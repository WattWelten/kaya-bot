const EventEmitter = require('events');

class KAYAPerformanceOptimizer extends EventEmitter {
    constructor() {
        super();
        this.cache = new Map();
        this.rateLimits = new Map();
        this.lazyLoaders = new Map();
        this.performanceMetrics = new Map();
        
        // Performance-Konfiguration
        this.config = {
            cache: {
                maxSize: 10000,
                defaultTTL: 300000, // 5 Minuten
                cleanupInterval: 60000 // 1 Minute
            },
            rateLimit: {
                windowMs: 60000, // 1 Minute
                maxRequests: 1000,
                skipSuccessfulRequests: false,
                skipFailedRequests: false
            },
            lazyLoading: {
                enabled: true,
                maxConcurrent: 10,
                timeout: 30000 // 30 Sekunden
            },
            monitoring: {
                enabled: true,
                sampleRate: 0.1, // 10% Sampling
                metricsInterval: 60000 // 1 Minute
            }
        };
        
        // Performance-Metriken
        this.metrics = {
            totalRequests: 0,
            cachedRequests: 0,
            rateLimitedRequests: 0,
            lazyLoadedRequests: 0,
            averageResponseTime: 0,
            averageCacheHitRate: 0,
            averageMemoryUsage: 0,
            errorRate: 0
        };
        
        // Cleanup-Timer starten
        this.startCleanupTimer();
        
        // Performance-Monitoring starten
        this.startPerformanceMonitoring();
        
        console.log('🚀 KAYA Performance Optimizer v2.0 initialisiert');
    }
    
    // Cache-Management
    getCacheKey(key, namespace = 'default') {
        return `${namespace}:${key}`;
    }
    
    getFromCache(key, namespace = 'default') {
        const cacheKey = this.getCacheKey(key, namespace);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            this.metrics.cachedRequests++;
            return cached.data;
        }
        
        // Abgelaufene Einträge entfernen
        if (cached) {
            this.cache.delete(cacheKey);
        }
        
        return null;
    }
    
    setCache(key, data, namespace = 'default', ttl = null) {
        const cacheKey = this.getCacheKey(key, namespace);
        const cacheTTL = ttl || this.config.cache.defaultTTL;
        
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now(),
            ttl: cacheTTL,
            namespace: namespace
        });
        
        // Cache-Größe prüfen
        if (this.cache.size > this.config.cache.maxSize) {
            this.cleanupCache();
        }
        
        return true;
    }
    
    deleteFromCache(key, namespace = 'default') {
        const cacheKey = this.getCacheKey(key, namespace);
        return this.cache.delete(cacheKey);
    }
    
    clearCache(namespace = null) {
        if (namespace) {
            // Namespace-spezifische Bereinigung
            for (const [key, value] of this.cache) {
                if (value.namespace === namespace) {
                    this.cache.delete(key);
                }
            }
        } else {
            // Komplette Cache-Bereinigung
            this.cache.clear();
        }
        
        console.log(`🗑️ Cache geleert: ${namespace || 'all'}`);
    }
    
    // Rate Limiting
    checkRateLimit(identifier, limit = null) {
        const now = Date.now();
        const windowMs = this.config.rateLimit.windowMs;
        const maxRequests = limit || this.config.rateLimit.maxRequests;
        
        const rateLimitData = this.rateLimits.get(identifier) || {
            count: 0,
            windowStart: now,
            blocked: false
        };
        
        // Fenster zurücksetzen
        if (now - rateLimitData.windowStart > windowMs) {
            rateLimitData.count = 0;
            rateLimitData.windowStart = now;
            rateLimitData.blocked = false;
        }
        
        // Limit prüfen
        if (rateLimitData.count >= maxRequests) {
            rateLimitData.blocked = true;
            this.rateLimits.set(identifier, rateLimitData);
            this.metrics.rateLimitedRequests++;
            
            console.log(`🚫 Rate Limit überschritten: ${identifier}`);
            return false;
        }
        
        // Zähler erhöhen
        rateLimitData.count++;
        this.rateLimits.set(identifier, rateLimitData);
        
        return true;
    }
    
    getRateLimitStatus(identifier) {
        const rateLimitData = this.rateLimits.get(identifier);
        
        if (!rateLimitData) {
            return {
                count: 0,
                limit: this.config.rateLimit.maxRequests,
                remaining: this.config.rateLimit.maxRequests,
                resetTime: Date.now() + this.config.rateLimit.windowMs,
                blocked: false
            };
        }
        
        const now = Date.now();
        const windowMs = this.config.rateLimit.windowMs;
        
        // Fenster zurücksetzen
        if (now - rateLimitData.windowStart > windowMs) {
            rateLimitData.count = 0;
            rateLimitData.windowStart = now;
            rateLimitData.blocked = false;
        }
        
        return {
            count: rateLimitData.count,
            limit: this.config.rateLimit.maxRequests,
            remaining: Math.max(0, this.config.rateLimit.maxRequests - rateLimitData.count),
            resetTime: rateLimitData.windowStart + windowMs,
            blocked: rateLimitData.blocked
        };
    }
    
    // Lazy Loading
    registerLazyLoader(name, loaderFunction, options = {}) {
        const lazyLoader = {
            name: name,
            loader: loaderFunction,
            cache: new Map(),
            loading: new Set(),
            options: {
                ttl: options.ttl || 300000, // 5 Minuten
                maxSize: options.maxSize || 1000,
                timeout: options.timeout || this.config.lazyLoading.timeout,
                ...options
            }
        };
        
        this.lazyLoaders.set(name, lazyLoader);
        
        console.log(`✅ Lazy Loader registriert: ${name}`);
        
        return lazyLoader;
    }
    
    async lazyLoad(name, key, ...args) {
        const lazyLoader = this.lazyLoaders.get(name);
        
        if (!lazyLoader) {
            throw new Error(`Lazy Loader nicht gefunden: ${name}`);
        }
        
        // Cache-Check
        const cached = lazyLoader.cache.get(key);
        if (cached && Date.now() - cached.timestamp < lazyLoader.options.ttl) {
            this.metrics.lazyLoadedRequests++;
            return cached.data;
        }
        
        // Ladevorgang prüfen
        if (lazyLoader.loading.has(key)) {
            // Warten auf laufenden Ladevorgang
            return new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    const cached = lazyLoader.cache.get(key);
                    if (cached) {
                        clearInterval(checkInterval);
                        resolve(cached.data);
                    }
                }, 100);
                
                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Lazy Loading Timeout'));
                }, lazyLoader.options.timeout);
            });
        }
        
        // Ladevorgang starten
        lazyLoader.loading.add(key);
        
        try {
            const startTime = Date.now();
            const data = await lazyLoader.loader(key, ...args);
            const loadTime = Date.now() - startTime;
            
            // Cache aktualisieren
            lazyLoader.cache.set(key, {
                data: data,
                timestamp: Date.now()
            });
            
            // Cache-Größe prüfen
            if (lazyLoader.cache.size > lazyLoader.options.maxSize) {
                this.cleanupLazyLoaderCache(name);
            }
            
            this.metrics.lazyLoadedRequests++;
            
            console.log(`🔄 Lazy Loaded: ${name}:${key} (${loadTime}ms)`);
            
            return data;
            
        } catch (error) {
            console.error(`❌ Lazy Loading Fehler: ${name}:${key}`, error);
            throw error;
            
        } finally {
            lazyLoader.loading.delete(key);
        }
    }
    
    // Performance-Monitoring
    startPerformanceMonitoring() {
        if (!this.config.monitoring.enabled) {
            return;
        }
        
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, this.config.monitoring.metricsInterval);
        
        console.log('📊 Performance-Monitoring gestartet');
    }
    
    collectPerformanceMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        const metrics = {
            timestamp: new Date().toISOString(),
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024)
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            cache: {
                size: this.cache.size,
                hitRate: this.calculateCacheHitRate()
            },
            rateLimits: {
                active: this.rateLimits.size,
                blocked: Array.from(this.rateLimits.values()).filter(r => r.blocked).length
            },
            lazyLoaders: {
                count: this.lazyLoaders.size,
                active: Array.from(this.lazyLoaders.values()).reduce((sum, loader) => 
                    sum + loader.loading.size, 0)
            }
        };
        
        this.performanceMetrics.set(Date.now(), metrics);
        
        // Nur die letzten 1000 Metriken behalten
        if (this.performanceMetrics.size > 1000) {
            const entries = Array.from(this.performanceMetrics.entries());
            entries.sort((a, b) => a[0] - b[0]);
            const toDelete = entries.slice(0, entries.length - 1000);
            toDelete.forEach(([key]) => this.performanceMetrics.delete(key));
        }
        
        // Event emittieren
        this.emit('performanceMetrics', metrics);
    }
    
    calculateCacheHitRate() {
        if (this.metrics.totalRequests === 0) {
            return 0;
        }
        
        return Math.round((this.metrics.cachedRequests / this.metrics.totalRequests) * 100);
    }
    
    // Cleanup-Timer
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, this.config.cache.cleanupInterval);
        
        console.log('🧹 Cleanup-Timer gestartet');
    }
    
    cleanupExpiredEntries() {
        const now = Date.now();
        let cleanedCount = 0;
        
        // Cache bereinigen
        for (const [key, value] of this.cache) {
            if (now - value.timestamp > value.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        
        // Rate Limits bereinigen
        for (const [key, value] of this.rateLimits) {
            if (now - value.windowStart > this.config.rateLimit.windowMs * 2) {
                this.rateLimits.delete(key);
                cleanedCount++;
            }
        }
        
        // Lazy Loader Caches bereinigen
        for (const [name, loader] of this.lazyLoaders) {
            for (const [key, value] of loader.cache) {
                if (now - value.timestamp > loader.options.ttl) {
                    loader.cache.delete(key);
                    cleanedCount++;
                }
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 ${cleanedCount} abgelaufene Einträge bereinigt`);
        }
    }
    
    cleanupCache() {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toDelete = entries.slice(0, entries.length - this.config.cache.maxSize);
        toDelete.forEach(([key]) => this.cache.delete(key));
        
        console.log(`🧹 Cache bereinigt: ${toDelete.length} Einträge entfernt`);
    }
    
    cleanupLazyLoaderCache(name) {
        const loader = this.lazyLoaders.get(name);
        
        if (!loader) {
            return;
        }
        
        const entries = Array.from(loader.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toDelete = entries.slice(0, entries.length - loader.options.maxSize);
        toDelete.forEach(([key]) => loader.cache.delete(key));
        
        console.log(`🧹 Lazy Loader Cache bereinigt: ${name} (${toDelete.length} Einträge)`);
    }
    
    // Performance-Metriken
    getMetrics() {
        return {
            ...this.metrics,
            cacheHitRate: this.calculateCacheHitRate(),
            cacheSize: this.cache.size,
            rateLimitSize: this.rateLimits.size,
            lazyLoaderCount: this.lazyLoaders.size,
            memoryUsage: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        };
    }
    
    // Performance-Historie
    getPerformanceHistory(timeRange = 3600000) { // 1 Stunde
        const now = Date.now();
        const history = [];
        
        for (const [timestamp, metrics] of this.performanceMetrics) {
            if (now - timestamp <= timeRange) {
                history.push({
                    timestamp: new Date(timestamp).toISOString(),
                    ...metrics
                });
            }
        }
        
        return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    // Health Check
    healthCheck() {
        const memoryUsage = process.memoryUsage();
        const cacheHitRate = this.calculateCacheHitRate();
        
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            cache: {
                size: this.cache.size,
                hitRate: cacheHitRate,
                maxSize: this.config.cache.maxSize
            },
            rateLimits: {
                active: this.rateLimits.size,
                blocked: Array.from(this.rateLimits.values()).filter(r => r.blocked).length
            },
            lazyLoaders: {
                count: this.lazyLoaders.size,
                active: Array.from(this.lazyLoaders.values()).reduce((sum, loader) => 
                    sum + loader.loading.size, 0)
            },
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024)
            }
        };
    }
    
    // Debug-Informationen
    getDebugInfo() {
        return {
            config: this.config,
            cache: {
                size: this.cache.size,
                maxSize: this.config.cache.maxSize,
                namespaces: Array.from(new Set(Array.from(this.cache.values()).map(v => v.namespace)))
            },
            rateLimits: {
                count: this.rateLimits.size,
                windowMs: this.config.rateLimit.windowMs,
                maxRequests: this.config.rateLimit.maxRequests
            },
            lazyLoaders: {
                count: this.lazyLoaders.size,
                names: Array.from(this.lazyLoaders.keys())
            },
            metrics: this.getMetrics()
        };
    }
}

module.exports = KAYAPerformanceOptimizer;

