#!/usr/bin/env node

/**
 * Test-Script für Dialog-Optimierungen (Kommunikationspsychologie)
 * 
 * Prüft:
 * 1. Variabilität statt mechanischer Struktur
 * 2. Natürliche Unsicherheits-Signale
 * 3. Listen reduziert (fließender Text)
 * 4. Natürliche Formulierungen
 */

const KAYACharacterHandler = require('../kaya_character_handler_v2');
const path = require('path');

class DialogOptimizationTest {
    constructor() {
        this.characterHandler = new KAYACharacterHandler();
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    async runTests() {
        console.log('🧪 Starte Dialog-Optimierungs-Tests...\n');

        // Test 1: Variabilität statt mechanischer Struktur
        await this.testVariability();

        // Test 2: Natürliche Unsicherheits-Signale
        await this.testUncertaintySignals();

        // Test 3: Listen reduziert (fließender Text)
        await this.testListReduction();

        // Test 4: Natürliche Formulierungen
        await this.testNaturalFormulations();

        // Zusammenfassung
        this.printSummary();
    }

    async testVariability() {
        console.log('📋 Test 1: Variabilität statt mechanischer Struktur');
        
        const testQueries = [
            'KFZ ummelden',
            'Was brauche ich für einen Bauantrag?',
            'Öffnungszeiten'
        ];

        for (const query of testQueries) {
            this.results.total++;
            try {
                const response = await this.characterHandler.generateResponse(query, null, `test-${Date.now()}`);
                
                // Prüfe ob mechanische Struktur vorhanden (schlecht)
                const hasMechanicalStructure = /^.*?\n\n.*?•.*?•.*?•/s.test(response.response || '');
                const hasNaturalVariation = !hasMechanicalStructure;
                
                if (hasNaturalVariation) {
                    this.results.passed++;
                    console.log(`  ✅ "${query}" - Variabilität vorhanden`);
                } else {
                    this.results.failed++;
                    console.log(`  ❌ "${query}" - Zu mechanisch strukturiert`);
                }

                this.results.details.push({
                    test: 'Variabilität',
                    query,
                    passed: hasNaturalVariation,
                    preview: (response.response || '').substring(0, 100)
                });
            } catch (error) {
                this.results.failed++;
                console.log(`  ❌ "${query}" - Fehler: ${error.message}`);
            }
        }
        console.log('');
    }

    async testUncertaintySignals() {
        console.log('📋 Test 2: Natürliche Unsicherheits-Signale');
        
        const testQueries = [
            'Was kostet eine Baugenehmigung genau?',
            'Gibt es spezielle Förderungen für Senioren?'
        ];

        for (const query of testQueries) {
            this.results.total++;
            try {
                const response = await this.characterHandler.generateResponse(query, null, `test-${Date.now()}`);
                const responseText = (response.response || '').toLowerCase();
                
                // Prüfe auf natürliche Unsicherheits-Signale
                const naturalSignals = ['hm,', 'da muss ich passen', 'genau weiß ich das nicht', 'bin ich mir nicht 100% sicher'];
                const formalSignals = ['das kann ich dir leider nicht sicher sagen'];
                
                const hasNaturalSignal = naturalSignals.some(signal => responseText.includes(signal));
                const hasFormalSignal = formalSignals.some(signal => responseText.includes(signal));
                
                if (hasNaturalSignal || !hasFormalSignal) {
                    this.results.passed++;
                    console.log(`  ✅ "${query}" - Natürliche Signale oder keine formalen`);
                } else {
                    this.results.failed++;
                    console.log(`  ❌ "${query}" - Zu formal bei Unsicherheit`);
                }

                this.results.details.push({
                    test: 'Unsicherheits-Signale',
                    query,
                    passed: hasNaturalSignal || !hasFormalSignal,
                    preview: responseText.substring(0, 100)
                });
            } catch (error) {
                this.results.failed++;
                console.log(`  ❌ "${query}" - Fehler: ${error.message}`);
            }
        }
        console.log('');
    }

    async testListReduction() {
        console.log('📋 Test 3: Listen reduziert (fließender Text)');
        
        const testQueries = [
            'KFZ ummelden - was brauche ich?',
            'Unterlagen für Bauantrag'
        ];

        for (const query of testQueries) {
            this.results.total++;
            try {
                const response = await this.characterHandler.generateResponse(query, null, `test-${Date.now()}`);
                const responseText = response.response || '';
                
                // Zähle Bulletpoints
                const bulletCount = (responseText.match(/•/g) || []).length;
                const hasFewBullets = bulletCount <= 3; // Maximal 3 Bulletpoints akzeptabel
                
                // Prüfe auf fließenden Text
                const hasFlowingText = responseText.includes('du brauchst') || 
                                       responseText.includes('Du brauchst') ||
                                       responseText.includes('benötigst') ||
                                       bulletCount === 0;
                
                if (hasFewBullets || hasFlowingText) {
                    this.results.passed++;
                    console.log(`  ✅ "${query}" - Listen reduziert (${bulletCount} Bullets)`);
                } else {
                    this.results.failed++;
                    console.log(`  ❌ "${query}" - Zu viele Listen (${bulletCount} Bullets)`);
                }

                this.results.details.push({
                    test: 'Listen reduziert',
                    query,
                    passed: hasFewBullets || hasFlowingText,
                    bulletCount,
                    preview: responseText.substring(0, 100)
                });
            } catch (error) {
                this.results.failed++;
                console.log(`  ❌ "${query}" - Fehler: ${error.message}`);
            }
        }
        console.log('');
    }

    async testNaturalFormulations() {
        console.log('📋 Test 4: Natürliche Formulierungen');
        
        const testQueries = [
            'Moin, ich brauche Hilfe',
            'Was geht denn so im Landkreis?'
        ];

        for (const query of testQueries) {
            this.results.total++;
            try {
                const response = await this.characterHandler.generateResponse(query, null, `test-${Date.now()}`);
                const responseText = (response.response || '').toLowerCase();
                
                // Prüfe auf natürliche Formulierungen (keine mechanischen Strukturen)
                const hasMechanicalMarkers = /^.*?\n\n.*?\d+\./s.test(response.response || '');
                const hasNaturalFlow = responseText.includes('klar') || 
                                      responseText.includes('gerne') ||
                                      responseText.includes('hm') ||
                                      !hasMechanicalMarkers;
                
                if (hasNaturalFlow) {
                    this.results.passed++;
                    console.log(`  ✅ "${query}" - Natürliche Formulierung`);
                } else {
                    this.results.failed++;
                    console.log(`  ❌ "${query}" - Zu mechanisch formuliert`);
                }

                this.results.details.push({
                    test: 'Natürliche Formulierungen',
                    query,
                    passed: hasNaturalFlow,
                    preview: responseText.substring(0, 100)
                });
            } catch (error) {
                this.results.failed++;
                console.log(`  ❌ "${query}" - Fehler: ${error.message}`);
            }
        }
        console.log('');
    }

    printSummary() {
        console.log('📊 Test-Zusammenfassung:');
        console.log(`  Gesamt: ${this.results.total}`);
        console.log(`  ✅ Bestanden: ${this.results.passed}`);
        console.log(`  ❌ Fehlgeschlagen: ${this.results.failed}`);
        console.log(`  Erfolgsrate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%\n`);

        if (this.results.failed > 0) {
            console.log('❌ Fehlgeschlagene Tests:');
            this.results.details
                .filter(d => !d.passed)
                .forEach(d => {
                    console.log(`  - ${d.test}: "${d.query}"`);
                    console.log(`    Preview: ${d.preview}...`);
                });
        }

        if (this.results.passed === this.results.total) {
            console.log('✅ Alle Tests bestanden! Dialog-Optimierungen funktionieren.');
        } else {
            console.log(`⚠️  ${this.results.failed} Tests fehlgeschlagen. Weitere Optimierungen empfohlen.`);
        }
    }
}

// Main
if (require.main === module) {
    const test = new DialogOptimizationTest();
    test.runTests().catch(error => {
        console.error('❌ Test-Fehler:', error);
        process.exit(1);
    });
}

module.exports = DialogOptimizationTest;

