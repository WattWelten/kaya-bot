const fs = require('fs');
const path = require('path');

class ContextMemory {
    constructor() {
        this.memoryDir = path.join(__dirname, '../memory');
        this.sessions = new Map(); // In-Memory für aktive Sessions
        this.maxSessions = 100; // Maximale Anzahl aktiver Sessions
        this.sessionTimeout = 30 * 60 * 1000; // 30 Minuten
        
        this.ensureMemoryDir();
        this.startCleanupInterval();
    }
    
    ensureMemoryDir() {
        if (!fs.existsSync(this.memoryDir)) {
            fs.mkdirSync(this.memoryDir, { recursive: true });
        }
    }
    
    // Session erstellen oder laden
    getSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                id: sessionId,
                createdAt: new Date(),
                lastActivity: new Date(),
                messages: [],
                context: {
                    location: null,
                    persona: null,
                    urgency: 'normal',
                    emotionalState: 'neutral',
                    citizenType: 'unknown',
                    currentTopic: null,
                    problemProgress: [],
                    preferences: {}
                },
                metadata: {
                    totalMessages: 0,
                    averageResponseTime: 0,
                    satisfactionScore: null
                }
            });
        }
        
        const session = this.sessions.get(sessionId);
        session.lastActivity = new Date();
        return session;
    }
    
    // Nachricht zur Session hinzufügen
    addMessage(sessionId, message, sender, metadata = {}) {
        const session = this.getSession(sessionId);
        
        const messageObj = {
            id: this.generateMessageId(),
            timestamp: new Date(),
            sender: sender, // 'user' oder 'kaya'
            content: message,
            metadata: {
                ...metadata,
                messageLength: message.length,
                containsQuestion: this.containsQuestion(message),
                containsEmotion: this.detectEmotion(message),
                containsLocation: this.extractLocation(message),
                containsUrgency: this.detectUrgency(message)
            }
        };
        
        session.messages.push(messageObj);
        session.metadata.totalMessages++;
        
        // Context aktualisieren
        this.updateContext(session, messageObj);
        
        // Session speichern
        this.saveSession(session);
        
        return messageObj;
    }
    
    // Context basierend auf Nachrichten aktualisieren
    updateContext(session, message) {
        const { content, metadata } = message;
        
        // Location aktualisieren
        if (metadata.containsLocation) {
            session.context.location = metadata.containsLocation;
        }
        
        // Emotional State aktualisieren
        if (metadata.containsEmotion) {
            session.context.emotionalState = metadata.containsEmotion;
        }
        
        // Urgency aktualisieren
        if (metadata.containsUrgency) {
            session.context.urgency = metadata.containsUrgency;
        }
        
        // Current Topic aktualisieren
        session.context.currentTopic = this.extractTopic(content);
        
        // Citizen Type bestimmen
        session.context.citizenType = this.determineCitizenType(session);
        
        // Problem Progress verfolgen
        this.updateProblemProgress(session, content);
    }
    
    // Emotionen in Text erkennen
    detectEmotion(text) {
        const emotions = {
            frustrated: ['ärgerlich', 'frustriert', 'genervt', 'verärgert', 'wütend'],
            confused: ['verwirrt', 'verstehe nicht', 'unsicher', 'ratlos'],
            urgent: ['eilig', 'dringend', 'schnell', 'sofort', 'heute noch'],
            happy: ['freut', 'danke', 'super', 'toll', 'perfekt'],
            sad: ['traurig', 'probleme', 'schwierig', 'kompliziert']
        };
        
        const textLower = text.toLowerCase();
        for (const [emotion, keywords] of Object.entries(emotions)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                return emotion;
            }
        }
        
        return 'neutral';
    }
    
    // Dringlichkeit erkennen
    detectUrgency(text) {
        const urgentKeywords = ['eilig', 'dringend', 'schnell', 'sofort', 'heute', 'morgen', 'frist'];
        const textLower = text.toLowerCase();
        
        if (urgentKeywords.some(keyword => textLower.includes(keyword))) {
            return 'high';
        }
        
        return 'normal';
    }
    
    // Ort/Location extrahieren
    extractLocation(text) {
        const locations = [
            'wildeshausen', 'delmenhorst', 'ganderkesee', 'hude', 'grossenkneten',
            'harpstedt', 'dötlingen', 'winkelsett', 'kirchseelte', 'neerstedt'
        ];
        
        const textLower = text.toLowerCase();
        for (const location of locations) {
            if (textLower.includes(location)) {
                return location;
            }
        }
        
        return null;
    }
    
    // Topic/Thema extrahieren
    extractTopic(text) {
        const topics = {
            'bauantrag': ['bauantrag', 'bauen', 'haus', 'umbau', 'anbau'],
            'kita': ['kita', 'kindergarten', 'krippe', 'betreuung', 'kind'],
            'sozialhilfe': ['sozialhilfe', 'alg', 'arbeitslos', 'hilfe', 'unterstützung'],
            'wohngeld': ['wohngeld', 'miete', 'wohnung', 'wohnen'],
            'gewerbe': ['gewerbe', 'geschäft', 'selbständig', 'unternehmen'],
            'ausweis': ['ausweis', 'personalausweis', 'reisepass', 'dokument'],
            'meldeamt': ['anmelden', 'ummelden', 'abmelden', 'wohnsitz']
        };
        
        const textLower = text.toLowerCase();
        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                return topic;
            }
        }
        
        return 'general';
    }
    
    // Bürger-Typ bestimmen
    determineCitizenType(session) {
        const messages = session.messages;
        const totalMessages = messages.length;
        
        if (totalMessages === 1) {
            return 'first_time';
        } else if (totalMessages > 10) {
            return 'regular';
        } else if (messages.some(m => m.metadata.containsEmotion === 'confused')) {
            return 'needs_guidance';
        } else if (messages.some(m => m.metadata.containsUrgency === 'high')) {
            return 'urgent_case';
        }
        
        return 'standard';
    }
    
    // Problem Progress verfolgen
    updateProblemProgress(session, content) {
        const progress = session.context.problemProgress;
        const currentTopic = session.context.currentTopic;
        
        // Prüfe ob neues Problem oder Fortschritt
        if (progress.length === 0 || progress[progress.length - 1].topic !== currentTopic) {
            progress.push({
                topic: currentTopic,
                started: new Date(),
                steps: [],
                status: 'in_progress'
            });
        }
        
        // Aktuellen Schritt hinzufügen
        const currentProblem = progress[progress.length - 1];
        currentProblem.steps.push({
            timestamp: new Date(),
            content: content,
            step: currentProblem.steps.length + 1
        });
    }
    
    // Frage erkennen
    containsQuestion(text) {
        return text.includes('?') || 
               text.toLowerCase().includes('wie') ||
               text.toLowerCase().includes('was') ||
               text.toLowerCase().includes('wo') ||
               text.toLowerCase().includes('wann') ||
               text.toLowerCase().includes('warum');
    }
    
    // Message ID generieren
    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Session speichern
    saveSession(session) {
        const filePath = path.join(this.memoryDir, `${session.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    }
    
    // Session laden
    loadSession(sessionId) {
        const filePath = path.join(this.memoryDir, `${sessionId}.json`);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return null;
    }
    
    // Context für LLM generieren
    generateContextPrompt(session) {
        const context = session.context;
        const recentMessages = session.messages.slice(-5); // Letzte 5 Nachrichten
        
        let prompt = `KONTEXT-ANALYSE für KAYA:
        
BÜRGER-PROFIL:
- Typ: ${context.citizenType}
- Emotionaler Zustand: ${context.emotionalState}
- Dringlichkeit: ${context.urgency}
- Standort: ${context.location || 'Landkreis Oldenburg'}
- Aktuelles Thema: ${context.currentTopic}

PROBLEM-PROGRESS:
`;
        
        if (context.problemProgress.length > 0) {
            const currentProblem = context.problemProgress[context.problemProgress.length - 1];
            prompt += `- Thema: ${currentProblem.topic}
- Status: ${currentProblem.status}
- Schritte: ${currentProblem.steps.length}
`;
        }
        
        prompt += `
LETZTE NACHRICHTEN:
`;
        
        recentMessages.forEach(msg => {
            prompt += `- ${msg.sender}: ${msg.content}\n`;
        });
        
        prompt += `
KAYA-SYSTEMPROMPT:
Reagiere als empathischer Bürgerservice-Mitarbeiter:
1. Berücksichtige den emotionalen Zustand
2. Stelle proaktive Fragen basierend auf dem Kontext
3. Biete konkrete Lösungswege an
4. Denke mit und erkenne implizite Bedürfnisse
5. Verwende den Standort für lokale Informationen
6. Verfolge den Problem-Progress und biete nächste Schritte`;
        
        return prompt;
    }
    
    // Cleanup alte Sessions
    startCleanupInterval() {
        setInterval(() => {
            const now = new Date();
            for (const [sessionId, session] of this.sessions.entries()) {
                if (now - session.lastActivity > this.sessionTimeout) {
                    this.sessions.delete(sessionId);
                }
            }
        }, 5 * 60 * 1000); // Alle 5 Minuten
    }
    
    // Session-Statistiken
    getSessionStats(sessionId) {
        const session = this.getSession(sessionId);
        return {
            totalMessages: session.metadata.totalMessages,
            sessionDuration: new Date() - session.createdAt,
            currentTopic: session.context.currentTopic,
            citizenType: session.context.citizenType,
            emotionalState: session.context.emotionalState,
            urgency: session.context.urgency
        };
    }
}

module.exports = ContextMemory;
