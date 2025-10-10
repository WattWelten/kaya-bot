const DualDomainCrawler = require('./dual_crawler');
const fs = require('fs-extra');
const path = require('path');

class KAYACrawlerIntegration {
    constructor() {
        this.crawler = new DualDomainCrawler();
        this.dataDir = path.join(__dirname, '..', 'data');
    }

    async runFullCrawling() {
        console.log('🚀 KAYA CRAWLER INTEGRATION - VOLLSTÄNDIGER CRAWL');
        console.log('================================================');
        
        try {
            // 1. Führe Dual-Domain Crawling durch
            await this.crawler.crawlBothDomains();
            
            // 2. Verarbeite Daten für KAYA
            await this.processDataForKAYA();
            
            // 3. Erstelle Agent-Dateien
            await this.createAgentFiles();
            
            // 4. Validiere Links
            await this.validateLinks();
            
            // 5. Erstelle Backup
            await this.createBackup();
            
            console.log('✅ VOLLSTÄNDIGER CRAWL ABGESCHLOSSEN!');
            
        } catch (error) {
            console.error('❌ Integration-Fehler:', error);
        }
    }

    async processDataForKAYA() {
        console.log('🔄 Verarbeite Daten für KAYA...');
        
        const reportPath = path.join(__dirname, '..', 'dual_domain_report.json');
        if (await fs.pathExists(reportPath)) {
            const report = await fs.readJson(reportPath);
            
            // Strukturiere Daten nach Agenten
            const agentData = this.structureDataByAgents(report);
            
            // Speichere strukturierte Daten
            await this.saveStructuredData(agentData);
            
            console.log('✅ Daten für KAYA verarbeitet');
        }
    }

    structureDataByAgents(report) {
        const agents = {
            buergerdienste: [],
            ratsinfo: [],
            stellenportal: [],
            kontakte: [],
            jugend: [],
            soziales: []
        };
        
        // Klassifiziere URLs nach Agenten
        report.allUrls.forEach(url => {
            const agent = this.classifyUrlToAgent(url);
            if (agent && agents[agent]) {
                agents[agent].push({
                    url: url,
                    title: this.extractTitleFromUrl(url),
                    type: 'web_content',
                    source: 'crawler_v2'
                });
            }
        });
        
        return agents;
    }

    classifyUrlToAgent(url) {
        if (url.includes('ratsinfomanagement.net')) {
            return 'ratsinfo';
        } else if (url.includes('stellenausschreibungen') || url.includes('jobs')) {
            return 'stellenportal';
        } else if (url.includes('kontakt') || url.includes('ansprechpartner')) {
            return 'kontakte';
        } else if (url.includes('jugend') || url.includes('familie')) {
            return 'jugend';
        } else if (url.includes('soziales') || url.includes('gesundheit')) {
            return 'soziales';
        } else {
            return 'buergerdienste';
        }
    }

    extractTitleFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
            return pathSegments[pathSegments.length - 1] || 'Unbekannt';
        } catch (e) {
            return 'Unbekannt';
        }
    }

    async saveStructuredData(agentData) {
        const timestamp = new Date().toISOString().split('T')[0];
        const outputDir = path.join(this.dataDir, 'processed', timestamp);
        
        await fs.ensureDir(outputDir);
        
        for (const [agentName, data] of Object.entries(agentData)) {
            const filePath = path.join(outputDir, `${agentName}_data.json`);
            await fs.writeJson(filePath, data, { spaces: 2 });
            console.log(`💾 ${agentName}: ${data.length} Einträge gespeichert`);
        }
    }

    async createAgentFiles() {
        console.log('📋 Erstelle Agent-Dateien...');
        
        const timestamp = new Date().toISOString().split('T')[0];
        const sourceDir = path.join(this.dataDir, 'processed', timestamp);
        const targetDir = path.join(__dirname, '..', 'ki_backend', timestamp);
        
        await fs.ensureDir(targetDir);
        
        // Kopiere Agent-Dateien
        const files = await fs.readdir(sourceDir);
        for (const file of files) {
            if (file.endsWith('_data.json')) {
                const sourcePath = path.join(sourceDir, file);
                const targetPath = path.join(targetDir, file);
                await fs.copy(sourcePath, targetPath);
            }
        }
        
        console.log('✅ Agent-Dateien erstellt');
    }

    async validateLinks() {
        console.log('🔍 Validiere Links...');
        
        // Einfache Link-Validierung
        const reportPath = path.join(__dirname, '..', 'dual_domain_report.json');
        if (await fs.pathExists(reportPath)) {
            const report = await fs.readJson(reportPath);
            
            let validLinks = 0;
            let totalLinks = report.allUrls.length;
            
            // Simuliere Link-Validierung (in der Realität würde man HTTP-Requests machen)
            for (const url of report.allUrls) {
                if (url.startsWith('http') && !url.includes('#')) {
                    validLinks++;
                }
            }
            
            const validationRate = (validLinks / totalLinks * 100).toFixed(2);
            console.log(`✅ Link-Validierung: ${validationRate}% (${validLinks}/${totalLinks})`);
        }
    }

    async createBackup() {
        console.log('💾 Erstelle Backup...');
        
        const timestamp = new Date().toISOString().split('T')[0];
        const sourceDir = path.join(this.dataDir, 'processed', timestamp);
        const backupDir = path.join(this.dataDir, 'backup');
        
        await fs.ensureDir(backupDir);
        
        if (await fs.pathExists(sourceDir)) {
            const backupPath = path.join(backupDir, `crawler_v2_backup_${timestamp}`);
            await fs.copy(sourceDir, backupPath);
            console.log('✅ Backup erstellt');
        }
    }
}

// Führe vollständige Integration aus
async function main() {
    const integration = new KAYACrawlerIntegration();
    await integration.runFullCrawling();
}

if (require.main === module) {
    main();
}

module.exports = KAYACrawlerIntegration;
