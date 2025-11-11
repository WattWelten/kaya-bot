/**
 * Cache Repository
 * Multi-layer caching: L1 (In-Memory) → L2 (Redis) → L3 (DB)
 */

import logger from '../utils/logger';
import { CacheEntry } from '../types';

class CacheRepository {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private redisClient: any = null;
  private redisEnabled: boolean = false;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private longTTL: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeRedis();
    this.startCleanupTimer();
  }

  private async initializeRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.warn('REDIS_URL not set, using in-memory cache only');
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
        logger.info('Redis connected');
        this.redisEnabled = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.error('Redis initialization failed', error as Error);
      this.redisEnabled = false;
    }
  }

  /**
   * Create cache key
   */
  createKey(key: string, namespace: string = 'default'): string {
    return `kaya:cache:${namespace}:${key}`;
  }

  /**
   * Get from cache (L1 → L2 → null)
   */
  async get<T>(key: string, namespace: string = 'default'): Promise<T | null> {
    const cacheKey = this.createKey(key, namespace);

    // L1: In-Memory Cache
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && Date.now() - memoryEntry.timestamp < memoryEntry.ttl) {
      logger.debug('Cache L1 HIT', { key, namespace });
      return memoryEntry.value as T;
    }

    // Remove expired entry
    if (memoryEntry) {
      this.memoryCache.delete(cacheKey);
    }

    // L2: Redis Cache
    if (this.redisEnabled && this.redisClient) {
      try {
        const value = await this.redisClient.get(cacheKey);
        if (value) {
          const parsed = JSON.parse(value);
          logger.debug('Cache L2 HIT', { key, namespace });
          
          // Populate L1 cache
          this.memoryCache.set(cacheKey, {
            value: parsed,
            timestamp: Date.now(),
            ttl: this.defaultTTL,
            namespace,
          });

          return parsed as T;
        }
      } catch (error) {
        logger.error('Redis GET error', error as Error, { key, namespace });
      }
    }

    logger.debug('Cache MISS', { key, namespace });
    return null;
  }

  /**
   * Set cache (L1 + L2)
   */
  async set<T>(
    key: string,
    value: T,
    namespace: string = 'default',
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.createKey(key, namespace);
    const cacheTTL = ttl || this.defaultTTL;

    // L1: In-Memory Cache
    this.memoryCache.set(cacheKey, {
      value,
      timestamp: Date.now(),
      ttl: cacheTTL,
      namespace,
    });

    // L2: Redis Cache
    if (this.redisEnabled && this.redisClient) {
      try {
        const serialized = JSON.stringify(value);
        await this.redisClient.setEx(cacheKey, Math.floor(cacheTTL / 1000), serialized);
        logger.debug('Cache SET', { key, namespace, ttl: cacheTTL });
      } catch (error) {
        logger.error('Redis SET error', error as Error, { key, namespace });
      }
    }
  }

  /**
   * Delete from cache (L1 + L2)
   */
  async delete(key: string, namespace: string = 'default'): Promise<void> {
    const cacheKey = this.createKey(key, namespace);

    // L1: In-Memory Cache
    this.memoryCache.delete(cacheKey);

    // L2: Redis Cache
    if (this.redisEnabled && this.redisClient) {
      try {
        await this.redisClient.del(cacheKey);
        logger.debug('Cache DELETE', { key, namespace });
      } catch (error) {
        logger.error('Redis DELETE error', error as Error, { key, namespace });
      }
    }
  }

  /**
   * Clear namespace
   */
  async clearNamespace(namespace: string): Promise<void> {
    // L1: In-Memory Cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.namespace === namespace) {
        this.memoryCache.delete(key);
      }
    }

    // L2: Redis Cache
    if (this.redisEnabled && this.redisClient) {
      try {
        const pattern = `kaya:cache:${namespace}:*`;
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
        logger.info('Cache namespace cleared', { namespace });
      } catch (error) {
        logger.error('Redis CLEAR error', error as Error, { namespace });
      }
    }
  }

  /**
   * Cleanup expired entries
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup', { cleaned });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number;
    redisEnabled: boolean;
    hitRate?: number;
  } {
    return {
      memorySize: this.memoryCache.size,
      redisEnabled: this.redisEnabled,
    };
  }
}

export default CacheRepository;
