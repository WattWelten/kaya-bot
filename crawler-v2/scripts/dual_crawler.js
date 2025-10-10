const puppeteer = require('puppeteer');
const fs = require('fs-extra');

class DualDomainCrawler {
    constructor() {
        this.browser = null;
        this.domains = [
            'https://www.oldenburg-kreis.de',
            'https://oldenburg-kreis.ratsinfomanagement.net'
        ];
        this.visitedUrls = new Set();
        this.allUrls = new Set();
        this.errors = [];
        this.stats = {
            totalPages: 0,
            crawledPages: 0,
            errorPages: 0,
            contentPages: 0,
            formPages: 0,
            contactPages: 0,
            domainStats: {
                'oldenburg-kreis.de': { pages: 0, errors: 0 },
                'ratsinfomanagement.net': { pages: 0, errors: 0 }
            }
        };
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async crawlBothDomains() {
        console.log('🚀 DUAL-DOMAIN CRAWLER: Landkreis Oldenburg');
        console.log('==========================================');
        console.log('🌐 Domain 1: https://www.oldenburg-kreis.de');
        console.log('🌐 Domain 2: https://oldenburg-kreis.ratsinfomanagement.net');
        
        await this.init();
        
        try {
            for (const domain of this.domains) {
                console.log(`\n🔍 Starte Crawling für: ${domain}`);
                await this.crawlDomain(domain);
            }
            
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Crawler-Fehler:', error);
        } finally {
            await this.browser.close();
        }
    }

    async crawlDomain(domain) {
        const domainName = this.getDomainName(domain);
        console.log(`📊 Crawle Domain: ${domainName}`);
        
        // Starte von der Hauptseite
        await this.crawlPage(domain);
        
        // Sammle URLs
        await this.collectDomainUrls(domain);
        
        // Crawle alle URLs
        await this.crawlDomainUrls(domain);
    }

    async collectDomainUrls(domain) {
        const priorityUrls = this.getPriorityUrls(domain);
        
        for (const url of priorityUrls) {
            await this.extractUrlsFromPage(url);
            await this.delay(500);
        }
        
        const domainUrls = Array.from(this.allUrls).filter(url => url.includes(this.getDomainName(domain)));
        console.log(`📊 URLs gesammelt für ${domain}: ${domainUrls.length}`);
    }

    getPriorityUrls(domain) {
        if (domain.includes('oldenburg-kreis.de')) {
            return [
                'https://www.oldenburg-kreis.de/buergerservice/',
                'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/',
                'https://www.oldenburg-kreis.de/jugend-und-familie/',
                'https://www.oldenburg-kreis.de/gesundheit-und-soziales/',
                'https://www.oldenburg-kreis.de/ordnung-und-verkehr/',
                'https://www.oldenburg-kreis.de/planen-und-bauen/'
            ];
        } else {
            return [
                'https://oldenburg-kreis.ratsinfomanagement.net/',
                'https://oldenburg-kreis.ratsinfomanagement.net/ris/'
            ];
        }
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
                            return href && (
                                href.includes('oldenburg-kreis.de') || 
                                href.includes('ratsinfomanagement.net')
                            );
                        })
                        .filter(href => !href.includes('#') && !href.includes('javascript:'))
                        .filter(href => !href.includes('.pdf') && !href.includes('.doc'))
                        .filter(href => href.startsWith('http'))
                        .slice(0, 200);
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

    async crawlDomainUrls(domain) {
        const domainName = this.getDomainName(domain);
        const urlsToCrawl = Array.from(this.allUrls)
            .filter(url => url.includes(domainName))
            .slice(0, 500); // Limit für Test
        
        console.log(`🌐 Crawle ${urlsToCrawl.length} URLs für ${domainName}...`);
        
        for (let i = 0; i < urlsToCrawl.length; i++) {
            const url = urlsToCrawl[i];
            
            if (this.visitedUrls.has(url)) continue;
            
            await this.crawlPage(url);
            if (this.stats.domainStats[domainName]) {
                this.stats.domainStats[domainName].pages++;
            } else {
                // Initialisiere Domain-Stats falls nicht vorhanden
                this.stats.domainStats[domainName] = { pages: 1, errors: 0 };
            }
            
            if ((i + 1) % 25 === 0) {
                const progress = ((i + 1) / urlsToCrawl.length * 100).toFixed(1);
                console.log(`📈 ${domainName} Progress: ${progress}% (${i + 1}/${urlsToCrawl.length})`);
            }
            
            await this.delay(200);
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
            
            const pageAnalysis = await page.evaluate(() => {
                const content = document.body.innerText;
                const hasForms = document.querySelectorAll('form').length > 0;
                const hasContacts = /@|telefon|tel:|fax|kontakt/i.test(content);
                const hasContent = content.length > 200;
                
                return { hasContent, hasForms, hasContacts, contentLength: content.length };
            });
            
            if (pageAnalysis.hasContent) this.stats.contentPages++;
            if (pageAnalysis.hasForms) this.stats.formPages++;
            if (pageAnalysis.hasContacts) this.stats.contactPages++;
            
            this.stats.crawledPages++;
            await page.close();
            
        } catch (error) {
            const domainName = this.getDomainName(url);
            if (this.stats.domainStats[domainName]) {
                this.stats.domainStats[domainName].errors++;
            } else {
                // Initialisiere Domain-Stats falls nicht vorhanden
                this.stats.domainStats[domainName] = { pages: 0, errors: 1 };
            }
            this.errors.push({ url, error: error.message });
            this.stats.errorPages++;
        }
    }

    getDomainName(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            
            // Normalisiere Domain-Namen
            if (hostname.includes('oldenburg-kreis.de')) {
                return 'oldenburg-kreis.de';
            } else if (hostname.includes('ratsinfomanagement.net')) {
                return 'ratsinfomanagement.net';
            }
            
            return hostname;
        } catch (e) {
            return 'unknown';
        }
    }

    async generateReport() {
        console.log('\n📊 DUAL-DOMAIN CRAWLER-REPORT:');
        console.log('================================');
        console.log(`📄 Gesamt gefundene URLs: ${this.allUrls.size}`);
        console.log(`✅ Erfolgreich gecrawlt: ${this.stats.crawledPages}`);
        console.log(`❌ Fehler: ${this.stats.errorPages}`);
        console.log(`📝 Content-Seiten: ${this.stats.contentPages}`);
        console.log(`📋 Formular-Seiten: ${this.stats.formPages}`);
        console.log(`📞 Kontakt-Seiten: ${this.stats.contactPages}`);
        
        console.log('\n🌐 DOMAIN-STATISTIKEN:');
        Object.entries(this.stats.domainStats).forEach(([domain, stats]) => {
            console.log(`📊 ${domain}: ${stats.pages} Seiten, ${stats.errors} Fehler`);
        });
        
        const successRate = (this.stats.crawledPages / this.stats.totalPages * 100).toFixed(2);
        const coverageRate = (this.stats.crawledPages / this.allUrls.size * 100).toFixed(2);
        
        console.log(`\n🎯 Erfolgsrate: ${successRate}%`);
        console.log(`📊 Coverage-Rate: ${coverageRate}%`);
        
        const report = {
            timestamp: new Date().toISOString(),
            domains: this.domains,
            stats: this.stats,
            allUrls: Array.from(this.allUrls),
            coverageRate: parseFloat(coverageRate)
        };
        
        await fs.writeJson('dual_domain_report.json', report, { spaces: 2 });
        console.log('💾 Report gespeichert: dual_domain_report.json');
        
        if (parseFloat(coverageRate) >= 95) {
            console.log('✅ ZIEL ERREICHT: 95%+ Coverage!');
        } else {
            console.log(`🟡 Coverage: ${coverageRate}% - Ziel: 95%+`);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    const crawler = new DualDomainCrawler();
    await crawler.crawlBothDomains();
}

if (require.main === module) {
    main();
}

module.exports = DualDomainCrawler;
