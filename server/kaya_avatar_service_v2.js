const EventEmitter = require('events');

class KAYAAvatarService extends EventEmitter {
    constructor() {
        super();
        this.avatars = new Map();
        this.emotionStates = new Map();
        this.gestureQueue = new Map();
        this.animationQueue = new Map();
        
        // Emotion-Detection
        this.emotionKeywords = {
            happy: ['freude', 'glücklich', 'zufrieden', 'super', 'toll', 'fantastisch', 'wunderbar'],
            sad: ['traurig', 'trauer', 'deprimiert', 'niedergeschlagen', 'unglücklich'],
            angry: ['wütend', 'ärgerlich', 'frustriert', 'verärgert', 'empört'],
            surprised: ['überrascht', 'erstaunt', 'verblüfft', 'verwundert'],
            fearful: ['ängstlich', 'besorgt', 'nervös', 'unsicher', 'panisch'],
            disgusted: ['ekel', 'widerlich', 'abstoßend', 'abscheulich'],
            neutral: ['normal', 'okay', 'standard', 'üblich', 'neutral']
        };
        
        // Gesture-Mapping
        this.gestureMapping = {
            greeting: ['winken', 'handschlag', 'begrüßung'],
            pointing: ['zeigen', 'hinweisen', 'zeig'],
            nodding: ['nicken', 'zustimmen', 'ja'],
            shaking: ['schütteln', 'ablehnen', 'nein'],
            thinking: ['nachdenken', 'überlegen', 'denken'],
            listening: ['zuhören', 'hören', 'lauschen'],
            speaking: ['sprechen', 'reden', 'sagen']
        };
        
        // Animation-Types
        this.animationTypes = {
            idle: 'idle',
            talking: 'talking',
            listening: 'listening',
            thinking: 'thinking',
            greeting: 'greeting',
            pointing: 'pointing',
            nodding: 'nodding',
            shaking: 'shaking'
        };
        
        // Performance Metrics
        this.metrics = {
            totalAvatars: 0,
            activeAvatars: 0,
            emotionDetections: 0,
            gestureExecutions: 0,
            animationPlays: 0,
            averageEmotionConfidence: 0,
            averageGestureLatency: 0
        };
        
        console.log('🚀 KAYA Avatar Service v2.0 initialisiert');
    }
    
    // Avatar erstellen
    createAvatar(avatarId, config = {}) {
        const avatar = {
            id: avatarId,
            config: {
                name: config.name || 'KAYA',
                model: config.model || 'default',
                voice: config.voice || 'female',
                personality: config.personality || 'friendly',
                ...config
            },
            state: {
                currentEmotion: 'neutral',
                currentGesture: 'idle',
                currentAnimation: 'idle',
                isTalking: false,
                isListening: false,
                isThinking: false
            },
            history: {
                emotions: [],
                gestures: [],
                animations: []
            },
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        this.avatars.set(avatarId, avatar);
        this.emotionStates.set(avatarId, 'neutral');
        this.gestureQueue.set(avatarId, []);
        this.animationQueue.set(avatarId, []);
        
        this.metrics.totalAvatars++;
        this.metrics.activeAvatars++;
        
        console.log(`✅ Avatar erstellt: ${avatarId}`);
        
        // Event emittieren
        this.emit('avatarCreated', avatar);
        
        return avatar;
    }
    
    // Avatar abrufen
    getAvatar(avatarId) {
        const avatar = this.avatars.get(avatarId);
        
        if (!avatar) {
            console.log(`⚠️ Avatar nicht gefunden: ${avatarId}`);
            return null;
        }
        
        // Aktivität aktualisieren
        avatar.lastActivity = new Date().toISOString();
        
        return avatar;
    }
    
    // Emotion analysieren
    analyzeEmotion(text, avatarId = null) {
        const startTime = Date.now();
        
        try {
            const textLower = text.toLowerCase();
            const emotionScores = {};
            
            // Emotion-Scoring
            for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
                emotionScores[emotion] = keywords.reduce((score, keyword) => {
                    return score + (textLower.includes(keyword) ? 1 : 0);
                }, 0);
            }
            
            // Beste Emotion finden
            const bestEmotion = Object.keys(emotionScores).reduce((a, b) => 
                emotionScores[a] > emotionScores[b] ? a : b
            );
            
            const confidence = Math.min(emotionScores[bestEmotion] * 20, 100);
            
            const emotionAnalysis = {
                emotion: bestEmotion,
                confidence: confidence,
                scores: emotionScores,
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
            
            // Avatar-Emotion aktualisieren
            if (avatarId) {
                this.setAvatarEmotion(avatarId, bestEmotion, confidence);
            }
            
            this.metrics.emotionDetections++;
            this.updateAverageEmotionConfidence(confidence);
            
            console.log(`😊 Emotion erkannt: ${bestEmotion} (${confidence}%)`);
            
            // Event emittieren
            this.emit('emotionDetected', {
                avatarId,
                emotion: bestEmotion,
                confidence,
                text: text.substring(0, 100)
            });
            
            return emotionAnalysis;
            
        } catch (error) {
            console.error('❌ Emotion-Analyse Fehler:', error);
            return {
                emotion: 'neutral',
                confidence: 0,
                scores: {},
                processingTime: 0,
                error: error.message
            };
        }
    }
    
    // Avatar-Emotion setzen
    setAvatarEmotion(avatarId, emotion, confidence = 100) {
        const avatar = this.avatars.get(avatarId);
        
        if (!avatar) {
            console.log(`⚠️ Avatar nicht gefunden für Emotion: ${avatarId}`);
            return false;
        }
        
        const previousEmotion = avatar.state.currentEmotion;
        avatar.state.currentEmotion = emotion;
        avatar.lastActivity = new Date().toISOString();
        
        // Emotion-Historie aktualisieren
        avatar.history.emotions.push({
            emotion: emotion,
            confidence: confidence,
            timestamp: new Date().toISOString(),
            previousEmotion: previousEmotion
        });
        
        // Nur die letzten 50 Emotionen behalten
        if (avatar.history.emotions.length > 50) {
            avatar.history.emotions = avatar.history.emotions.slice(-50);
        }
        
        // Emotion-State aktualisieren
        this.emotionStates.set(avatarId, emotion);
        
        console.log(`😊 Avatar ${avatarId} Emotion geändert: ${previousEmotion} → ${emotion}`);
        
        // Event emittieren
        this.emit('avatarEmotionChanged', {
            avatarId,
            emotion,
            confidence,
            previousEmotion
        });
        
        return true;
    }
    
    // Gesture ausführen
    executeGesture(avatarId, gestureType, duration = 2000) {
        const startTime = Date.now();
        
        try {
            const avatar = this.avatars.get(avatarId);
            
            if (!avatar) {
                console.log(`⚠️ Avatar nicht gefunden für Gesture: ${avatarId}`);
                return false;
            }
            
            const previousGesture = avatar.state.currentGesture;
            avatar.state.currentGesture = gestureType;
            avatar.lastActivity = new Date().toISOString();
            
            // Gesture-Historie aktualisieren
            avatar.history.gestures.push({
                gesture: gestureType,
                duration: duration,
                timestamp: new Date().toISOString(),
                previousGesture: previousGesture
            });
            
            // Nur die letzten 50 Gestures behalten
            if (avatar.history.gestures.length > 50) {
                avatar.history.gestures = avatar.history.gestures.slice(-50);
            }
            
            // Gesture-Queue aktualisieren
            const gestureQueue = this.gestureQueue.get(avatarId) || [];
            gestureQueue.push({
                gesture: gestureType,
                duration: duration,
                startTime: startTime
            });
            this.gestureQueue.set(avatarId, gestureQueue);
            
            this.metrics.gestureExecutions++;
            this.updateAverageGestureLatency(Date.now() - startTime);
            
            console.log(`👋 Avatar ${avatarId} Gesture ausgeführt: ${gestureType}`);
            
            // Event emittieren
            this.emit('gestureExecuted', {
                avatarId,
                gesture: gestureType,
                duration,
                previousGesture
            });
            
            // Gesture nach Duration beenden
            setTimeout(() => {
                this.endGesture(avatarId, gestureType);
            }, duration);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Gesture-Ausführung Fehler für ${avatarId}:`, error);
            return false;
        }
    }
    
    // Gesture beenden
    endGesture(avatarId, gestureType) {
        const avatar = this.avatars.get(avatarId);
        
        if (!avatar) return false;
        
        // Gesture-Queue aktualisieren
        const gestureQueue = this.gestureQueue.get(avatarId) || [];
        const updatedQueue = gestureQueue.filter(g => g.gesture !== gestureType);
        this.gestureQueue.set(avatarId, updatedQueue);
        
        // Avatar-State zurücksetzen
        if (avatar.state.currentGesture === gestureType) {
            avatar.state.currentGesture = 'idle';
        }
        
        console.log(`👋 Avatar ${avatarId} Gesture beendet: ${gestureType}`);
        
        // Event emittieren
        this.emit('gestureEnded', {
            avatarId,
            gesture: gestureType
        });
        
        return true;
    }
    
    // Animation abspielen
    playAnimation(avatarId, animationType, duration = 3000) {
        const startTime = Date.now();
        
        try {
            const avatar = this.avatars.get(avatarId);
            
            if (!avatar) {
                console.log(`⚠️ Avatar nicht gefunden für Animation: ${avatarId}`);
                return false;
            }
            
            const previousAnimation = avatar.state.currentAnimation;
            avatar.state.currentAnimation = animationType;
            avatar.lastActivity = new Date().toISOString();
            
            // Animation-Historie aktualisieren
            avatar.history.animations.push({
                animation: animationType,
                duration: duration,
                timestamp: new Date().toISOString(),
                previousAnimation: previousAnimation
            });
            
            // Nur die letzten 50 Animationen behalten
            if (avatar.history.animations.length > 50) {
                avatar.history.animations = avatar.history.animations.slice(-50);
            }
            
            // Animation-Queue aktualisieren
            const animationQueue = this.animationQueue.get(avatarId) || [];
            animationQueue.push({
                animation: animationType,
                duration: duration,
                startTime: startTime
            });
            this.animationQueue.set(avatarId, animationQueue);
            
            this.metrics.animationPlays++;
            
            console.log(`🎬 Avatar ${avatarId} Animation abgespielt: ${animationType}`);
            
            // Event emittieren
            this.emit('animationPlayed', {
                avatarId,
                animation: animationType,
                duration,
                previousAnimation
            });
            
            // Animation nach Duration beenden
            setTimeout(() => {
                this.endAnimation(avatarId, animationType);
            }, duration);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Animation-Abspielung Fehler für ${avatarId}:`, error);
            return false;
        }
    }
    
    // Animation beenden
    endAnimation(avatarId, animationType) {
        const avatar = this.avatars.get(avatarId);
        
        if (!avatar) return false;
        
        // Animation-Queue aktualisieren
        const animationQueue = this.animationQueue.get(avatarId) || [];
        const updatedQueue = animationQueue.filter(a => a.animation !== animationType);
        this.animationQueue.set(avatarId, updatedQueue);
        
        // Avatar-State zurücksetzen
        if (avatar.state.currentAnimation === animationType) {
            avatar.state.currentAnimation = 'idle';
        }
        
        console.log(`🎬 Avatar ${avatarId} Animation beendet: ${animationType}`);
        
        // Event emittieren
        this.emit('animationEnded', {
            avatarId,
            animation: animationType
        });
        
        return true;
    }
    
    // Avatar-Status abrufen
    getAvatarStatus(avatarId) {
        const avatar = this.avatars.get(avatarId);
        
        if (!avatar) {
            return null;
        }
        
        return {
            id: avatarId,
            config: avatar.config,
            state: avatar.state,
            history: {
                emotionCount: avatar.history.emotions.length,
                gestureCount: avatar.history.gestures.length,
                animationCount: avatar.history.animations.length
            },
            createdAt: avatar.createdAt,
            lastActivity: avatar.lastActivity,
            isActive: Date.now() - new Date(avatar.lastActivity).getTime() < 300000 // 5 Minuten
        };
    }
    
    // Alle Avatare-Status
    getAllAvatarsStatus() {
        const avatars = [];
        
        for (const [avatarId] of this.avatars) {
            avatars.push(this.getAvatarStatus(avatarId));
        }
        
        return avatars;
    }
    
    // Avatar löschen
    deleteAvatar(avatarId) {
        const avatar = this.avatars.get(avatarId);
        
        if (!avatar) {
            console.log(`⚠️ Avatar nicht gefunden zum Löschen: ${avatarId}`);
            return false;
        }
        
        this.avatars.delete(avatarId);
        this.emotionStates.delete(avatarId);
        this.gestureQueue.delete(avatarId);
        this.animationQueue.delete(avatarId);
        
        this.metrics.activeAvatars--;
        
        console.log(`🗑️ Avatar gelöscht: ${avatarId}`);
        
        // Event emittieren
        this.emit('avatarDeleted', {
            avatarId,
            avatar
        });
        
        return true;
    }
    
    // Metriken aktualisieren
    updateAverageEmotionConfidence(confidence) {
        this.metrics.averageEmotionConfidence = Math.round(
            (this.metrics.averageEmotionConfidence * (this.metrics.emotionDetections - 1) + confidence) / 
            this.metrics.emotionDetections
        );
    }
    
    updateAverageGestureLatency(latency) {
        this.metrics.averageGestureLatency = Math.round(
            (this.metrics.averageGestureLatency * (this.metrics.gestureExecutions - 1) + latency) / 
            this.metrics.gestureExecutions
        );
    }
    
    // Performance-Metriken
    getMetrics() {
        return {
            ...this.metrics,
            activeAvatars: this.avatars.size,
            totalEmotionStates: this.emotionStates.size,
            totalGestureQueues: this.gestureQueue.size,
            totalAnimationQueues: this.animationQueue.size
        };
    }
    
    // Health Check
    healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            avatars: {
                total: this.avatars.size,
                active: Array.from(this.avatars.values()).filter(a => 
                    Date.now() - new Date(a.lastActivity).getTime() < 300000
                ).length
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
            emotionKeywords: Object.keys(this.emotionKeywords),
            gestureMapping: Object.keys(this.gestureMapping),
            animationTypes: Object.values(this.animationTypes),
            activeAvatars: this.avatars.size,
            metrics: this.getMetrics()
        };
    }
}

module.exports = KAYAAvatarService;

