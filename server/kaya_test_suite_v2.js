const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');

class KAYATestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.startTime = null;
        this.endTime = null;
        
        // Test-Konfiguration
        this.config = {
            timeout: 30000, // 30 Sekunden
            retries: 3,
            parallel: false,
            verbose: true,
            stopOnFailure: false
        };
        
        console.log('🧪 KAYA Test Suite v2.0 initialisiert');
    }
    
    // Test hinzufügen
    addTest(name, testFunction, options = {}) {
        const test = {
            name: name,
            function: testFunction,
            options: {
                timeout: options.timeout || this.config.timeout,
                retries: options.retries || this.config.retries,
                skip: options.skip || false,
                ...options
            },
            status: 'pending',
            result: null,
            error: null,
            duration: 0,
            retries: 0
        };
        
        this.tests.push(test);
        
        if (this.config.verbose) {
            console.log(`📋 Test hinzugefügt: ${name}`);
        }
        
        return test;
    }
    
    // Tests ausführen
    async runTests() {
        console.log('🚀 KAYA Test Suite gestartet');
        console.log(`📊 ${this.tests.length} Tests gefunden`);
        
        this.startTime = Date.now();
        
        if (this.config.parallel) {
            await this.runTestsParallel();
        } else {
            await this.runTestsSequential();
        }
        
        this.endTime = Date.now();
        
        this.generateReport();
        
        return this.results;
    }
    
    // Tests sequenziell ausführen
    async runTestsSequential() {
        for (const test of this.tests) {
            if (test.options.skip) {
                test.status = 'skipped';
                this.results.push(test);
                continue;
            }
            
            await this.runSingleTest(test);
            
            if (test.status === 'failed' && this.config.stopOnFailure) {
                console.log('🛑 Test-Fehler - Ausführung gestoppt');
                break;
            }
        }
    }
    
    // Tests parallel ausführen
    async runTestsParallel() {
        const promises = this.tests.map(test => {
            if (test.options.skip) {
                test.status = 'skipped';
                return Promise.resolve(test);
            }
            
            return this.runSingleTest(test);
        });
        
        await Promise.all(promises);
    }
    
    // Einzelnen Test ausführen
    async runSingleTest(test) {
        const startTime = Date.now();
        
        try {
            if (this.config.verbose) {
                console.log(`▶️ Test gestartet: ${test.name}`);
            }
            
            // Test mit Timeout ausführen
            const result = await Promise.race([
                test.function(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test Timeout')), test.options.timeout)
                )
            ]);
            
            test.status = 'passed';
            test.result = result;
            test.duration = Date.now() - startTime;
            
            if (this.config.verbose) {
                console.log(`✅ Test bestanden: ${test.name} (${test.duration}ms)`);
            }
            
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            test.duration = Date.now() - startTime;
            
            if (this.config.verbose) {
                console.log(`❌ Test fehlgeschlagen: ${test.name} (${test.duration}ms)`);
                console.log(`   Fehler: ${error.message}`);
            }
            
            // Retry-Logik
            if (test.retries < test.options.retries) {
                test.retries++;
                console.log(`🔄 Test wiederholt: ${test.name} (Versuch ${test.retries})`);
                
                // Kurze Pause vor Retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                return this.runSingleTest(test);
            }
        }
        
        this.results.push(test);
        return test;
    }
    
    // Test-Report generieren
    generateReport() {
        const totalDuration = this.endTime - this.startTime;
        const passedTests = this.results.filter(t => t.status === 'passed').length;
        const failedTests = this.results.filter(t => t.status === 'failed').length;
        const skippedTests = this.results.filter(t => t.status === 'skipped').length;
        
        console.log('\n📊 TEST-REPORT:');
        console.log('================');
        console.log(`⏱️ Gesamtdauer: ${totalDuration}ms`);
        console.log(`✅ Bestanden: ${passedTests}`);
        console.log(`❌ Fehlgeschlagen: ${failedTests}`);
        console.log(`⏭️ Übersprungen: ${skippedTests}`);
        console.log(`📊 Erfolgsrate: ${Math.round((passedTests / this.results.length) * 100)}%`);
        
        // Detaillierte Ergebnisse
        if (failedTests > 0) {
            console.log('\n❌ FEHLGESCHLAGENE TESTS:');
            console.log('==========================');
            
            this.results
                .filter(t => t.status === 'failed')
                .forEach(test => {
                    console.log(`\n🔴 ${test.name}`);
                    console.log(`   Dauer: ${test.duration}ms`);
                    console.log(`   Fehler: ${test.error}`);
                    console.log(`   Versuche: ${test.retries + 1}`);
                });
        }
        
        // Performance-Analyse
        const slowTests = this.results
            .filter(t => t.duration > 1000)
            .sort((a, b) => b.duration - a.duration);
        
        if (slowTests.length > 0) {
            console.log('\n🐌 LANGSAME TESTS:');
            console.log('==================');
            
            slowTests.forEach(test => {
                console.log(`⏱️ ${test.name}: ${test.duration}ms`);
            });
        }
        
        // Report speichern
        this.saveReport();
    }
    
    // Report speichern
    async saveReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                duration: this.endTime - this.startTime,
                summary: {
                    total: this.results.length,
                    passed: this.results.filter(t => t.status === 'passed').length,
                    failed: this.results.filter(t => t.status === 'failed').length,
                    skipped: this.results.filter(t => t.status === 'skipped').length
                },
                results: this.results.map(test => ({
                    name: test.name,
                    status: test.status,
                    duration: test.duration,
                    error: test.error,
                    retries: test.retries
                }))
            };
            
            const reportPath = path.join(__dirname, '../data/test-reports');
            await fs.ensureDir(reportPath);
            
            const fileName = `test-report-${Date.now()}.json`;
            const filePath = path.join(reportPath, fileName);
            
            await fs.writeJson(filePath, report, { spaces: 2 });
            
            console.log(`💾 Test-Report gespeichert: ${filePath}`);
            
        } catch (error) {
            console.error('❌ Test-Report-Speicherung Fehler:', error);
        }
    }
}

// Unit Tests für KAYA Character Handler
class KAYACharacterHandlerTests {
    constructor() {
        this.testSuite = new KAYATestSuite();
        this.setupTests();
    }
    
    setupTests() {
        // Test: Persona-Erkennung
        this.testSuite.addTest('Persona-Erkennung', async () => {
            const KAYACharacterHandler = require('./kaya_character_handler_v2');
            const handler = new KAYACharacterHandler();
            
            const testCases = [
                { text: 'Ich bin Rentner und brauche Hilfe', expected: 'senior' },
                { text: 'Ich studiere und brauche BAföG', expected: 'student' },
                { text: 'Ich habe Kinder und brauche Unterstützung', expected: 'family' }
            ];
            
            for (const testCase of testCases) {
                const result = handler.analyzePersona(testCase.text);
                assert.strictEqual(result.persona.type, testCase.expected);
            }
            
            return 'Persona-Erkennung erfolgreich';
        });
        
        // Test: Emotion-Erkennung
        this.testSuite.addTest('Emotion-Erkennung', async () => {
            const KAYACharacterHandler = require('./kaya_character_handler_v2');
            const handler = new KAYACharacterHandler();
            
            const testCases = [
                { text: 'Ich bin super glücklich!', expected: 'positive' },
                { text: 'Das macht mich wütend', expected: 'angry' },
                { text: 'Ich bin traurig', expected: 'sad' }
            ];
            
            for (const testCase of testCases) {
                const result = handler.analyzePersona(testCase.text);
                assert.strictEqual(result.emotionalState.state, testCase.expected);
            }
            
            return 'Emotion-Erkennung erfolgreich';
        });
        
        // Test: Intention-Erkennung
        this.testSuite.addTest('Intention-Erkennung', async () => {
            const KAYACharacterHandler = require('./kaya_character_handler_v2');
            const handler = new KAYACharacterHandler();
            
            const testCases = [
                { text: 'Ich brauche einen Führerschein', expected: 'führerschein' },
                { text: 'Ich möchte ein Auto zulassen', expected: 'kfz_zulassung' },
                { text: 'Ich brauche einen Bauantrag', expected: 'bauantrag' }
            ];
            
            for (const testCase of testCases) {
                const result = handler.analyzeIntention(testCase.text);
                assert.strictEqual(result.intention, testCase.expected);
            }
            
            return 'Intention-Erkennung erfolgreich';
        });
        
        // Test: Cache-Funktionalität
        this.testSuite.addTest('Cache-Funktionalität', async () => {
            const KAYACharacterHandler = require('./kaya_character_handler_v2');
            const handler = new KAYACharacterHandler();
            
            const testQuery = 'Test-Query für Cache';
            const sessionId = 'test-session';
            
            // Erste Anfrage (kein Cache)
            const result1 = await handler.generateResponse(testQuery, 'user', sessionId);
            
            // Zweite Anfrage (Cache-Hit)
            const result2 = await handler.generateResponse(testQuery, 'user', sessionId);
            
            assert.strictEqual(result1.response, result2.response);
            
            return 'Cache-Funktionalität erfolgreich';
        });
    }
    
    async runTests() {
        return await this.testSuite.runTests();
    }
}

// Unit Tests für KAYA Agent Manager
class KAYAAgentManagerTests {
    constructor() {
        this.testSuite = new KAYATestSuite();
        this.setupTests();
    }
    
    setupTests() {
        // Test: Agent-Daten laden
        this.testSuite.addTest('Agent-Daten laden', async () => {
            const KAYAAgentManager = require('./kaya_agent_manager_v2');
            const manager = new KAYAAgentManager();
            
            // Warten auf Initialisierung
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const agentStatus = manager.getAgentStatus();
            assert.strictEqual(typeof agentStatus.totalAgents, 'number');
            assert.strictEqual(agentStatus.totalAgents > 0, true);
            
            return 'Agent-Daten erfolgreich geladen';
        });
        
        // Test: Agent-Routing
        this.testSuite.addTest('Agent-Routing', async () => {
            const KAYAAgentManager = require('./kaya_agent_manager_v2');
            const manager = new KAYAAgentManager();
            
            const testCases = [
                { 
                    intention: 'kfz_zulassung', 
                    expected: 'buergerdienste' 
                },
                { 
                    intention: 'soziales', 
                    expected: 'soziales' 
                },
                { 
                    intention: 'jugend', 
                    expected: 'jugend' 
                }
            ];
            
            for (const testCase of testCases) {
                const result = await manager.routeToAgent(
                    'Test-Query',
                    'test-session',
                    {},
                    { intention: testCase.intention, confidence: 80 },
                    { persona: { type: 'general' } }
                );
                
                assert.strictEqual(result.agent, testCase.expected);
            }
            
            return 'Agent-Routing erfolgreich';
        });
    }
    
    async runTests() {
        return await this.testSuite.runTests();
    }
}

// Unit Tests für KAYA Session Manager
class KAYASessionManagerTests {
    constructor() {
        this.testSuite = new KAYATestSuite();
        this.setupTests();
    }
    
    setupTests() {
        // Test: Session erstellen
        this.testSuite.addTest('Session erstellen', async () => {
            const KAYASessionManager = require('./kaya_session_manager_v2');
            const manager = new KAYASessionManager();
            
            const sessionId = 'test-session-' + Date.now();
            const session = manager.createSession(sessionId);
            
            assert.strictEqual(session.id, sessionId);
            assert.strictEqual(session.status, 'active');
            assert.strictEqual(Array.isArray(session.messages), true);
            
            return 'Session erfolgreich erstellt';
        });
        
        // Test: Nachricht hinzufügen
        this.testSuite.addTest('Nachricht hinzufügen', async () => {
            const KAYASessionManager = require('./kaya_session_manager_v2');
            const manager = new KAYASessionManager();
            
            const sessionId = 'test-session-' + Date.now();
            manager.createSession(sessionId);
            
            const message = manager.addMessage(sessionId, 'Test-Nachricht', 'user');
            
            assert.strictEqual(message.content, 'Test-Nachricht');
            assert.strictEqual(message.role, 'user');
            assert.strictEqual(typeof message.timestamp, 'string');
            
            const session = manager.getSession(sessionId);
            assert.strictEqual(session.messageCount, 1);
            
            return 'Nachricht erfolgreich hinzugefügt';
        });
        
        // Test: Session-Kontext
        this.testSuite.addTest('Session-Kontext', async () => {
            const KAYASessionManager = require('./kaya_session_manager_v2');
            const manager = new KAYASessionManager();
            
            const sessionId = 'test-session-' + Date.now();
            manager.createSession(sessionId);
            
            manager.addMessage(sessionId, 'Test-Nachricht', 'user', {
                intention: 'kfz_zulassung',
                persona: 'senior'
            });
            
            const context = manager.getSessionContext(sessionId);
            
            assert.strictEqual(context.previousIntention, 'kfz_zulassung');
            assert.strictEqual(context.persona, 'senior');
            assert.strictEqual(context.messageCount, 1);
            
            return 'Session-Kontext erfolgreich';
        });
    }
    
    async runTests() {
        return await this.testSuite.runTests();
    }
}

// Unit Tests für KAYA WebSocket Service
class KAYAWebSocketServiceTests {
    constructor() {
        this.testSuite = new KAYATestSuite();
        this.setupTests();
    }
    
    setupTests() {
        // Test: WebSocket-Service initialisieren
        this.testSuite.addTest('WebSocket-Service initialisieren', async () => {
            const KAYAWebSocketService = require('./kaya_websocket_service_v2');
            const service = new KAYAWebSocketService(null); // Mock Server
            
            assert.strictEqual(typeof service.metrics.totalConnections, 'number');
            assert.strictEqual(typeof service.metrics.activeConnections, 'number');
            
            return 'WebSocket-Service erfolgreich initialisiert';
        });
        
        // Test: Rate Limiting
        this.testSuite.addTest('Rate Limiting', async () => {
            const KAYAWebSocketService = require('./kaya_websocket_service_v2');
            const service = new KAYAWebSocketService(null);
            
            const clientId = 'test-client';
            
            // Erste Anfragen sollten durchgehen
            for (let i = 0; i < 10; i++) {
                assert.strictEqual(service.checkRateLimit(clientId), true);
            }
            
            // Rate Limit Status prüfen
            const status = service.getRateLimitStatus(clientId);
            assert.strictEqual(typeof status.count, 'number');
            assert.strictEqual(typeof status.remaining, 'number');
            
            return 'Rate Limiting erfolgreich';
        });
    }
    
    async runTests() {
        return await this.testSuite.runTests();
    }
}

// Unit Tests für KAYA Avatar Service
class KAYAAvatarServiceTests {
    constructor() {
        this.testSuite = new KAYATestSuite();
        this.setupTests();
    }
    
    setupTests() {
        // Test: Avatar erstellen
        this.testSuite.addTest('Avatar erstellen', async () => {
            const KAYAAvatarService = require('./kaya_avatar_service_v2');
            const service = new KAYAAvatarService();
            
            const avatarId = 'test-avatar-' + Date.now();
            const avatar = service.createAvatar(avatarId);
            
            assert.strictEqual(avatar.id, avatarId);
            assert.strictEqual(avatar.state.currentEmotion, 'neutral');
            assert.strictEqual(avatar.state.currentGesture, 'idle');
            
            return 'Avatar erfolgreich erstellt';
        });
        
        // Test: Emotion-Erkennung
        this.testSuite.addTest('Avatar-Emotion-Erkennung', async () => {
            const KAYAAvatarService = require('./kaya_avatar_service_v2');
            const service = new KAYAAvatarService();
            
            const avatarId = 'test-avatar-' + Date.now();
            service.createAvatar(avatarId);
            
            const result = service.analyzeEmotion('Ich bin super glücklich!', avatarId);
            
            assert.strictEqual(result.emotion, 'positive');
            assert.strictEqual(typeof result.confidence, 'number');
            
            const avatar = service.getAvatar(avatarId);
            assert.strictEqual(avatar.state.currentEmotion, 'positive');
            
            return 'Avatar-Emotion-Erkennung erfolgreich';
        });
        
        // Test: Gesture ausführen
        this.testSuite.addTest('Avatar-Gesture ausführen', async () => {
            const KAYAAvatarService = require('./kaya_avatar_service_v2');
            const service = new KAYAAvatarService();
            
            const avatarId = 'test-avatar-' + Date.now();
            service.createAvatar(avatarId);
            
            const result = service.executeGesture(avatarId, 'greeting', 1000);
            
            assert.strictEqual(result, true);
            
            const avatar = service.getAvatar(avatarId);
            assert.strictEqual(avatar.state.currentGesture, 'greeting');
            
            return 'Avatar-Gesture erfolgreich ausgeführt';
        });
    }
    
    async runTests() {
        return await this.testSuite.runTests();
    }
}

// Unit Tests für KAYA Audio Service
class KAYAAudioServiceTests {
    constructor() {
        this.testSuite = new KAYATestSuite();
        this.setupTests();
    }
    
    setupTests() {
        // Test: Audio-Service initialisieren
        this.testSuite.addTest('Audio-Service initialisieren', async () => {
            const KAYAAudioService = require('./kaya_audio_service_v2');
            const service = new KAYAAudioService();
            
            assert.strictEqual(typeof service.metrics.totalAudioRequests, 'number');
            assert.strictEqual(typeof service.audioConfig.defaultVoice, 'string');
            
            return 'Audio-Service erfolgreich initialisiert';
        });
        
        // Test: Audio-Session erstellen
        this.testSuite.addTest('Audio-Session erstellen', async () => {
            const KAYAAudioService = require('./kaya_audio_service_v2');
            const service = new KAYAAudioService();
            
            const sessionId = 'test-session-' + Date.now();
            const session = service.createAudioSession(sessionId);
            
            assert.strictEqual(session.id, sessionId);
            assert.strictEqual(Array.isArray(session.audioFiles), true);
            assert.strictEqual(session.totalDuration, 0);
            
            return 'Audio-Session erfolgreich erstellt';
        });
        
        // Test: Speech generieren
        this.testSuite.addTest('Speech generieren', async () => {
            const KAYAAudioService = require('./kaya_audio_service_v2');
            const service = new KAYAAudioService();
            
            const testText = 'Hallo, das ist ein Test.';
            const audioFile = await service.generateSpeech(testText);
            
            assert.strictEqual(typeof audioFile.id, 'string');
            assert.strictEqual(typeof audioFile.fileName, 'string');
            assert.strictEqual(typeof audioFile.url, 'string');
            assert.strictEqual(audioFile.metadata.text, testText);
            
            return 'Speech erfolgreich generiert';
        });
    }
    
    async runTests() {
        return await this.testSuite.runTests();
    }
}

// Unit Tests für KAYA Performance Optimizer
class KAYAPerformanceOptimizerTests {
    constructor() {
        this.testSuite = new KAYATestSuite();
        this.setupTests();
    }
    
    setupTests() {
        // Test: Performance-Optimizer initialisieren
        this.testSuite.addTest('Performance-Optimizer initialisieren', async () => {
            const KAYAPerformanceOptimizer = require('./kaya_performance_optimizer_v2');
            const optimizer = new KAYAPerformanceOptimizer();
            
            assert.strictEqual(typeof optimizer.metrics.totalRequests, 'number');
            assert.strictEqual(typeof optimizer.config.cache.maxSize, 'number');
            
            return 'Performance-Optimizer erfolgreich initialisiert';
        });
        
        // Test: Cache-Funktionalität
        this.testSuite.addTest('Cache-Funktionalität', async () => {
            const KAYAPerformanceOptimizer = require('./kaya_performance_optimizer_v2');
            const optimizer = new KAYAPerformanceOptimizer();
            
            const testKey = 'test-key';
            const testData = { message: 'Test-Daten' };
            
            // Daten setzen
            optimizer.setCache(testKey, testData);
            
            // Daten abrufen
            const cachedData = optimizer.getFromCache(testKey);
            
            assert.strictEqual(cachedData.message, testData.message);
            
            return 'Cache-Funktionalität erfolgreich';
        });
        
        // Test: Rate Limiting
        this.testSuite.addTest('Performance-Rate-Limiting', async () => {
            const KAYAPerformanceOptimizer = require('./kaya_performance_optimizer_v2');
            const optimizer = new KAYAPerformanceOptimizer();
            
            const identifier = 'test-identifier';
            
            // Erste Anfragen sollten durchgehen
            for (let i = 0; i < 10; i++) {
                assert.strictEqual(optimizer.checkRateLimit(identifier), true);
            }
            
            // Rate Limit Status prüfen
            const status = optimizer.getRateLimitStatus(identifier);
            assert.strictEqual(typeof status.count, 'number');
            assert.strictEqual(typeof status.remaining, 'number');
            
            return 'Performance-Rate-Limiting erfolgreich';
        });
        
        // Test: Lazy Loading
        this.testSuite.addTest('Lazy Loading', async () => {
            const KAYAPerformanceOptimizer = require('./kaya_performance_optimizer_v2');
            const optimizer = new KAYAPerformanceOptimizer();
            
            // Lazy Loader registrieren
            const loader = optimizer.registerLazyLoader('test-loader', async (key) => {
                return { key: key, data: 'Test-Daten' };
            });
            
            assert.strictEqual(loader.name, 'test-loader');
            
            // Lazy Loading testen
            const result = await optimizer.lazyLoad('test-loader', 'test-key');
            
            assert.strictEqual(result.key, 'test-key');
            assert.strictEqual(result.data, 'Test-Daten');
            
            return 'Lazy Loading erfolgreich';
        });
    }
    
    async runTests() {
        return await this.testSuite.runTests();
    }
}

// Integration Tests
class KAYAIntegrationTests {
    constructor() {
        this.testSuite = new KAYATestSuite();
        this.setupTests();
    }
    
    setupTests() {
        // Test: Vollständige KAYA-Pipeline
        this.testSuite.addTest('Vollständige KAYA-Pipeline', async () => {
            const KAYACharacterHandler = require('./kaya_character_handler_v2');
            const KAYAAgentManager = require('./kaya_agent_manager_v2');
            const KAYASessionManager = require('./kaya_session_manager_v2');
            
            // Services initialisieren
            const characterHandler = new KAYACharacterHandler();
            const agentManager = new KAYAAgentManager();
            const sessionManager = new KAYASessionManager();
            
            // Warten auf Initialisierung
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const sessionId = 'integration-test-' + Date.now();
            const testQuery = 'Ich brauche einen Führerschein';
            
            // Session erstellen
            sessionManager.createSession(sessionId);
            
            // Response generieren
            const response = await characterHandler.generateResponse(testQuery, 'user', sessionId);
            
            assert.strictEqual(typeof response.response, 'string');
            assert.strictEqual(response.response.length > 0, true);
            
            // Session prüfen
            const session = sessionManager.getSession(sessionId);
            assert.strictEqual(session.messageCount, 2); // User + Assistant
            
            return 'Vollständige KAYA-Pipeline erfolgreich';
        });
        
        // Test: Performance unter Last
        this.testSuite.addTest('Performance unter Last', async () => {
            const KAYACharacterHandler = require('./kaya_character_handler_v2');
            const handler = new KAYACharacterHandler();
            
            const testQueries = [
                'Ich brauche einen Führerschein',
                'Ich möchte ein Auto zulassen',
                'Ich brauche einen Bauantrag',
                'Ich bin Rentner und brauche Hilfe',
                'Ich studiere und brauche BAföG'
            ];
            
            const startTime = Date.now();
            const promises = testQueries.map((query, index) => 
                handler.generateResponse(query, 'user', `test-session-${index}`)
            );
            
            const results = await Promise.all(promises);
            const duration = Date.now() - startTime;
            
            assert.strictEqual(results.length, testQueries.length);
            assert.strictEqual(duration < 10000, true); // Unter 10 Sekunden
            
            return `Performance unter Last erfolgreich (${duration}ms)`;
        });
    }
    
    async runTests() {
        return await this.testSuite.runTests();
    }
}

// Haupt-Test-Runner
class KAYATestRunner {
    constructor() {
        this.testSuites = [];
        this.results = [];
    }
    
    addTestSuite(testSuite) {
        this.testSuites.push(testSuite);
    }
    
    async runAllTests() {
        console.log('🚀 KAYA Test Runner gestartet');
        console.log(`📊 ${this.testSuites.length} Test-Suites gefunden`);
        
        const startTime = Date.now();
        
        for (const testSuite of this.testSuites) {
            console.log(`\n🧪 Test-Suite: ${testSuite.constructor.name}`);
            console.log('='.repeat(50));
            
            const results = await testSuite.runTests();
            this.results.push({
                suite: testSuite.constructor.name,
                results: results
            });
        }
        
        const totalDuration = Date.now() - startTime;
        
        this.generateOverallReport(totalDuration);
        
        return this.results;
    }
    
    generateOverallReport(totalDuration) {
        const totalTests = this.results.reduce((sum, suite) => sum + suite.results.length, 0);
        const totalPassed = this.results.reduce((sum, suite) => 
            sum + suite.results.filter(t => t.status === 'passed').length, 0);
        const totalFailed = this.results.reduce((sum, suite) => 
            sum + suite.results.filter(t => t.status === 'failed').length, 0);
        const totalSkipped = this.results.reduce((sum, suite) => 
            sum + suite.results.filter(t => t.status === 'skipped').length, 0);
        
        console.log('\n🏆 GESAMTBERICHT:');
        console.log('==================');
        console.log(`⏱️ Gesamtdauer: ${totalDuration}ms`);
        console.log(`📊 Gesamttests: ${totalTests}`);
        console.log(`✅ Bestanden: ${totalPassed}`);
        console.log(`❌ Fehlgeschlagen: ${totalFailed}`);
        console.log(`⏭️ Übersprungen: ${totalSkipped}`);
        console.log(`📈 Erfolgsrate: ${Math.round((totalPassed / totalTests) * 100)}%`);
        
        // Suite-spezifische Ergebnisse
        console.log('\n📋 SUITE-ERGEBNISSE:');
        console.log('====================');
        
        this.results.forEach(suite => {
            const passed = suite.results.filter(t => t.status === 'passed').length;
            const failed = suite.results.filter(t => t.status === 'failed').length;
            const skipped = suite.results.filter(t => t.status === 'skipped').length;
            const total = suite.results.length;
            
            console.log(`\n🧪 ${suite.suite}:`);
            console.log(`   Gesamt: ${total}, Bestanden: ${passed}, Fehlgeschlagen: ${failed}, Übersprungen: ${skipped}`);
            console.log(`   Erfolgsrate: ${Math.round((passed / total) * 100)}%`);
        });
    }
}

// Test-Runner initialisieren und ausführen
async function runKAYATests() {
    const testRunner = new KAYATestRunner();
    
    // Test-Suites hinzufügen
    testRunner.addTestSuite(new KAYACharacterHandlerTests());
    testRunner.addTestSuite(new KAYAAgentManagerTests());
    testRunner.addTestSuite(new KAYASessionManagerTests());
    testRunner.addTestSuite(new KAYAWebSocketServiceTests());
    testRunner.addTestSuite(new KAYAAvatarServiceTests());
    testRunner.addTestSuite(new KAYAAudioServiceTests());
    testRunner.addTestSuite(new KAYAPerformanceOptimizerTests());
    testRunner.addTestSuite(new KAYAIntegrationTests());
    
    // Tests ausführen
    const results = await testRunner.runAllTests();
    
    return results;
}

// Export für direkte Ausführung
if (require.main === module) {
    runKAYATests().catch(console.error);
}

module.exports = {
    KAYATestSuite,
    KAYACharacterHandlerTests,
    KAYAAgentManagerTests,
    KAYASessionManagerTests,
    KAYAWebSocketServiceTests,
    KAYAAvatarServiceTests,
    KAYAAudioServiceTests,
    KAYAPerformanceOptimizerTests,
    KAYAIntegrationTests,
    KAYATestRunner,
    runKAYATests
};
