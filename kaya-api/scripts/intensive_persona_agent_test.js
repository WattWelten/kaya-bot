const KAYACharacterHandler = require('../kaya_character_handler_v2');
const KAYAAgentManager = require('../kaya_agent_manager_v2');

class IntensivePersonaAgentTest {
    constructor() {
        this.characterHandler = new KAYACharacterHandler();
        this.agentManager = new KAYAAgentManager();
        this.results = [];
        this.statistics = {
            totalTests: 0,
            successfulRoutings: 0,
            failedRoutings: 0,
            responseTimes: [],
            agentDistribution: {},
            personaDistribution: {},
            errors: []
        };
    }

    // Test-Cases definieren
    getTestCases() {
        return [
            // Fokus: Landrat / politik_landkreis
            { query: "Wer ist der Landrat?", expectedAgent: "politik_landkreis", personas: ["political_interested", "general", "senior"] },
            { query: "Dr. Christian Pundt", expectedAgent: "politik_landkreis", personas: ["political_interested", "general"] },
            { query: "Kreistagsmitglieder", expectedAgent: "politik_landkreis", personas: ["political_interested", "general"] },
            { query: "Kreisorgane", expectedAgent: "politik_landkreis", personas: ["political_interested"] },
            { query: "Landrat Kontakt", expectedAgent: "politik_landkreis", personas: ["general"] },

            // Fokus: XRechnung / rechnung_ebilling
            { query: "XRechnung senden", expectedAgent: "rechnung_ebilling", personas: ["entrepreneur", "small_business", "general"] },
            { query: "E-Rechnung Landkreis Oldenburg", expectedAgent: "rechnung_ebilling", personas: ["entrepreneur", "small_business"] },
            { query: "Leitweg-ID 03458-0-051", expectedAgent: "rechnung_ebilling", personas: ["small_business", "general"] },
            { query: "eBilling", expectedAgent: "rechnung_ebilling", personas: ["entrepreneur"] },
            { query: "XRechnung", expectedAgent: "rechnung_ebilling", personas: ["general"] },

            // buergerdienste
            { query: "KFZ anmelden", expectedAgent: "buergerdienste", personas: ["general", "migrant", "commuter"] },
            { query: "Personalausweis beantragen", expectedAgent: "buergerdienste", personas: ["general", "migrant", "housing_seeker"] },

            // ratsinfo
            { query: "Kreistagssitzung", expectedAgent: "ratsinfo", personas: ["political_interested", "general"] },
            { query: "Tagesordnung", expectedAgent: "ratsinfo", personas: ["political_interested"] },

            // stellenportal
            { query: "Stellenangebote", expectedAgent: "stellenportal", personas: ["unemployed", "student", "general"] },
            { query: "Bewerbung", expectedAgent: "stellenportal", personas: ["unemployed", "student"] },

            // kontakte
            { query: "Kontakt Landkreis", expectedAgent: "kontakte", personas: ["general", "migrant"] },
            { query: "Telefonnummer", expectedAgent: "kontakte", personas: ["general"] },

            // jugend
            { query: "Jugendamt", expectedAgent: "jugend", personas: ["youth", "family", "single_parent"] },
            { query: "Kindergeld", expectedAgent: "jugend", personas: ["family", "single_parent"] },

            // soziales
            { query: "Sozialhilfe", expectedAgent: "soziales", personas: ["unemployed", "low_income", "senior"] },
            { query: "Bürgergeld", expectedAgent: "soziales", personas: ["unemployed", "low_income"] },

            // politik
            { query: "Politik im Landkreis", expectedAgent: "politik_landkreis", personas: ["political_interested"] },

            // jobcenter
            { query: "Arbeitslosengeld", expectedAgent: "jobcenter", personas: ["unemployed", "unemployed_longterm"] },

            // wirtschaft
            { query: "Gewerbe anmelden", expectedAgent: "buergerdienste", personas: ["entrepreneur", "small_business"] },

            // ordnungsamt
            { query: "Ordnungsamt", expectedAgent: "buergerdienste", personas: ["general"] },

            // senioren
            { query: "Seniorenbetreuung", expectedAgent: "senioren", personas: ["senior", "pensioner"] },

            // inklusion
            { query: "Inklusion", expectedAgent: "inklusion", personas: ["disabled", "disabled_worker"] },

            // digitalisierung
            { query: "Digitalisierung", expectedAgent: "digitalisierung", personas: ["general"] },

            // gleichstellung
            { query: "Gleichstellung", expectedAgent: "gleichstellung", personas: ["general"] },

            // aktionen_veranstaltungen
            { query: "Aktion Saubere Landschaft", expectedAgent: "aktionen_veranstaltungen", personas: ["tourist", "culture_interested"] },
            { query: "Veranstaltungen", expectedAgent: "aktionen_veranstaltungen", personas: ["tourist", "culture_interested"] },

            // Zusätzliche Edge-Cases
            { query: "Bauantrag stellen", expectedAgent: "buergerdienste", personas: ["general", "housing_seeker"] },
            { query: "Jugendliche", expectedAgent: "jugend", personas: ["youth"] },
            { query: "Plattdeutsch", expectedAgent: "buergerdienste", personas: ["plattdeutsch_speaker"] },
            { query: "Bildung lernen", expectedAgent: "buergerdienste", personas: ["low_education"] },
            { query: "Wohnung suchen", expectedAgent: "buergerdienste", personas: ["housing_seeker"] },
            { query: "Pendler", expectedAgent: "buergerdienste", personas: ["commuter"] },
            { query: "Migrant Hilfe", expectedAgent: "buergerdienste", personas: ["migrant"] },
        ];
    }

    // Warte auf AgentManager-Initialisierung
    async waitForInitialization() {
        let attempts = 0;
        while (attempts < 10) {
            if (this.agentManager.agents.size > 0) {
                console.log(`✅ AgentManager initialisiert: ${this.agentManager.agents.size} Agenten geladen`);
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        console.log('⚠️ AgentManager nicht vollständig initialisiert, aber fortfahren...');
        return false;
    }

    // Einzelnen Test durchführen
    async runTest(testCase, personaType) {
        const startTime = Date.now();
        const testId = `${testCase.query}_${personaType}`;
        const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Session Context simulieren
            const sessionContext = {
                previousIntention: null,
                conversationHistory: []
            };

            // Persona-Analyse
            const personaAnalysis = this.characterHandler.analyzePersona(testCase.query, sessionContext);

            // Intention-Analyse
            const intentionAnalysis = this.characterHandler.analyzeIntention(testCase.query, sessionContext);

            // Agent-Routing
            const routingResult = await this.agentManager.routeToAgent(
                testCase.query,
                sessionId,
                sessionContext,
                intentionAnalysis,
                personaAnalysis
            );

            const responseTime = Date.now() - startTime;

            // Response generieren (vollständig)
            const fullResponse = await this.characterHandler.generateResponse(
                testCase.query,
                'user',
                sessionId
            );

            const result = {
                testId,
                query: testCase.query,
                personaType,
                expectedAgent: testCase.expectedAgent,
                actualAgent: routingResult.agent,
                responseAgent: fullResponse.agent || routingResult.agent,
                routingSuccess: routingResult.agent === testCase.expectedAgent,
                responseTime,
                hasResponse: !!fullResponse.response && fullResponse.response.length > 0,
                responseLength: fullResponse.response ? fullResponse.response.length : 0,
                confidence: routingResult.confidence || 0,
                dataCount: routingResult.dataCount || 0,
                personaDetected: personaAnalysis.persona.type,
                intentionDetected: intentionAnalysis.intention,
                response: fullResponse.response ? fullResponse.response.substring(0, 200) + '...' : 'Keine Response'
            };

            // Statistiken aktualisieren
            this.statistics.totalTests++;
            if (result.routingSuccess) {
                this.statistics.successfulRoutings++;
            } else {
                this.statistics.failedRoutings++;
                this.statistics.errors.push({
                    query: testCase.query,
                    expected: testCase.expectedAgent,
                    actual: result.actualAgent,
                    persona: personaType
                });
            }

            this.statistics.responseTimes.push(responseTime);
            this.statistics.agentDistribution[result.actualAgent] = (this.statistics.agentDistribution[result.actualAgent] || 0) + 1;
            this.statistics.personaDistribution[personaType] = (this.statistics.personaDistribution[personaType] || 0) + 1;

            return result;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.statistics.totalTests++;
            this.statistics.failedRoutings++;
            this.statistics.errors.push({
                query: testCase.query,
                error: error.message,
                persona: personaType
            });

            return {
                testId,
                query: testCase.query,
                personaType,
                expectedAgent: testCase.expectedAgent,
                actualAgent: 'ERROR',
                routingSuccess: false,
                responseTime,
                hasResponse: false,
                error: error.message
            };
        }
    }

    // Alle Tests durchführen
    async runAllTests() {
        console.log('🚀 Starte intensiven Persona- und Agent-Test...\n');
        
        await this.waitForInitialization();

        const testCases = this.getTestCases();
        console.log(`📋 ${testCases.length} Test-Cases gefunden\n`);

        let testCounter = 0;
        for (const testCase of testCases) {
            for (const personaType of testCase.personas) {
                testCounter++;
                process.stdout.write(`\r⏳ Test ${testCounter}/${testCases.reduce((sum, tc) => sum + tc.personas.length, 0)}: ${testCase.query.substring(0, 50)}... [${personaType}]`);
                
                const result = await this.runTest(testCase, personaType);
                this.results.push(result);

                // Kleine Pause zwischen Tests
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log('\n\n✅ Alle Tests abgeschlossen!\n');
    }

    // Statistiken berechnen
    calculateStatistics() {
        const avgResponseTime = this.statistics.responseTimes.length > 0
            ? Math.round(this.statistics.responseTimes.reduce((a, b) => a + b, 0) / this.statistics.responseTimes.length)
            : 0;

        const successRate = this.statistics.totalTests > 0
            ? ((this.statistics.successfulRoutings / this.statistics.totalTests) * 100).toFixed(2)
            : 0;

        return {
            ...this.statistics,
            avgResponseTime,
            successRate: parseFloat(successRate),
            minResponseTime: Math.min(...this.statistics.responseTimes),
            maxResponseTime: Math.max(...this.statistics.responseTimes)
        };
    }

    // Report generieren
    generateReport() {
        const stats = this.calculateStatistics();

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: stats.totalTests,
                successfulRoutings: stats.successfulRoutings,
                failedRoutings: stats.failedRoutings,
                successRate: `${stats.successRate}%`,
                avgResponseTime: `${stats.avgResponseTime}ms`,
                minResponseTime: `${stats.minResponseTime}ms`,
                maxResponseTime: `${stats.maxResponseTime}ms`
            },
            agentDistribution: stats.agentDistribution,
            personaDistribution: stats.personaDistribution,
            errors: stats.errors,
            detailedResults: this.results
        };

        return report;
    }

    // Markdown-Report erstellen
    generateMarkdownReport() {
        const stats = this.calculateStatistics();
        const date = new Date().toISOString().split('T')[0];

        let markdown = `# Intensiver Persona- und Agent-Test - Report ${date}\n\n`;
        markdown += `**Datum:** ${new Date().toISOString()}\n`;
        markdown += `**Status:** ✅ Test abgeschlossen\n\n`;
        markdown += `---\n\n`;

        // Zusammenfassung
        markdown += `## Zusammenfassung\n\n`;
        markdown += `| Metrik | Wert |\n`;
        markdown += `|--------|------|\n`;
        markdown += `| Gesamt-Tests | ${stats.totalTests} |\n`;
        markdown += `| Erfolgreiche Routings | ${stats.successfulRoutings} (${stats.successRate}%) |\n`;
        markdown += `| Fehlgeschlagene Routings | ${stats.failedRoutings} |\n`;
        markdown += `| Durchschnittliche Response-Zeit | ${stats.avgResponseTime}ms |\n`;
        markdown += `| Min Response-Zeit | ${stats.minResponseTime}ms |\n`;
        markdown += `| Max Response-Zeit | ${stats.maxResponseTime}ms |\n\n`;

        // Agent-Verteilung
        markdown += `## Agent-Verteilung\n\n`;
        const sortedAgents = Object.entries(stats.agentDistribution)
            .sort((a, b) => b[1] - a[1]);
        markdown += `| Agent | Anzahl |\n`;
        markdown += `|-------|--------|\n`;
        for (const [agent, count] of sortedAgents) {
            markdown += `| ${agent} | ${count} |\n`;
        }
        markdown += `\n`;

        // Persona-Verteilung
        markdown += `## Persona-Verteilung\n\n`;
        const sortedPersonas = Object.entries(stats.personaDistribution)
            .sort((a, b) => b[1] - a[1]);
        markdown += `| Persona | Anzahl |\n`;
        markdown += `|---------|--------|\n`;
        for (const [persona, count] of sortedPersonas) {
            markdown += `| ${persona} | ${count} |\n`;
        }
        markdown += `\n`;

        // Fokus-Ergebnisse: Landrat
        markdown += `## Fokus-Ergebnisse: Landrat / politik_landkreis\n\n`;
        const landratResults = this.results.filter(r => 
            r.query.includes('Landrat') || 
            r.query.includes('Dr. Christian Pundt') || 
            r.query.includes('Kreistagsmitglieder') ||
            r.query.includes('Kreisorgane') ||
            r.expectedAgent === 'politik_landkreis'
        );
        markdown += `| Query | Persona | Erwartet | Tatsächlich | Erfolg |\n`;
        markdown += `|-------|---------|----------|-------------|--------|\n`;
        for (const result of landratResults) {
            markdown += `| ${result.query} | ${result.personaType} | ${result.expectedAgent} | ${result.actualAgent} | ${result.routingSuccess ? '✅' : '❌'} |\n`;
        }
        markdown += `\n`;

        // Fokus-Ergebnisse: XRechnung
        markdown += `## Fokus-Ergebnisse: XRechnung / rechnung_ebilling\n\n`;
        const xrechnungResults = this.results.filter(r => 
            r.query.includes('XRechnung') || 
            r.query.includes('E-Rechnung') || 
            r.query.includes('Leitweg') ||
            r.query.includes('eBilling') ||
            r.expectedAgent === 'rechnung_ebilling'
        );
        markdown += `| Query | Persona | Erwartet | Tatsächlich | Erfolg |\n`;
        markdown += `|-------|---------|----------|-------------|--------|\n`;
        for (const result of xrechnungResults) {
            markdown += `| ${result.query} | ${result.personaType} | ${result.expectedAgent} | ${result.actualAgent} | ${result.routingSuccess ? '✅' : '❌'} |\n`;
        }
        markdown += `\n`;

        // Fehler
        if (stats.errors.length > 0) {
            markdown += `## Fehler und Probleme\n\n`;
            markdown += `| Query | Erwartet | Tatsächlich | Persona | Error |\n`;
            markdown += `|-------|----------|-------------|---------|-------|\n`;
            for (const error of stats.errors.slice(0, 20)) {
                markdown += `| ${error.query || 'N/A'} | ${error.expected || 'N/A'} | ${error.actual || 'N/A'} | ${error.persona || 'N/A'} | ${error.error || 'Routing-Fehler'} |\n`;
            }
            markdown += `\n`;
        }

        // Detaillierte Ergebnisse pro Agent
        markdown += `## Detaillierte Ergebnisse pro Agent\n\n`;
        const agents = [...new Set(this.results.map(r => r.expectedAgent))];
        for (const agent of agents.sort()) {
            const agentResults = this.results.filter(r => r.expectedAgent === agent);
            const successCount = agentResults.filter(r => r.routingSuccess).length;
            const successRate = agentResults.length > 0 
                ? ((successCount / agentResults.length) * 100).toFixed(1)
                : 0;
            
            markdown += `### ${agent} (${successCount}/${agentResults.length} erfolgreich, ${successRate}%)\n\n`;
            markdown += `| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |\n`;
            markdown += `|-------|---------|-------------|--------|----------------|\n`;
            for (const result of agentResults.slice(0, 10)) {
                markdown += `| ${result.query.substring(0, 40)} | ${result.personaType} | ${result.actualAgent} | ${result.routingSuccess ? '✅' : '❌'} | ${result.responseTime}ms |\n`;
            }
            if (agentResults.length > 10) {
                markdown += `| ... | ... | ... | ... | ... |\n`;
            }
            markdown += `\n`;
        }

        // Empfehlungen
        markdown += `## Empfehlungen\n\n`;
        if (stats.successRate < 95) {
            markdown += `⚠️ **Routing-Erfolgsrate unter 95%** - Verbesserung empfohlen\n\n`;
        }
        if (stats.avgResponseTime > 1000) {
            markdown += `⚠️ **Durchschnittliche Response-Zeit über 1s** - Performance-Optimierung empfohlen\n\n`;
        }
        if (stats.errors.length > 0) {
            markdown += `⚠️ **${stats.errors.length} Fehler gefunden** - Bitte prüfen\n\n`;
        }
        if (stats.successRate >= 95 && stats.avgResponseTime <= 1000) {
            markdown += `✅ **Alle Erfolgskriterien erfüllt!**\n\n`;
        }

        markdown += `---\n\n`;
        markdown += `**Report erstellt:** ${new Date().toISOString()}\n`;

        return markdown;
    }
}

// Main
(async () => {
    try {
        const tester = new IntensivePersonaAgentTest();
        await tester.runAllTests();
        
        const report = tester.generateReport();
        const markdownReport = tester.generateMarkdownReport();

        // JSON-Report speichern
        const fs = require('fs');
        const path = require('path');
        const reportDir = path.join(__dirname, '../../');
        const jsonReportPath = path.join(reportDir, `intensive_test_results_${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
        console.log(`💾 JSON-Report gespeichert: ${jsonReportPath}`);

        // Markdown-Report speichern
        const markdownReportPath = path.join(reportDir, `INTENSIVE_PERSONA_AGENT_TEST_REPORT_${new Date().toISOString().split('T')[0]}.md`);
        fs.writeFileSync(markdownReportPath, markdownReport);
        console.log(`💾 Markdown-Report gespeichert: ${markdownReportPath}`);

        // Zusammenfassung ausgeben
        console.log('\n' + '='.repeat(70));
        console.log('📊 TEST-ZUSAMMENFASSUNG');
        console.log('='.repeat(70));
        console.log(`Gesamt-Tests: ${report.summary.totalTests}`);
        console.log(`Erfolgreiche Routings: ${report.summary.successfulRoutings} (${report.summary.successRate})`);
        console.log(`Fehlgeschlagene Routings: ${report.summary.failedRoutings}`);
        console.log(`Durchschnittliche Response-Zeit: ${report.summary.avgResponseTime}`);
        console.log('='.repeat(70) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Test-Fehler:', error);
        process.exit(1);
    }
})();


