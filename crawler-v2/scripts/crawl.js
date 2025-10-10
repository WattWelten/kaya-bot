#!/usr/bin/env node

const CrawlerEngine = require('../src/core/CrawlerEngine');
const Logger = require('../src/utils/Logger');

async function main() {
    const logger = new Logger('CrawlerScript');
    
    try {
        logger.info('🚀 Starte KAYA Crawler v2...');
        
        const crawler = new CrawlerEngine();
        
        // Führe vollständigen Crawl durch
        const results = await crawler.crawlAll();
        
        logger.info('✅ Crawl erfolgreich abgeschlossen!');
        logger.info(`📊 Ergebnisse: ${Object.keys(results).length} Agenten verarbeitet`);
        
        // Zeige Zusammenfassung
        for (const [agent, data] of Object.entries(results)) {
            if (data.error) {
                logger.error(`❌ ${agent}: ${data.error}`);
            } else {
                logger.info(`✅ ${agent}: ${data.length} Einträge`);
            }
        }
        
        // Schließe Browser
        await crawler.webCrawler.close();
        
        process.exit(0);
        
    } catch (error) {
        logger.error('❌ Crawler-Fehler:', error);
        process.exit(1);
    }
}

// Führe Script aus
if (require.main === module) {
    main();
}

module.exports = main;

