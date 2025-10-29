const KAYACharacterHandler = require('../../server/kaya_character_handler_v2');

class PersonaTestSuite {
    constructor() {
        this.handler = new KAYACharacterHandler();
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    // Test-Cases für alle Personas (min. 3 Queries pro Persona)
    getTestCases() {
        return {
            senior: [
                "Ich bin Rentner und brauche Hilfe bei der Rente",
                "Als Senior finde ich es schwer, das Amtsdeutsch zu verstehen",
                "Ich bin alt und brauche Unterstützung"
            ],
            youth: [
                "Ich bin Schüler und suche einen Praktikumsplatz",
                "Als Jugendlicher brauche ich Hilfe bei der Ausbildung",
                "Ich bin jugendlich und interessiere mich für Jobs"
            ],
            family: [
                "Wir haben Kinder und brauchen Unterstützung",
                "Als Familie mit Baby brauchen wir Hilfe",
                "Ich bin alleinerziehend mit meinem Kind"
            ],
            migrant: [
                "Ich bin Flüchtling und brauche Hilfe bei der Integration",
                "Als Ausländer suche ich einen Sprachkurs",
                "Ich möchte Deutsch lernen"
            ],
            disabled: [
                "Ich bin behindert und brauche barrierefreie Zugänge",
                "Als Rollstuhlfahrer benötige ich Hilfe",
                "Ich brauche Assistenz aufgrund meiner Behinderung"
            ],
            farmer: [
                "Ich bin Landwirt und habe Fragen zur Landwirtschaft",
                "Als Bauer brauche ich Informationen zum Hof",
                "Ich interessiere mich für Agrarthemen"
            ],
            craftsman: [
                "Ich bin Handwerker und suche eine Meisterprüfung",
                "Als Handwerker brauche ich Hilfe bei der Ausbildung",
                "Ich habe Fragen zur Handwerkskammer"
            ],
            student: [
                "Ich bin Student und brauche BAföG-Informationen",
                "Als Student suche ich ein Stipendium",
                "Ich studiere und habe Fragen zur Universität"
            ],
            unemployed: [
                "Ich bin arbeitslos und brauche Hilfe vom Jobcenter",
                "Als Arbeitsloser suche ich eine Bewerbung",
                "Ich brauche Unterstützung bei der Arbeitssuche"
            ],
            pensioner: [
                "Ich bin Pensionär und habe Fragen zur Rente",
                "Als Pensionär brauche ich Unterstützung im Ruhestand",
                "Ich bin im Ruhestand und brauche Hilfe"
            ],
            single_parent: [
                "Ich bin alleinerziehend und brauche Hilfe",
                "Als alleinerziehender Vater brauche ich Unterstützung",
                "Ich bin alleinerziehende Mutter mit meinem Kind"
            ],
            small_business: [
                "Ich bin Kleinunternehmer und habe Fragen zum Gewerbe",
                "Als Selbständiger brauche ich Hilfe",
                "Ich habe eine Firma und brauche Informationen"
            ],
            child: [
                "Ich bin ein Kind und habe Fragen",
                "Als Schüler möchte ich spielen",
                "Ich bin jung und brauche Hilfe für die Schule"
            ],
            commuter: [
                "Ich bin Pendler und brauche Informationen zum Zug",
                "Als Pendler suche ich eine Fahrkarte",
                "Ich pendle täglich mit dem Bus"
            ],
            housing_seeker: [
                "Ich suche eine Wohnung und brauche Hilfe",
                "Als Wohnungssuchender brauche ich Unterstützung",
                "Ich möchte eine Mietwohnung finden"
            ],
            care_dependent: [
                "Ich bin pflegebedürftig und brauche Unterstützung",
                "Als Pflegebedürftiger brauche ich Betreuung",
                "Ich benötige Hilfe in einem Pflegeheim"
            ],
            low_income: [
                "Ich bin arm und brauche Sozialhilfe",
                "Als Geringverdiener brauche ich Grundsicherung",
                "Ich habe finanzielle Probleme und brauche Hilfe"
            ],
            sports_interested: [
                "Ich interessiere mich für Sport und suche einen Verein",
                "Als Sportler brauche ich ein Training",
                "Ich möchte Fitness-Angebote finden"
            ],
            culture_interested: [
                "Ich interessiere mich für Kultur und suche ein Museum",
                "Als Kulturliebhaber möchte ich ins Theater",
                "Ich besuche gerne Konzerte und Veranstaltungen"
            ],
            plattdeutsch_speaker: [
                "Moin, ik snak Platt",
                "Ik bruuk Hülp in plattdeutsch",
                "Wohr kann ik wat niederdeutsch lern'n?"
            ],
            low_education: [
                "Ich kann nicht gut lesen und schreiben",
                "Als Person mit niedriger Bildung brauche ich einfache Sprache",
                "Ich möchte einen Kurs zum Lernen finden"
            ],
            mobility_needs: [
                "Ich brauche Mobilität und Transport",
                "Als mobilitätseingeschränkte Person brauche ich ein Fahrzeug",
                "Ich benötige Hilfe mit Auto, Bus oder Zug"
            ],
            tourist: [
                "Ich bin Tourist und möchte Informationen",
                "Als Besucher suche ich Sehenswürdigkeiten",
                "Ich bin Gast und mache Urlaub hier"
            ],
            camper: [
                "Ich bin Camper und suche einen Campingplatz",
                "Als Camper brauche ich einen Platz für mein Zelt",
                "Ich reise mit dem Wohnmobil und brauche Hilfe"
            ],
            accommodation_seeker: [
                "Ich suche eine Unterkunft für meinen Urlaub",
                "Als Tourist brauche ich ein Hotel",
                "Ich suche eine Pension oder Ferienwohnung"
            ],
            unemployed_longterm: [
                "Ich bin seit Jahren arbeitslos",
                "Als Langzeitarbeitsloser brauche ich Hilfe",
                "Ich habe seit langem keinen Job mehr"
            ],
            entrepreneur: [
                "Ich bin Gründer und starte ein Unternehmen",
                "Als Startup-Gründer brauche ich Hilfe",
                "Ich möchte eine Existenzgründung machen"
            ],
            political_interested: [
                "Ich interessiere mich für Politik und den Kreistag",
                "Als politisch Interessierter suche ich Informationen zur Fraktion",
                "Ich möchte etwas über Gremien und Sitzungen erfahren"
            ],
            sightseeing_tourist: [
                "Ich bin Tourist und suche Sehenswürdigkeiten",
                "Als Besucher möchte ich Attraktionen besichtigen",
                "Ich mache eine Tour durch die Region"
            ],
            active_tourist: [
                "Ich bin aktiver Tourist und möchte wandern",
                "Als Aktiver suche ich Radwege",
                "Ich interessiere mich für Sport und Bewegung im Urlaub"
            ],
            family_tourist: [
                "Wir machen einen Familienurlaub mit Kindern",
                "Als Familie suche ich Aktivitäten für Kinder",
                "Ich brauche einen Spielplatz für meine Kinder"
            ],
            wellness_tourist: [
                "Ich suche Wellness und Entspannung",
                "Als Wellness-Tourist möchte ich ins Spa",
                "Ich brauche eine Massage"
            ],
            culinary_tourist: [
                "Ich interessiere mich für kulinarische Angebote",
                "Als Feinschmecker suche ich Restaurants",
                "Ich möchte die lokale Küche probieren"
            ],
            shopping_tourist: [
                "Ich bin Tourist und möchte einkaufen",
                "Als Besucher suche ich Shopping-Möglichkeiten",
                "Ich interessiere mich für Märkte und Geschäfte"
            ],
            event_tourist: [
                "Ich suche Veranstaltungen und Events",
                "Als Tourist möchte ich Feste besuchen",
                "Ich interessiere mich für Konzerte"
            ]
        };
    }

    async runTests() {
        console.log('🧪 PERSONA-TEST-SUITE');
        console.log('━'.repeat(60));
        console.log('Teste alle Personas mit automatisierten Queries...\n');

        const testCases = this.getTestCases();
        const personaTypes = Object.keys(testCases);

        for (const personaType of personaTypes) {
            const queries = testCases[personaType];
            
            for (let i = 0; i < queries.length; i++) {
                const query = queries[i];
                this.results.total++;
                
                try {
                    // Analysiere Persona
                    const personaAnalysis = this.handler.analyzePersona(query);
                    const detectedPersona = personaAnalysis.persona.type;
                    
                    // Prüfe auch Routing
                    const routing = this.handler.routeToSystemPromptAgent('general', query, {});
                    const targetAgent = routing.agent;
                    
                    // Prüfe Sprache (falls relevant)
                    const languageAnalysis = this.handler.analyzeLanguage(query);
                    const detectedLanguage = languageAnalysis.detected;
                    
                    // Test-Ergebnis
                    const passed = detectedPersona === personaType;
                    const confidence = personaAnalysis.confidence;
                    
                    if (passed) {
                        this.results.passed++;
                    } else {
                        this.results.failed++;
                    }
                    
                    this.results.details.push({
                        personaType,
                        query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
                        detectedPersona,
                        targetAgent,
                        detectedLanguage,
                        confidence,
                        passed
                    });
                    
                    const status = passed ? '✅' : '❌';
                    const confidenceStr = confidence >= 50 ? `(${confidence}%)` : `⚠️ LOW (${confidence}%)`;
                    console.log(`${status} ${personaType} [${i+1}]: ${detectedPersona} → ${targetAgent} ${confidenceStr}`);
                    
                } catch (error) {
                    this.results.failed++;
                    this.results.details.push({
                        personaType,
                        query: query.substring(0, 50),
                        error: error.message,
                        passed: false
                    });
                    console.log(`❌ ${personaType} [${i+1}]: FEHLER - ${error.message}`);
                }
            }
        }

        console.log('\n━'.repeat(60));
        console.log(`📊 ERGEBNISSE:`);
        console.log(`   Gesamt: ${this.results.total}`);
        console.log(`   ✅ Erfolg: ${this.results.passed} (${((this.results.passed / this.results.total) * 100).toFixed(1)}%)`);
        console.log(`   ❌ Fehler: ${this.results.failed} (${((this.results.failed / this.results.total) * 100).toFixed(1)}%)`);
        
        // Fehlgeschlagene Tests
        const failedTests = this.results.details.filter(d => !d.passed);
        if (failedTests.length > 0) {
            console.log(`\n⚠️  Fehlgeschlagene Tests:`);
            failedTests.forEach(test => {
                console.log(`   - ${test.personaType}: "${test.query}" → erkannt als "${test.detectedPersona || test.error}"`);
            });
        }
        
        return this.results;
    }

    generateTestReport() {
        const report = [];
        report.push('# Persona-Test-Report');
        report.push(`**Datum:** ${new Date().toLocaleDateString('de-DE')}`);
        report.push(`**Getestete Personas:** ${Object.keys(this.getTestCases()).length}`);
        report.push(`**Gesamte Queries:** ${this.results.total}`);
        report.push(`**Erfolgsrate:** ${((this.results.passed / this.results.total) * 100).toFixed(1)}%\n`);
        report.push('---\n');
        
        // Gruppiere nach Persona
        const byPersona = {};
        this.results.details.forEach(detail => {
            if (!byPersona[detail.personaType]) {
                byPersona[detail.personaType] = [];
            }
            byPersona[detail.personaType].push(detail);
        });
        
        report.push('## Ergebnisse pro Persona\n');
        
        Object.keys(byPersona).forEach(personaType => {
            const tests = byPersona[personaType];
            const passed = tests.filter(t => t.passed).length;
            const total = tests.length;
            const rate = ((passed / total) * 100).toFixed(0);
            
            report.push(`### ${personaType} (${passed}/${total} = ${rate}%)`);
            
            tests.forEach(test => {
                const icon = test.passed ? '✅' : '❌';
                report.push(`- ${icon} "${test.query}"`);
                if (!test.passed) {
                    report.push(`  - Erkannt als: ${test.detectedPersona || test.error}`);
                } else {
                    report.push(`  - Agent: ${test.targetAgent}, Confidence: ${test.confidence}%, Sprache: ${test.detectedLanguage}`);
                }
            });
            report.push('');
        });
        
        return report.join('\n');
    }
}

// Main
(async () => {
    const testSuite = new PersonaTestSuite();
    const results = await testSuite.runTests();
    
    // Generiere Report
    const report = testSuite.generateTestReport();
    const fs = require('fs-extra');
    const reportPath = require('path').join(__dirname, '../../PERSONA_TEST_REPORT_2025-10-29.md');
    await fs.writeFile(reportPath, report, 'utf-8');
    console.log(`\n✅ Test-Report gespeichert: ${reportPath}`);
    
    process.exit(results.failed > 0 ? 1 : 0);
})().catch(error => {
    console.error('❌ Fehler:', error);
    process.exit(1);
});



