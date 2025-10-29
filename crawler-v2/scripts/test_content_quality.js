const fs = require('fs-extra');
const path = require('path');

class ContentQualityValidator {
    constructor() {
        this.processedDir = path.join(__dirname, '..', 'data', 'processed');
    }

    async analyze() {
        console.log('📊 CONTENT-QUALITÄT-ANALYSE\n');

        // Finde neueste all_agents_data Datei
        const files = await fs.readdir(this.processedDir);
        const dataFiles = files.filter(f => f.startsWith('all_agents_data_') && f.endsWith('.json'));
        if (dataFiles.length === 0) {
            console.error('❌ Keine processed Daten gefunden!');
            return;
        }

        const latestFile = dataFiles.sort().reverse()[0];
        const filePath = path.join(this.processedDir, latestFile);
        console.log(`📁 Analysiere: ${latestFile}\n`);

        const data = await fs.readJson(filePath);
        
        const agentStats = {};
        let globalStats = { total: 0, withContent: 0, withText: 0, withLinks: 0, empty: 0, sections: 0, articles: 0, headings: 0 };

        // Analysiere jeden Agent
        for (const [agentName, agentData] of Object.entries(data)) {
            if (!Array.isArray(agentData)) continue;

            const stats = {
                total: 0,
                withContent: 0,
                withText: 0,
                withLinks: 0,
                empty: 0,
                sections: 0,
                articles: 0,
                headings: 0,
                contentLength: { total: 0, count: 0, min: Infinity, max: 0 }
            };

            agentData.forEach(entry => {
                stats.total++;
                globalStats.total++;

                // Content-Checks
                const hasContent = entry.content && entry.content.trim().length > 0;
                const hasPlainText = entry.plain_text && entry.plain_text.trim().length > 0;
                const hasLinks = entry.links && entry.links.length > 0;

                if (hasContent) {
                    stats.withContent++;
                    globalStats.withContent++;
                    const contentLen = entry.content.trim().length;
                    stats.contentLength.total += contentLen;
                    stats.contentLength.count++;
                    stats.contentLength.min = Math.min(stats.contentLength.min, contentLen);
                    stats.contentLength.max = Math.max(stats.contentLength.max, contentLen);
                }
                if (hasPlainText) {
                    stats.withText++;
                    globalStats.withText++;
                }
                if (hasLinks) {
                    stats.withLinks++;
                    globalStats.withLinks++;
                }
                if (!hasContent && !hasPlainText) {
                    stats.empty++;
                    globalStats.empty++;
                }

                // Struktur-Typen (aus metadata.sectionType oder direkt)
                const sectionType = entry.metadata?.sectionType || entry.sectionType;
                if (sectionType === 'article') {
                    stats.articles++;
                    globalStats.articles++;
                } else if (sectionType === 'section') {
                    stats.sections++;
                    globalStats.sections++;
                } else if (sectionType === 'heading') {
                    stats.headings++;
                    globalStats.headings++;
                }
            });

            agentStats[agentName] = stats;
        }

        // Ausgabe
        console.log('━'.repeat(70));
        console.log('📈 GLOBALE STATISTIKEN:\n');
        
        const contentQuality = globalStats.total > 0 
            ? ((globalStats.withContent / globalStats.total) * 100).toFixed(1)
            : '0.0';
        
        const avgContentLength = globalStats.withContent > 0
            ? (globalStats.withContent > 0 ? (globalStats.total > 0 ? (globalStats.withContent * 100 / globalStats.total).toFixed(0) : 0) : 0)
            : 0;

        console.log(`   Gesamt Einträge:        ${globalStats.total.toLocaleString()}`);
        console.log(`   Mit Content:           ${globalStats.withContent.toLocaleString()} (${contentQuality}%)`);
        console.log(`   Mit Plain-Text:        ${globalStats.withText.toLocaleString()}`);
        console.log(`   Mit Links:             ${globalStats.withLinks.toLocaleString()}`);
        console.log(`   Leer:                  ${globalStats.empty.toLocaleString()} (${((globalStats.empty / globalStats.total) * 100).toFixed(1)}%)`);
        console.log(`\n   Struktur-Typen:`);
        console.log(`   - Articles:            ${globalStats.articles.toLocaleString()}`);
        console.log(`   - Sections:            ${globalStats.sections.toLocaleString()}`);
        console.log(`   - Headings:            ${globalStats.headings.toLocaleString()}`);

        console.log('\n━'.repeat(70));
        console.log('📊 STATISTIKEN PRO AGENT:\n');

        // Sortiere nach Content-Qualität
        const sortedAgents = Object.entries(agentStats).sort((a, b) => {
            const qualityA = a[1].total > 0 ? (a[1].withContent / a[1].total) : 0;
            const qualityB = b[1].total > 0 ? (b[1].withContent / b[1].total) : 0;
            return qualityB - qualityA;
        });

        for (const [agentName, stats] of sortedAgents) {
            const quality = stats.total > 0 
                ? ((stats.withContent / stats.total) * 100).toFixed(1)
                : '0.0';
            
            const avgLen = stats.contentLength.count > 0
                ? Math.round(stats.contentLength.total / stats.contentLength.count)
                : 0;

            const icon = parseFloat(quality) >= 80 ? '✅' : parseFloat(quality) >= 50 ? '⚠️' : '❌';
            
            console.log(`${icon} ${agentName.padEnd(25)} | ${quality.padStart(6)}% | ${stats.total.toString().padStart(5)} Einträge | Avg: ${avgLen.toLocaleString()} Zeichen`);
        }

        // Beispiele für gute Content-Einträge
        console.log('\n━'.repeat(70));
        console.log('💡 BEISPIEL-CONTENT (Top 5 nach Länge):\n');

        const contentExamples = [];
        for (const [agentName, agentData] of Object.entries(data)) {
            if (!Array.isArray(agentData)) continue;
            agentData.forEach(entry => {
                if (entry.content && entry.content.trim().length > 200) {
                    const sectionType = entry.metadata?.sectionType || entry.sectionType || 'unknown';
                    contentExamples.push({
                        agent: agentName,
                        title: entry.title || 'Ohne Titel',
                        url: entry.url || entry.source || 'N/A',
                        length: entry.content.trim().length,
                        sectionType: sectionType,
                        preview: entry.content.trim().substring(0, 150) + '...'
                    });
                }
            });
        }

        contentExamples.sort((a, b) => b.length - a.length).slice(0, 5).forEach((ex, i) => {
            console.log(`${i + 1}. [${ex.agent}] ${ex.title}`);
            console.log(`   URL: ${ex.url}`);
            console.log(`   Typ: ${ex.sectionType} | Länge: ${ex.length.toLocaleString()} Zeichen`);
            console.log(`   Preview: ${ex.preview}\n`);
        });

        // Zusammenfassung
        console.log('━'.repeat(70));
        console.log('📋 ZUSAMMENFASSUNG:\n');
        
        const targetQuality = 80;
        const currentQuality = parseFloat(contentQuality);
        
        if (currentQuality >= targetQuality) {
            console.log(`✅ Content-Qualität erreicht: ${currentQuality}% >= ${targetQuality}%`);
        } else {
            const improvement = targetQuality - currentQuality;
            console.log(`⚠️  Content-Qualität unter Ziel: ${currentQuality}% < ${targetQuality}%`);
            console.log(`   Benötigte Verbesserung: +${improvement.toFixed(1)}% (${Math.round(globalStats.empty * improvement / 100).toLocaleString()} Einträge)`);
        }

        return {
            globalStats,
            agentStats,
            contentQuality: parseFloat(contentQuality),
            targetQuality: 80,
            examples: contentExamples.slice(0, 5)
        };
    }
}

// Main
(async () => {
    try {
        const validator = new ContentQualityValidator();
        const results = await validator.analyze();
        
        // Speichere Ergebnisse
        const reportPath = path.join(__dirname, '..', 'data', `content_quality_report_${new Date().toISOString().split('T')[0]}.json`);
        await fs.writeJson(reportPath, results, { spaces: 2 });
        console.log(`\n💾 Report gespeichert: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Fehler:', error);
        process.exit(1);
    }
})();

