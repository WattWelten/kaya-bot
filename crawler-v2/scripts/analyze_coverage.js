const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');

class CoverageAnalyzer {
    constructor() {
        this.baseUrl = 'https://www.oldenburg-kreis.de';
        this.crawledUrls = new Set();
        this.allUrls = new Set();
        this.sitemapUrls = new Set();
        this.navigationUrls = new Set();
    }

    async analyze() {
        console.log('📊 COVERAGE-ANALYSE STARTET\n');

        // 1. Sammle gecrawlte URLs aus CrawlerEngine
        await this.loadCrawledUrls();
        
        // 2. Versuche Sitemap zu crawlen
        await this.crawlSitemap();
        
        // 3. Analysiere Hauptnavigation
        await this.crawlNavigation();
        
        // 4. Berechne Coverage
        const coverage = this.calculateCoverage();
        
        // 5. Analysiere fehlende Bereiche
        const missing = this.analyzeMissing();
        
        // 6. Report generieren
        this.generateReport(coverage, missing);
        
        return { coverage, missing, crawledUrls: this.crawledUrls.size, allUrls: this.allUrls.size };
    }

    async loadCrawledUrls() {
        console.log('1️⃣ Lade gecrawlte URLs aus CrawlerEngine...\n');
        
        const CrawlerEngine = require('../src/core/CrawlerEngine');
        const engine = new CrawlerEngine();
        
        const agents = [
            'buergerdienste', 'ratsinfo', 'stellenportal', 'kontakte', 'jugend',
            'soziales', 'politik', 'jobcenter', 'wirtschaft', 'ordnungsamt',
            'senioren', 'inklusion', 'digitalisierung', 'gleichstellung',
            'rechnung_ebilling', 'aktionen_veranstaltungen', 'politik_landkreis'
        ];
        
        for (const agentName of agents) {
            try {
                const config = engine.getAgentConfig(agentName);
                if (config && config.webSources) {
                    config.webSources.forEach(url => {
                        this.crawledUrls.add(this.normalizeUrl(url));
                    });
                }
            } catch (error) {
                // Ignoriere Fehler
            }
        }
        
        console.log(`   ✅ ${this.crawledUrls.size} URLs aus Agent-Konfiguration geladen\n`);
    }

    async crawlSitemap() {
        console.log('2️⃣ Crawle Sitemap...\n');
        
        const sitemapUrls = [
            `${this.baseUrl}/sitemap.xml`,
            `${this.baseUrl}/sitemap_index.xml`,
            `${this.baseUrl}/sitemap.html`
        ];
        
        for (const sitemapUrl of sitemapUrls) {
            try {
                const response = await fetch(sitemapUrl, { method: 'HEAD' });
                if (response.ok && response.headers.get('content-type')?.includes('xml')) {
                    console.log(`   ✅ Sitemap gefunden: ${sitemapUrl}`);
                    const urls = await this.parseSitemap(sitemapUrl);
                    urls.forEach(url => {
                        this.sitemapUrls.add(url);
                        this.allUrls.add(url);
                    });
                    console.log(`   📊 ${urls.length} URLs aus Sitemap extrahiert\n`);
                    return; // Erste erfolgreiche Sitemap reicht
                }
            } catch (error) {
                // Weiter zur nächsten Sitemap
            }
        }
        
        console.log('   ⚠️  Keine XML-Sitemap gefunden, verwende Navigation-Analyse\n');
    }

    async parseSitemap(sitemapUrl) {
        try {
            const response = await fetch(sitemapUrl);
            const text = await response.text();
            const urlRegex = /<loc>(.*?)<\/loc>/g;
            const urls = [];
            let match;
            
            while ((match = urlRegex.exec(text)) !== null) {
                const url = match[1].trim();
                if (url.includes('oldenburg-kreis.de')) {
                    urls.push(this.normalizeUrl(url));
                }
            }
            
            return urls;
        } catch (error) {
            console.error(`   ❌ Fehler beim Parsen der Sitemap: ${error.message}\n`);
            return [];
        }
    }

    async crawlNavigation() {
        console.log('3️⃣ Analysiere Hauptnavigation...\n');
        
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        try {
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Extrahiere Links aus Navigation
            const navLinks = await page.evaluate(() => {
                const links = new Set();
                
                // Hauptnavigation
                document.querySelectorAll('nav a[href], .navigation a[href], .menu a[href], header a[href]').forEach(a => {
                    const href = a.getAttribute('href');
                    if (href && href.startsWith('/')) {
                        links.add(href);
                    } else if (href && href.includes('oldenburg-kreis.de')) {
                        links.add(new URL(href).pathname);
                    }
                });
                
                // Breadcrumbs (Top-Level-Kategorien)
                document.querySelectorAll('.breadcrumb a[href], [class*="breadcrumb"] a[href]').forEach(a => {
                    const href = a.getAttribute('href');
                    if (href) {
                        try {
                            const url = new URL(href, window.location.origin);
                            if (url.hostname.includes('oldenburg-kreis.de')) {
                                links.add(url.pathname);
                            }
                        } catch (e) {}
                    }
                });
                
                // Footer-Links (Top-Level)
                document.querySelectorAll('footer a[href]').forEach(a => {
                    const href = a.getAttribute('href');
                    if (href && href.startsWith('/')) {
                        links.add(href);
                    }
                });
                
                return Array.from(links);
            });
            
            navLinks.forEach(link => {
                const fullUrl = this.normalizeUrl(new URL(link, this.baseUrl).href);
                this.navigationUrls.add(fullUrl);
                this.allUrls.add(fullUrl);
            });
            
            console.log(`   ✅ ${navLinks.length} URLs aus Navigation extrahiert\n`);
            
            // Erweitere URLs rekursiv (Depth 1)
            console.log('4️⃣ Erweitere URLs rekursiv (Depth 1)...\n');
            const expandedUrls = await this.expandUrls(Array.from(this.navigationUrls), 1, page);
            expandedUrls.forEach(url => {
                this.allUrls.add(url);
            });
            console.log(`   ✅ ${expandedUrls.length} zusätzliche URLs gefunden (Depth 1)\n`);
            
        } catch (error) {
            console.error(`   ❌ Fehler beim Navigation-Crawl: ${error.message}\n`);
        } finally {
            await browser.close();
        }
    }

    async expandUrls(urls, depth, page) {
        if (depth <= 0) return [];
        
        const expanded = new Set();
        
        for (const url of urls.slice(0, 20)) { // Limitiere auf 20 URLs pro Depth
            try {
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
                const links = await page.evaluate((baseUrl) => {
                    const found = new Set();
                    document.querySelectorAll('a[href]').forEach(a => {
                        const href = a.getAttribute('href');
                        if (href) {
                            try {
                                const url = new URL(href, baseUrl);
                                if (url.hostname.includes('oldenburg-kreis.de') && url.pathname !== '/') {
                                    found.add(url.pathname);
                                }
                            } catch (e) {}
                        }
                    });
                    return Array.from(found);
                }, url);
                
                links.forEach(link => {
                    const fullUrl = this.normalizeUrl(new URL(link, this.baseUrl).href);
                    expanded.add(fullUrl);
                });
            } catch (error) {
                // Überspringe Fehler
            }
        }
        
        return Array.from(expanded);
    }

    normalizeUrl(url) {
        try {
            const u = new URL(url);
            // Entferne Query-Params und Fragments
            return `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/$/, '');
        } catch (error) {
            return url.split('?')[0].split('#')[0].replace(/\/$/, '');
        }
    }

    calculateCoverage() {
        console.log('5️⃣ Berechne Coverage...\n');
        
        const total = this.allUrls.size;
        const crawled = Array.from(this.crawledUrls).filter(url => 
            this.allUrls.has(url) || url.includes('oldenburg-kreis.de')
        ).length;
        
        const coverage = total > 0 ? (crawled / total * 100).toFixed(1) : 0;
        
        console.log(`   📊 Gecrawlte URLs:    ${crawled}`);
        console.log(`   📊 Gesamt-URLs:       ${total}`);
        console.log(`   📊 Coverage:          ${coverage}%\n`);
        
        return {
            crawled,
            total,
            coverage: parseFloat(coverage),
            crawledUrls: Array.from(this.crawledUrls),
            allUrls: Array.from(this.allUrls)
        };
    }

    analyzeMissing() {
        const missing = [];
        const categories = new Set();
        
        this.allUrls.forEach(url => {
            if (!this.crawledUrls.has(url)) {
                missing.push(url);
                // Versuche Kategorie zu extrahieren
                const match = url.match(/oldenburg-kreis\.de\/([^\/]+)/);
                if (match) {
                    categories.add(match[1]);
                }
            }
        });
        
        return {
            urls: missing,
            categories: Array.from(categories),
            count: missing.length
        };
    }

    generateReport(coverage, missing) {
        console.log('━'.repeat(70));
        console.log('📋 COVERAGE-REPORT\n');
        
        console.log(`Aktuelle Coverage: ${coverage.coverage}%`);
        console.log(`   Gecrawlt: ${coverage.crawled} URLs`);
        console.log(`   Gesamt:   ${coverage.total} URLs`);
        console.log(`   Fehlend:  ${missing.count} URLs\n`);
        
        if (missing.categories.length > 0) {
            console.log('Fehlende Kategorien:');
            missing.categories.slice(0, 10).forEach(cat => {
                console.log(`   - ${cat}`);
            });
            if (missing.categories.length > 10) {
                console.log(`   ... und ${missing.categories.length - 10} weitere`);
            }
            console.log('');
        }
        
        // Speichere Report
        const report = {
            timestamp: new Date().toISOString(),
            coverage,
            missing: {
                count: missing.count,
                categories: missing.categories,
                sampleUrls: missing.urls.slice(0, 20)
            },
            sitemapUrls: this.sitemapUrls.size,
            navigationUrls: this.navigationUrls.size
        };
        
        const reportPath = path.join(__dirname, '..', 'data', `coverage_report_${new Date().toISOString().split('T')[0]}.json`);
        fs.writeJsonSync(reportPath, report, { spaces: 2 });
        console.log(`💾 Report gespeichert: ${reportPath}`);
    }
}

// Main
(async () => {
    try {
        const analyzer = new CoverageAnalyzer();
        const results = await analyzer.analyze();
        
        console.log('\n✅ Coverage-Analyse abgeschlossen\n');
    } catch (error) {
        console.error('❌ Fehler:', error);
        process.exit(1);
    }
})();



