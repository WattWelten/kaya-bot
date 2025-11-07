/**
 * KommuneConfigLoader - Lädt kommunenspezifische Konfiguration
 * Ermöglicht Skalierbarkeit für verschiedene Kommunen
 */

const fs = require('fs-extra');
const path = require('path');
const Logger = require('../utils/Logger');

class KommuneConfigLoader {
    constructor() {
        this.logger = new Logger('KommuneConfigLoader');
        this.configDir = path.join(__dirname, '../../config/kommunen');
        this.currentKommune = process.env.KOMMUNE || 'oldenburg-kreis';
        this.config = null;
    }
    
    /**
     * Lädt Konfiguration für aktuelle Kommune
     */
    load() {
        if (this.config) {
            return this.config;
        }
        
        const configPath = path.join(this.configDir, `${this.currentKommune}.json`);
        
        try {
            if (!fs.existsSync(configPath)) {
                throw new Error(`Konfigurationsdatei nicht gefunden: ${configPath}. Verwende Environment Variable KOMMUNE oder erstelle Konfiguration.`);
            }
            
            this.config = fs.readJsonSync(configPath);
            this.validateConfig(this.config);
            
            this.logger.info(`✅ Kommune-Konfiguration geladen: ${this.config.kommune.name} (${this.config.kommune.domain})`);
            
            return this.config;
        } catch (error) {
            this.logger.error(`❌ Fehler beim Laden der Kommune-Konfiguration:`, error);
            throw error;
        }
    }
    
    /**
     * Validiert Konfiguration
     */
    validateConfig(config) {
        if (!config.kommune) {
            throw new Error('Konfiguration: kommune-Block fehlt');
        }
        
        if (!config.kommune.name || !config.kommune.domain || !config.kommune.base_url) {
            throw new Error('Konfiguration: kommune.name, kommune.domain oder kommune.base_url fehlt');
        }
        
        if (!config.agents || Object.keys(config.agents).length === 0) {
            throw new Error('Konfiguration: agents fehlen oder sind leer');
        }
        
        // Validiere Agent-Konfigurationen
        for (const [agentName, agentConfig] of Object.entries(config.agents)) {
            if (!agentConfig.name) {
                this.logger.warn(`⚠️ Agent ${agentName} hat kein name-Feld`);
            }
            if (!agentConfig.webSources && !agentConfig.fileSources && !agentConfig.pdfSources) {
                this.logger.warn(`⚠️ Agent ${agentName} hat keine Quellen definiert`);
            }
        }
    }
    
    /**
     * Gibt Agent-Namen-Liste zurück
     */
    getAgentNames() {
        const config = this.load();
        return Object.keys(config.agents);
    }
    
    /**
     * Gibt Agent-Konfiguration zurück
     */
    getAgentConfig(agentName) {
        const config = this.load();
        return config.agents[agentName] || null;
    }
    
    /**
     * Gibt Kommune-Informationen zurück
     */
    getKommuneInfo() {
        const config = this.load();
        return config.kommune;
    }
    
    /**
     * Gibt Crawler-Einstellungen zurück
     */
    getCrawlerSettings() {
        const config = this.load();
        return config.crawler_settings || {
            timeout: 30000,
            waitUntil: 'networkidle2',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            retryAttempts: 3,
            retryDelay: 2000,
            maxConcurrent: 5,
            delayBetweenRequests: 500
        };
    }
    
    /**
     * Setzt aktuelle Kommune (z.B. für Testing)
     */
    setKommune(kommuneName) {
        this.currentKommune = kommuneName;
        this.config = null; // Force reload
    }
    
    /**
     * Listet verfügbare Kommunen auf
     */
    listAvailableKommunen() {
        try {
            const files = fs.readdirSync(this.configDir);
            return files
                .filter(file => file.endsWith('.json') && file !== 'template.json')
                .map(file => path.basename(file, '.json'));
        } catch (error) {
            this.logger.error(`Fehler beim Auflisten der Kommunen:`, error);
            return [];
        }
    }
}

module.exports = KommuneConfigLoader;

