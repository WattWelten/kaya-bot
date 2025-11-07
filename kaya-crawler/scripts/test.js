#!/usr/bin/env node

const CrawlerEngine = require('../src/core/CrawlerEngine');
const Logger = require('../src/utils/Logger');

async function testCrawler() {
    const logger = new Logger('CrawlerTest');
    
    try {
        logger.info('🧪 Teste KAYA Crawler v2...');
        
        const crawler = new CrawlerEngine();
        
        // Teste einzelne Agent
        logger.info('🔍 Teste Bürgerdienste...');
        const testData = await crawler.crawlAgent('buergerdienste');
        
        logger.info(`✅ Test erfolgreich: ${testData.length} Einträge`);
        
        // Zeige erste 3 Einträge
        testData.slice(0, 3).forEach((item, index) => {
            logger.info(`📄 Eintrag ${index + 1}: ${item.type} - ${item.title || item.url}`);
        });
        
        // Schließe Browser
        await crawler.webCrawler.close();
        
        logger.info('✅ Test abgeschlossen!');
        
    } catch (error) {
        logger.error('❌ Test-Fehler:', error);
        process.exit(1);
    }
}

// Führe Test aus
if (require.main === module) {
    testCrawler();
}

module.exports = testCrawler;

