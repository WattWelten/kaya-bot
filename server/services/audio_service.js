const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const EventEmitter = require('events');
const costTracker = require('./cost_tracker');

/**
 * KAYA Audio Service
 * 
 * Integriert:
 * - ElevenLabs TTS (Text-to-Speech) - Natürliche deutsche Stimme
 * - OpenAI Whisper STT (Speech-to-Text) - Audio-Transkription
 * 
 * Features:
 * - Audio-Caching für Performance
 * - Circuit Breaker für Fehlerbehandlung
 * - Streaming Support für niedrige Latenz
 */

class AudioService extends EventEmitter {
    constructor() {
        super();
        
        // API Keys
        this.elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        
        // Configuration
        this.config = {
            elevenlabsApiUrl: 'https://api.elevenlabs.io/v1',
            openaiApiUrl: 'https://api.openai.com/v1/audio/transcriptions',
            defaultVoice: 'Dana', // Persönliche Stimme für KAYA (wird von ENV überschrieben)
            fallbackVoice: 'Bella', // Warm, empathisch
            modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
            stability: parseFloat(process.env.ELEVENLABS_STABILITY || '0.40'),
            similarityBoost: parseFloat(process.env.ELEVENLABS_SIMILARITY || '0.85'),
            style: parseFloat(process.env.ELEVENLABS_STYLE || '0.15'),
            speakerBoost: String(process.env.ELEVENLABS_SPEAKER_BOOST || 'true') === 'true',
            whisperModel: 'whisper-1'
        };
        
        // Cache
        this.audioCache = new Map();
        this.cacheMaxSize = 1000;
        this.cacheTTL = 3600000; // 1 Stunde
        
        // Performance Metrics
        this.metrics = {
            totalSTTRequests: 0,
            totalTTSRequests: 0,
            successfulSTT: 0,
            successfulTTS: 0,
            cacheHits: 0,
            averageLatency: {
                stt: [],
                tts: []
            }
        };
        
        // Circuit Breaker
        this.circuitBreaker = {
            stt: {
                isOpen: false,
                failureCount: 0,
                lastFailureTime: 0,
                timeout: 60000
            },
            tts: {
                isOpen: false,
                failureCount: 0,
                lastFailureTime: 0,
                timeout: 60000
            }
        };
        
        console.log('🎙️ Audio Service initialisiert');
    }
    
    /**
     * Speech-to-Text: Audio → Text (OpenAI Whisper)
     */
    async speechToText(audioBuffer, language = 'de') {
        const startTime = Date.now();
        
        try {
            this.metrics.totalSTTRequests++;
            
            // Circuit Breaker prüfen
            if (this.circuitBreaker.stt.isOpen) {
                if (Date.now() - this.circuitBreaker.stt.lastFailureTime > this.circuitBreaker.stt.timeout) {
                    this.circuitBreaker.stt.isOpen = false;
                    this.circuitBreaker.stt.failureCount = 0;
                    console.log('🔧 STT Circuit Breaker: Geschlossen');
                } else {
                    throw new Error('STT Circuit Breaker ist offen');
                }
            }
            
            // OpenAI Whisper API Call
            const formData = new FormData();
            formData.append('file', audioBuffer, {
                filename: 'recording.webm',
                contentType: 'audio/webm'
            });
            formData.append('model', this.config.whisperModel);
            formData.append('language', language);
            
            const response = await axios.post(
                this.config.openaiApiUrl,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                        ...formData.getHeaders()
                    },
                    timeout: 30000
                }
            );
            
            // Erfolg
            this.circuitBreaker.stt.isOpen = false;
            this.circuitBreaker.stt.failureCount = 0;
            this.metrics.successfulSTT++;
            
            const transcription = response.data.text;
            const latency = Date.now() - startTime;
            this.metrics.averageLatency.stt.push(latency);
            
            // Kosten tracken (Whisper: $0.006/Minute, geschätzt: 5 Sekunden = 0.083 Minuten)
            const estimatedMinutes = 0.083; // Durchschnittliche Audio-Länge
            costTracker.trackWhisper(estimatedMinutes);
            
            console.log(`✅ STT erfolgreich: "${transcription}" (${latency}ms)`);
            
            return {
                success: true,
                text: transcription,
                language: response.data.language || language,
                latency
            };
            
        } catch (error) {
            this.handleSTTError(error);
            throw error;
        }
    }
    
    /**
     * Viseme-Timeline aus Text generieren (Lippensync für Avatar)
     */
    generateVisemeTimeline(text, duration) {
        // Phonem → Viseme Mapping für deutschen Text
        const phonemeToViseme = {
            'a': 'mouthOpen', 'ä': 'mouthOpen', 'e': 'mouthSmile_L', 'i': 'mouthSmile_L',
            'o': 'mouthO', 'ö': 'mouthO', 'u': 'mouthFunnel', 'ü': 'mouthFunnel',
            'f': 'mouthClose', 'v': 'mouthClose', 'p': 'mouthClose', 'b': 'mouthClose',
            'm': 'mouthClose', 's': 'mouthSmile_R', 'z': 'mouthSmile_R', 'sch': 'mouthFunnel',
            'ch': 'mouthSmile_R', 'r': 'mouthOpen', 'l': 'tongueOut', 'n': 'mouthClose',
            't': 'mouthClose', 'd': 'mouthClose', 'k': 'mouthOpen', 'g': 'mouthOpen'
        };
        
        const timeline = [];
        const words = text.toLowerCase().split(/\s+/);
        const avgDuration = duration / Math.max(words.length, 1);
        let currentTime = 0;
        
        words.forEach((word) => {
            const chars = word.split('');
            const charDuration = avgDuration / Math.max(chars.length, 1);
            
            chars.forEach((char, charIndex) => {
                let phoneme = char;
                let viseme = phonemeToViseme[char] || 'neutral';
                
                // Check für 2-3 Buchstaben-Kombinationen
                if (charIndex < chars.length - 1) {
                    const twoChar = char + chars[charIndex + 1];
                    if (phonemeToViseme[twoChar]) {
                        phoneme = twoChar;
                        viseme = phonemeToViseme[twoChar];
                    }
                }
                
                if (charIndex < chars.length - 2) {
                    const threeChar = char + chars[charIndex + 1] + chars[charIndex + 2];
                    if (phonemeToViseme[threeChar]) {
                        phoneme = threeChar;
                        viseme = phonemeToViseme[threeChar];
                    }
                }
                
                // Nur relevante Phoneme hinzufügen (nicht neutral)
                if (viseme !== 'neutral') {
                    timeline.push({
                        phoneme: phoneme,
                        viseme: viseme,
                        start: currentTime,
                        end: currentTime + charDuration,
                        weight: 0.8
                    });
                }
                
                currentTime += charDuration;
            });
            
            // Kleine Pause zwischen Wörtern
            currentTime += charDuration * 0.3;
        });
        
        return timeline;
    }
    
    /**
     * Text-to-Speech: Text → Audio (ElevenLabs)
     */
    async textToSpeech(text, voiceId = null, options = {}) {
        const startTime = Date.now();
        
        try {
            this.metrics.totalTTSRequests++;
            
            // Cache prüfen
            const cacheKey = this.generateCacheKey(text, voiceId);
            const cached = this.getFromCache(cacheKey);
            
            if (cached) {
                this.metrics.cacheHits++;
                console.log('📦 TTS Cache-Hit');
                // Viseme-Timeline auch für Cache generieren
                const estimatedDuration = text.split(/\s+/).length * 3000;
                const visemeTimeline = this.generateVisemeTimeline(text, estimatedDuration);
                return { success: true, audio: cached, cached: true, visemeTimeline };
            }
            
            // Circuit Breaker prüfen
            if (this.circuitBreaker.tts.isOpen) {
                if (Date.now() - this.circuitBreaker.tts.lastFailureTime > this.circuitBreaker.tts.timeout) {
                    this.circuitBreaker.tts.isOpen = false;
                    this.circuitBreaker.tts.failureCount = 0;
                    console.log('🔧 TTS Circuit Breaker: Geschlossen');
                } else {
                    throw new Error('TTS Circuit Breaker ist offen');
                }
            }
            
            // Voice ID bestimmen
            const finalVoiceId = voiceId || this.getDefaultVoiceId();
            
            // Debug: Prüfe ob API Key vorhanden
            if (!this.elevenlabsApiKey) {
                throw new Error('ELEVENLABS_API_KEY ist nicht gesetzt');
            }
            
            console.log(`🔊 TTS Voice ID: ${finalVoiceId}, Text: "${text.substring(0, 30)}..."`);
            
            // ElevenLabs API Call
            const response = await axios.post(
                `${this.config.elevenlabsApiUrl}/text-to-speech/${finalVoiceId}`,
                {
                    text: text,
                    model_id: this.config.modelId,
                    voice_settings: {
                        stability: options.stability || this.config.stability,
                        similarity_boost: options.similarityBoost || this.config.similarityBoost,
                        style: options.style || this.config.style,
                        use_speaker_boost: typeof options.useSpeakerBoost === 'boolean' ? options.useSpeakerBoost : this.config.speakerBoost
                    }
                },
                {
                    headers: {
                        'xi-api-key': this.elevenlabsApiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000
                }
            );
            
            // Erfolg
            this.circuitBreaker.tts.isOpen = false;
            this.circuitBreaker.tts.failureCount = 0;
            this.metrics.successfulTTS++;
            
            const audioBuffer = Buffer.from(response.data);
            const latency = Date.now() - startTime;
            this.metrics.averageLatency.tts.push(latency);
            
            // Cache speichern
            this.setCache(cacheKey, audioBuffer);
            
            // Kosten tracken (ElevenLabs: $5/30k Zeichen)
            costTracker.trackElevenLabs(text.length);
            
            console.log(`✅ TTS erfolgreich: "${text.substring(0, 50)}..." (${latency}ms)`);
            
            // Viseme-Timeline generieren (geschätzte Audio-Dauer: ~3 Sekunden pro Wort)
            const estimatedDuration = text.split(/\s+/).length * 3000; // 3s pro Wort
            const visemeTimeline = this.generateVisemeTimeline(text, estimatedDuration);
            console.log(`🎭 Viseme-Timeline generiert: ${visemeTimeline.length} Segmente`);
            
            return {
                success: true,
                audio: audioBuffer,
                audioUrl: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`,
                visemeTimeline: visemeTimeline,
                latency,
                cached: false
            };
            
        } catch (error) {
            this.handleTTSError(error);
            throw error;
        }
    }
    
    /**
     * Kompletter Audio-Chat-Flow
     */
    async audioChatFlow(audioBuffer, language = 'de') {
        try {
            // 1. STT: Audio → Text
            const { text } = await this.speechToText(audioBuffer, language);
            
            // 2. KAYA Response generieren (via Character Handler)
            // (Wird vom Server bereitgestellt)
            
            return {
                success: true,
                text
            };
            
        } catch (error) {
            console.error('❌ Audio Chat Flow Fehler:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Helper: Default Voice ID
     */
    getDefaultVoiceId() {
        // ENV hat Vorrang (z.B. Elena)
        if (process.env.ELEVENLABS_VOICE_ID) {
            return process.env.ELEVENLABS_VOICE_ID;
        }
        // ElevenLabs Voice IDs
        const voices = {
            'Dana': 'otF9rqKzRHFgfwf6serQ', // Persönliche KAYA-Stimme
            'Rachel': 'pNInz6obpgDQGcFmaJgB', // Female
            'Bella': 'EXAVITQu4vr4xnSDxMaL', // Female, warm
            'Antoni': 'ErXwobaYiN019PkySvjV', // Male
            'Adam': 'pNInz6obpgDQGcFmaJgB', // Male
            'Domi': 'AZnzlk1XvdvUeBnXmlld', // Female
            'Elli': 'MF3mGyEYCl7XYWbV9V6O', // Female
            'Josh': 'TxGEqnHWrfWFTfGW9XjX', // Male
            'Arnold': 'VR6AewLTigWG4xSOukaG', // Male
            'Alice': 'XB0fDUnXU5powFXDhCwa' // Female
        };
        
        // Fallback: Verwende Dana als Standard
        return voices[this.config.defaultVoice] || 'otF9rqKzRHFgfwf6serQ';
    }
    
    /**
     * Helper: Cache Key generieren
     */
    generateCacheKey(text, voiceId = null) {
        return `${text}:${voiceId || this.getDefaultVoiceId()}`;
    }
    
    /**
     * Helper: Aus Cache laden
     */
    getFromCache(key) {
        const cached = this.audioCache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        
        if (cached) {
            this.audioCache.delete(key);
        }
        
        return null;
    }
    
    /**
     * Helper: In Cache speichern
     */
    setCache(key, data) {
        // Cache-Size begrenzen
        if (this.audioCache.size >= this.cacheMaxSize) {
            const firstKey = this.audioCache.keys().next().value;
            this.audioCache.delete(firstKey);
        }
        
        this.audioCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Helper: STT Fehlerbehandlung
     */
    handleSTTError(error) {
        this.circuitBreaker.stt.failureCount++;
        this.circuitBreaker.stt.lastFailureTime = Date.now();
        
        if (this.circuitBreaker.stt.failureCount >= 3) {
            this.circuitBreaker.stt.isOpen = true;
            console.error('❌ STT Circuit Breaker: Offen');
        }
        
        console.error('❌ STT Fehler:', error.message);
    }
    
    /**
     * Helper: TTS Fehlerbehandlung
     */
    handleTTSError(error) {
        this.circuitBreaker.tts.failureCount++;
        this.circuitBreaker.tts.lastFailureTime = Date.now();
        
        if (this.circuitBreaker.tts.failureCount >= 3) {
            this.circuitBreaker.tts.isOpen = true;
            console.error('❌ TTS Circuit Breaker: Offen');
        }
        
        console.error('❌ TTS Fehler:', error.message);
    }
    
    /**
     * Performance Metrics abrufen
     */
    getMetrics() {
        const avgSTTLatency = this.metrics.averageLatency.stt.length > 0
            ? this.metrics.averageLatency.stt.reduce((a, b) => a + b, 0) / this.metrics.averageLatency.stt.length
            : 0;
            
        const avgTTSLatency = this.metrics.averageLatency.tts.length > 0
            ? this.metrics.averageLatency.tts.reduce((a, b) => a + b, 0) / this.metrics.averageLatency.tts.length
            : 0;
        
        return {
            ...this.metrics,
            cacheSize: this.audioCache.size,
            averageLatency: {
                stt: Math.round(avgSTTLatency),
                tts: Math.round(avgTTSLatency)
            },
            successRate: {
                stt: this.metrics.totalSTTRequests > 0
                    ? (this.metrics.successfulSTT / this.metrics.totalSTTRequests * 100).toFixed(1)
                    : 0,
                tts: this.metrics.totalTTSRequests > 0
                    ? (this.metrics.successfulTTS / this.metrics.totalTTSRequests * 100).toFixed(1)
                    : 0
            },
            cacheHitRate: this.metrics.totalTTSRequests > 0
                ? ((this.metrics.cacheHits / this.metrics.totalTTSRequests) * 100).toFixed(1)
                : 0
        };
    }
    
    /**
     * Verfügbarkeit prüfen
     */
    isAvailable() {
        return !!(this.elevenlabsApiKey && this.openaiApiKey);
    }
}

module.exports = new AudioService();

