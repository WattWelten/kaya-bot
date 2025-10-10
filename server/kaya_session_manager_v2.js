const fs = require('fs-extra');
const path = require('path');

class KAYASessionManager {
    constructor() {
        this.sessions = new Map();
        this.sessionDataPath = path.join(__dirname, '../data/sessions');
        this.maxSessions = 1000;
        this.sessionTimeout = 3600000; // 1 Stunde
        this.cleanupInterval = 300000; // 5 Minuten
        
        // Performance Metrics
        this.metrics = {
            totalSessions: 0,
            activeSessions: 0,
            expiredSessions: 0,
            averageSessionDuration: 0,
            averageMessagesPerSession: 0
        };
        
        // Cleanup-Timer starten
        this.startCleanupTimer();
        
        console.log('🚀 KAYA Session Manager v2.0 initialisiert');
        this.initializeSessionStorage();
    }
    
    // Session-Storage initialisieren
    async initializeSessionStorage() {
        try {
            await fs.ensureDir(this.sessionDataPath);
            console.log('📁 Session-Storage initialisiert');
        } catch (error) {
            console.error('❌ Session-Storage Initialisierung Fehler:', error);
        }
    }
    
    // Session erstellen
    createSession(sessionId, initialData = {}) {
        const session = {
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
                conversationHistory: []
            },
            metadata: {
                userAgent: initialData.userAgent || 'unknown',
                ipAddress: initialData.ipAddress || 'unknown',
                referrer: initialData.referrer || 'unknown'
            },
            status: 'active',
            messageCount: 0,
            totalDuration: 0
        };
        
        this.sessions.set(sessionId, session);
        this.metrics.totalSessions++;
        this.metrics.activeSessions++;
        
        console.log(`✅ Session erstellt: ${sessionId}`);
        return session;
    }
    
    // Session abrufen
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            console.log(`⚠️ Session nicht gefunden: ${sessionId}`);
            return null;
        }
        
        // Session-Aktivität aktualisieren
        session.lastActivity = new Date().toISOString();
        
        return session;
    }
    
    // Session aktualisieren
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            console.log(`⚠️ Session nicht gefunden für Update: ${sessionId}`);
            return null;
        }
        
        // Updates anwenden
        Object.assign(session, updates);
        session.lastActivity = new Date().toISOString();
        
        console.log(`🔄 Session aktualisiert: ${sessionId}`);
        return session;
    }
    
    // Nachricht zur Session hinzufügen
    addMessage(sessionId, content, role, metadata = {}) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            console.log(`⚠️ Session nicht gefunden für Nachricht: ${sessionId}`);
            return null;
        }
        
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: content,
            role: role, // 'user' oder 'assistant'
            timestamp: new Date().toISOString(),
            metadata: metadata
        };
        
        session.messages.push(message);
        session.messageCount++;
        session.lastActivity = new Date().toISOString();
        
        // Context aktualisieren
        if (metadata.intention) {
            session.context.previousIntention = metadata.intention;
        }
        
        if (metadata.persona) {
            session.context.persona = metadata.persona;
        }
        
        if (metadata.emotionalState) {
            session.context.emotionalState = metadata.emotionalState;
        }
        
        if (metadata.urgency) {
            session.context.urgency = metadata.urgency;
        }
        
        if (metadata.language) {
            session.context.language = metadata.language;
        }
        
        if (metadata.accessibility) {
            session.context.accessibility = metadata.accessibility;
        }
        
        // Conversation History aktualisieren (letzte 5 Nachrichten)
        session.context.conversationHistory = session.messages.slice(-5);
        
        console.log(`💬 Nachricht hinzugefügt zu Session ${sessionId}: ${role} (${content.substring(0, 50)}...)`);
        
        return message;
    }
    
    // Session-Kontext abrufen
    getSessionContext(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return null;
        }
        
        return {
            sessionId: sessionId,
            persona: session.context.persona,
            emotionalState: session.context.emotionalState,
            urgency: session.context.urgency,
            language: session.context.language,
            accessibility: session.context.accessibility,
            previousIntention: session.context.previousIntention,
            conversationHistory: session.context.conversationHistory,
            messageCount: session.messageCount,
            sessionDuration: Date.now() - new Date(session.createdAt).getTime()
        };
    }
    
    // Session-Statistiken
    getSessionStats(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return null;
        }
        
        const now = new Date();
        const createdAt = new Date(session.createdAt);
        const lastActivity = new Date(session.lastActivity);
        
        return {
            sessionId: sessionId,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            duration: now - createdAt,
            idleTime: now - lastActivity,
            messageCount: session.messageCount,
            status: session.status,
            context: session.context
        };
    }
    
    // Session beenden
    endSession(sessionId, reason = 'user_end') {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            console.log(`⚠️ Session nicht gefunden für Ende: ${sessionId}`);
            return null;
        }
        
        session.status = 'ended';
        session.endedAt = new Date().toISOString();
        session.endReason = reason;
        session.totalDuration = Date.now() - new Date(session.createdAt).getTime();
        
        this.metrics.activeSessions--;
        
        console.log(`🔚 Session beendet: ${sessionId} (${reason})`);
        
        // Session speichern
        this.saveSessionToFile(sessionId);
        
        return session;
    }
    
    // Session speichern
    async saveSessionToFile(sessionId) {
        try {
            const session = this.sessions.get(sessionId);
            if (!session) return;
            
            const filePath = path.join(this.sessionDataPath, `${sessionId}.json`);
            await fs.writeJson(filePath, session, { spaces: 2 });
            
            console.log(`💾 Session gespeichert: ${sessionId}`);
        } catch (error) {
            console.error(`❌ Session-Speicherung Fehler für ${sessionId}:`, error);
        }
    }
    
    // Session aus Datei laden
    async loadSessionFromFile(sessionId) {
        try {
            const filePath = path.join(this.sessionDataPath, `${sessionId}.json`);
            
            if (!await fs.pathExists(filePath)) {
                return null;
            }
            
            const session = await fs.readJson(filePath);
            this.sessions.set(sessionId, session);
            
            console.log(`📂 Session geladen: ${sessionId}`);
            return session;
        } catch (error) {
            console.error(`❌ Session-Ladung Fehler für ${sessionId}:`, error);
            return null;
        }
    }
    
    // Session-Cleanup
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, this.cleanupInterval);
        
        console.log('🧹 Session-Cleanup-Timer gestartet');
    }
    
    cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [sessionId, session] of this.sessions) {
            const lastActivity = new Date(session.lastActivity).getTime();
            const idleTime = now - lastActivity;
            
            if (idleTime > this.sessionTimeout) {
                this.endSession(sessionId, 'timeout');
                this.sessions.delete(sessionId);
                cleanedCount++;
                this.metrics.expiredSessions++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 ${cleanedCount} abgelaufene Sessions bereinigt`);
        }
        
        // Session-Limit prüfen
        if (this.sessions.size > this.maxSessions) {
            this.cleanupOldestSessions();
        }
    }
    
    cleanupOldestSessions() {
        const sessions = Array.from(this.sessions.entries());
        sessions.sort((a, b) => new Date(a[1].lastActivity) - new Date(b[1].lastActivity));
        
        const toRemove = sessions.slice(0, sessions.length - this.maxSessions);
        
        for (const [sessionId] of toRemove) {
            this.endSession(sessionId, 'limit_exceeded');
            this.sessions.delete(sessionId);
        }
        
        console.log(`🧹 ${toRemove.length} alte Sessions bereinigt (Limit: ${this.maxSessions})`);
    }
    
    // Session-Suche
    searchSessions(criteria) {
        const results = [];
        
        for (const [sessionId, session] of this.sessions) {
            let matches = true;
            
            if (criteria.persona && session.context.persona !== criteria.persona) {
                matches = false;
            }
            
            if (criteria.emotionalState && session.context.emotionalState !== criteria.emotionalState) {
                matches = false;
            }
            
            if (criteria.urgency && session.context.urgency !== criteria.urgency) {
                matches = false;
            }
            
            if (criteria.language && session.context.language !== criteria.language) {
                matches = false;
            }
            
            if (criteria.status && session.status !== criteria.status) {
                matches = false;
            }
            
            if (criteria.dateFrom && new Date(session.createdAt) < new Date(criteria.dateFrom)) {
                matches = false;
            }
            
            if (criteria.dateTo && new Date(session.createdAt) > new Date(criteria.dateTo)) {
                matches = false;
            }
            
            if (matches) {
                results.push({
                    sessionId,
                    stats: this.getSessionStats(sessionId)
                });
            }
        }
        
        return results;
    }
    
    // Performance-Metriken
    getMetrics() {
        const totalDuration = Array.from(this.sessions.values())
            .reduce((sum, session) => sum + (session.totalDuration || 0), 0);
        
        const totalMessages = Array.from(this.sessions.values())
            .reduce((sum, session) => sum + session.messageCount, 0);
        
        return {
            ...this.metrics,
            activeSessions: this.sessions.size,
            averageSessionDuration: this.metrics.totalSessions > 0 ? 
                Math.round(totalDuration / this.metrics.totalSessions) : 0,
            averageMessagesPerSession: this.metrics.totalSessions > 0 ? 
                Math.round(totalMessages / this.metrics.totalSessions) : 0,
            sessionTimeout: this.sessionTimeout,
            maxSessions: this.maxSessions
        };
    }
    
    // Session-Export
    exportSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return null;
        }
        
        return {
            sessionId: sessionId,
            exportDate: new Date().toISOString(),
            session: session,
            stats: this.getSessionStats(sessionId)
        };
    }
    
    // Session-Import
    async importSession(sessionData) {
        try {
            const sessionId = sessionData.sessionId || `imported_${Date.now()}`;
            const session = sessionData.session;
            
            this.sessions.set(sessionId, session);
            this.metrics.totalSessions++;
            this.metrics.activeSessions++;
            
            console.log(`📥 Session importiert: ${sessionId}`);
            return sessionId;
        } catch (error) {
            console.error('❌ Session-Import Fehler:', error);
            return null;
        }
    }
    
    // Health Check
    healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            sessions: {
                total: this.sessions.size,
                active: Array.from(this.sessions.values()).filter(s => s.status === 'active').length,
                ended: Array.from(this.sessions.values()).filter(s => s.status === 'ended').length
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
            sessionDataPath: this.sessionDataPath,
            maxSessions: this.maxSessions,
            sessionTimeout: this.sessionTimeout,
            cleanupInterval: this.cleanupInterval,
            activeSessions: this.sessions.size,
            metrics: this.getMetrics()
        };
    }
}

module.exports = KAYASessionManager;

