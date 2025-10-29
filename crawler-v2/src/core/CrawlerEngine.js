const fs = require('fs-extra');
const path = require('path');
const Logger = require('../utils/Logger');
const WebCrawler = require('../sources/WebCrawler');
const FileCrawler = require('../sources/FileCrawler');
const PDFCrawler = require('../sources/PDFCrawler');
const DataProcessor = require('../processors/DataProcessor');
const DataCompressor = require('../processors/DataCompressor');
const BackupManager = require('../processors/BackupManager');
const KommuneConfigLoader = require('./KommuneConfigLoader');

class CrawlerEngine {
    constructor() {
        this.logger = new Logger('CrawlerEngine');
        this.webCrawler = new WebCrawler();
        this.fileCrawler = new FileCrawler();
        this.pdfCrawler = new PDFCrawler();
        this.dataProcessor = new DataProcessor();
        this.dataCompressor = new DataCompressor();
        this.backupManager = new BackupManager();
        
        // Lade kommunenspezifische Konfiguration
        this.kommuneConfig = new KommuneConfigLoader();
        const kommuneInfo = this.kommuneConfig.getKommuneInfo();
        this.logger.info(`🌍 Kommune: ${kommuneInfo.name} (${kommuneInfo.domain})`);
        
        // Agent-Namen aus Konfiguration laden (statt hardcoded)
        this.agents = this.kommuneConfig.getAgentNames();
        this.logger.info(`📋 ${this.agents.length} Agenten konfiguriert: ${this.agents.join(', ')}`);
        
        this.dataDir = path.join(__dirname, '../../data');
        this.ensureDataDirectories();
    }

    async ensureDataDirectories() {
        const dirs = ['raw', 'processed', 'compressed', 'backup'];
        for (const dir of dirs) {
            await fs.ensureDir(path.join(this.dataDir, dir));
        }
    }

    async crawlAll() {
        this.logger.info('🚀 Starte vollständigen Crawl aller Agent-Daten...');
        
        const results = {};
        const timestamp = new Date().toISOString().split('T')[0];
        
        for (const agent of this.agents) {
            try {
                this.logger.info(`📡 Crawle Agent: ${agent}`);
                const agentData = await this.crawlAgent(agent);
                results[agent] = agentData;
                
                // Speichere rohe Daten
                await this.saveRawData(agent, agentData, timestamp);
                
            } catch (error) {
                this.logger.error(`❌ Fehler beim Crawlen von ${agent}:`, error);
                results[agent] = { error: error.message };
            }
        }
        
        // Verarbeite alle Daten
        this.logger.info('🔄 Verarbeite alle Agent-Daten...');
        const processedResults = await this.dataProcessor.processAll(results);
        
        // Validiere Links (kritisch für Production-Qualität)
        this.logger.info('🔍 Validiere Links...');
        try {
            for (const [agentName, agentData] of Object.entries(processedResults)) {
                if (Array.isArray(agentData) && agentData.length > 0) {
                    const validatedData = await this.dataProcessor.validateLinks(agentData);
                    processedResults[agentName] = validatedData;
                    this.logger.info(`✅ ${agentName}: Links validiert`);
                }
            }
        } catch (error) {
            this.logger.error('⚠️ Link-Validierung Fehler (fortfahren ohne Validierung):', error.message);
        }
        
        // Speichere verarbeitete Daten
        await this.saveProcessedData(processedResults, timestamp);
        
        // Komprimiere Daten
        this.logger.info('📦 Komprimiere Daten...');
        await this.dataCompressor.compressAll(processedResults, timestamp);
        
        // Backup erstellen
        this.logger.info('💾 Erstelle Backup...');
        await this.backupManager.createBackup(timestamp);
        
        this.logger.info('✅ Crawl abgeschlossen!');
        return results;
    }

    async crawlAgent(agentName) {
        this.logger.info(`🔍 Crawle Agent: ${agentName}`);
        
        const agentConfig = this.getAgentConfig(agentName);
        const agentData = [];
        
        // Web-Crawling
        if (agentConfig.webSources) {
            for (const url of agentConfig.webSources) {
                try {
                    const webData = await this.webCrawler.crawl(url);
                    agentData.push(...webData);
                } catch (error) {
                    this.logger.error(`Web-Crawl Fehler für ${url}:`, error);
                }
            }
        }
        
        // File-Crawling
        if (agentConfig.fileSources) {
            for (const filePath of agentConfig.fileSources) {
                try {
                    const fileData = await this.fileCrawler.crawl(filePath);
                    agentData.push(...fileData);
                } catch (error) {
                    this.logger.error(`File-Crawl Fehler für ${filePath}:`, error);
                }
            }
        }
        
        // PDF-Crawling
        if (agentConfig.pdfSources) {
            for (const pdfPath of agentConfig.pdfSources) {
                try {
                    const pdfData = await this.pdfCrawler.crawl(pdfPath);
                    agentData.push(...pdfData);
                } catch (error) {
                    this.logger.error(`PDF-Crawl Fehler für ${pdfPath}:`, error);
                }
            }
        }
        
        return agentData;
    }

    getAgentConfig(agentName) {
        // Lade Konfiguration aus kommunenspezifischer Datei
        const agentConfig = this.kommuneConfig.getAgentConfig(agentName);
        
        if (!agentConfig) {
            this.logger.warn(`⚠️ Keine Konfiguration für Agent ${agentName} gefunden`);
            return {
                webSources: [],
                fileSources: [],
                pdfSources: []
            };
        }
        
        return {
            webSources: agentConfig.webSources || [],
            fileSources: agentConfig.fileSources || [],
            pdfSources: agentConfig.pdfSources || []
        };
    }
    

    async saveRawData(agentName, data, timestamp) {
        const filePath = path.join(this.dataDir, 'raw', `${agentName}_data_${timestamp}.json`);
        await fs.writeJson(filePath, data, { spaces: 2 });
        this.logger.info(`💾 Rohe Daten gespeichert: ${filePath}`);
    }

    async saveProcessedData(data, timestamp) {
        // Speichere alle Agenten in einer Datei (für Backups)
        const filePath = path.join(this.dataDir, 'processed', `all_agents_data_${timestamp}.json`);
        await fs.writeJson(filePath, data, { spaces: 2 });
        this.logger.info(`💾 Verarbeitete Daten gespeichert: ${filePath}`);
        
        // Speichere zusätzlich einzelne Dateien pro Agent (für AgentManager)
        const processedDir = path.join(this.dataDir, 'processed');
        for (const [agentName, agentData] of Object.entries(data)) {
            const agentFilePath = path.join(processedDir, `${agentName}_data_${timestamp}.json`);
            await fs.writeJson(agentFilePath, agentData, { spaces: 2 });
        }
        this.logger.info(`💾 Einzelne Agent-Dateien gespeichert (für AgentManager)`);
    }

    async getLatestData() {
        const processedDir = path.join(this.dataDir, 'processed');
        const files = await fs.readdir(processedDir);
        const dataFiles = files.filter(file => file.endsWith('.json'));
        
        if (dataFiles.length === 0) {
            throw new Error('Keine verarbeiteten Daten gefunden');
        }
        
        // Sortiere nach Datum (neueste zuerst)
        dataFiles.sort().reverse();
        const latestFile = dataFiles[0];
        
        const filePath = path.join(processedDir, latestFile);
        return await fs.readJson(filePath);
    }
}

module.exports = CrawlerEngine;

