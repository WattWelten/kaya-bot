/**
 * KAYA Redis Cache Service
 * 
 * Strategie:
 * - Persistenter Cache für alle Fragen (nicht nur frequent)
 * - 30-Min-TTL für seltene Fragen
 * - Fallback auf In-Memory wenn Redis nicht verfügbar
 */

class RedisCacheService {
  constructor() {
    this.redis = null;
    this.enabled = false;
    this.fallbackEnabled = true;
    this.ttl = 30 * 60 * 1000; // 30 Minuten
    
    this.connectRedis();
  }
  
  /**
   * Verbindet zu Redis (Railway oder lokaler Server)
   */
  async connectRedis() {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.log('⚠️ REDIS_URL nicht gesetzt → Redis-Cache deaktiviert');
      console.log('   Fallback: In-Memory Cache nur');
      return;
    }
    
    try {
      const redis = require('redis');
      this.client = redis.createClient({
        url: redisUrl
      });
      
      this.client.on('error', (err) => {
        console.error('❌ Redis Fehler:', err);
        this.enabled = false;
      });
      
      this.client.on('connect', () => {
        console.log('✅ Redis verbunden');
        this.enabled = true;
      });
      
      this.client.on('disconnect', () => {
        console.log('⚠️ Redis getrennt');
        this.enabled = false;
      });
      
      await this.client.connect();
      console.log('💾 Redis Cache Service initialisiert');
      console.log(`   TTL: ${this.ttl / 1000}s`);
      
    } catch (error) {
      console.error('❌ Redis Verbindung fehlgeschlagen:', error.message);
      console.log('   Fallback: In-Memory Cache nur');
      this.enabled = false;
    }
  }
  
  /**
   * Erstellt Cache-Key
   */
  createKey(query, context = {}) {
    const queryLower = query.toLowerCase().trim();
    const contextHash = JSON.stringify(context).substring(0, 50);
    return `kaya:cache:${queryLower}_${contextHash}`;
  }
  
  /**
   * Ruft Wert aus Redis ab
   */
  async get(key) {
    if (!this.enabled) {
      return null;
    }
    
    try {
      const value = await this.client.get(key);
      
      if (value) {
        const parsedValue = JSON.parse(value);
        console.log(`✅ Redis HIT: ${key.substring(0, 50)}...`);
        return parsedValue;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Redis GET Fehler:', error.message);
      return null;
    }
  }
  
  /**
   * Setzt Wert in Redis
   */
  async set(key, value, customTtl = null) {
    if (!this.enabled) {
      return false;
    }
    
    try {
      const serialized = JSON.stringify(value);
      const ttl = customTtl || this.ttl;
      
      await this.client.setEx(key, Math.floor(ttl / 1000), serialized);
      console.log(`💾 Redis SET: ${key.substring(0, 50)}... (TTL: ${Math.floor(ttl / 1000)}s)`);
      
      return true;
    } catch (error) {
      console.error('❌ Redis SET Fehler:', error.message);
      return false;
    }
  }
  
  /**
   * Entfernt Wert aus Redis
   */
  async delete(key) {
    if (!this.enabled) {
      return false;
    }
    
    try {
      await this.client.del(key);
      console.log(`🗑️ Redis DELETE: ${key.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('❌ Redis DELETE Fehler:', error.message);
      return false;
    }
  }
  
  /**
   * Prüft ob Redis aktiv ist
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Gibt Statistiken zurück
   */
  async getStats() {
    if (!this.enabled) {
      return { enabled: false };
    }
    
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.dbSize();
      
      return {
        enabled: true,
        keyspace,
        info
      };
    } catch (error) {
      console.error('❌ Redis Stats Fehler:', error.message);
      return { enabled: false };
    }
  }
  
  /**
   * Leert Cache (für Testing)
   */
  async clear() {
    if (!this.enabled) {
      return false;
    }
    
    try {
      const keys = await this.client.keys('kaya:cache:*');
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Redis geleert: ${keys.length} Keys`);
      }
      return true;
    } catch (error) {
      console.error('❌ Redis CLEAR Fehler:', error.message);
      return false;
    }
  }
}

// Singleton-Instanz
const redisCacheService = new RedisCacheService();

module.exports = redisCacheService;


