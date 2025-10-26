const fs = require('fs-extra');
const path = require('path');

class ContextMemory {
    constructor() {
        this.sessions = new Map();
        this.memoryDir = path.join(__dirname, 'memory');
        this.ensureMemoryDir();
        this.loadPersistentSessions();
        
        console.log('🧠 Context Memory initialisiert');
    }
    
    ensureMemoryDir() {
        try {
            fs.ensureDirSync(this.memoryDir);
        } catch (error) {
            console.error('Fehler beim Erstellen des Memory-Verzeichnisses:', error);
        }
    }
    
    loadPersistentSessions() {
        try {
            const files = fs.readdirSync(this.memoryDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const sessionId = path.basename(file, '.json');
                    const sessionPath = path.join(this.memoryDir, file);
                    const sessionData = fs.readJsonSync(sessionPath);
                    this.sessions.set(sessionId, sessionData);
                }
            });
            console.log(`📁 ${files.length} Sessions aus Dateisystem geladen`);
        } catch (error) {
            console.log('Keine persistenten Sessions gefunden oder Fehler beim Laden');
        }
    }
    
    saveSession(sessionId) {
        try {
            const session = this.sessions.get(sessionId);
            if (session) {
                const sessionPath = path.join(this.memoryDir, `${sessionId}.json`);
                fs.writeJsonSync(sessionPath, session, { spaces: 2 });
            }
        } catch (error) {
            console.error(`Fehler beim Speichern der Session ${sessionId}:`, error);
        }
    }
    
    getSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                id: sessionId,
                messages: [],
                context: {
                    userData: {}
                },
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            });
        }
        
        const session = this.sessions.get(sessionId);
        session.lastActivity = new Date().toISOString();
        return session;
    }
    
    /**
     * Extrahiert User-Daten aus Nachricht (Name, etc.)
     */
    extractUserData(message, sessionId) {
        const session = this.getSession(sessionId);
        if (!session) return;
        
        const lowerMsg = message.toLowerCase();
        
        // Name-Extraction
        const namePatterns = [
            /(?:ich bin|ich heiße|mein name ist|ich heisse)\s+([a-zäöüß]+)/i,
            /^([A-ZÄÖÜ][a-zäöüß]+)(?:\s|$)/ // Erster Großbuchstabe am Anfang
        ];
        
        for (const pattern of namePatterns) {
            const match = message.match(pattern);
            if (match && match[1] && match[1].length > 2) { // Mind. 3 Buchstaben
                const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
                if (!session.context) session.context = {};
                if (!session.context.userData) session.context.userData = {};
                session.context.userData.name = name;
                console.log(`👤 Name extrahiert: ${name} (Session: ${sessionId})`);
                this.saveSession(sessionId);
                break;
            }
        }
    }
    
    addMessage(sessionId, sender, content, metadata = {}) {
        const session = this.getSession(sessionId);
        
        const messageObj = {
            id: Date.now().toString(),
            sender: sender,
            content: content,
            timestamp: new Date().toISOString(),
            context: metadata
        };
        
        session.messages.push(messageObj);
        
        // Session speichern
        this.saveSession(sessionId);
        
        return messageObj;
    }
    
    getMessages(sessionId, limit = 10) {
        const session = this.getSession(sessionId);
        return session.messages.slice(-limit);
    }
    
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
        
        // Datei löschen
        try {
            const sessionPath = path.join(this.memoryDir, `${sessionId}.json`);
            if (fs.existsSync(sessionPath)) {
                fs.removeSync(sessionPath);
            }
        } catch (error) {
            console.error(`Fehler beim Löschen der Session-Datei ${sessionId}:`, error);
        }
    }
    
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    
    cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 Stunden
        const now = new Date();
        const sessionsToDelete = [];
        
        this.sessions.forEach((session, sessionId) => {
            const lastActivity = new Date(session.lastActivity);
            const age = now - lastActivity;
            
            if (age > maxAge) {
                sessionsToDelete.push(sessionId);
            }
        });
        
        sessionsToDelete.forEach(sessionId => {
            this.clearSession(sessionId);
        });
        
        if (sessionsToDelete.length > 0) {
            console.log(`🧹 ${sessionsToDelete.length} alte Sessions bereinigt`);
        }
    }
    
    getSessionStats() {
        return {
            totalSessions: this.sessions.size,
            totalMessages: Array.from(this.sessions.values())
                .reduce((sum, session) => sum + session.messages.length, 0),
            averageMessagesPerSession: this.sessions.size > 0 
                ? Array.from(this.sessions.values())
                    .reduce((sum, session) => sum + session.messages.length, 0) / this.sessions.size
                : 0
        };
    }
}

module.exports = ContextMemory;

