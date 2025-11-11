const WebSocket = require('ws');
const EventEmitter = require('events');

class KAYAWebSocketService extends EventEmitter {
    constructor(server) {
        super();
        this.server = server;
        this.wss = null;
        this.clients = new Map(); // Lokale WebSocket-Verbindungen (können nicht in Redis gespeichert werden)
        this.redisCacheService = null; // Redis für Shared State
        this.redisEnabled = false;
        this.heartbeatInterval = 30000; // 30 Sekunden
        this.maxClients = 1000;
        this.maxMessageSize = 1024 * 1024; // 1MB
        
        // Performance Metrics (lokale Metriken, können später in Redis aggregiert werden)
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            totalMessages: 0,
            messagesPerSecond: 0,
            averageLatency: 0,
            errorCount: 0
        };
        
        this.rateLimitWindow = 60000; // 1 Minute
        this.rateLimitMax = 100; // 100 Nachrichten pro Minute
        
        // Lokale Rate-Limits für Fallback (wenn Redis nicht verfügbar)
        this.localRateLimits = new Map();
        
        // Redis initialisieren
        this.initializeRedis();
        
        console.log('🚀 KAYA WebSocket Service v2.0 initialisiert (Redis-backed)');
        this.initializeWebSocket();
    }
    
    /**
     * Redis für Shared State initialisieren
     */
    async initializeRedis() {
        try {
            this.redisCacheService = require('./services/redis_cache');
            this.redisEnabled = this.redisCacheService.isEnabled();
            
            if (this.redisEnabled) {
                console.log('✅ Redis für WebSocket Shared State aktiviert');
            } else {
                console.log('⚠️ Redis nicht verfügbar, verwende lokale Maps (nicht skalierbar)');
            }
        } catch (error) {
            console.error('❌ Redis-Initialisierung fehlgeschlagen:', error.message);
            this.redisEnabled = false;
        }
    }
    
    // WebSocket-Server initialisieren
    initializeWebSocket() {
        try {
            this.wss = new WebSocket.Server({
                server: this.server,
                path: '/ws',
                maxPayload: this.maxMessageSize
            });
            
            this.wss.on('connection', (ws, request) => {
                this.handleConnection(ws, request);
            });
            
            this.wss.on('error', (error) => {
                console.error('❌ WebSocket Server Fehler:', error);
                this.metrics.errorCount++;
            });
            
            // Heartbeat-Timer starten
            this.startHeartbeat();
            
            console.log('✅ WebSocket Server gestartet auf /ws');
            
        } catch (error) {
            console.error('❌ WebSocket Initialisierung Fehler:', error);
        }
    }
    
    // Verbindung behandeln
    handleConnection(ws, request) {
        const clientId = this.generateClientId();
        const clientInfo = {
            id: clientId,
            ws: ws,
            ip: request.socket.remoteAddress,
            userAgent: request.headers['user-agent'] || 'unknown',
            connectedAt: new Date().toISOString(),
            lastActivity: Date.now(),
            messageCount: 0,
            sessionId: null,
            rooms: new Set()
        };
        
        this.clients.set(clientId, clientInfo);
        this.metrics.totalConnections++;
        this.metrics.activeConnections++;
        
        console.log(`🔌 Client verbunden: ${clientId} (${clientInfo.ip})`);
        
        // Client-Events
        ws.on('message', async (data) => {
            await this.handleMessage(clientId, data);
        });
        
        ws.on('close', async (code, reason) => {
            await this.handleDisconnection(clientId, code, reason);
        });
        
        ws.on('error', (error) => {
            this.handleError(clientId, error);
        });
        
        // Willkommensnachricht senden
        this.sendToClient(clientId, {
            type: 'connection',
            data: {
                clientId: clientId,
                message: 'Verbindung erfolgreich hergestellt',
                timestamp: new Date().toISOString()
            }
        });
        
        // Event emittieren
        this.emit('clientConnected', clientInfo);
    }
    
    // Nachricht behandeln (async wegen Redis)
    async handleMessage(clientId, data) {
        const startTime = Date.now();
        
        try {
            // Rate Limiting prüfen (async)
            if (!(await this.checkRateLimit(clientId))) {
                this.sendToClient(clientId, {
                    type: 'error',
                    data: {
                        message: 'Rate Limit überschritten',
                        code: 'RATE_LIMIT_EXCEEDED'
                    }
                });
                return;
            }
            
            const message = JSON.parse(data.toString());
            const client = this.clients.get(clientId);
            
            if (!client) {
                console.log(`⚠️ Client nicht gefunden: ${clientId}`);
                return;
            }
            
            // Client-Aktivität aktualisieren
            client.lastActivity = Date.now();
            client.messageCount++;
            
            // Nachrichten-Metriken aktualisieren
            this.metrics.totalMessages++;
            this.updateMessagesPerSecond();
            
            // Nachricht verarbeiten (async)
            await this.processMessage(clientId, message);
            
            // Latenz berechnen
            const latency = Date.now() - startTime;
            this.updateAverageLatency(latency);
            
            console.log(`💬 Nachricht von ${clientId}: ${message.type} (${latency}ms)`);
            
        } catch (error) {
            console.error(`❌ Nachricht-Verarbeitung Fehler für ${clientId}:`, error);
            this.metrics.errorCount++;
            
            this.sendToClient(clientId, {
                type: 'error',
                data: {
                    message: 'Nachricht konnte nicht verarbeitet werden',
                    code: 'MESSAGE_PROCESSING_ERROR'
                }
            });
        }
    }
    
    // Nachricht verarbeiten (async)
    async processMessage(clientId, message) {
        const { type, data } = message;
        
        switch (type) {
            case 'ping':
                this.handlePing(clientId);
                break;
                
            case 'chat':
                await this.handleChatMessage(clientId, data);
                break;
                
            case 'session':
                await this.handleSessionMessage(clientId, data);
                break;
                
            case 'avatar':
                this.handleAvatarMessage(clientId, data);
                break;
                
            case 'audio':
                this.handleAudioMessage(clientId, data);
                break;
                
            case 'join_room':
                this.handleJoinRoom(clientId, data);
                break;
                
            case 'leave_room':
                this.handleLeaveRoom(clientId, data);
                break;
                
            case 'broadcast':
                this.handleBroadcast(clientId, data);
                break;
                
            default:
                console.log(`⚠️ Unbekannter Nachrichtentyp: ${type}`);
                this.sendToClient(clientId, {
                    type: 'error',
                    data: {
                        message: `Unbekannter Nachrichtentyp: ${type}`,
                        code: 'UNKNOWN_MESSAGE_TYPE'
                    }
                });
        }
    }
    
    // Ping behandeln
    handlePing(clientId) {
        this.sendToClient(clientId, {
            type: 'pong',
            data: {
                timestamp: new Date().toISOString()
            }
        });
    }
    
    // Chat-Nachricht behandeln
    async handleChatMessage(clientId, data) {
        const { message, sessionId } = data;
        
        // Session-ID speichern (lokal + Redis)
        const client = this.clients.get(clientId);
        if (client && sessionId) {
            client.sessionId = sessionId;
            
            // Redis: Session-Mapping speichern
            if (this.redisEnabled && this.redisCacheService) {
                const mappingKey = `ws:session:${sessionId}`;
                const clientKey = `ws:client:${clientId}:session`;
                await this.redisCacheService.set(mappingKey, clientId, 3600000);
                await this.redisCacheService.set(clientKey, sessionId, 3600000);
            }
        }
        
        // Event emittieren für weitere Verarbeitung
        this.emit('chatMessage', {
            clientId,
            message,
            sessionId,
            timestamp: new Date().toISOString()
        });
    }
    
    // Emotion an Client senden (für Avatar-Mimik)
    sendEmotion(clientId, emotion, confidence) {
        this.sendToClient(clientId, {
            type: 'emotion',
            data: {
                emotion,
                confidence,
                timestamp: new Date().toISOString()
            }
        });
        
        console.log(`😊 Emotion gesendet an ${clientId}: ${emotion} (${confidence}%)`);
    }
    
    // Viseme-Timeline an Client senden (für Lippensync)
    sendVisemeTimeline(clientId, visemeTimeline) {
        this.sendToClient(clientId, {
            type: 'visemeTimeline',
            data: {
                timeline: visemeTimeline,
                timestamp: new Date().toISOString()
            }
        });
        
        console.log(`🎭 Viseme-Timeline gesendet an ${clientId}: ${visemeTimeline.length} Segmente`);
    }
    
    // Session-Nachricht behandeln
    async handleSessionMessage(clientId, data) {
        const { action, sessionId, data: sessionData } = data;
        
        // Session-ID → Client-ID Mapping (für sendToSession) - jetzt Redis-backed
        if (sessionId) {
            const mappingKey = `ws:session:${sessionId}`;
            const clientKey = `ws:client:${clientId}:session`;
            
            if (this.redisEnabled && this.redisCacheService) {
                // Redis: Session → Client Mapping (TTL: 1 Stunde)
                await this.redisCacheService.set(mappingKey, clientId, 3600000);
                await this.redisCacheService.set(clientKey, sessionId, 3600000);
            }
            
            // Lokales Mapping aktualisieren (für schnellen Zugriff)
            const client = this.clients.get(clientId);
            if (client) {
                client.sessionId = sessionId;
            }
            
            console.log(`🔗 Session-Mapping: ${sessionId} → ${clientId} (${this.redisEnabled ? 'Redis' : 'lokale Map'})`);
        }
        
        // Event emittieren für Session-Management
        this.emit('sessionMessage', {
            clientId,
            action,
            sessionId,
            data: sessionData,
            timestamp: new Date().toISOString()
        });
    }
    
    // Neue Methode: Nachricht an Session-ID senden (nicht Client-ID) - Redis-backed
    async sendToSession(sessionId, message) {
        let clientId = null;
        
        // 1. Versuche lokale Client-Verbindung
        for (const [cid, client] of this.clients) {
            if (client.sessionId === sessionId) {
                clientId = cid;
                break;
            }
        }
        
        // 2. Falls nicht lokal gefunden, versuche Redis (für andere Instanzen)
        if (!clientId && this.redisEnabled && this.redisCacheService) {
            const mappingKey = `ws:session:${sessionId}`;
            clientId = await this.redisCacheService.get(mappingKey);
            
            if (clientId && this.clients.has(clientId)) {
                // Client ist lokal verbunden, sende Nachricht
                this.sendToClient(clientId, message);
                console.log(`📤 Nachricht an Session ${sessionId} (Client: ${clientId}) gesendet via Redis`);
                return true;
            }
        }
        
        // 3. Lokale Client-Verbindung verwenden
        if (clientId) {
            this.sendToClient(clientId, message);
            console.log(`📤 Nachricht an Session ${sessionId} (Client: ${clientId}) gesendet`);
            return true;
        } else {
            console.warn(`⚠️ Keine WebSocket-Verbindung für Session: ${sessionId}`);
            return false;
        }
    }
    
    // Avatar-Nachricht behandeln
    handleAvatarMessage(clientId, data) {
        const { action, emotion, gesture, position } = data;
        
        // Event emittieren für Avatar-Management
        this.emit('avatarMessage', {
            clientId,
            action,
            emotion,
            gesture,
            position,
            timestamp: new Date().toISOString()
        });
    }
    
    // Audio-Nachricht behandeln
    handleAudioMessage(clientId, data) {
        const { action, audioData, format } = data;
        
        // Event emittieren für Audio-Verarbeitung
        this.emit('audioMessage', {
            clientId,
            action,
            audioData,
            format,
            timestamp: new Date().toISOString()
        });
    }
    
    // Raum beitreten
    handleJoinRoom(clientId, data) {
        const { roomId } = data;
        
        const client = this.clients.get(clientId);
        if (!client) return;
        
        client.rooms.add(roomId);
        
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        
        this.rooms.get(roomId).add(clientId);
        
        console.log(`🏠 Client ${clientId} ist Raum ${roomId} beigetreten`);
        
        this.sendToClient(clientId, {
            type: 'room_joined',
            data: {
                roomId: roomId,
                message: `Raum ${roomId} beigetreten`
            }
        });
    }
    
    // Raum verlassen
    handleLeaveRoom(clientId, data) {
        const { roomId } = data;
        
        const client = this.clients.get(clientId);
        if (!client) return;
        
        client.rooms.delete(roomId);
        
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).delete(clientId);
            
            if (this.rooms.get(roomId).size === 0) {
                this.rooms.delete(roomId);
            }
        }
        
        console.log(`🚪 Client ${clientId} hat Raum ${roomId} verlassen`);
        
        this.sendToClient(clientId, {
            type: 'room_left',
            data: {
                roomId: roomId,
                message: `Raum ${roomId} verlassen`
            }
        });
    }
    
    // Broadcast behandeln
    handleBroadcast(clientId, data) {
        const { message, targetRoom } = data;
        
        if (targetRoom) {
            this.broadcastToRoom(targetRoom, {
                type: 'broadcast',
                data: {
                    message: message,
                    from: clientId,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            this.broadcastToAll({
                type: 'broadcast',
                data: {
                    message: message,
                    from: clientId,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
    
    // Verbindung trennen - Redis cleanup
    async handleDisconnection(clientId, code, reason) {
        const client = this.clients.get(clientId);
        
        if (client) {
            // Redis-Cleanup: Session-Mappings entfernen
            if (this.redisEnabled && this.redisCacheService && client.sessionId) {
                const mappingKey = `ws:session:${client.sessionId}`;
                const clientKey = `ws:client:${clientId}:session`;
                
                await this.redisCacheService.delete(mappingKey);
                await this.redisCacheService.delete(clientKey);
                
                // Rate-Limit-Key entfernen
                const rateLimitKey = `ws:ratelimit:${clientId}`;
                await this.redisCacheService.delete(rateLimitKey);
            }
            
            // Aus allen Räumen entfernen
            for (const roomId of client.rooms) {
                await this.handleLeaveRoom(clientId, { roomId });
            }
            
            this.clients.delete(clientId);
            this.metrics.activeConnections--;
            
            console.log(`🔌 Client getrennt: ${clientId} (Code: ${code}, Grund: ${reason})`);
            
            // Event emittieren
            this.emit('clientDisconnected', {
                clientId,
                code,
                reason,
                duration: Date.now() - new Date(client.connectedAt).getTime()
            });
        }
    }
    
    // Fehler behandeln
    handleError(clientId, error) {
        console.error(`❌ WebSocket Fehler für ${clientId}:`, error);
        this.metrics.errorCount++;
        
        // Event emittieren
        this.emit('clientError', {
            clientId,
            error: error.message
        });
    }
    
    // Rate Limiting prüfen - Redis-backed für horizontale Skalierung
    async checkRateLimit(clientId) {
        const now = Date.now();
        const rateLimitKey = `ws:ratelimit:${clientId}`;
        
        if (this.redisEnabled && this.redisCacheService) {
            // Redis-basierte Rate-Limiting (skalierbar)
            try {
                const cached = await this.redisCacheService.get(rateLimitKey);
                
                if (cached) {
                    const { count, windowStart } = cached;
                    
                    // Fenster zurücksetzen falls abgelaufen
                    if (now - windowStart > this.rateLimitWindow) {
                        await this.redisCacheService.set(rateLimitKey, {
                            count: 1,
                            windowStart: now
                        }, this.rateLimitWindow);
                        return true;
                    }
                    
                    // Limit prüfen
                    if (count >= this.rateLimitMax) {
                        return false;
                    }
                    
                    // Zähler erhöhen
                    await this.redisCacheService.set(rateLimitKey, {
                        count: count + 1,
                        windowStart: windowStart
                    }, this.rateLimitWindow);
                    return true;
                } else {
                    // Erste Nachricht in diesem Fenster
                    await this.redisCacheService.set(rateLimitKey, {
                        count: 1,
                        windowStart: now
                    }, this.rateLimitWindow);
                    return true;
                }
            } catch (error) {
                console.error('❌ Redis Rate-Limit Fehler:', error.message);
                // Fallback: Lokales Rate-Limiting
                return true; // Im Fehlerfall durchlassen
            }
        }
        
        // Fallback: Lokales Rate-Limiting (nicht skalierbar, aber funktioniert ohne Redis)
        // Lokale Map für Fallback
        if (!this.localRateLimits) {
            this.localRateLimits = new Map();
        }
        
        const clientLimits = this.localRateLimits.get(clientId) || { count: 0, windowStart: now };
        
        // Fenster zurücksetzen
        if (now - clientLimits.windowStart > this.rateLimitWindow) {
            clientLimits.count = 0;
            clientLimits.windowStart = now;
        }
        
        // Limit prüfen
        if (clientLimits.count >= this.rateLimitMax) {
            return false;
        }
        
        // Zähler erhöhen
        clientLimits.count++;
        this.localRateLimits.set(clientId, clientLimits);
        
        return true;
    }
    
    // Nachricht an Client senden
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        
        if (!client || client.ws.readyState !== WebSocket.OPEN) {
            console.log(`⚠️ Client nicht verfügbar für Nachricht: ${clientId}`);
            return false;
        }
        
        try {
            client.ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error(`❌ Nachricht-Sendung Fehler für ${clientId}:`, error);
            return false;
        }
    }
    
    // Nachricht an alle Clients senden
    broadcastToAll(message) {
        let sentCount = 0;
        
        for (const [clientId] of this.clients) {
            if (this.sendToClient(clientId, message)) {
                sentCount++;
            }
        }
        
        console.log(`📢 Broadcast an ${sentCount} Clients gesendet`);
        return sentCount;
    }
    
    // Nachricht an Raum senden
    broadcastToRoom(roomId, message) {
        const room = this.rooms.get(roomId);
        
        if (!room) {
            console.log(`⚠️ Raum nicht gefunden: ${roomId}`);
            return 0;
        }
        
        let sentCount = 0;
        
        for (const clientId of room) {
            if (this.sendToClient(clientId, message)) {
                sentCount++;
            }
        }
        
        console.log(`📢 Broadcast an Raum ${roomId} (${sentCount} Clients) gesendet`);
        return sentCount;
    }
    
    // Nachricht an Session senden - bereits oben implementiert
    // Diese Methode wird durch die oben definierte sendToSession ersetzt
    
    // Heartbeat starten
    startHeartbeat() {
        setInterval(() => {
            this.sendHeartbeat();
        }, this.heartbeatInterval);
        
        console.log('💓 Heartbeat-Timer gestartet');
    }
    
    // Heartbeat senden
    sendHeartbeat() {
        const heartbeatMessage = {
            type: 'heartbeat',
            data: {
                timestamp: new Date().toISOString(),
                activeConnections: this.metrics.activeConnections
            }
        };
        
        this.broadcastToAll(heartbeatMessage);
    }
    
    // Metriken aktualisieren
    updateMessagesPerSecond() {
        // Einfache Implementierung - könnte erweitert werden
        this.metrics.messagesPerSecond = Math.round(this.metrics.totalMessages / 60);
    }
    
    updateAverageLatency(latency) {
        this.metrics.averageLatency = Math.round(
            (this.metrics.averageLatency * (this.metrics.totalMessages - 1) + latency) / 
            this.metrics.totalMessages
        );
    }
    
    // Client-ID generieren
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Performance-Metriken
    getMetrics() {
        return {
            ...this.metrics,
            activeConnections: this.clients.size,
            totalRooms: this.rooms.size,
            rateLimitWindow: this.rateLimitWindow,
            rateLimitMax: this.rateLimitMax
        };
    }
    
    // Client-Status
    getClientStatus(clientId) {
        const client = this.clients.get(clientId);
        
        if (!client) {
            return null;
        }
        
        return {
            clientId: clientId,
            connectedAt: client.connectedAt,
            lastActivity: new Date(client.lastActivity).toISOString(),
            messageCount: client.messageCount,
            sessionId: client.sessionId,
            rooms: Array.from(client.rooms),
            ip: client.ip,
            userAgent: client.userAgent
        };
    }
    
    // Alle Clients-Status
    getAllClientsStatus() {
        const clients = [];
        
        for (const [clientId] of this.clients) {
            clients.push(this.getClientStatus(clientId));
        }
        
        return clients;
    }
    
    // Health Check
    healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            clients: {
                total: this.clients.size,
                active: Array.from(this.clients.values()).filter(c => 
                    c.ws.readyState === WebSocket.OPEN
                ).length
            },
            rooms: {
                total: this.rooms.size,
                details: Array.from(this.rooms.entries()).map(([roomId, clients]) => ({
                    roomId,
                    clientCount: clients.size
                }))
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        };
    }
    
    // Debug-Informationen
    getDebugInfo() {
        return {
            maxClients: this.maxClients,
            maxMessageSize: this.maxMessageSize,
            heartbeatInterval: this.heartbeatInterval,
            rateLimitWindow: this.rateLimitWindow,
            rateLimitMax: this.rateLimitMax,
            activeConnections: this.clients.size,
            totalRooms: this.rooms.size,
            metrics: this.getMetrics()
        };
    }
}

module.exports = KAYAWebSocketService;

