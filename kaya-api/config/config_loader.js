/**
 * Config Loader - Lädt und validiert Konfiguration
 * Ersetzt hardcoded Credentials durch Environment Variables
 */

const fs = require('fs-extra');
const path = require('path');

class ConfigLoader {
    constructor() {
        this.configPath = path.join(__dirname, '../kaya_config.json');
        this.config = null;
    }
    
    /**
     * Lädt Konfiguration und ersetzt Environment Variable Placeholders
     */
    load() {
        if (this.config) {
            return this.config;
        }
        
        try {
            const rawConfig = fs.readJsonSync(this.configPath);
            
            // Ersetze Environment Variable Placeholders
            this.config = this.replaceEnvVariables(rawConfig);
            
            // Validiere kritische Config-Werte
            this.validateConfig(this.config);
            
            return this.config;
        } catch (error) {
            console.error('❌ Fehler beim Laden der Konfiguration:', error);
            throw new Error(`Konfiguration konnte nicht geladen werden: ${error.message}`);
        }
    }
    
    /**
     * Ersetzt ${VAR_NAME} Placeholders durch Environment Variables
     */
    replaceEnvVariables(obj) {
        if (typeof obj === 'string') {
            // Ersetze ${VAR_NAME} durch process.env.VAR_NAME
            return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                const value = process.env[varName];
                if (value === undefined) {
                    console.warn(`⚠️ Environment Variable ${varName} nicht gesetzt`);
                    return match; // Behalte Placeholder falls nicht gesetzt
                }
                return value;
            });
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.replaceEnvVariables(item));
        } else if (obj !== null && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.replaceEnvVariables(value);
            }
            return result;
        }
        return obj;
    }
    
    /**
     * Validiert kritische Konfigurationswerte
     */
    validateConfig(config) {
        // Validiere kritische Werte
        if (!config.character) {
            console.warn('⚠️ Konfiguration: character-Einstellungen fehlen');
        }
        
        if (!config.agents) {
            console.warn('⚠️ Konfiguration: agents fehlen');
        }
    }
    
    /**
     * Gibt spezifischen Config-Wert zurück
     */
    get(path, defaultValue = null) {
        const config = this.load();
        const keys = path.split('.');
        let value = config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value !== undefined ? value : defaultValue;
    }
}

// Singleton-Instanz
const configLoader = new ConfigLoader();

module.exports = configLoader;

