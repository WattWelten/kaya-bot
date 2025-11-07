const rateLimit = require('express-rate-limit');

/**
 * KAYA Rate Limiter
 * 
 * Limits pro User/IP:
 * - Chat: 30 Requests/Minute
 * - OpenAI: 20 Requests/Minute
 * - Audio STT: 10 Requests/Minute
 * - Audio TTS: 15 Requests/Minute
 */

class RateLimiterService {
    constructor() {
        // Standard Store (in-memory)
        // Für Production: Redis Store implementieren
        this.store = new Map();
        
        console.log('🛡️ Rate Limiter Service initialisiert');
    }
    
    /**
     * Chat Rate Limiter (30/Min)
     */
    getChatLimiter() {
        return rateLimit({
            windowMs: 60 * 1000, // 1 Minute
            max: 30, // 30 Requests pro Minute
            message: 'Zu viele Chat-Requests. Bitte warten Sie einen Moment.',
            standardHeaders: true,
            legacyHeaders: false,
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
        return rateLimit({
            windowMs: 60 * 1000, // 1 Minute
            max: 20, // 20 Requests pro Minute
            message: 'Zu viele AI-Requests. Bitte warten Sie einen Moment.',
            standardHeaders: true,
            legacyHeaders: false
        });
    }
    
    /**
     * STT Rate Limiter (10/Min)
     */
    getSTTLimiter() {
        return rateLimit({
            windowMs: 60 * 1000, // 1 Minute
            max: 10, // 10 Requests pro Minute
            message: 'Zu viele Audio-Uploads. Bitte warten Sie einen Moment.',
            standardHeaders: true,
            legacyHeaders: false
        });
    }
    
    /**
     * TTS Rate Limiter (15/Min)
     */
    getTTSLimiter() {
        return rateLimit({
            windowMs: 60 * 1000, // 1 Minute
            max: 15, // 15 Requests pro Minute
            message: 'Zu viele Audio-Generierungen. Bitte warten Sie einen Moment.',
            standardHeaders: true,
            legacyHeaders: false
        });
    }
    
    /**
     * Kombinierter Limiter für mehrere Endpoints
     */
    createCustomLimiter(windowMs, max, message) {
        return rateLimit({
            windowMs,
            max,
            message,
            standardHeaders: true,
            legacyHeaders: false
        });
    }
}

module.exports = new RateLimiterService();

