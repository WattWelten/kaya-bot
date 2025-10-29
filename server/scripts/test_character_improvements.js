/**
 * Intensiver Test für KAYA-Charakterverbesserungen
 * Prüft: Output-Guard, System-Prompt, Few-Shots, Floskeln, Closers
 */

const KAYACharacterHandler = require('../kaya_character_handler_v2');
const OutputGuard = require('../utils/OutputGuard');

class CharacterTest {
    constructor() {
        this.characterHandler = new KAYACharacterHandler();
        this.results = {
            outputGuardTests: [],
            systemPromptTests: [],
            integrationTests: [],
            errors: []
        };
    }

    // Test 1: Output-Guard Floskel-Entfernung
    testOutputGuardFloskels() {
        console.log('\n🧪 Test 1: Output-Guard Floskel-Entfernung');
        const testCases = [
            { input: 'Ich hoffe, das hilft. Hier ist die Antwort.' },
            { input: 'Gern geschehen! Das war meine Antwort.' },
            { input: 'Bei weiteren Fragen stehe ich zur Verfügung.' }
        ];

        testCases.forEach((testCase, index) => {
            const state = { lastFooters: [], lastClosers: [] };
            const output = OutputGuard.applyOutputGuard(testCase.input, state);
            const bannedPhrases = OutputGuard.guardCfg.bannedPhrases;
            const hasFloskel = bannedPhrases.some(phrase => output.toLowerCase().includes(phrase.toLowerCase()));
            
            const success = !hasFloskel;
            this.results.outputGuardTests.push({
                test: `Floskel-Test ${index + 1}`,
                input: testCase.input,
                output: output,
                success: success
            });
            
            console.log(`${success ? '✅' : '❌'} Test ${index + 1}: ${testCase.input.substring(0, 40)}... → ${output.substring(0, 40)}...`);
        });
    }

    // Test 2: Output-Guard Kürzung
    testOutputGuardTruncation() {
        console.log('\n🧪 Test 2: Output-Guard Kürzung (max. 8 Zeilen)');
        const longText = Array(15).fill('Dies ist eine Testzeile.').join('\n');
        const state = { lastFooters: [], lastClosers: [] };
        const output = OutputGuard.applyOutputGuard(longText, state);
        const lineCount = output.split('\n').length;
        const success = lineCount <= 8;
        
        this.results.outputGuardTests.push({
            test: 'Kürzung-Test',
            inputLines: 15,
            outputLines: lineCount,
            success: success
        });
        
        console.log(`${success ? '✅' : '❌'} Kürzung: ${15} Zeilen → ${lineCount} Zeilen (max. 8 erlaubt)`);
    }

    // Test 3: Output-Guard Closer-Rotation
    testOutputGuardClosers() {
        console.log('\n🧪 Test 3: Output-Guard Closer-Rotation');
        const text = 'Hier ist eine Antwort ohne Closer.';
        const state = { lastFooters: [], lastClosers: [] };
        
        const outputs = [];
        for (let i = 0; i < 3; i++) {
            const output = OutputGuard.applyOutputGuard(text, state);
            outputs.push(output);
        }
        
        const uniqueClosers = new Set(outputs.map(o => {
            const closerMatch = o.match(/(?:Passt das|Soll ich|Weiter mit)/i);
            return closerMatch ? closerMatch[0] : null;
        }).filter(Boolean));
        
        const success = uniqueClosers.size > 0; // Mindestens ein Closer sollte hinzugefügt werden
        this.results.outputGuardTests.push({
            test: 'Closer-Rotation',
            uniqueClosers: uniqueClosers.size,
            success: success
        });
        
        console.log(`${success ? '✅' : '❌'} Closer-Rotation: ${uniqueClosers.size} verschiedene Closers gefunden`);
    }

    // Test 4: Integration Character Handler (Mock)
    async testCharacterHandlerIntegration() {
        console.log('\n🧪 Test 4: Character Handler Integration');
        try {
            // Prüfe ob OutputGuard korrekt geladen werden kann
            const testModule = require('../utils/OutputGuard');
            const hasApplyFunction = typeof testModule.applyOutputGuard === 'function';
            
            this.results.integrationTests.push({
                test: 'OutputGuard Module Load',
                success: hasApplyFunction
            });
            
            console.log(`${hasApplyFunction ? '✅' : '❌'} OutputGuard kann geladen werden`);
            
            // Prüfe Character Handler kann initialisiert werden
            const handlerInitialized = this.characterHandler !== null;
            this.results.integrationTests.push({
                test: 'Character Handler Initialization',
                success: handlerInitialized
            });
            
            console.log(`${handlerInitialized ? '✅' : '❌'} Character Handler initialisiert`);
            
        } catch (error) {
            this.results.errors.push({
                test: 'Character Handler Integration',
                error: error.message
            });
            console.log(`❌ Fehler: ${error.message}`);
        }
    }

    // Test 5: System-Prompt Struktur
    testSystemPromptStructure() {
        console.log('\n🧪 Test 5: System-Prompt Struktur');
        try {
            const llmService = this.characterHandler.getLLMService();
            const prompt = llmService.buildSystemPrompt({
                persona: { persona: 'general' },
                emotionalState: { state: 'neutral' },
                urgency: { level: 'normal' },
                language: 'german',
                userData: {},
                isFirstMessage: false
            });
            
            const checks = {
                hasFewShots: prompt.includes('FEW-SHOT-BEISPIELE') || prompt.includes('Beispiel 1'),
                hasKayaPurpose: prompt.includes('digitale Assistenz') || prompt.includes('Landkreis Oldenburg'),
                hasNorddeutsch: prompt.includes('Norddeutscher') || prompt.includes('norddeutscher'),
                hasNoFloskeln: prompt.includes('Keine Standardfloskeln') || prompt.includes('keine Floskeln'),
                hasAnswerStyle: prompt.includes('Antwortstil') || prompt.includes('Nutzenversprechen')
            };
            
            const allPassed = Object.values(checks).every(Boolean);
            
            this.results.systemPromptTests.push({
                test: 'System-Prompt Struktur',
                checks: checks,
                success: allPassed
            });
            
            console.log(`${allPassed ? '✅' : '⚠️'} System-Prompt Struktur:`);
            Object.entries(checks).forEach(([key, value]) => {
                console.log(`  ${value ? '✅' : '❌'} ${key}`);
            });
            
        } catch (error) {
            this.results.errors.push({
                test: 'System-Prompt Test',
                error: error.message
            });
            console.log(`❌ Fehler: ${error.message}`);
        }
    }

    // Alle Tests ausführen
    async runAllTests() {
        console.log('🚀 Starte intensive Tests für KAYA-Charakterverbesserungen...\n');
        
        this.testOutputGuardFloskels();
        this.testOutputGuardTruncation();
        this.testOutputGuardClosers();
        this.testSystemPromptStructure();
        await this.testCharacterHandlerIntegration();
        
        // Zusammenfassung
        console.log('\n📊 TESTS ZUSAMMENFASSUNG:');
        console.log('='.repeat(50));
        
        const outputGuardPassed = this.results.outputGuardTests.filter(t => t.success).length;
        const outputGuardTotal = this.results.outputGuardTests.length;
        console.log(`Output-Guard Tests: ${outputGuardPassed}/${outputGuardTotal} bestanden`);
        
        const integrationPassed = this.results.integrationTests.filter(t => t.success).length;
        const integrationTotal = this.results.integrationTests.length;
        console.log(`Integration Tests: ${integrationPassed}/${integrationTotal} bestanden`);
        
        const systemPromptPassed = this.results.systemPromptTests.filter(t => t.success).length;
        const systemPromptTotal = this.results.systemPromptTests.length;
        console.log(`System-Prompt Tests: ${systemPromptPassed}/${systemPromptTotal} bestanden`);
        
        const errorCount = this.results.errors.length;
        if (errorCount > 0) {
            console.log(`\n❌ ${errorCount} Fehler gefunden:`);
            this.results.errors.forEach(e => {
                console.log(`  - ${e.test}: ${e.error}`);
            });
        } else {
            console.log('\n✅ Keine Fehler gefunden!');
        }
        
        const totalPassed = outputGuardPassed + integrationPassed + systemPromptPassed;
        const totalTests = outputGuardTotal + integrationTotal + systemPromptTotal;
        const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
        
        console.log(`\n🎯 Gesamt: ${totalPassed}/${totalTests} Tests bestanden (${successRate}%)`);
        
        return {
            success: errorCount === 0 && totalPassed === totalTests,
            results: this.results,
            statistics: {
                outputGuard: { passed: outputGuardPassed, total: outputGuardTotal },
                integration: { passed: integrationPassed, total: integrationTotal },
                systemPrompt: { passed: systemPromptPassed, total: systemPromptTotal },
                errors: errorCount,
                successRate: parseFloat(successRate)
            }
        };
    }
}

// Test ausführen wenn direkt aufgerufen
if (require.main === module) {
    (async () => {
        const tester = new CharacterTest();
        const result = await tester.runAllTests();
        process.exit(result.success ? 0 : 1);
    })();
}

module.exports = CharacterTest;

