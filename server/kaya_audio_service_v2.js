const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');

class KAYAAudioService extends EventEmitter {
    constructor() {
        super();
        this.audioQueue = new Map();
        this.audioCache = new Map();
        this.audioSessions = new Map();
        this.audioDataPath = path.join(__dirname, '../data/audio');
        
        // Audio-Konfiguration
        this.audioConfig = {
            defaultVoice: 'female',
            defaultLanguage: 'de-DE',
            defaultSpeed: 1.0,
            defaultPitch: 1.0,
            defaultVolume: 0.8,
            supportedFormats: ['mp3', 'wav', 'ogg'],
            maxAudioLength: 300000, // 5 Minuten
            maxCacheSize: 1000 // 1000 Audio-Dateien
        };
        
        // Voice-Mapping
        this.voiceMapping = {
            female: {
                name: 'KAYA Female',
                language: 'de-DE',
                gender: 'female',
                age: 'adult'
            },
            male: {
                name: 'KAYA Male',
                language: 'de-DE',
                gender: 'male',
                age: 'adult'
            },
            child: {
                name: 'KAYA Child',
                language: 'de-DE',
                gender: 'female',
                age: 'child'
            },
            senior: {
                name: 'KAYA Senior',
                language: 'de-DE',
                gender: 'female',
                age: 'senior'
            }
        };
        
        // Language-Mapping
        this.languageMapping = {
            'de-DE': 'Deutsch',
            'en-US': 'English',
            'tr-TR': 'Türkçe',
            'ar-SA': 'العربية',
            'pl-PL': 'Polski',
            'ru-RU': 'Русский',
            'ro-RO': 'Română',
            'uk-UA': 'Українська',
            'nl-NL': 'Nederlands',
            'da-DK': 'Dansk'
        };
        
        // Performance Metrics
        this.metrics = {
            totalAudioRequests: 0,
            successfulAudioRequests: 0,
            failedAudioRequests: 0,
            cacheHits: 0,
            averageProcessingTime: 0,
            averageAudioLength: 0,
            totalAudioGenerated: 0
        };
        
        console.log('🚀 KAYA Audio Service v2.0 initialisiert');
        this.initializeAudioStorage();
    }
    
    // Audio-Storage initialisieren
    async initializeAudioStorage() {
        try {
            await fs.ensureDir(this.audioDataPath);
            await fs.ensureDir(path.join(this.audioDataPath, 'cache'));
            await fs.ensureDir(path.join(this.audioDataPath, 'sessions'));
            await fs.ensureDir(path.join(this.audioDataPath, 'temp'));
            
            console.log('📁 Audio-Storage initialisiert');
        } catch (error) {
            console.error('❌ Audio-Storage Initialisierung Fehler:', error);
        }
    }
    
    // Text-to-Speech generieren
    async generateSpeech(text, options = {}) {
        const startTime = Date.now();
        
        try {
            // Optionen zusammenführen
            const config = {
                voice: options.voice || this.audioConfig.defaultVoice,
                language: options.language || this.audioConfig.defaultLanguage,
                speed: options.speed || this.audioConfig.defaultSpeed,
                pitch: options.pitch || this.audioConfig.defaultPitch,
                volume: options.volume || this.audioConfig.defaultVolume,
                format: options.format || 'mp3',
                sessionId: options.sessionId || 'default'
            };
            
            // Text validieren
            if (!text || text.length === 0) {
                throw new Error('Text ist leer');
            }
            
            if (text.length > 5000) {
                throw new Error('Text ist zu lang (max. 5000 Zeichen)');
            }
            
            // Cache-Check
            const cacheKey = this.generateCacheKey(text, config);
            const cachedAudio = this.getFromCache(cacheKey);
            
            if (cachedAudio) {
                console.log('📦 Audio-Cache-Hit für Text:', text.substring(0, 50));
                this.metrics.cacheHits++;
                return cachedAudio;
            }
            
            // Audio generieren
            const audioData = await this.synthesizeSpeech(text, config);
            
            // Audio speichern
            const audioFile = await this.saveAudioFile(audioData, config);
            
            // Cache aktualisieren
            this.setCache(cacheKey, audioFile);
            
            // Metriken aktualisieren
            this.metrics.totalAudioRequests++;
            this.metrics.successfulAudioRequests++;
            this.metrics.totalAudioGenerated++;
            
            const processingTime = Date.now() - startTime;
            this.updateAverageProcessingTime(processingTime);
            this.updateAverageAudioLength(audioData.length);
            
            console.log(`🎵 Audio generiert: ${text.substring(0, 50)}... (${processingTime}ms)`);
            
            // Event emittieren
            this.emit('audioGenerated', {
                text: text.substring(0, 100),
                config: config,
                audioFile: audioFile,
                processingTime: processingTime
            });
            
            return audioFile;
            
        } catch (error) {
            console.error('❌ Audio-Generierung Fehler:', error);
            
            this.metrics.totalAudioRequests++;
            this.metrics.failedAudioRequests++;
            
            // Event emittieren
            this.emit('audioGenerationFailed', {
                text: text.substring(0, 100),
                error: error.message
            });
            
            throw error;
        }
    }
    
    // Speech-Synthese (Simulation - würde normalerweise mit ElevenLabs oder ähnlichem Service)
    async synthesizeSpeech(text, config) {
        // Simuliere Audio-Generierung
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simuliere Audio-Daten
                const audioData = {
                    text: text,
                    voice: config.voice,
                    language: config.language,
                    speed: config.speed,
                    pitch: config.pitch,
                    volume: config.volume,
                    format: config.format,
                    duration: Math.round(text.length * 0.1), // Geschätzte Dauer
                    size: Math.round(text.length * 100), // Geschätzte Größe
                    timestamp: new Date().toISOString()
                };
                
                resolve(audioData);
            }, 100); // Simuliere Verarbeitungszeit
        });
    }
    
    // Audio-Datei speichern
    async saveAudioFile(audioData, config) {
        try {
            const fileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${config.format}`;
            const filePath = path.join(this.audioDataPath, 'cache', fileName);
            
            // Simuliere Datei-Speicherung
            await fs.writeJson(filePath.replace(`.${config.format}`, '.json'), audioData, { spaces: 2 });
            
            const audioFile = {
                id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                fileName: fileName,
                filePath: filePath,
                url: `/audio/cache/${fileName}`,
                config: config,
                metadata: {
                    text: audioData.text,
                    duration: audioData.duration,
                    size: audioData.size,
                    format: config.format,
                    voice: config.voice,
                    language: config.language,
                    createdAt: new Date().toISOString()
                }
            };
            
            return audioFile;
            
        } catch (error) {
            console.error('❌ Audio-Datei-Speicherung Fehler:', error);
            throw error;
        }
    }
    
    // Audio-Session erstellen
    createAudioSession(sessionId, config = {}) {
        const audioSession = {
            id: sessionId,
            config: {
                voice: config.voice || this.audioConfig.defaultVoice,
                language: config.language || this.audioConfig.defaultLanguage,
                speed: config.speed || this.audioConfig.defaultSpeed,
                pitch: config.pitch || this.audioConfig.defaultPitch,
                volume: config.volume || this.audioConfig.defaultVolume,
                format: config.format || 'mp3'
            },
            audioFiles: [],
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            totalDuration: 0,
            totalSize: 0
        };
        
        this.audioSessions.set(sessionId, audioSession);
        
        console.log(`✅ Audio-Session erstellt: ${sessionId}`);
        
        // Event emittieren
        this.emit('audioSessionCreated', audioSession);
        
        return audioSession;
    }
    
    // Audio-Session abrufen
    getAudioSession(sessionId) {
        const session = this.audioSessions.get(sessionId);
        
        if (!session) {
            console.log(`⚠️ Audio-Session nicht gefunden: ${sessionId}`);
            return null;
        }
        
        // Aktivität aktualisieren
        session.lastActivity = new Date().toISOString();
        
        return session;
    }
    
    // Audio zur Session hinzufügen
    addAudioToSession(sessionId, audioFile) {
        const session = this.audioSessions.get(sessionId);
        
        if (!session) {
            console.log(`⚠️ Audio-Session nicht gefunden: ${sessionId}`);
            return false;
        }
        
        session.audioFiles.push(audioFile);
        session.totalDuration += audioFile.metadata.duration;
        session.totalSize += audioFile.metadata.size;
        session.lastActivity = new Date().toISOString();
        
        console.log(`🎵 Audio zur Session hinzugefügt: ${sessionId}`);
        
        // Event emittieren
        this.emit('audioAddedToSession', {
            sessionId,
            audioFile
        });
        
        return true;
    }
    
    // Audio-Queue verwalten
    addToQueue(sessionId, text, options = {}) {
        const queueItem = {
            id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: sessionId,
            text: text,
            options: options,
            status: 'pending',
            createdAt: new Date().toISOString(),
            priority: options.priority || 'normal'
        };
        
        const queue = this.audioQueue.get(sessionId) || [];
        queue.push(queueItem);
        this.audioQueue.set(sessionId, queue);
        
        console.log(`📋 Audio zur Queue hinzugefügt: ${sessionId}`);
        
        // Event emittieren
        this.emit('audioQueued', queueItem);
        
        return queueItem;
    }
    
    // Queue verarbeiten
    async processQueue(sessionId) {
        const queue = this.audioQueue.get(sessionId);
        
        if (!queue || queue.length === 0) {
            return;
        }
        
        console.log(`🔄 Verarbeite Audio-Queue: ${sessionId} (${queue.length} Items)`);
        
        for (const item of queue) {
            if (item.status === 'pending') {
                try {
                    item.status = 'processing';
                    
                    const audioFile = await this.generateSpeech(item.text, item.options);
                    
                    item.status = 'completed';
                    item.audioFile = audioFile;
                    item.completedAt = new Date().toISOString();
                    
                    // Audio zur Session hinzufügen
                    this.addAudioToSession(sessionId, audioFile);
                    
                    console.log(`✅ Queue-Item verarbeitet: ${item.id}`);
                    
                } catch (error) {
                    item.status = 'failed';
                    item.error = error.message;
                    item.failedAt = new Date().toISOString();
                    
                    console.error(`❌ Queue-Item Fehler: ${item.id}`, error);
                }
            }
        }
        
        // Event emittieren
        this.emit('queueProcessed', {
            sessionId,
            queue: queue
        });
    }
    
    // Cache-Management
    generateCacheKey(text, config) {
        const key = `${text}_${config.voice}_${config.language}_${config.speed}_${config.pitch}_${config.volume}_${config.format}`;
        return Buffer.from(key).toString('base64');
    }
    
    getFromCache(cacheKey) {
        const cached = this.audioCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 Stunde TTL
            return cached.data;
        }
        
        return null;
    }
    
    setCache(cacheKey, data) {
        this.audioCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        // Cache-Cleanup
        if (this.audioCache.size > this.audioConfig.maxCacheSize) {
            const entries = Array.from(this.audioCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toDelete = entries.slice(0, entries.length - this.audioConfig.maxCacheSize);
            toDelete.forEach(([key]) => this.audioCache.delete(key));
        }
    }
    
    // Metriken aktualisieren
    updateAverageProcessingTime(processingTime) {
        this.metrics.averageProcessingTime = Math.round(
            (this.metrics.averageProcessingTime * (this.metrics.successfulAudioRequests - 1) + processingTime) / 
            this.metrics.successfulAudioRequests
        );
    }
    
    updateAverageAudioLength(audioLength) {
        this.metrics.averageAudioLength = Math.round(
            (this.metrics.averageAudioLength * (this.metrics.totalAudioGenerated - 1) + audioLength) / 
            this.metrics.totalAudioGenerated
        );
    }
    
    // Performance-Metriken
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.audioCache.size,
            cacheHitRate: this.metrics.totalAudioRequests > 0 ? 
                Math.round((this.metrics.cacheHits / this.metrics.totalAudioRequests) * 100) : 0,
            successRate: this.metrics.totalAudioRequests > 0 ? 
                Math.round((this.metrics.successfulAudioRequests / this.metrics.totalAudioRequests) * 100) : 0,
            averageProcessingTime: this.metrics.averageProcessingTime,
            averageAudioLength: this.metrics.averageAudioLength
        };
    }
    
    // Audio-Session-Status
    getAudioSessionStatus(sessionId) {
        const session = this.audioSessions.get(sessionId);
        
        if (!session) {
            return null;
        }
        
        return {
            id: sessionId,
            config: session.config,
            audioCount: session.audioFiles.length,
            totalDuration: session.totalDuration,
            totalSize: session.totalSize,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            queueLength: this.audioQueue.get(sessionId)?.length || 0
        };
    }
    
    // Alle Audio-Sessions-Status
    getAllAudioSessionsStatus() {
        const sessions = [];
        
        for (const [sessionId] of this.audioSessions) {
            sessions.push(this.getAudioSessionStatus(sessionId));
        }
        
        return sessions;
    }
    
    // Cache leeren
    clearCache() {
        this.audioCache.clear();
        console.log('🗑️ Audio-Cache geleert');
    }
    
    // Health Check
    healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            config: this.audioConfig,
            sessions: {
                total: this.audioSessions.size,
                active: Array.from(this.audioSessions.values()).filter(s => 
                    Date.now() - new Date(s.lastActivity).getTime() < 300000
                ).length
            },
            cache: {
                size: this.audioCache.size,
                hitRate: this.getMetrics().cacheHitRate
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
            audioDataPath: this.audioDataPath,
            audioConfig: this.audioConfig,
            voiceMapping: Object.keys(this.voiceMapping),
            languageMapping: Object.keys(this.languageMapping),
            activeSessions: this.audioSessions.size,
            cacheSize: this.audioCache.size,
            metrics: this.getMetrics()
        };
    }
}

module.exports = KAYAAudioService;
