const fs = require('fs-extra');
const path = require('path');
const Logger = require('../utils/Logger');
const WebCrawler = require('../sources/WebCrawler');
const FileCrawler = require('../sources/FileCrawler');
const PDFCrawler = require('../sources/PDFCrawler');
const DataProcessor = require('../processors/DataProcessor');
const DataCompressor = require('../processors/DataCompressor');
const BackupManager = require('../processors/BackupManager');

class CrawlerEngine {
    constructor() {
        this.logger = new Logger('CrawlerEngine');
        this.webCrawler = new WebCrawler();
        this.fileCrawler = new FileCrawler();
        this.pdfCrawler = new PDFCrawler();
        this.dataProcessor = new DataProcessor();
        this.dataCompressor = new DataCompressor();
        this.backupManager = new BackupManager();
        
        this.agents = [
            'buergerdienste',
            'ratsinfo', 
            'stellenportal',
            'kontakte',
            'jugend',
            'soziales',
            'politik',
            'jobcenter',
            'wirtschaft',
            'ordnungsamt',
            'senioren',
            'inklusion',
            'digitalisierung',
            'gleichstellung'
        ];
        
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
        const configs = {
            buergerdienste: {
                webSources: [
                    'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/',
                    'https://www.oldenburg-kreis.de/ordnung-und-verkehr/kfz-zulassungsstelle/',
                    'https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/'
                ],
                fileSources: [],
                pdfSources: []
            },
            ratsinfo: {
                webSources: [
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreistag/',
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreisverwaltung/'
                ],
                fileSources: [],
                pdfSources: []
            },
            stellenportal: {
                webSources: [
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/arbeitgeber-landkreis-oldenburg/stellenausschreibungen/'
                ],
                fileSources: [],
                pdfSources: []
            },
            kontakte: {
                webSources: [
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreisverwaltung/ansprechpartner-in-der-kreisverwaltung/'
                ],
                fileSources: [],
                pdfSources: []
            },
            jugend: {
                webSources: [
                    'https://www.oldenburg-kreis.de/jugend-und-familie/',
                    'https://www.oldenburg-kreis.de/jugend-und-familie/jugendamt/'
                ],
                fileSources: [],
                pdfSources: []
            },
            soziales: {
                webSources: [
                    'https://www.oldenburg-kreis.de/gesundheit-und-soziales/',
                    'https://www.oldenburg-kreis.de/gesundheit-und-soziales/aufgaben-der-sozialen-sicherung/'
                ],
                fileSources: [],
                pdfSources: []
            },
            politik: {
                webSources: [
                    'https://oldenburg-kreis.ratsinfomanagement.net/',
                    'https://oldenburg-kreis.ratsinfomanagement.net/gremien/',
                    'https://oldenburg-kreis.ratsinfomanagement.net/fraktionen/',
                    'https://oldenburg-kreis.ratsinfomanagement.net/sitzungen/',
                    'https://oldenburg-kreis.ratsinfomanagement.net/vorlagen/',
                    'https://oldenburg-kreis.ratsinfomanagement.net/personen/',
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreistag/'
                ],
                fileSources: [],
                pdfSources: []
            },
            jobcenter: {
                webSources: [
                    'https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/jobcenter-landkreis-oldenburg/',
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreisverwaltung/kurzvorstellung-der-aemter/jobcenter/'
                ],
                fileSources: [],
                pdfSources: []
            },
            wirtschaft: {
                webSources: [
                    'https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/wirtschaftsfoerderung/',
                    'https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/schwarzarbeitsbekaempfung/'
                ],
                fileSources: [],
                pdfSources: []
            },
            ordnungsamt: {
                webSources: [
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreisverwaltung/kurzvorstellung-der-aemter/ordnungsamt/'
                ],
                fileSources: [],
                pdfSources: []
            },
            senioren: {
                webSources: [
                    'https://www.oldenburg-kreis.de/gesundheit-und-soziales/senioren/',
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreisverwaltung/kurzvorstellung-der-aemter/amt-fuer-teilhabe-und-soziale-sicherung/'
                ],
                fileSources: [],
                pdfSources: []
            },
            inklusion: {
                webSources: [
                    'https://www.oldenburg-kreis.de/gesundheit-und-soziales/inklusion/',
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreisverwaltung/kurzvorstellung-der-aemter/amt-fuer-teilhabe-und-soziale-sicherung/'
                ],
                fileSources: [],
                pdfSources: []
            },
            digitalisierung: {
                webSources: [
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/geoportal/',
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/breitbandausbau/'
                ],
                fileSources: [],
                pdfSources: []
            },
            gleichstellung: {
                webSources: [
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/gleichstellungsbeauftragte/',
                    'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/gleichstellungsbeauftragte/gewaltschutz-hilfetelefone-und-beratungsangebote/'
                ],
                fileSources: [],
                pdfSources: []
            }
        };
        
        return configs[agentName] || { webSources: [], fileSources: [], pdfSources: [] };
    }

    async saveRawData(agentName, data, timestamp) {
        const filePath = path.join(this.dataDir, 'raw', `${agentName}_data_${timestamp}.json`);
        await fs.writeJson(filePath, data, { spaces: 2 });
        this.logger.info(`💾 Rohe Daten gespeichert: ${filePath}`);
    }

    async saveProcessedData(data, timestamp) {
        const filePath = path.join(this.dataDir, 'processed', `all_agents_data_${timestamp}.json`);
        await fs.writeJson(filePath, data, { spaces: 2 });
        this.logger.info(`💾 Verarbeitete Daten gespeichert: ${filePath}`);
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

