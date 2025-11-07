/**
 * KommuneConfigLoader für Server-Code
 * Lädt kommunenspezifische Konfiguration für Backend
 */

const path = require('path');
const KommuneConfigLoader = require('../../crawler-v2/src/core/KommuneConfigLoader');

class ServerKommuneConfigLoader {
    constructor() {
        this.loader = null;
        this.kommuneInfo = null;
    }
    
    /**
     * Lazy loading der Kommune-Konfiguration
     */
    getLoader() {
        if (!this.loader) {
            try {
                this.loader = new KommuneConfigLoader();
                this.kommuneInfo = this.loader.getKommuneInfo();
            } catch (error) {
                console.warn('⚠️ KommuneConfigLoader nicht verfügbar, verwende Defaults:', error.message);
                // Fallback zu Landkreis Oldenburg
                this.kommuneInfo = {
                    name: 'Landkreis Oldenburg',
                    domain: 'oldenburg-kreis.de',
                    base_url: 'https://www.oldenburg-kreis.de'
                };
            }
        }
        return this.loader;
    }
    
    /**
     * Gibt Kommune-Informationen zurück
     */
    getKommuneInfo() {
        if (!this.kommuneInfo) {
            this.getLoader(); // Initialisiert auch kommuneInfo
        }
        return this.kommuneInfo || {
            name: 'Landkreis Oldenburg',
            domain: 'oldenburg-kreis.de',
            base_url: 'https://www.oldenburg-kreis.de'
        };
    }
    
    /**
     * Gibt Kommune-Namen zurück
     */
    getKommuneName() {
        return this.getKommuneInfo().name;
    }
    
    /**
     * Gibt Base-URL zurück
     */
    getBaseUrl() {
        return this.getKommuneInfo().base_url;
    }
}

// Singleton-Instanz
let instance = null;

function getKommuneConfig() {
    if (!instance) {
        instance = new ServerKommuneConfigLoader();
    }
    return instance;
}

module.exports = {
    getKommuneConfig,
    ServerKommuneConfigLoader
};

