/**
 * WebSocket Service (Redis-backed)
 * Stateless WebSocket service with shared state in Redis
 */

import { Server } from 'http';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { IWebSocketService } from '../types/services';
import container from '../config/container';
import { ICacheRepository } from '../types/services';
import logger from '../middleware/logger';

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  ip: string;
  userAgent: string;
  connectedAt: string;
  lastActivity: number;
  messageCount: number;
  sessionId: string | null;
  rooms: Set<string>;
}

class WebSocketService extends EventEmitter implements IWebSocketService {
  private server: Server;
  private wss: WebSocket.Server | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private cacheRepo: ICacheRepository;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private maxClients: number = 1000;
  private maxMessageSize: number = 1024 * 1024; // 1MB

  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errorCount: 0,
  };

  constructor(server: Server) {
    super();
    this.server = server;
    this.cacheRepo = container.resolve<ICacheRepository>('cacheRepository');
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    try {
      this.wss = new WebSocket.Server({
        server: this.server,
        path: '/ws',
        maxPayload: this.maxMessageSize,
      });

      this.wss.on('connection', (ws: WebSocket, request: any) => {
        this.handleConnection(ws, request);
      });

      this.wss.on('error', (error: Error) => {
        logger.error('WebSocket Server error', { error: error.message });
        this.metrics.errorCount++;
      });

      this.startHeartbeat();
      logger.info('WebSocket Server started on /ws');
    } catch (error) {
      logger.error('WebSocket initialization error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleConnection(ws: WebSocket, request: any): Promise<void> {
    const clientId = this.generateClientId();
    const clientInfo: WebSocketClient = {
      id: clientId,
      ws,
      ip: request.socket.remoteAddress || 'unknown',
      userAgent: request.headers['user-agent'] || 'unknown',
      connectedAt: new Date().toISOString(),
      lastActivity: Date.now(),
      messageCount: 0,
      sessionId: null,
      rooms: new Set(),
    };

    this.clients.set(clientId, clientInfo);
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    // Store connection in Redis for shared state
    await this.cacheRepo.set(`ws:client:${clientId}`, {
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      connectedAt: clientInfo.connectedAt,
    }, 'websocket', 3600000); // 1 hour TTL

    logger.info('WebSocket client connected', { clientId, ip: clientInfo.ip });

    ws.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', (code: number, reason: Buffer) => {
      this.handleDisconnection(clientId, code, reason.toString());
    });

    ws.on('error', (error: Error) => {
      this.handleError(clientId, error);
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection',
      data: {
        clientId,
        status: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  }

  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    const startTime = Date.now();
    const client = this.clients.get(clientId);

    if (!client) {
      logger.warn('Message from unknown client', { clientId });
      return;
    }

    try {
      const message = JSON.parse(data.toString());
      client.lastActivity = Date.now();
      client.messageCount++;
      this.metrics.totalMessages++;

      // Handle session registration
      if (message.type === 'register' && message.sessionId) {
        client.sessionId = message.sessionId;
        
        // Store session mapping in Redis
        await this.cacheRepo.set(`ws:session:${message.sessionId}`, clientId, 'websocket', 3600000);
        await this.cacheRepo.set(`ws:client:${clientId}:session`, message.sessionId, 'websocket', 3600000);

        logger.info('WebSocket session registered', { clientId, sessionId: message.sessionId });
      }

      // Handle heartbeat
      if (message.type === 'heartbeat') {
        this.sendToClient(clientId, {
          type: 'heartbeat',
          data: { timestamp: new Date().toISOString() },
        });
        return;
      }

      // Emit message event
      this.emit('message', { clientId, message });

      const latency = Date.now() - startTime;
      this.updateAverageLatency(latency);

      logger.debug('WebSocket message received', {
        clientId,
        type: message.type,
        latency: `${latency}ms`,
      });
    } catch (error) {
      logger.error('WebSocket message processing error', {
        clientId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.metrics.errorCount++;
    }
  }

  private async handleDisconnection(clientId: string, code: number, reason: string): Promise<void> {
    const client = this.clients.get(clientId);
    
    if (client) {
      // Remove from Redis
      await this.cacheRepo.delete(`ws:client:${clientId}`, 'websocket');
      if (client.sessionId) {
        await this.cacheRepo.delete(`ws:session:${client.sessionId}`, 'websocket');
        await this.cacheRepo.delete(`ws:client:${clientId}:session`, 'websocket');
      }

      this.clients.delete(clientId);
      this.metrics.activeConnections--;

      logger.info('WebSocket client disconnected', {
        clientId,
        code,
        reason,
        sessionId: client.sessionId,
      });

      this.emit('disconnect', { clientId, code, reason });
    }
  }

  private handleError(clientId: string, error: Error): void {
    logger.error('WebSocket client error', {
      clientId,
      error: error.message,
    });
    this.metrics.errorCount++;
  }

  sendToSession(sessionId: string, message: any): boolean {
    // Try local client first
    for (const [clientId, client] of this.clients) {
      if (client.sessionId === sessionId && client.ws.readyState === WebSocket.OPEN) {
        return this.sendToClient(clientId, message);
      }
    }

    // Try Redis to find client in other instances
    // This would require Redis pub/sub for cross-instance messaging
    // For now, return false if not found locally
    logger.debug('Session not found locally', { sessionId });
    return false;
  }

  sendToClient(clientId: string, message: any): boolean {
    const client = this.clients.get(clientId);
    
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send to client', { clientId, readyState: client?.ws.readyState });
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      client.lastActivity = Date.now();
      return true;
    } catch (error) {
      logger.error('WebSocket send error', {
        clientId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  broadcast(message: any, room?: string): void {
    let sent = 0;
    
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (!room || client.rooms.has(room)) {
          if (this.sendToClient(clientId, message)) {
            sent++;
          }
        }
      }
    }

    logger.debug('Broadcast message', { room, sent });
  }

  getClient(sessionId: string): WebSocketClient | null {
    for (const [clientId, client] of this.clients) {
      if (client.sessionId === sessionId) {
        return client;
      }
    }
    return null;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minute

      for (const [clientId, client] of this.clients) {
        if (now - client.lastActivity > timeout) {
          if (client.ws.readyState === WebSocket.OPEN) {
            try {
              client.ws.ping();
            } catch (error) {
              logger.error('Heartbeat ping error', {
                clientId,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      }
    }, 30000); // Every 30 seconds
  }

  private updateAverageLatency(latency: number): void {
    this.metrics.averageLatency = Math.round(
      (this.metrics.averageLatency * (this.metrics.totalMessages - 1) + latency) /
      this.metrics.totalMessages
    );
  }

  getMetrics(): any {
    return {
      ...this.metrics,
      activeConnections: this.clients.size,
    };
  }

  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all connections
    for (const [clientId, client] of this.clients) {
      client.ws.close(1001, 'Server shutdown');
    }

    this.clients.clear();
    logger.info('WebSocket Service shut down');
  }
}

export default WebSocketService;

