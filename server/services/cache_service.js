/**
 * KAYA Cache Service - In-Memory Cache für häufige Fragen
 * 
 * Strategie:
 * - Top 20 häufigste Fragen: 5-Min-TTL, sofortige Antwort
 * - Fuzzy-Matching für ähnliche Fragen
 * - Hit-Rate Tracking für Optimierung
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 Minuten
    this.hitRate = { hits: 0, misses: 0 };
    
    // Top 20 häufigste Fragen (erweiterbar)
    this.frequentQuestions = [
      'kfz zulassen',
      'wohnsitz anmelden',
      'ausweis beantragen',
      'führerschein',
      'kita anmeldung',
      'bürgergeld',
      'termin buchen',
      'kreistag',
      'bauantrag',
      'gewerbe anmelden',
      'jobcenter',
      'soziales',
      'gesundheit',
      'umwelt',
      'jugend',
      'bildung',
      'landwirtschaft',
      'handwerk',
      'tourismus',
      'lieferanten'
    ];
    
    console.log('💾 In-Memory Cache Service initialisiert');
    console.log(`   TTL: ${this.ttl / 1000}s`);
    console.log(`   Frequent Questions: ${this.frequentQuestions.length}`);
  }
  
  /**
   * Erstellt Cache-Key aus Query
   */
  createKey(query, context = {}) {
    const queryLower = query.toLowerCase().trim();
    const contextHash = JSON.stringify(context).substring(0, 50);
    return `${queryLower}_${contextHash}`;
  }
  
  /**
   * Ruft Wert aus Cache ab
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.hitRate.misses++;
      return null;
    }
    
    // Prüfe TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.hitRate.misses++;
      return null;
    }
    
    this.hitRate.hits++;
    console.log(`✅ Cache HIT: ${key.substring(0, 50)}...`);
    return entry.value;
  }
  
  /**
   * Setzt Wert in Cache
   */
  set(key, value, customTtl = null) {
    const entry = {
      value,
      timestamp: Date.now(),
      ttl: customTtl || this.ttl
    };
    
    this.cache.set(key, entry);
    console.log(`💾 Cache SET: ${key.substring(0, 50)}...`);
  }
  
  /**
   * Prüft ob Query gecacht werden sollte
   */
  shouldCache(query) {
    if (!query || query.trim().length < 3) {
      return false;
    }
    
    const queryLower = query.toLowerCase().trim();
    
    // Prüfe ob Query zu frequentQuestions passt (fuzzy-match)
    for (const frequent of this.frequentQuestions) {
      if (queryLower.includes(frequent) || frequent.includes(queryLower)) {
        console.log(`🎯 Frequent Question erkannt: "${frequent}" → Caching aktiviert`);
        return true;
      }
    }
    
    // Heuristik: Kurze, direkte Fragen sollten gecacht werden
    const wordCount = query.split(/\s+/).length;
    if (wordCount <= 6 && queryLower.length < 100) {
      console.log(`💡 Heuristik: Kurze Frage → Caching aktiviert`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Fuzzy-Match für ähnliche Queries
   */
  findSimilarKey(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
    
    for (const [key, entry] of this.cache.entries()) {
      // Prüfe ob Key-Query ähnlich ist
      const keyQuery = key.substring(0, key.indexOf('_'));
      const similarity = this.calculateSimilarity(keyQuery, queryLower);
      
      if (similarity > 0.7) {
        console.log(`🔍 Ähnliche Query gefunden: "${keyQuery}" (Ähnlichkeit: ${(similarity * 100).toFixed(1)}%)`);
        return key;
      }
    }
    
    return null;
  }
  
  /**
   * Berechnet Ähnlichkeit zwischen zwei Strings (einfache Levenshtein-Distanz)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  /**
   * Levenshtein-Distanz zwischen zwei Strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Gibt Cache-Statistiken zurück
   */
  getStats() {
    const total = this.hitRate.hits + this.hitRate.misses;
    const hitRate = total > 0 ? (this.hitRate.hits / total * 100).toFixed(2) : 0;
    
    return {
      size: this.cache.size,
      hits: this.hitRate.hits,
      misses: this.hitRate.misses,
      hitRate: `${hitRate}%`,
      frequentQuestions: this.frequentQuestions.length
    };
  }
  
  /**
   * Leert Cache (für Testing)
   */
  clear() {
    this.cache.clear();
    this.hitRate = { hits: 0, misses: 0 };
    console.log('🗑️ Cache geleert');
  }
  
  /**
   * Entfernt abgelaufene Einträge (Cleanup)
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 Cache Cleanup: ${removed} abgelaufene Einträge entfernt`);
    }
    
    return removed;
  }
}

// Singleton-Instanz
const cacheService = new CacheService();

// Cleanup alle 5 Minuten
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);

module.exports = cacheService;


