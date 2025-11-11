const rateLimit = require('express-rate-limit');

/**
 * KAYA Rate Limiter
 * 
 * Limits pro User/IP:
 * - Chat: 30 Requests/Minute
 * - OpenAI: 20 Requests/Minute
 * - Audio STT: 10 Requests/Minute
 * - Audio TTS: 15 Requests/Minute
 * 
 * Redis-backed für horizontale Skalierung
 */

class RateLimiterService {
    constructor() {
        this.redisStore = null;
        this.redisEnabled = false;
        
        // Redis Store initialisieren
        this.initializeRedisStore();
        
        console.log('🛡️ Rate Limiter Service initialisiert');
    }
    
    /**
     * Redis Store für Rate Limiting initialisieren
     */
    async initializeRedisStore() {
        const redisUrl = process.env.REDIS_URL;
        
        if (!redisUrl) {
            console.log('⚠️ REDIS_URL nicht gesetzt → Rate Limiting verwendet In-Memory Store (nicht skalierbar)');
            return;
        }
        
        try {
            // express-rate-limit unterstützt Redis Store
            const RedisStore = require('rate-limit-redis').RedisStore;
            const redis = require('redis');
            
            const redisClient = redis.createClient({ url: redisUrl });
            
            redisClient.on('error', (err) => {
                console.error('❌ Redis Rate Limit Store Fehler:', err);
                this.redisEnabled = false;
            });
            
            redisClient.on('connect', () => {
                console.log('✅ Redis Rate Limit Store verbunden');
                this.redisEnabled = true;
            });
            
            await redisClient.connect();
            
            this.redisStore = new RedisStore({
                client: redisClient,
                prefix: 'rl:'
            });
            
            console.log('✅ Redis Rate Limiter Store initialisiert');
        } catch (error) {
            console.error('❌ Redis Rate Limit Store Initialisierung fehlgeschlagen:', error.message);
            console.log('   Fallback: In-Memory Store (nicht skalierbar)');
            this.redisEnabled = false;
        }
    }
    
    /**
     * Rate Limiter erstellen (mit Redis Store falls verfügbar)
     */
    createLimiter(options) {
        const limiterOptions = {
            ...options,
            standardHeaders: true,
            legacyHeaders: false,
            store: this.redisStore || undefined // undefined = Standard In-Memory Store
        };
        
        return rateLimit(limiterOptions);
    }
    
    /**
     * Chat Rate Limiter (30/Min)
     */
    getChatLimiter() {
        return this.createLimiter({
            windowMs: 60 * 1000, // 1 Minute
            max: 30, // 30 Requests pro Minute
            message: 'Zu viele Chat-Requests. Bitte warten Sie einen Moment.',
            skip: (req) => {
                // Bypass für Health-Checks
                return req.path === '/health';
            }
        });
    }
    
    /**
     * OpenAI Rate Limiter (20/Min)
     */
    getOpenAILimiter() {
        return this.createLimiter({
            windowMs: 60 * 1000, // 1 Minute
            max: 20, // 20 Requests pro Minute
            message: 'Zu viele AI-Requests. Bitte warten Sie einen Moment.'
        });
    }
    
    /**
     * STT Rate Limiter (10/Min)
     */
    getSTTLimiter() {
        return this.createLimiter({
            windowMs: 60 * 1000, // 1 Minute
            max: 10, // 10 Requests pro Minute
            message: 'Zu viele Audio-Uploads. Bitte warten Sie einen Moment.'
        });
    }
    
    /**
     * TTS Rate Limiter (15/Min)
     */
    getTTSLimiter() {
        return this.createLimiter({
            windowMs: 60 * 1000, // 1 Minute
            max: 15, // 15 Requests pro Minute
            message: 'Zu viele Audio-Generierungen. Bitte warten Sie einen Moment.'
        });
    }
    
    /**
     * Kombinierter Limiter für mehrere Endpoints
     */
    createCustomLimiter(windowMs, max, message) {
        return this.createLimiter({
            windowMs,
            max,
            message
        });
    }
    
    /**
     * Status-Informationen
     */
    getStatus() {
        return {
            redisEnabled: this.redisEnabled,
            storeType: this.redisEnabled ? 'Redis' : 'In-Memory'
        };
    }
}

module.exports = new RateLimiterService();

