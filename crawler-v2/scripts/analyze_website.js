const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class WebsiteAnalyzer {
    constructor() {
        this.browser = null;
        this.baseUrl = 'https://www.oldenburg-kreis.de';
        this.visitedUrls = new Set();
        this.allUrls = new Set();
        this.errors = [];
        this.stats = {
            totalPages: 0,
            crawledPages: 0,
            errorPages: 0,
            contentPages: 0,
            formPages: 0,
            contactPages: 0
        };
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async analyzeWebsite() {
        console.log('🔍 ANALYSE: Landkreis Oldenburg Website...');
        
        await this.init();
        
        try {
            // 1. Starte von der Hauptseite
            await this.crawlPage(this.baseUrl);
            
            // 2. Finde alle Links auf der Hauptseite
            const mainPageLinks = await this.extractAllLinks(this.baseUrl);
            console.log(`📊 Hauptseite: ${mainPageLinks.length} Links gefunden`);
            
            // 3. Crawle alle gefundenen Links
            for (const link of mainPageLinks) {
                if (!this.visitedUrls.has(link)) {
                    await this.crawlPage(link);
                    await this.delay(1000); // Rate limiting
                }
            }
            
            // 4. Generiere Analyse-Report
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Analyse-Fehler:', error);
        } finally {
            await this.browser.close();
        }
    }

    async crawlPage(url) {
        if (this.visitedUrls.has(url)) return;
        
        this.visitedUrls.add(url);
        this.stats.totalPages++;
        
        try {
            const page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await page.setDefaultTimeout(30000);
            
            console.log(`🌐 Crawle: ${url}`);
            
            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.waitForSelector('body', { timeout: 10000 });
            
            // Analysiere Seiteninhalt
            const pageAnalysis = await page.evaluate(() => {
                const content = document.body.innerText;
                const hasForms = document.querySelectorAll('form').length > 0;
                const hasContacts = /@|telefon|tel:|fax/i.test(content);
                const hasContent = content.length > 500;
                
                return {
                    hasContent,
                    hasForms,
                    hasContacts,
                    contentLength: content.length,
                    title: document.title,
                    links: Array.from(document.querySelectorAll('a[href]')).map(a => a.href)
                };
            });
            
            // Update Stats
            if (pageAnalysis.hasContent) this.stats.contentPages++;
            if (pageAnalysis.hasForms) this.stats.formPages++;
            if (pageAnalysis.hasContacts) this.stats.contactPages++;
            
            this.stats.crawledPages++;
            
            // Sammle alle Links
            pageAnalysis.links.forEach(link => {
                if (link.includes('oldenburg-kreis.de')) {
                    this.allUrls.add(link);
                }
            });
            
            await page.close();
            
        } catch (error) {
            console.error(`❌ Fehler bei ${url}:`, error.message);
            this.errors.push({ url, error: error.message });
            this.stats.errorPages++;
        }
    }

    async extractAllLinks(url) {
        try {
            const page = await this.browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            
            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a[href]'))
                    .map(a => a.href)
                    .filter(href => href.includes('oldenburg-kreis.de'))
                    .filter(href => !href.includes('#') && !href.includes('javascript:'))
                    .filter(href => !href.includes('.pdf') && !href.includes('.doc'))
                    .slice(0, 100); // Limit für Test
            });
            
            await page.close();
            return links;
            
        } catch (error) {
            console.error(`❌ Link-Extraktion Fehler für ${url}:`, error);
            return [];
        }
    }

    async generateReport() {
        console.log('\n📊 ANALYSE-REPORT:');
        console.log('==================');
        console.log(`📄 Gesamt gefundene URLs: ${this.allUrls.size}`);
        console.log(`✅ Erfolgreich gecrawlt: ${this.stats.crawledPages}`);
        console.log(`❌ Fehler: ${this.stats.errorPages}`);
        console.log(`📝 Content-Seiten: ${this.stats.contentPages}`);
        console.log(`📋 Formular-Seiten: ${this.stats.formPages}`);
        console.log(`📞 Kontakt-Seiten: ${this.stats.contactPages}`);
        
        const successRate = (this.stats.crawledPages / this.stats.totalPages * 100).toFixed(2);
        console.log(`🎯 Erfolgsrate: ${successRate}%`);
        
        // Speichere detaillierten Report
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            allUrls: Array.from(this.allUrls),
            visitedUrls: Array.from(this.visitedUrls),
            errors: this.errors
        };
        
        await fs.writeJson('website_analysis_report.json', report, { spaces: 2 });
        console.log('💾 Detaillierter Report gespeichert: website_analysis_report.json');
        
        // Zeige Top-Bereiche
        this.showTopAreas();
    }

    showTopAreas() {
        console.log('\n🏆 TOP-BEREICHE:');
        console.log('================');
        
        const areas = {};
        Array.from(this.allUrls).forEach(url => {
            const path = new URL(url).pathname;
            const segments = path.split('/').filter(s => s.length > 0);
            if (segments.length > 0) {
                const area = segments[0];
                areas[area] = (areas[area] || 0) + 1;
            }
        });
        
        const sortedAreas = Object.entries(areas)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        sortedAreas.forEach(([area, count]) => {
            console.log(`📁 ${area}: ${count} Seiten`);
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Führe Analyse aus
async function main() {
    const analyzer = new WebsiteAnalyzer();
    await analyzer.analyzeWebsite();
}

if (require.main === module) {
    main();
}

module.exports = WebsiteAnalyzer;

