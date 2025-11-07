const puppeteer = require('puppeteer');
const fs = require('fs-extra');

class CompleteWebsiteCrawler {
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
        this.maxPages = 1000; // Erhöhe für vollständige Coverage
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async crawlCompleteWebsite() {
        console.log('🚀 VOLLSTÄNDIGER WEBSITE-CRAWLER: oldenburg-kreis.de');
        console.log('==================================================');
        console.log(`🎯 Ziel: ${this.maxPages} Seiten für 95%+ Coverage`);
        
        await this.init();
        
        try {
            // 1. Sammle alle URLs systematisch
            await this.collectAllUrls();
            
            // 2. Crawle alle URLs
            await this.crawlAllUrls();
            
            // 3. Generiere Report
            await this.generateCompleteReport();
            
        } catch (error) {
            console.error('❌ Crawler-Fehler:', error);
        } finally {
            await this.browser.close();
        }
    }

    async collectAllUrls() {
        console.log('🔍 Sammle alle URLs systematisch...');
        
        const priorityUrls = [
            'https://www.oldenburg-kreis.de/',
            'https://www.oldenburg-kreis.de/buergerservice/',
            'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/',
            'https://www.oldenburg-kreis.de/jugend-und-familie/',
            'https://www.oldenburg-kreis.de/gesundheit-und-soziales/',
            'https://www.oldenburg-kreis.de/ordnung-und-verkehr/',
            'https://www.oldenburg-kreis.de/planen-und-bauen/',
            'https://www.oldenburg-kreis.de/umwelt-und-abfall/',
            'https://www.oldenburg-kreis.de/bildung-und-kultur/',
            'https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/',
            'https://www.oldenburg-kreis.de/downloads/',
            'https://www.oldenburg-kreis.de/portal/',
            'https://www.oldenburg-kreis.de/regional/',
            'https://www.oldenburg-kreis.de/medien/'
        ];
        
        // Crawle Prioritäts-URLs zuerst
        for (const url of priorityUrls) {
            await this.extractUrlsFromPage(url);
            await this.delay(300);
        }
        
        // Sammle URLs aus allen gefundenen Seiten
        const urlsToProcess = Array.from(this.allUrls).slice(0, 200);
        for (const url of urlsToProcess) {
            if (!this.visitedUrls.has(url)) {
                await this.extractUrlsFromPage(url);
                await this.delay(200);
            }
        }
        
        console.log(`📊 URLs gesammelt: ${this.allUrls.size}`);
    }

    async extractUrlsFromPage(url) {
        try {
            const page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await page.setDefaultTimeout(30000);
            
            await page.goto(url, { waitUntil: 'networkidle2' });
            
            const urls = await page.evaluate(() => {
                try {
                    return Array.from(document.querySelectorAll('a[href]'))
                        .map(a => a.href)
                        .filter(href => {
                            return href && href.includes('oldenburg-kreis.de');
                        })
                        .filter(href => !href.includes('#') && !href.includes('javascript:'))
                        .filter(href => !href.includes('.pdf') && !href.includes('.doc') && !href.includes('.xls'))
                        .filter(href => !href.includes('mailto:') && !href.includes('tel:'))
                        .filter(href => href.startsWith('http'))
                        .slice(0, 300);
                } catch (e) {
                    return [];
                }
            });
            
            if (urls && urls.length > 0) {
                urls.forEach(url => this.allUrls.add(url));
            }
            
            await page.close();
            
        } catch (error) {
            console.error(`❌ URL-Extraktion Fehler für ${url}:`, error.message);
        }
    }

    async crawlAllUrls() {
        console.log('🌐 Crawle alle URLs...');
        
        const urlsToCrawl = Array.from(this.allUrls).slice(0, this.maxPages);
        console.log(`📊 Crawle ${urlsToCrawl.length} URLs...`);
        
        for (let i = 0; i < urlsToCrawl.length; i++) {
            const url = urlsToCrawl[i];
            
            if (this.visitedUrls.has(url)) {
                continue;
            }
            
            await this.crawlPage(url);
            
            // Progress-Anzeige
            if ((i + 1) % 50 === 0) {
                const progress = ((i + 1) / urlsToCrawl.length * 100).toFixed(1);
                console.log(`📈 Progress: ${progress}% (${i + 1}/${urlsToCrawl.length})`);
            }
            
            // Rate limiting
            await this.delay(150);
        }
    }

    async crawlPage(url) {
        if (this.visitedUrls.has(url)) return;
        
        this.visitedUrls.add(url);
        this.stats.totalPages++;
        
        try {
            const page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await page.setDefaultTimeout(20000);
            
            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.waitForSelector('body', { timeout: 5000 });
            
            // Analysiere Seiteninhalt
            const pageAnalysis = await page.evaluate(() => {
                const content = document.body.innerText;
                const hasForms = document.querySelectorAll('form').length > 0;
                const hasContacts = /@|telefon|tel:|fax|kontakt/i.test(content);
                const hasContent = content.length > 200;
                
                return {
                    hasContent,
                    hasForms,
                    hasContacts,
                    contentLength: content.length,
                    title: document.title,
                    url: window.location.href
                };
            });
            
            // Update Stats
            if (pageAnalysis.hasContent) this.stats.contentPages++;
            if (pageAnalysis.hasForms) this.stats.formPages++;
            if (pageAnalysis.hasContacts) this.stats.contactPages++;
            
            this.stats.crawledPages++;
            
            await page.close();
            
        } catch (error) {
            this.errors.push({ url, error: error.message });
            this.stats.errorPages++;
        }
    }

    async generateCompleteReport() {
        console.log('\n📊 VOLLSTÄNDIGER CRAWLER-REPORT:');
        console.log('==================================');
        console.log(`📄 Gesamt gefundene URLs: ${this.allUrls.size}`);
        console.log(`✅ Erfolgreich gecrawlt: ${this.stats.crawledPages}`);
        console.log(`❌ Fehler: ${this.stats.errorPages}`);
        console.log(`📝 Content-Seiten: ${this.stats.contentPages}`);
        console.log(`📋 Formular-Seiten: ${this.stats.formPages}`);
        console.log(`📞 Kontakt-Seiten: ${this.stats.contactPages}`);
        
        const successRate = (this.stats.crawledPages / this.stats.totalPages * 100).toFixed(2);
        const coverageRate = (this.stats.crawledPages / this.allUrls.size * 100).toFixed(2);
        
        console.log(`\n🎯 Erfolgsrate: ${successRate}%`);
        console.log(`📊 Coverage-Rate: ${coverageRate}%`);
        
        // Speichere Report
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            allUrls: Array.from(this.allUrls),
            visitedUrls: Array.from(this.visitedUrls),
            errors: this.errors,
            coverageRate: parseFloat(coverageRate)
        };
        
        await fs.writeJson('complete_website_report.json', report, { spaces: 2 });
        console.log('💾 Report gespeichert: complete_website_report.json');
        
        // Zeige Bereichs-Analyse
        this.showAreaAnalysis();
        
        // Zeige Coverage-Status
        this.showCoverageStatus(parseFloat(coverageRate));
    }

    showAreaAnalysis() {
        console.log('\n🏆 BEREICHS-ANALYSE:');
        console.log('====================');
        
        const areas = {};
        Array.from(this.allUrls).forEach(url => {
            try {
                const path = new URL(url).pathname;
                const segments = path.split('/').filter(s => s.length > 0);
                if (segments.length > 0) {
                    const area = segments[0];
                    areas[area] = (areas[area] || 0) + 1;
                }
            } catch (e) {
                // Ignore invalid URLs
            }
        });
        
        const sortedAreas = Object.entries(areas)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20);
        
        sortedAreas.forEach(([area, count]) => {
            console.log(`📁 ${area}: ${count} Seiten`);
        });
    }

    showCoverageStatus(coverageRate) {
        console.log('\n🎯 COVERAGE-STATUS:');
        console.log('===================');
        
        if (coverageRate >= 95) {
            console.log('✅ ZIEL ERREICHT: 95%+ Coverage!');
            console.log('🚀 Phase 1 kann starten!');
        } else if (coverageRate >= 80) {
            console.log('🟡 GUT: 80%+ Coverage erreicht');
            console.log('⚠️ Empfehlung: Weitere URLs crawlen');
        } else if (coverageRate >= 60) {
            console.log('🟠 OK: 60%+ Coverage erreicht');
            console.log('❌ Muss verbessert werden');
        } else {
            console.log('🔴 NICHT AUSREICHEND: <60% Coverage');
            console.log('❌ Phase 1 nicht möglich');
        }
        
        console.log(`📊 Aktuelle Coverage: ${coverageRate}%`);
        console.log(`🎯 Ziel: 95%+`);
        
        if (coverageRate < 95) {
            const neededPages = Math.ceil((this.allUrls.size * 0.95) - this.stats.crawledPages);
            console.log(`📈 Noch benötigt: ${neededPages} Seiten`);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    const crawler = new CompleteWebsiteCrawler();
    await crawler.crawlCompleteWebsite();
}

if (require.main === module) {
    main();
}

module.exports = CompleteWebsiteCrawler;

