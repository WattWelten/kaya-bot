const fs = require('fs-extra');
const path = require('path');

class ContextMemory {
    constructor() {
        this.sessions = new Map();
        this.memoryDir = path.join(__dirname, 'memory');
        this.cleanupInterval = null; // Für automatischen Cleanup
        this.ensureMemoryDir();
        this.loadPersistentSessions();
        
        // Starte automatischen Cleanup (DSGVO-konform)
        this.startAutoCleanup();
        
        console.log('🧠 Context Memory initialisiert (DSGVO-konform: Auto-Cleanup nach 30 Tagen)');
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
                    
                    // Migration: Stelle sicher, dass context.userData existiert
                    if (!sessionData.context) {
                        sessionData.context = { userData: {} };
                    }
                    if (!sessionData.context.userData) {
                        sessionData.context.userData = {};
                    }
                    
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
        
        // Name-Extraction - Robuste Patterns für bessere Trefferquote
        const namePatterns = [
            // "ich bin Klara" oder "ich heiße Sandra"
            /(?:ich bin|ich heiße|mein name ist|ich heisse|ich heiße|ich nenne mich)\s+([a-zäöüß]+)/i,
            // "ich bin Klara und bin 78" - nur Name vor Konjunktionen
            /(?:ich bin|ich heiße)\s+([a-zäöüß]+)(?:\s+und|\s+bin|\s+habe|\s+ist)/i,
            // "mein Name ist Wilhelm"
            /mein name ist\s+([a-zäöüß]+)/i,
            // "Ich heiße Michael"
            /ich heiße\s+([a-zäöüß]+)/i,
            // "mein Name ist Sandra und..."
            /mein name ist\s+([a-zäöüß]+)(?:\s+und|\s+habe|\s+bin)/i
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
    
    /**
     * Löscht eine Session komplett (inkl. Datei)
     * DSGVO-konform: Alle User-Daten werden entfernt
     * @param {string} sessionId - Session-ID
     * @returns {boolean} - Erfolg
     */
    clearSession(sessionId) {
        let deleted = false;
        
        // Aus Memory entfernen
        if (this.sessions.has(sessionId)) {
            this.sessions.delete(sessionId);
            deleted = true;
        }
        
        // Datei löschen
        try {
            const sessionPath = path.join(this.memoryDir, `${sessionId}.json`);
            if (fs.existsSync(sessionPath)) {
                fs.removeSync(sessionPath);
                deleted = true;
            }
        } catch (error) {
            console.error(`Fehler beim Löschen der Session-Datei ${sessionId}:`, error);
            return false;
        }
        
        if (deleted) {
            console.log(`🗑️ Session gelöscht: ${sessionId} (DSGVO-konform)`);
        }
        
        return deleted;
    }
    
    /**
     * Löscht Session nach expliziter Anfrage (DSGVO: Recht auf Löschung)
     * @param {string} sessionId - Session-ID
     * @returns {object} - Ergebnis mit Status
     */
    deleteSession(sessionId) {
        if (!sessionId || typeof sessionId !== 'string') {
            return { success: false, error: 'Ungültige Session-ID' };
        }
        
        const existed = this.sessions.has(sessionId);
        const deleted = this.clearSession(sessionId);
        
        return {
            success: deleted,
            existed: existed,
            message: deleted 
                ? 'Session erfolgreich gelöscht (DSGVO-konform)' 
                : 'Session nicht gefunden'
        };
    }
    
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    
    /**
     * Bereinigt alte Sessions automatisch
     * DSGVO-konform: Sessions werden nach 30 Tagen automatisch gelöscht
     * @param {number} maxAge - Maximale Alter in Millisekunden (Standard: 30 Tage)
     */
    cleanupOldSessions(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 Tage (DSGVO-konform)
        const now = new Date();
        const sessionsToDelete = [];
        
        this.sessions.forEach((session, sessionId) => {
            const lastActivity = new Date(session.lastActivity || session.createdAt);
            const age = now - lastActivity;
            
            if (age > maxAge) {
                sessionsToDelete.push(sessionId);
            }
        });
        
        sessionsToDelete.forEach(sessionId => {
            this.clearSession(sessionId);
        });
        
        if (sessionsToDelete.length > 0) {
            console.log(`🧹 DSGVO-Cleanup: ${sessionsToDelete.length} alte Sessions (>30 Tage) gelöscht`);
        }
        
        return sessionsToDelete.length;
    }
    
    /**
     * Startet automatischen Cleanup-Intervall
     * Läuft täglich um 3:00 Uhr
     */
    startAutoCleanup() {
        // Prüfe ob bereits ein Intervall läuft
        if (this.cleanupInterval) {
            return;
        }
        
        // Berechne Zeit bis zur nächsten 3:00 Uhr
        const now = new Date();
        const nextCleanup = new Date(now);
        nextCleanup.setHours(3, 0, 0, 0);
        if (nextCleanup <= now) {
            nextCleanup.setDate(nextCleanup.getDate() + 1);
        }
        
        const msUntilCleanup = nextCleanup - now;
        
        // Führe ersten Cleanup nach berechneter Zeit aus
        setTimeout(() => {
            this.cleanupOldSessions();
            
            // Dann täglich wiederholen
            this.cleanupInterval = setInterval(() => {
                this.cleanupOldSessions();
            }, 24 * 60 * 60 * 1000); // 24 Stunden
        }, msUntilCleanup);
        
        console.log(`🧹 Auto-Cleanup geplant: täglich um 3:00 Uhr (nächster Cleanup: ${nextCleanup.toISOString()})`);
    }
    
    /**
     * Stoppt automatischen Cleanup
     */
    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
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

