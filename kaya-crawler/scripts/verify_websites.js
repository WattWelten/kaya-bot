const puppeteer = require('puppeteer');
const fs = require('fs-extra');

class WebsiteVerification {
    constructor() {
        this.browser = null;
        this.domains = [
            'https://www.oldenburg-kreis.de',
            'https://oldenburg-kreis.ratsinfomanagement.net'
        ];
        this.verificationResults = {
            'oldenburg-kreis.de': { totalUrls: 0, crawledUrls: 0, missingUrls: [], errors: [] },
            'ratsinfomanagement.net': { totalUrls: 0, crawledUrls: 0, missingUrls: [], errors: [] }
        };
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async verifyBothDomains() {
        console.log('🔍 WEBSITE-VERIFICATION: Landkreis Oldenburg');
        console.log('============================================');
        
        await this.init();
        
        try {
            for (const domain of this.domains) {
                console.log(`\n🌐 Verifiziere: ${domain}`);
                await this.verifyDomain(domain);
            }
            
            await this.generateVerificationReport();
            
        } catch (error) {
            console.error('❌ Verification-Fehler:', error);
        } finally {
            await this.browser.close();
        }
    }

    async verifyDomain(domain) {
        const domainName = this.getDomainName(domain);
        
        try {
            // 1. Sammle alle URLs der Domain
            const allUrls = await this.collectAllDomainUrls(domain);
            this.verificationResults[domainName].totalUrls = allUrls.length;
            
            console.log(`📊 Gefundene URLs: ${allUrls.length}`);
            
            // 2. Prüfe wichtige Bereiche
            await this.checkImportantAreas(domain, allUrls);
            
            // 3. Prüfe Crawler-Coverage
            await this.checkCrawlerCoverage(domainName, allUrls);
            
        } catch (error) {
            console.error(`❌ Domain-Verification Fehler für ${domain}:`, error);
            this.verificationResults[domainName].errors.push(error.message);
        }
    }

    async collectAllDomainUrls(domain) {
        const allUrls = new Set();
        
        try {
            const page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await page.setDefaultTimeout(30000);
            
            // Starte von der Hauptseite
            await page.goto(domain, { waitUntil: 'networkidle2' });
            
            // Sammle URLs von der Hauptseite
            const mainUrls = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a[href]'))
                    .map(a => a.href)
                    .filter(href => href && href.includes('oldenburg-kreis.de'))
                    .filter(href => !href.includes('#') && !href.includes('javascript:'))
                    .filter(href => !href.includes('.pdf') && !href.includes('.doc'))
                    .filter(href => href.startsWith('http'))
                    .slice(0, 500);
            });
            
            mainUrls.forEach(url => allUrls.add(url));
            
            // Sammle URLs von wichtigen Bereichen
            const importantAreas = this.getImportantAreas(domain);
            for (const area of importantAreas) {
                try {
                    await page.goto(area, { waitUntil: 'networkidle2' });
                    const areaUrls = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('a[href]'))
                            .map(a => a.href)
                            .filter(href => href && href.includes('oldenburg-kreis.de'))
                            .filter(href => !href.includes('#') && !href.includes('javascript:'))
                            .filter(href => !href.includes('.pdf') && !href.includes('.doc'))
                            .filter(href => href.startsWith('http'))
                            .slice(0, 200);
                    });
                    
                    areaUrls.forEach(url => allUrls.add(url));
                } catch (error) {
                    console.error(`❌ Fehler beim Sammeln von ${area}:`, error.message);
                }
            }
            
            await page.close();
            
        } catch (error) {
            console.error(`❌ URL-Sammlung Fehler für ${domain}:`, error);
        }
        
        return Array.from(allUrls);
    }

    getImportantAreas(domain) {
        if (domain.includes('oldenburg-kreis.de')) {
            return [
                'https://www.oldenburg-kreis.de/buergerservice/',
                'https://www.oldenburg-kreis.de/landkreis-und-verwaltung/',
                'https://www.oldenburg-kreis.de/jugend-und-familie/',
                'https://www.oldenburg-kreis.de/gesundheit-und-soziales/',
                'https://www.oldenburg-kreis.de/ordnung-und-verkehr/',
                'https://www.oldenburg-kreis.de/planen-und-bauen/',
                'https://www.oldenburg-kreis.de/umwelt-und-abfall/',
                'https://www.oldenburg-kreis.de/bildung-und-kultur/',
                'https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/'
            ];
        } else {
            return [
                'https://oldenburg-kreis.ratsinfomanagement.net/',
                'https://oldenburg-kreis.ratsinfomanagement.net/ris/',
                'https://oldenburg-kreis.ratsinfomanagement.net/ris/ris_uebersicht.php',
                'https://oldenburg-kreis.ratsinfomanagement.net/ris/ris_sitzung.php',
                'https://oldenburg-kreis.ratsinfomanagement.net/ris/ris_vorlage.php'
            ];
        }
    }

    async checkImportantAreas(domain, allUrls) {
        const importantAreas = this.getImportantAreas(domain);
        const domainName = this.getDomainName(domain);
        
        console.log(`🔍 Prüfe wichtige Bereiche für ${domainName}:`);
        
        for (const area of importantAreas) {
            const areaUrls = allUrls.filter(url => url.includes(area.split('/').slice(-2).join('/')));
            console.log(`  📁 ${area.split('/').slice(-2).join('/')}: ${areaUrls.length} URLs`);
            
            if (areaUrls.length === 0) {
                this.verificationResults[domainName].missingUrls.push(area);
            }
        }
    }

    async checkCrawlerCoverage(domainName, allUrls) {
        // Lade Crawler-Report
        const reportPath = 'dual_domain_report.json';
        if (await fs.pathExists(reportPath)) {
            const report = await fs.readJson(reportPath);
            const crawledUrls = report.allUrls.filter(url => url.includes(domainName));
            
            this.verificationResults[domainName].crawledUrls = crawledUrls.length;
            
            // Finde fehlende URLs
            const missingUrls = allUrls.filter(url => !crawledUrls.includes(url));
            this.verificationResults[domainName].missingUrls.push(...missingUrls);
            
            const coverageRate = (crawledUrls.length / allUrls.length * 100).toFixed(2);
            console.log(`📊 Crawler-Coverage: ${coverageRate}% (${crawledUrls.length}/${allUrls.length})`);
            
            if (parseFloat(coverageRate) >= 95) {
                console.log(`✅ ${domainName}: Vollständig erfasst!`);
            } else {
                console.log(`⚠️ ${domainName}: Unvollständig erfasst!`);
            }
        }
    }

    getDomainName(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            
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

    async generateVerificationReport() {
        console.log('\n📊 VERIFICATION-REPORT:');
        console.log('========================');
        
        let totalCoverage = 0;
        let totalDomains = 0;
        
        Object.entries(this.verificationResults).forEach(([domain, results]) => {
            console.log(`\n🌐 ${domain}:`);
            console.log(`  📄 Gesamt URLs: ${results.totalUrls}`);
            console.log(`  ✅ Gecrawlt: ${results.crawledUrls}`);
            console.log(`  ❌ Fehlend: ${results.missingUrls.length}`);
            console.log(`  🚨 Fehler: ${results.errors.length}`);
            
            if (results.totalUrls > 0) {
                const coverage = (results.crawledUrls / results.totalUrls * 100).toFixed(2);
                console.log(`  📊 Coverage: ${coverage}%`);
                totalCoverage += parseFloat(coverage);
                totalDomains++;
            }
        });
        
        const overallCoverage = totalDomains > 0 ? (totalCoverage / totalDomains).toFixed(2) : 0;
        console.log(`\n🎯 Gesamt-Coverage: ${overallCoverage}%`);
        
        // Speichere Verification-Report
        const report = {
            timestamp: new Date().toISOString(),
            verificationResults: this.verificationResults,
            overallCoverage: parseFloat(overallCoverage)
        };
        
        await fs.writeJson('website_verification_report.json', report, { spaces: 2 });
        console.log('💾 Verification-Report gespeichert: website_verification_report.json');
        
        // Zeige Phase-1-Status
        this.showPhase1Status(parseFloat(overallCoverage));
    }

    showPhase1Status(coverage) {
        console.log('\n🚀 PHASE-1-STATUS:');
        console.log('==================');
        
        if (coverage >= 95) {
            console.log('✅ PHASE 1 BEREIT: Beide Websites vollständig erfasst!');
            console.log('🎯 Coverage: 95%+ erreicht');
            console.log('🚀 Kann mit Phase 1 fortfahren');
        } else if (coverage >= 80) {
            console.log('🟡 PHASE 1 FAST BEREIT: Gute Coverage erreicht');
            console.log(`📊 Coverage: ${coverage}%`);
            console.log('⚠️ Empfehlung: Fehlende Bereiche crawlen');
        } else {
            console.log('🔴 PHASE 1 NICHT BEREIT: Unvollständige Coverage');
            console.log(`📊 Coverage: ${coverage}%`);
            console.log('❌ Muss vor Phase 1 verbessert werden');
        }
    }
}

async function main() {
    const verification = new WebsiteVerification();
    await verification.verifyBothDomains();
}

if (require.main === module) {
    main();
}

module.exports = WebsiteVerification;

