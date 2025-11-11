/**
 * Session Repository
 * Manages sessions with Redis (shared state) + File System (persistence)
 */

import logger from '../utils/logger';
import { Session, SessionContext, SessionMetadata } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

class SessionRepository {
  private redisClient: any = null;
  private redisEnabled: boolean = false;
  private sessionDataPath: string;
  private maxSessions: number = 1000;
  private sessionTimeout: number = 3600000; // 1 hour

  constructor() {
    this.sessionDataPath = path.join(__dirname, '../../memory');
    this.initializeRedis();
    this.ensureDataDirectory();
  }

  private async initializeRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.warn('REDIS_URL not set, using file-based sessions only');
      return;
    }

    try {
      const redis = require('redis');
      this.redisClient = redis.createClient({ url: redisUrl });

      this.redisClient.on('error', (err: Error) => {
        logger.error('Redis connection error', err);
        this.redisEnabled = false;
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected for sessions');
        this.redisEnabled = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.error('Redis initialization failed', error as Error);
      this.redisEnabled = false;
    }
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.ensureDir(this.sessionDataPath);
    } catch (error) {
      logger.error('Failed to create session data directory', error as Error);
    }
  }

  /**
   * Create session
   */
  async createSession(
    sessionId: string,
    initialData: Partial<Session> = {}
  ): Promise<Session> {
    const session: Session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messages: [],
      context: {
        persona: 'general',
        emotionalState: 'neutral',
        urgency: 'normal',
        language: 'german',
        accessibility: { needs: [], hasNeeds: false },
        previousIntention: null,
        conversationHistory: [],
        ...initialData.context,
      },
      metadata: {
        userAgent: initialData.metadata?.userAgent || 'unknown',
        ipAddress: initialData.metadata?.ipAddress || 'unknown',
        referrer: initialData.metadata?.referrer || 'unknown',
      },
      status: 'active',
      messageCount: 0,
      totalDuration: 0,
      ...initialData,
    };

    // Store in Redis (shared state)
    if (this.redisEnabled && this.redisClient) {
      try {
        await this.redisClient.setEx(
          `kaya:session:${sessionId}`,
          3600, // 1 hour TTL
          JSON.stringify(session)
        );
      } catch (error) {
        logger.error('Redis SET session error', error as Error, { sessionId });
      }
    }

    // Store in file system (persistence)
    await this.saveSessionToFile(session);

    logger.info('Session created', { sessionId });
    return session;
  }

  /**
   * Get session
   */
  async getSession(sessionId: string): Promise<Session | null> {
    // Try Redis first (shared state)
    if (this.redisEnabled && this.redisClient) {
      try {
        const cached = await this.redisClient.get(`kaya:session:${sessionId}`);
        if (cached) {
          const session = JSON.parse(cached) as Session;
          logger.debug('Session retrieved from Redis', { sessionId });
          return session;
        }
      } catch (error) {
        logger.error('Redis GET session error', error as Error, { sessionId });
      }
    }

    // Fallback to file system
    try {
      const filePath = path.join(this.sessionDataPath, `${sessionId}.json`);
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJson(filePath);
        logger.debug('Session retrieved from file', { sessionId });
        
        // Populate Redis cache
        if (this.redisEnabled && this.redisClient) {
          await this.redisClient.setEx(
            `kaya:session:${sessionId}`,
            3600,
            JSON.stringify(data)
          );
        }

        return data as Session;
      }
    } catch (error) {
      logger.error('File GET session error', error as Error, { sessionId });
    }

    return null;
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    const updated: Session = {
      ...session,
      ...updates,
      lastActivity: new Date().toISOString(),
    };

    // Update Redis
    if (this.redisEnabled && this.redisClient) {
      try {
        await this.redisClient.setEx(
          `kaya:session:${sessionId}`,
          3600,
          JSON.stringify(updated)
        );
      } catch (error) {
        logger.error('Redis UPDATE session error', error as Error, { sessionId });
      }
    }

    // Update file system
    await this.saveSessionToFile(updated);

    logger.debug('Session updated', { sessionId });
    return updated;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    let deleted = false;

    // Delete from Redis
    if (this.redisEnabled && this.redisClient) {
      try {
        await this.redisClient.del(`kaya:session:${sessionId}`);
        deleted = true;
      } catch (error) {
        logger.error('Redis DELETE session error', error as Error, { sessionId });
      }
    }

    // Delete from file system
    try {
      const filePath = path.join(this.sessionDataPath, `${sessionId}.json`);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        deleted = true;
      }
    } catch (error) {
      logger.error('File DELETE session error', error as Error, { sessionId });
    }

    if (deleted) {
      logger.info('Session deleted', { sessionId });
    }

    return deleted;
  }

  /**
   * Save session to file
   */
  private async saveSessionToFile(session: Session): Promise<void> {
    try {
      const filePath = path.join(this.sessionDataPath, `${session.id}.json`);
      await fs.writeJson(filePath, session, { spaces: 2 });
    } catch (error) {
      logger.error('Failed to save session to file', error as Error, { sessionId: session.id });
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    let cleaned = 0;
    const cutoff = Date.now() - maxAge;

    try {
      const files = await fs.readdir(this.sessionDataPath);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.sessionDataPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoff) {
          const sessionId = file.replace('.json', '');
          await this.deleteSession(sessionId);
          cleaned++;
        }
      }
    } catch (error) {
      logger.error('Session cleanup error', error as Error);
    }

    if (cleaned > 0) {
      logger.info('Expired sessions cleaned', { cleaned });
    }

    return cleaned;
  }
}

export default SessionRepository;
