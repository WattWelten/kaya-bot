const fs = require('fs-extra');
const path = require('path');
const DataProcessor = require('../src/processors/DataProcessor');

class LinkValidator {
    constructor() {
        this.dataProcessor = new DataProcessor();
        this.processedDir = path.join(__dirname, '..', 'data', 'processed');
    }

    async validateAllLinks() {
        console.log('🔍 LINK-VALIDIERUNG\n');
        console.log('━'.repeat(70));

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
        
        const stats = {
            total: 0,
            validated: 0,
            valid: 0,
            invalid: 0,
            byAgent: {}
        };

        // Validiere Links für jeden Agent
        for (const [agentName, agentData] of Object.entries(data)) {
            if (!Array.isArray(agentData)) continue;

            const agentStats = {
                total: 0,
                valid: 0,
                invalid: 0,
                forms: { total: 0, valid: 0, invalid: 0 },
                links: { total: 0, valid: 0, invalid: 0 }
            };

            // Validiere Daten
            const validatedData = await this.dataProcessor.validateLinks(agentData);
            
            for (const entry of validatedData) {
                // Formulare
                if (entry.forms && Array.isArray(entry.forms)) {
                    for (const form of entry.forms) {
                        agentStats.forms.total++;
                        stats.total++;
                        if (form.valid === true) {
                            agentStats.forms.valid++;
                            stats.valid++;
                        } else if (form.valid === false) {
                            agentStats.forms.invalid++;
                            stats.invalid++;
                        }
                    }
                }

                // Links
                if (entry.links && Array.isArray(entry.links)) {
                    for (const link of entry.links) {
                        agentStats.links.total++;
                        stats.total++;
                        if (link.valid === true) {
                            agentStats.links.valid++;
                            stats.valid++;
                        } else if (link.valid === false) {
                            agentStats.links.invalid++;
                            stats.invalid++;
                        }
                    }
                }
            }

            stats.validated += agentStats.total;
            stats.byAgent[agentName] = agentStats;
        }

        // Ausgabe
        console.log('📊 LINK-VALIDIERUNGS-STATISTIKEN:\n');
        
        const validationRate = stats.total > 0 
            ? ((stats.validated / stats.total) * 100).toFixed(1)
            : '0.0';
        
        const validRate = stats.validated > 0
            ? ((stats.valid / stats.validated) * 100).toFixed(1)
            : '0.0';

        console.log(`   Gesamt Links/Formulare:  ${stats.total.toLocaleString()}`);
        console.log(`   Validiert:              ${stats.validated.toLocaleString()} (${validationRate}%)`);
        console.log(`   Gültig:                 ${stats.valid.toLocaleString()} (${validRate}%)`);
        console.log(`   Ungültig:               ${stats.invalid.toLocaleString()} (${((stats.invalid / stats.validated) * 100).toFixed(1)}%)`);
        console.log(`\n   Nicht validiert:         ${(stats.total - stats.validated).toLocaleString()} (${((stats.total - stats.validated) / stats.total * 100).toFixed(1)}%)`);

        console.log('\n━'.repeat(70));
        console.log('📊 STATISTIKEN PRO AGENT:\n');

        for (const [agentName, agentStats] of Object.entries(stats.byAgent)) {
            const total = agentStats.links.total + agentStats.forms.total;
            const valid = agentStats.links.valid + agentStats.forms.valid;
            const invalid = agentStats.links.invalid + agentStats.forms.invalid;
            const validRate = total > 0 ? ((valid / total) * 100).toFixed(1) : '0.0';
            
            const icon = parseFloat(validRate) >= 95 ? '✅' : parseFloat(validRate) >= 80 ? '⚠️' : '❌';
            
            console.log(`${icon} ${agentName.padEnd(25)} | Links: ${agentStats.links.valid}/${agentStats.links.total} | Forms: ${agentStats.forms.valid}/${agentStats.forms.total} | Gültig: ${validRate}%`);
        }

        // Speichere validierte Daten
        const validatedFilePath = path.join(this.processedDir, latestFile.replace('.json', '_validated.json'));
        await fs.writeJson(validatedFilePath, data, { spaces: 2 });
        console.log(`\n💾 Validierte Daten gespeichert: ${path.basename(validatedFilePath)}`);

        // Speichere Report
        const reportPath = path.join(__dirname, '..', 'data', `link_validation_report_${latestFile.match(/\d{4}-\d{2}-\d{2}/)[0]}.json`);
        await fs.writeJson(reportPath, {
            date: new Date().toISOString(),
            file: latestFile,
            stats: stats
        }, { spaces: 2 });
        console.log(`💾 Report gespeichert: ${path.basename(reportPath)}`);

        return stats;
    }
}

// Main
(async () => {
    try {
        const validator = new LinkValidator();
        const stats = await validator.validateAllLinks();
        
        console.log('\n━'.repeat(70));
        if (stats.invalid > 0) {
            console.log(`⚠️  ${stats.invalid} ungültige Links gefunden! Bitte prüfen.`);
        } else {
            console.log('✅ Alle Links sind gültig!');
        }
        
    } catch (error) {
        console.error('❌ Fehler:', error);
        process.exit(1);
    }
})();



