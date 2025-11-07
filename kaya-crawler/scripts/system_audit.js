const fs = require('fs-extra');
const path = require('path');
const CrawlerEngine = require('../src/core/CrawlerEngine');
const puppeteer = require('puppeteer');

class SystemAudit {
    constructor() {
        this.results = {
            crawler: {},
            agents: {},
            personas: {},
            languages: {},
            recommendations: []
        };
        this.crawlerEngine = new CrawlerEngine();
    }

    async runFullAudit() {
        console.log('🔍 Starte vollständige Systemprüfung...\n');
        
        await this.auditCrawler();
        await this.auditAgents();
        await this.auditPersonas();
        await this.auditLanguages();
        await this.generateReport();
    }

    async auditCrawler() {
        console.log('📊 1. CRAWLER-PRÜFUNG');
        console.log('━'.repeat(60));
        
        // 1.1 Alle gecrawlten URLs sammeln
        const crawledUrls = new Set();
        const agentUrls = {};
        
        for (const agent of this.crawlerEngine.agents) {
            const config = this.crawlerEngine.getAgentConfig(agent);
            const urls = config.webSources || [];
            agentUrls[agent] = urls;
            urls.forEach(url => crawledUrls.add(url));
        }
        
        const totalCrawledUrls = crawledUrls.size;
        console.log(`✅ Gecrawlte URLs (eindeutig): ${totalCrawledUrls}`);
        console.log(`✅ Agenten: ${this.crawlerEngine.agents.length}`);
        
        // 1.2 Sitemap-Analyse (Versuche sitemap.xml zu laden)
        let sitemapUrls = [];
        try {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            
            // Versuche sitemap.xml
            try {
                await page.goto('https://www.oldenburg-kreis.de/sitemap.xml', { waitUntil: 'networkidle2', timeout: 10000 });
                const content = await page.content();
                // Einfache URL-Extraktion aus sitemap
                const urlMatches = content.match(/<loc>(.*?)<\/loc>/g) || [];
                sitemapUrls = urlMatches.map(m => m.replace(/<loc>|<\/loc>/g, '').trim());
            } catch (e) {
                console.log('⚠️  Sitemap.xml nicht erreichbar, analysiere Hauptnavigation...');
                // Analysiere Hauptnavigation
                await page.goto('https://www.oldenburg-kreis.de/', { waitUntil: 'networkidle2' });
                const navLinks = await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('nav a[href], .navigation a[href], header a[href]'));
                    return links.map(a => {
                        const href = a.getAttribute('href');
                        if (href && (href.startsWith('http') || href.startsWith('/'))) {
                            return href.startsWith('/') ? `https://www.oldenburg-kreis.de${href}` : href;
                        }
                        return null;
                    }).filter(Boolean);
                });
                sitemapUrls = [...new Set(navLinks)];
            }
            
            await browser.close();
        } catch (error) {
            console.log(`⚠️  Sitemap-Analyse fehlgeschlagen: ${error.message}`);
        }
        
        const totalWebsiteUrls = sitemapUrls.length || 0;
        const coveragePercent = totalWebsiteUrls > 0 
            ? ((totalCrawledUrls / totalWebsiteUrls) * 100).toFixed(1)
            : 'N/A';
        
        console.log(`📈 Website-URLs (aus Sitemap/Navigation): ${totalWebsiteUrls}`);
        console.log(`📊 Abdeckung: ${coveragePercent}%`);
        
        // 1.3 Fehlende Bereiche identifizieren
        const missingCategories = [];
        const websiteCategories = new Set();
        
        sitemapUrls.forEach(url => {
            const match = url.match(/\/[^\/]+\/([^\/]+)/);
            if (match) {
                websiteCategories.add(match[1]);
            }
        });
        
        // Bekannte Kategorien, die fehlen könnten
        const expectedCategories = [
            'bildung', 'gesundheit', 'umwelt', 'veterinär', 'wahlen', 
            'katastrophenschutz', 'kultur', 'bibliothek', 'schulen'
        ];
        
        expectedCategories.forEach(cat => {
            const found = Array.from(websiteCategories).some(wc => 
                wc.includes(cat) || cat.includes(wc)
            );
            if (!found && sitemapUrls.some(url => url.includes(cat))) {
                missingCategories.push(cat);
            }
        });
        
        console.log(`\n⚠️  Potenzielle fehlende Kategorien: ${missingCategories.length > 0 ? missingCategories.join(', ') : 'Keine gefunden'}`);
        
        // 1.4 Content-Qualität prüfen
        const processedDir = path.join(__dirname, '../data/processed');
        const processedFiles = await fs.readdir(processedDir);
        const latestDataFile = processedFiles
            .filter(f => f.startsWith('all_agents_data_') && f.endsWith('.json'))
            .sort()
            .reverse()[0];
        
        let qualityStats = { total: 0, withContent: 0, withText: 0, withLinks: 0, empty: 0 };
        
        if (latestDataFile) {
            const data = await fs.readJson(path.join(processedDir, latestDataFile));
            
            Object.values(data).forEach(agentData => {
                if (Array.isArray(agentData)) {
                    agentData.forEach(entry => {
                        qualityStats.total++;
                        if (entry.content && entry.content.trim()) qualityStats.withContent++;
                        if (entry.plain_text && entry.plain_text.trim()) qualityStats.withText++;
                        if (entry.links && entry.links.length > 0) qualityStats.withLinks++;
                        if (!entry.content && !entry.plain_text) qualityStats.empty++;
                    });
                }
            });
        }
        
        const contentQuality = qualityStats.total > 0 
            ? ((qualityStats.withContent / qualityStats.total) * 100).toFixed(1)
            : 0;
        
        console.log(`\n📝 Content-Qualität:`);
        console.log(`   - Einträge mit Content: ${qualityStats.withContent}/${qualityStats.total} (${contentQuality}%)`);
        console.log(`   - Einträge mit Plain-Text: ${qualityStats.withText}/${qualityStats.total}`);
        console.log(`   - Einträge mit Links: ${qualityStats.withLinks}/${qualityStats.total}`);
        console.log(`   - Leere Einträge: ${qualityStats.empty}/${qualityStats.total}`);
        
        this.results.crawler = {
            totalCrawledUrls,
            totalWebsiteUrls,
            coveragePercent,
            agentUrls,
            missingCategories,
            qualityStats,
            contentQuality
        };
        
        console.log('');
    }

    async auditAgents() {
        console.log('🤖 2. AGENT-PRÜFUNG');
        console.log('━'.repeat(60));
        
        const agentConfigs = {};
        const agentKeywords = {};
        const responseGenerators = {};
        
        // Lade Character Handler für Routing-Analyse
        const characterHandlerPath = path.join(__dirname, '../../server/kaya_character_handler_v2.js');
        const handlerCode = await fs.readFile(characterHandlerPath, 'utf-8');
        
        // Extrahiere Agent-Routing-Logik
        const routingMatch = handlerCode.match(/const agentRouting = \{([\s\S]*?)\};/);
        if (routingMatch) {
            const routingBlock = routingMatch[1];
            this.crawlerEngine.agents.forEach(agent => {
                const regex = new RegExp(`(['"])?${agent.replace(/_/g, '[_]')}(['"])?\\s*:`, 'g');
                const matches = routingBlock.match(regex);
                if (matches) {
                    agentKeywords[agent] = matches.length;
                }
            });
        }
        
        // Prüfe Response-Generatoren
        this.crawlerEngine.agents.forEach(agent => {
            const generatorMatch = handlerCode.match(new RegExp(`generate${agent.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Response`));
            responseGenerators[agent] = !!generatorMatch;
            
            const config = this.crawlerEngine.getAgentConfig(agent);
            agentConfigs[agent] = {
                webSources: (config.webSources || []).length,
                fileSources: (config.fileSources || []).length,
                pdfSources: (config.pdfSources || []).length
            };
        });
        
        // Fehlende Agenten basierend auf AGENT_PERSONA_ANALYSIS.md
        const expectedAgents = [
            'bildung', 'gesundheit', 'verkehr', 'tierhaltung', 
            'wahlen', 'kultur', 'umwelt', 'katastrophenschutz'
        ];
        const missingAgents = expectedAgents.filter(ea => 
            !this.crawlerEngine.agents.some(a => a.includes(ea))
        );
        
        // Agent-Überlappungen
        const overlaps = [];
        if (this.crawlerEngine.agents.includes('politik') && 
            this.crawlerEngine.agents.includes('politik_landkreis')) {
            overlaps.push({ agents: ['politik', 'politik_landkreis'], reason: 'Ähnliche Themen' });
        }
        
        console.log(`✅ Implementierte Agenten: ${this.crawlerEngine.agents.length}`);
        console.log(`⚠️  Fehlende Agenten: ${missingAgents.length > 0 ? missingAgents.join(', ') : 'Keine'}`);
        console.log(`⚠️  Überlappungen: ${overlaps.length > 0 ? overlaps.map(o => o.agents.join(' ↔ ')).join(', ') : 'Keine'}`);
        
        const agentsWithoutGenerators = this.crawlerEngine.agents.filter(a => !responseGenerators[a]);
        console.log(`⚠️  Agenten ohne Response-Generator: ${agentsWithoutGenerators.length > 0 ? agentsWithoutGenerators.join(', ') : 'Keine'}`);
        
        this.results.agents = {
            total: this.crawlerEngine.agents.length,
            agentConfigs,
            agentKeywords,
            responseGenerators,
            missingAgents,
            overlaps,
            agentsWithoutGenerators
        };
        
        console.log('');
    }

    async auditPersonas() {
        console.log('👥 3. PERSONA-PRÜFUNG');
        console.log('━'.repeat(60));
        
        const handlerPath = path.join(__dirname, '../../server/kaya_character_handler_v2.js');
        const handlerCode = await fs.readFile(handlerPath, 'utf-8');
        
        // Extrahiere Persona-Definitionen
        const personaMatch = handlerCode.match(/const personas = \{([\s\S]*?)\};/);
        const personas = {};
        
        if (personaMatch) {
            const personaBlock = personaMatch[1];
            const personaRegex = /(\w+):\s*\[(.*?)\]/g;
            let match;
            while ((match = personaRegex.exec(personaBlock)) !== null) {
                const personaType = match[1];
                const keywords = match[2].split(',').map(k => k.trim().replace(/['"]/g, ''));
                personas[personaType] = keywords;
            }
        }
        
        const totalPersonas = Object.keys(personas).length;
        console.log(`✅ Definiert Personas: ${totalPersonas}`);
        
        // Mappe Personas zu Agenten
        const personaAgentMapping = {};
        const unmappedPersonas = [];
        
        Object.keys(personas).forEach(personaType => {
            const keywords = personas[personaType];
            let mappedAgent = null;
            
            // Einfache Keyword-basierte Zuordnung
            this.crawlerEngine.agents.forEach(agent => {
                const agentKeywords = ['jugend', 'soziales', 'jobcenter', 'wirtschaft', 
                                       'buergerdienste', 'stellenportal', 'senioren'];
                if (agentKeywords.some(ak => agent.includes(ak) || keywords.some(k => k.includes(ak)))) {
                    mappedAgent = agent;
                }
            });
            
            if (mappedAgent) {
                personaAgentMapping[personaType] = mappedAgent;
            } else {
                unmappedPersonas.push(personaType);
            }
        });
        
        console.log(`✅ Personas mit Agent-Zuordnung: ${Object.keys(personaAgentMapping).length}`);
        console.log(`⚠️  Personas ohne Agent: ${unmappedPersonas.length > 0 ? unmappedPersonas.slice(0, 10).join(', ') + (unmappedPersonas.length > 10 ? ` (+${unmappedPersonas.length - 10} weitere)` : '') : 'Keine'}`);
        
        // Prüfe kritische Personas
        const criticalPersonas = ['migrant', 'child', 'care_dependent', 'low_education'];
        const criticalUnmapped = criticalPersonas.filter(cp => unmappedPersonas.includes(cp));
        console.log(`🚨 Kritische Personas ohne Agent: ${criticalUnmapped.length > 0 ? criticalUnmapped.join(', ') : 'Keine'}`);
        
        this.results.personas = {
            total: totalPersonas,
            personas,
            personaAgentMapping,
            unmappedPersonas,
            criticalUnmapped
        };
        
        console.log('');
    }

    async auditLanguages() {
        console.log('🌐 4. SPRACH-PRÜFUNG');
        console.log('━'.repeat(60));
        
        // Prüfe beide Character Handler
        const handlerV2Path = path.join(__dirname, '../../server/kaya_character_handler_v2.js');
        const handlerOldPath = path.join(__dirname, '../../server/kaya_character_handler.js');
        
        const handlerV2Code = await fs.readFile(handlerV2Path, 'utf-8');
        const handlerOldCode = fs.existsSync(handlerOldPath) 
            ? await fs.readFile(handlerOldPath, 'utf-8') 
            : '';
        
        // Extrahiere unterstützte Sprachen
        const languagesV2 = [];
        const languagesOld = [];
        
        // V2: Deutsch/Englisch
        if (handlerV2Code.includes('germanIndicators')) languagesV2.push('german', 'english');
        
        // Old: Viele Sprachen
        if (handlerOldCode.includes('turkishWords')) {
            languagesOld.push('german', 'english', 'turkish', 'arabic', 'polish', 
                            'russian', 'romanian', 'ukrainian', 'dutch', 'danish', 'plattdeutsch');
        }
        
        console.log(`✅ Sprachen in v2 Handler: ${languagesV2.length > 0 ? languagesV2.join(', ') : 'Nur Deutsch'}`);
        console.log(`✅ Sprachen in altem Handler: ${languagesOld.length > 0 ? languagesOld.join(', ') : 'Keine'}`);
        
        // Welcher Handler wird verwendet?
        const serverCode = await fs.readFile(path.join(__dirname, '../../server/kaya_server.js'), 'utf-8');
        const usesV2 = serverCode.includes('kaya_character_handler_v2');
        const usesOld = serverCode.includes('kaya_character_handler.js') && !usesV2;
        
        console.log(`📌 Aktiver Handler: ${usesV2 ? 'v2' : usesOld ? 'old' : 'unbekannt'}`);
        
        // Plattdeutsch-Support
        const hasPlattdeutsch = handlerV2Code.includes('plattdeutsch') || handlerOldCode.includes('plattdeutsch');
        console.log(`✅ Plattdeutsch-Support: ${hasPlattdeutsch ? 'Ja' : 'Nein'}`);
        
        this.results.languages = {
            supportedV2: languagesV2,
            supportedOld: languagesOld,
            activeHandler: usesV2 ? 'v2' : usesOld ? 'old' : 'unknown',
            hasPlattdeutsch,
            isMultilingual: languagesV2.length > 2 || languagesOld.length > 2
        };
        
        console.log('');
    }

    async generateReport() {
        console.log('📄 5. REPORT GENERIEREN');
        console.log('━'.repeat(60));
        
        const reportPath = path.join(__dirname, '../../SYSTEM_AUDIT_REPORT_2025-10-29.md');
        const report = [];
        
        report.push('# System-Audit-Report KAYA Bot');
        report.push(`**Datum:** ${new Date().toLocaleDateString('de-DE')}`);
        report.push(`**Version:** 1.0.0\n`);
        report.push('---\n');
        
        // 1. Crawler-Abdeckung
        report.push('## 1. CRAWLER-ABDECKUNG\n');
        report.push(`- **Gecrawlte URLs:** ${this.results.crawler.totalCrawledUrls}`);
        report.push(`- **Website-URLs (Sitemap):** ${this.results.crawler.totalWebsiteUrls}`);
        report.push(`- **Abdeckung:** ${this.results.crawler.coveragePercent}%\n`);
        
        if (this.results.crawler.missingCategories.length > 0) {
            report.push('### Fehlende Kategorien:');
            this.results.crawler.missingCategories.forEach(cat => {
                report.push(`- ${cat}`);
            });
            report.push('');
        }
        
        report.push(`### Content-Qualität:`);
        report.push(`- Einträge mit Content: ${this.results.crawler.qualityStats.withContent}/${this.results.crawler.qualityStats.total} (${this.results.crawler.contentQuality}%)`);
        report.push(`- Leere Einträge: ${this.results.crawler.qualityStats.empty}/${this.results.crawler.qualityStats.total}\n`);
        
        // 2. Agent-Vollständigkeit
        report.push('## 2. AGENT-VOLLSTÄNDIGKEIT\n');
        report.push(`- **Implementierte Agenten:** ${this.results.agents.total}`);
        report.push(`- **Agenten ohne Response-Generator:** ${this.results.agents.agentsWithoutGenerators.length}`);
        
        if (this.results.agents.missingAgents.length > 0) {
            report.push('\n### Fehlende Agenten:');
            this.results.agents.missingAgents.forEach(agent => {
                report.push(`- ${agent}`);
            });
            report.push('');
        }
        
        if (this.results.agents.overlaps.length > 0) {
            report.push('\n### Überlappungen:');
            this.results.agents.overlaps.forEach(overlap => {
                report.push(`- ${overlap.agents.join(' ↔ ')}`);
            });
            report.push('');
        }
        
        // 3. Persona-Coverage
        report.push('## 3. PERSONA-COVERAGE\n');
        report.push(`- **Definierte Personas:** ${this.results.personas.total}`);
        report.push(`- **Personas mit Agent-Zuordnung:** ${Object.keys(this.results.personas.personaAgentMapping).length}`);
        report.push(`- **Personas ohne Agent:** ${this.results.personas.unmappedPersonas.length}`);
        
        if (this.results.personas.criticalUnmapped.length > 0) {
            report.push('\n### 🚨 Kritische Personas ohne Agent:');
            this.results.personas.criticalUnmapped.forEach(p => {
                report.push(`- ${p}`);
            });
            report.push('');
        }
        
        // 4. Sprach-Support
        report.push('## 4. SPRACH-SUPPORT\n');
        report.push(`- **Aktiver Handler:** ${this.results.languages.activeHandler}`);
        report.push(`- **Unterstützte Sprachen (v2):** ${this.results.languages.supportedV2.join(', ') || 'Nur Deutsch'}`);
        report.push(`- **Unterstützte Sprachen (alt):** ${this.results.languages.supportedOld.join(', ') || 'Keine'}`);
        report.push(`- **Plattdeutsch:** ${this.results.languages.hasPlattdeutsch ? 'Ja' : 'Nein'}\n`);
        
        // 5. Empfehlungen
        report.push('## 5. EMPFEHLUNGEN\n');
        
        // Priorität Hoch
        report.push('### Priorität: Hoch\n');
        if (this.results.personas.criticalUnmapped.length > 0) {
            report.push(`- **Neue Agenten für kritische Personas:** ${this.results.personas.criticalUnmapped.join(', ')}`);
        }
        if (this.results.agents.missingAgents.length > 0) {
            report.push(`- **Fehlende Agenten implementieren:** ${this.results.agents.missingAgents.slice(0, 3).join(', ')}`);
        }
        if (parseFloat(this.results.crawler.contentQuality) < 70) {
            report.push('- **Content-Extraktion verbessern:** Aktuell nur ' + this.results.crawler.contentQuality + '% der Einträge haben Content');
        }
        report.push('');
        
        // Priorität Mittel
        report.push('### Priorität: Mittel\n');
        if (this.results.crawler.missingCategories.length > 0) {
            report.push(`- **Crawler erweitern:** Fehlende Kategorien ${this.results.crawler.missingCategories.slice(0, 3).join(', ')} crawlen`);
        }
        if (this.results.agents.agentsWithoutGenerators.length > 0) {
            report.push(`- **Response-Generatoren:** Für ${this.results.agents.agentsWithoutGenerators.length} Agenten erstellen`);
        }
        if (!this.results.languages.isMultilingual && this.results.languages.supportedOld.length > 2) {
            report.push('- **Sprach-Support:** v2 Handler erweitern (altes Handler hat mehr Sprachen)');
        }
        report.push('');
        
        // Priorität Niedrig
        report.push('### Priorität: Niedrig\n');
        if (this.results.agents.overlaps.length > 0) {
            report.push('- **Agent-Überlappungen reduzieren:** Routing-Logik optimieren');
        }
        report.push('- **Persona-Keywords verfeinern:** Bessere Erkennung für alle Personas');
        report.push('');
        
        await fs.writeFile(reportPath, report.join('\n'), 'utf-8');
        console.log(`✅ Report gespeichert: ${reportPath}`);
    }
}

// Main
(async () => {
    const audit = new SystemAudit();
    await audit.runFullAudit();
    console.log('\n✅ Systemprüfung abgeschlossen!');
    process.exit(0);
})().catch(error => {
    console.error('❌ Fehler:', error);
    process.exit(1);
});



