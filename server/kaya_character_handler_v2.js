const ContextMemory = require('./context_memory');

class KAYACharacterHandler {
    constructor() {
        this.agentHandler = null; // Lazy loading für Agent Handler
        this.llmService = null; // Lazy loading
        this.useLLM = process.env.USE_LLM === 'true';
        this.contextMemory = new ContextMemory();
        this.cache = new Map(); // In-Memory Cache
        this.responseTimes = new Map(); // Performance Tracking
        this.errorCounts = new Map(); // Error Tracking
        
        // Performance Metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            averageResponseTime: 0,
            cacheHitRate: 0
        };
        
        console.log('🚀 KAYA Character Handler v2.0 initialisiert');
    }
    
    // Lazy loading für Agent Handler
    getAgentHandler() {
        if (!this.agentHandler) {
            const KAYAAgentHandler = require('./kaya_agent_handler');
            this.agentHandler = new KAYAAgentHandler();
        }
        return this.agentHandler;
    }
    
    // Agent-Routing nach System-Prompt
    routeToSystemPromptAgent(intention, query, sessionContext) {
        const queryLower = query.toLowerCase();
        
        // System-Prompt konforme Agent-Zuordnung
        const agentRouting = {
            // Dienstleistung/Lebenslage/Formulare/Gebühren/Unterlagen → buergerdienste
            kfz_zulassung: 'buergerdienste',
            führerschein: 'buergerdienste', 
            bauantrag: 'buergerdienste',
            gewerbe: 'buergerdienste',
            landwirtschaft: 'buergerdienste',
            handwerk: 'buergerdienste',
            soziales: 'buergerdienste',
            gesundheit: 'buergerdienste',
            bildung: 'buergerdienste',
            umwelt: 'buergerdienste',
            
            // Sitzung/Tagesordnung/Beschluss/Kreistag → ratsinfo
            ratsinfo: 'ratsinfo',
            sitzung: 'ratsinfo',
            tagesordnung: 'ratsinfo',
            beschluss: 'ratsinfo',
            kreistag: 'ratsinfo',
            
            // Stelle/Bewerbung/Ausbildung/Praktikum → stellenportal
            stellen: 'stellenportal',
            bewerbung: 'stellenportal',
            ausbildung: 'stellenportal',
            praktikum: 'stellenportal',
            job: 'stellenportal',
            
            // Kontakt/Telefon/E-Mail/Sprechzeit/Standort → kontakte
            kontakt: 'kontakte',
            telefon: 'kontakte',
            email: 'kontakte',
            sprechzeit: 'kontakte',
            standort: 'kontakte',
            öffnungszeiten: 'kontakte',
            
            // Spezielle Bereiche
            notfall: 'kaya', // Sofortige KAYA-Antwort
            tourismus: 'kaya', // KAYA-spezifische Antwort
            
            // Fallback
            general: 'kaya'
        };
        
        // Direkte Agent-Zuordnung basierend auf Intention
        let targetAgent = agentRouting[intention] || 'kaya';
        
        // Zusätzliche Keyword-basierte Routing-Logik
        if (queryLower.includes('sitzung') || queryLower.includes('kreistag') || queryLower.includes('beschluss')) {
            targetAgent = 'ratsinfo';
        } else if (queryLower.includes('stelle') || queryLower.includes('bewerbung') || queryLower.includes('job')) {
            targetAgent = 'stellenportal';
        } else if (queryLower.includes('kontakt') || queryLower.includes('telefon') || queryLower.includes('sprechzeit')) {
            targetAgent = 'kontakte';
        } else if (queryLower.includes('notfall') || queryLower.includes('112') || queryLower.includes('110')) {
            targetAgent = 'kaya'; // Sofortige KAYA-Antwort für Notfälle
        }
        
        return {
            agent: targetAgent,
            confidence: 0.9,
            reasoning: `Geroutet zu ${targetAgent} basierend auf Intention: ${intention}`
        };
    }
    
    // Lazy loading für LLM Service
    getLLMService() {
        if (!this.llmService) {
            const LLMService = require('./llm_service');
            this.llmService = new LLMService();
        }
        return this.llmService;
    }
    
    // Cache Management
    getCacheKey(query, sessionId) {
        return `${sessionId}:${query.toLowerCase().trim()}`;
    }
    
    getFromCache(query, sessionId) {
        const key = this.getCacheKey(query, sessionId);
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 Minuten TTL
            this.metrics.cacheHitRate = (this.metrics.cacheHitRate * this.metrics.totalRequests + 1) / (this.metrics.totalRequests + 1);
            return cached.data;
        }
        return null;
    }
    
    setCache(query, sessionId, data) {
        const key = this.getCacheKey(query, sessionId);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Cache Cleanup (behalte nur die letzten 1000 Einträge)
        if (this.cache.size > 1000) {
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toDelete = entries.slice(0, entries.length - 1000);
            toDelete.forEach(([key]) => this.cache.delete(key));
        }
    }
    
    // Performance Tracking
    startTimer() {
        return Date.now();
    }
    
    endTimer(startTime) {
        return Date.now() - startTime;
    }
    
    updateMetrics(responseTime, success = true) {
        this.metrics.totalRequests++;
        if (success) {
            this.metrics.successfulRequests++;
        }
        
        // Moving average für Response Time
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
            this.metrics.totalRequests;
    }
    
    // Enhanced Persona Detection
    analyzePersona(query, sessionContext = {}) {
        const startTime = this.startTimer();
        
        try {
            // Basis-Persona-Analyse
            const persona = this.detectBasicPersona(query);
            
            // Emotionale Analyse
            const emotionalState = this.analyzeEmotionalState(query);
            
            // Dringlichkeits-Analyse
            const urgency = this.analyzeUrgency(query);
            
            // Sprach-Analyse
            const language = this.analyzeLanguage(query);
            
            // Accessibility-Bedürfnisse
            const accessibility = this.analyzeAccessibility(query);
            
            const analysis = {
                persona,
                emotionalState,
                urgency,
                language,
                accessibility,
                confidence: this.calculateConfidence(persona, emotionalState, urgency),
                processingTime: this.endTimer(startTime)
            };
            
            console.log(`🧠 Persona-Analyse: ${persona.type} (${emotionalState.state}, ${urgency.level}) - ${analysis.confidence}%`);
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Persona-Analyse Fehler:', error);
            return this.getDefaultPersona();
        }
    }
    
    detectBasicPersona(query) {
        const queryLower = query.toLowerCase();
        
        // Erweiterte Persona-Keywords
        const personas = {
            senior: ['senior', 'rentner', 'pensionär', 'alt', 'älter', 'hilfe', 'unterstützung', 'einfach', 'langsam'],
            youth: ['jugend', 'jugendliche', 'schüler', 'student', 'ausbildung', 'praktikum', 'job', 'arbeit'],
            family: ['familie', 'kinder', 'kind', 'baby', 'schwanger', 'eltern', 'mutter', 'vater'],
            migrant: ['migration', 'flüchtling', 'asyl', 'ausländer', 'deutsch lernen', 'sprachkurs', 'integration'],
            disabled: ['behinderung', 'rollstuhl', 'barrierefrei', 'zugänglich', 'hilfe', 'assistenz'],
            farmer: ['landwirt', 'bauer', 'landwirtschaft', 'hof', 'tier', 'pflanze', 'ernte', 'acker'],
            craftsman: ['handwerk', 'handwerker', 'meister', 'ausbildung', 'lehre', 'werkstatt'],
            student: ['student', 'studium', 'universität', 'hochschule', 'bafög', 'stipendium'],
            unemployed: ['arbeitslos', 'jobcenter', 'arbeitsagentur', 'bewerbung', 'arbeitssuche'],
            pensioner: ['rente', 'pension', 'ruhestand', 'senior', 'altersversorgung'],
            single_parent: ['alleinerziehend', 'alleinerziehende', 'kind allein', 'vater allein', 'mutter allein'],
            small_business: ['kleinunternehmer', 'selbständig', 'gewerbe', 'firma', 'unternehmen'],
            child: ['kind', 'schüler', 'schule', 'spiel', 'spielen', 'freunde'],
            commuter: ['pendler', 'pendeln', 'zug', 'bus', 'verkehr', 'fahrkarte'],
            housing_seeker: ['wohnung', 'miete', 'wohnen', 'haus', 'wohnungssuche'],
            care_dependent: ['pflege', 'pflegebedürftig', 'betreuung', 'pflegeheim'],
            low_income: ['armut', 'sozialhilfe', 'grundsicherung', 'finanziell', 'geld'],
            sports_interested: ['sport', 'verein', 'training', 'fitness', 'bewegung'],
            culture_interested: ['kultur', 'museum', 'theater', 'konzert', 'veranstaltung'],
            plattdeutsch_speaker: ['platt', 'plattdeutsch', 'niederdeutsch', 'dialekt'],
            low_education: ['bildung', 'lesen', 'schreiben', 'lernen', 'kurs'],
            mobility_needs: ['mobilität', 'transport', 'fahrzeug', 'auto', 'bus', 'zug'],
            tourist: ['tourist', 'urlaub', 'besucher', 'gast', 'reise'],
            camper: ['camping', 'zelt', 'wohnmobil', 'campingplatz'],
            accommodation_seeker: ['unterkunft', 'hotel', 'pension', 'ferienwohnung'],
            sightseeing_tourist: ['sehenswürdigkeit', 'attraktion', 'besichtigen', 'tour'],
            active_tourist: ['wandern', 'radfahren', 'aktiv', 'sport', 'bewegung'],
            family_tourist: ['familienurlaub', 'kinder', 'familie', 'spielplatz'],
            wellness_tourist: ['wellness', 'entspannung', 'spa', 'massage'],
            culinary_tourist: ['kulinarisch', 'essen', 'restaurant', 'küche'],
            shopping_tourist: ['einkaufen', 'shopping', 'geschäft', 'markt'],
            event_tourist: ['veranstaltung', 'event', 'fest', 'konzert']
        };
        
        // Persona-Scoring
        const scores = {};
        Object.keys(personas).forEach(persona => {
            scores[persona] = personas[persona].reduce((score, keyword) => {
                return score + (queryLower.includes(keyword) ? 1 : 0);
            }, 0);
        });
        
        // Beste Persona finden
        const bestPersona = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return {
            type: bestPersona,
            score: scores[bestPersona],
            confidence: Math.min(scores[bestPersona] * 20, 100)
        };
    }
    
    analyzeEmotionalState(query) {
        const queryLower = query.toLowerCase();
        
        const emotions = {
            frustrated: ['frustriert', 'ärgerlich', 'wütend', 'nervig', 'blöd', 'doof', 'verzweifelt', 'kompliziert', 'verstehe nicht', 'verwirrt', 'hilflos', 'überfordert', 'schwierig', 'unmöglich', 'stress'],
            anxious: ['angst', 'sorge', 'besorgt', 'unsicher', 'nervös', 'panik', 'befürchte', 'zweifel', 'unsicher', 'sorge'],
            positive: ['gut', 'super', 'toll', 'fantastisch', 'wunderbar', 'perfekt', 'danke', 'freue mich', 'schön', 'freudig', 'zufrieden'],
            neutral: ['ok', 'okay', 'normal', 'standard', 'üblich', 'möchte', 'brauche', 'suche']
        };
        
        const scores = {};
        Object.keys(emotions).forEach(emotion => {
            scores[emotion] = emotions[emotion].reduce((score, keyword) => {
                return score + (queryLower.includes(keyword) ? 1 : 0);
            }, 0);
        });
        
        const bestEmotion = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return {
            state: bestEmotion,
            score: scores[bestEmotion],
            confidence: Math.min(scores[bestEmotion] * 25, 100)
        };
    }
    
    analyzeUrgency(query) {
        const queryLower = query.toLowerCase();
        
        const urgencyKeywords = {
            critical: ['sofort', 'dringend', 'notfall', 'heute', 'jetzt', 'eilig', 'wichtig'],
            high: ['bald', 'schnell', 'wichtig', 'priorität', 'dringend'],
            normal: ['normal', 'standard', 'üblich', 'regulär']
        };
        
        const scores = {};
        Object.keys(urgencyKeywords).forEach(level => {
            scores[level] = urgencyKeywords[level].reduce((score, keyword) => {
                return score + (queryLower.includes(keyword) ? 1 : 0);
            }, 0);
        });
        
        const bestLevel = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return {
            level: bestLevel,
            score: scores[bestLevel],
            confidence: Math.min(scores[bestLevel] * 30, 100)
        };
    }
    
    analyzeLanguage(query) {
        const queryLower = query.toLowerCase();
        
        // Deutsche Indikatoren (inklusive norddeutsche Begrüßungen)
        const germanIndicators = [
            'moin', 'hallo', 'guten tag', 'guten morgen', 'guten abend',
            'deutsch', 'german', 'ich', 'du', 'sie', 'wir', 'ihr',
            'bitte', 'danke', 'entschuldigung', 'ja', 'nein',
            'hilfe', 'brauche', 'möchte', 'kann', 'muss', 'soll',
            'wie', 'was', 'wo', 'wann', 'warum', 'wer'
        ];
        
        // Englische Indikatoren (nur eindeutige)
        const englishIndicators = [
            'hello', 'hi there', 'good morning', 'good afternoon', 'good evening',
            'english', 'englisch', 'i', 'you', 'we', 'they', 'he', 'she',
            'please', 'thank you', 'sorry', 'yes', 'no',
            'help', 'need', 'want', 'can', 'must', 'should',
            'how', 'what', 'where', 'when', 'why', 'who'
        ];
        
        // Prüfe deutsche Indikatoren
        const germanMatches = germanIndicators.filter(indicator => 
            queryLower.includes(indicator)
        ).length;
        
        // Prüfe englische Indikatoren
        const englishMatches = englishIndicators.filter(indicator => 
            queryLower.includes(indicator)
        ).length;
        
        // Entscheidung: Nur bei eindeutig englischen Anfragen wechseln
        if (englishMatches > 0 && germanMatches === 0) {
            return {
                detected: 'english',
                confidence: 90
            };
        }
        
        // Default: Deutsch (auch bei gemischten oder unklaren Anfragen)
        return {
            detected: 'german',
            confidence: Math.min(germanMatches * 20 + 60, 100)
        };
    }
    
    analyzeAccessibility(query) {
        const queryLower = query.toLowerCase();
        
        const accessibilityNeeds = {
            visual: ['blind', 'sehbehindert', 'brille', 'sehen'],
            hearing: ['taub', 'schwerhörig', 'hören', 'hörgerät'],
            mobility: ['rollstuhl', 'gehbehindert', 'laufen', 'bewegung'],
            simple_language: ['einfach', 'verständlich', 'leicht', 'langsam']
        };
        
        const needs = [];
        Object.keys(accessibilityNeeds).forEach(need => {
            if (accessibilityNeeds[need].some(keyword => queryLower.includes(keyword))) {
                needs.push(need);
            }
        });
        
        return {
            needs,
            hasNeeds: needs.length > 0
        };
    }
    
    calculateConfidence(persona, emotionalState, urgency) {
        const personaConfidence = persona.confidence || 0;
        const emotionConfidence = emotionalState.confidence || 0;
        const urgencyConfidence = urgency.confidence || 0;
        
        return Math.round((personaConfidence + emotionConfidence + urgencyConfidence) / 3);
    }
    
    getDefaultPersona() {
        return {
            persona: { type: 'general', confidence: 50 },
            emotionalState: { state: 'neutral', confidence: 50 },
            urgency: { level: 'normal', confidence: 50 },
            language: { detected: 'german', confidence: 60 },
            accessibility: { needs: [], hasNeeds: false },
            confidence: 50,
            processingTime: 0
        };
    }
    
    // Enhanced Intention Recognition
    analyzeIntention(query, sessionContext = {}) {
        const startTime = this.startTimer();
        
        try {
            const queryLower = query.toLowerCase();
            
            // Erweiterte Intention-Keywords
            const intentions = {
                // Bürgerdienste & Dokumente (NEU - PRIORITÄT!) - Erweiterte Liste für bessere Erkennung
                buergerdienste: ['meldebescheinigung', 'meldebescheinigung beantragen', 'meldebescheinigung erhalten',
                                'meldebestätigung', 'wohnsitzbescheinigung', 'wohnsitznachweis',
                                'personalausweis beantragen', 'personalausweis neu', 'personalausweis verlängern',
                                'reisepass verlängern', 'reisepass neu', 'pass beantragen',
                                'bürgerdienste', 'bürgerservice', 'bürgerbüro', 'standesamt meldewesen',
                                'anmeldung', 'anmeldung wohnung', 'wohnsitz anmelden',
                                'ummelden', 'ummelden alt', 'ummelden neu', 'adressänderung',
                                'melderegister', 'melderechtlich', 'meldepflicht'],
                // KFZ
                kfz_zulassung: ['kfz', 'auto', 'fahrzeug', 'zulassung', 'kennzeichen', 'fahrzeugbrief', 'evb', 'versicherung'],
                führerschein: ['führerschein', 'fuehrerschein', 'fahrerlaubnis', 'fahren lernen', 'fahrschule'],
                // Amtliche Angelegenheiten
                bauantrag: ['bauantrag', 'bauen', 'haus', 'gebäude', 'baugenehmigung', 'planung'],
                gewerbe: ['gewerbe', 'gewerbeanmeldung', 'selbständig', 'unternehmen', 'firma'],
                landwirtschaft: ['landwirtschaft', 'landwirt', 'bauer', 'hof', 'tier', 'pflanze'],
                handwerk: ['handwerk', 'handwerker', 'meister', 'ausbildung', 'lehre'],
                studium: ['studium', 'universität', 'hochschule', 'student', 'bafög'],
                // Soziale Dienste
                soziales: ['sozialhilfe', 'grundsicherung', 'hilfe', 'unterstützung', 'sozial', 'bürgergeld', 'wohngeld'],
                gesundheit: ['gesundheit', 'arzt', 'krankenhaus', 'medizin', 'behandlung'],
                bildung: ['bildung', 'schule', 'lernen', 'kurs', 'ausbildung'],
                umwelt: ['umwelt', 'müll', 'abfall', 'recycling', 'nachhaltigkeit'],
                notfall: ['notfall', 'notruf', 'hilfe', 'schnell', 'dringend'],
                tourismus: ['tourismus', 'urlaub', 'besucher', 'gast', 'reise', 'unterkunft']
            };
            
            // Intention-Scoring mit Fuzzy Matching
            const scores = {};
            Object.keys(intentions).forEach(intention => {
                scores[intention] = this.calculateIntentionScore(queryLower, intentions[intention]);
            });
            
            // Beste Intention finden
            const bestIntention = Object.keys(scores).reduce((a, b) => 
                scores[a] > scores[b] ? a : b
            );
            
            // Debug: Log Top 3 Intentions
            const topIntentions = Object.keys(scores)
                .sort((a, b) => scores[b] - scores[a])
                .slice(0, 3)
                .map(key => `${key}:${scores[key].toFixed(3)}`);
            console.log(`🔍 Top Intentions: ${topIntentions.join(', ')}`);
            
            const confidence = scores[bestIntention];
            const isSpecific = confidence > 0; // Jede Intention erkannt, auch wenn gering
            
            const result = {
                type: isSpecific ? bestIntention : 'general',
                intention: isSpecific ? bestIntention : 'general',
                confidence: Math.round(confidence * 100),
                isSpecific,
                processingTime: this.endTimer(startTime),
                alternatives: Object.keys(scores)
                    .filter(key => scores[key] > 0.1)
                    .sort((a, b) => scores[b] - scores[a])
                    .slice(0, 3)
                    .map(key => ({ intention: key, score: scores[key] }))
            };
            
            console.log(`🎯 Intention: ${result.intention} (${result.confidence}%)`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Intention-Analyse Fehler:', error);
            return {
                intention: 'general',
                confidence: 0,
                isSpecific: false,
                processingTime: 0,
                alternatives: []
            };
        }
    }
    
    calculateIntentionScore(query, keywords) {
        let score = 0;
        let exactMatches = 0;
        
        // Exakte Matches haben höchste Priorität
        keywords.forEach(keyword => {
            if (query.includes(keyword)) {
                score += 10; // Exakte Matches zählen stark
                exactMatches++;
            }
        });
        
        // Fuzzy Matching nur wenn keine exakten Matches
        if (exactMatches === 0) {
            keywords.forEach(keyword => {
                if (this.fuzzyMatch(query, keyword)) {
                    score += 0.5;
                }
            });
        }
        
        // Score ist jetzt absolute Zahl, nicht relativ zu keywords.length
        return score;
    }
    
    fuzzyMatch(query, keyword) {
        // Einfache Fuzzy-Matching-Logik
        const queryWords = query.split(' ');
        const keywordWords = keyword.split(' ');
        
        return keywordWords.some(kw => 
            queryWords.some(qw => 
                qw.includes(kw) || kw.includes(qw) || 
                this.levenshteinDistance(qw, kw) <= 2
            )
        );
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    
    // Main Response Generation
    async generateResponse(query, userMessage, sessionId = 'default') {
        const startTime = this.startTimer();
        
        try {
            // Cache-Check
            // Cache prüfen (nur für identische Queries ohne Audio-Kontext)
            const cachedResponse = this.getFromCache(query, sessionId);
            if (cachedResponse) {
                // Session-Kontext prüfen für Audio-Modus
                const session = this.contextMemory.getSession(sessionId);
                const hasAudioContext = session.messages.some(msg => 
                    msg.context && msg.context.communicationMode === 'audio'
                );
                
                if (!hasAudioContext) {
                    console.log('📦 Cache-Hit für Query:', query.substring(0, 50));
                    return cachedResponse;
                }
            }
            
            // Session-Kontext abrufen (vor User-Nachricht hinzufügen)
            const session = this.contextMemory.getSession(sessionId);
            const sessionContext = {
                previousIntention: session.messages.length > 1 ? 
                    session.messages[session.messages.length - 2].context?.intention : null,
                conversationHistory: session.messages.slice(-3)
            };
            
            // Kommunikationsmodus für User-Eingabe erkennen (mit Session-Kontext)
            const userCommunicationMode = this.detectCommunicationMode(query, sessionContext);
            
            // Context-Memory: Nachricht zur Session hinzufügen
            this.contextMemory.addMessage(sessionId, 'user', query, {
                communicationMode: userCommunicationMode.mode
            });
            
            // Session-Kontext erneut abrufen (nach User-Nachricht)
            const updatedSession = this.contextMemory.getSession(sessionId);
            const updatedSessionContext = {
                previousIntention: updatedSession.messages.length > 1 ? 
                    updatedSession.messages[updatedSession.messages.length - 2].context?.intention : null,
                conversationHistory: updatedSession.messages.slice(-3)
            };
            
            // Session-Kontext für Debugging (optional)
            // console.log('🔍 Session-Kontext:', updatedSessionContext);
            
            // Persona-Analyse
            const personaAnalysis = this.analyzePersona(query, updatedSessionContext);
            
            // Intention-Analyse
            const intentionAnalysis = this.analyzeIntention(query, updatedSessionContext);
            
            // Kommunikationsmodus erkennen (Text/Audio)
            const communicationMode = this.detectCommunicationMode(query, updatedSessionContext);
            
            // System-Prompt konforme Antwort generieren
            const response = await this.generateSystemPromptResponse(
                intentionAnalysis.type, 
                personaAnalysis, 
                query, 
                updatedSessionContext
            );
            
            // Finale Sprache für Session-Memory bestimmen
            const finalLanguage = this.determineFinalLanguage(
                this.detectLanguageSwitch(query), 
                updatedSessionContext, 
                personaAnalysis.language.detected
            );
            
            // Dual-Response für Text und Audio generieren
            const dualResponse = this.generateDualResponse(response.response, communicationMode, finalLanguage);
            
            // Cache speichern
            this.setCache(query, sessionId, response);
            
            // Context-Memory: KAYA-Antwort hinzufügen
            this.contextMemory.addMessage(sessionId, 'assistant', dualResponse.text, {
                intention: intentionAnalysis.intention,
                persona: personaAnalysis.persona.type,
                emotionalState: personaAnalysis.emotionalState.state,
                urgency: personaAnalysis.urgency.level,
                agent: response.agent || 'kaya',
                language: finalLanguage || personaAnalysis.language.detected,
                communicationMode: communicationMode.mode,
                audioResponse: dualResponse.audio
            });
            
            // Performance-Metriken aktualisieren
            const responseTime = this.endTimer(startTime);
            this.updateMetrics(responseTime, true);
            
            console.log(`✅ Response generiert in ${responseTime}ms`);
            
            return {
                response: dualResponse.text,
                audio: dualResponse.audio,
                mode: dualResponse.mode,
                language: finalLanguage,
                communicationMode: communicationMode.mode
            };
            
        } catch (error) {
            console.error('❌ Response-Generierung Fehler:', error);
            
            const responseTime = this.endTimer(startTime);
            this.updateMetrics(responseTime, false);
            
            return {
                response: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
                agent: 'kaya',
                error: error.message,
                metadata: {
                    intention: 'general',
                    persona: 'general',
                    emotionalState: 'neutral',
                    urgency: 'normal'
                }
            };
        }
    }
    
    // KAYA Response Generation
    async generateKAYAResponse(query, intentionAnalysis, personaAnalysis, sessionContext) {
        const { intention } = intentionAnalysis;
        const { persona, emotionalState, urgency, language } = personaAnalysis;
        
        // Response-Mapping
        const responseMap = {
            buergerdienste: () => this.generateBuergerdiensteResponse(query, personaAnalysis),
            kfz_zulassung: () => this.generateKFZZulassungResponse(query, personaAnalysis),
            führerschein: () => this.generateFührerscheinResponse(query, personaAnalysis),
            bauantrag: () => this.generateBauantragResponse(query, personaAnalysis),
            gewerbe: () => this.generateGewerbeResponse(query, personaAnalysis),
            landwirtschaft: () => this.generateLandwirtschaftResponse(query, personaAnalysis),
            handwerk: () => this.generateHandwerkResponse(query, personaAnalysis),
            studium: () => this.generateStudiumResponse(query, personaAnalysis),
            soziales: () => this.generateSozialesResponse(query, personaAnalysis),
            gesundheit: () => this.generateGesundheitResponse(query, personaAnalysis),
            bildung: () => this.generateBildungResponse(query, personaAnalysis),
            umwelt: () => this.generateUmweltResponse(query, personaAnalysis),
            notfall: () => this.generateNotfallResponse(query, personaAnalysis),
            tourismus: () => this.generateTourismusResponse(query, personaAnalysis),
            general: () => this.generateGeneralResponse(query, personaAnalysis)
        };
        
        const responseFunction = responseMap[intention] || responseMap.general;
        const response = await responseFunction();
        
        return {
            response: response.response || response,
            agent: 'kaya',
            metadata: {
                intention,
                persona: persona.type,
                emotionalState: emotionalState.state,
                urgency: urgency.level,
                language: language.detected,
                confidence: intentionAnalysis.confidence
            }
        };
    }
    
    // Specific Response Generators
    generateBuergerdiensteResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        // Dynamische Begrüßung basierend auf Persona
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        
        response += `🎯 **Bürgerdienste im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Meldebescheinigung beantragen:**\n`;
        response += `→ [Terminvereinbarung](https://www.oldenburg-kreis.de/buergerservice/meldewesen)\n\n`;
        response += `🆔 **2. Personalausweis oder Reisepass:**\n`;
        response += `→ [Ausweis-Beratung](https://www.oldenburg-kreis.de/buergerservice/dokumente)\n\n`;
        response += `📞 **3. Sofort anrufen:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (urgency.level === 'critical') {
            response += `🚨 **Dringend?** Ruf sofort an oder komm vorbei!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Termin buchen oder direkt anrufen!\n\n`;
        response += `Brauchst du spezielle Hilfe? Sag mir, was du brauchst!`;
        
        return { response };
    }
    
    generateGeneralResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        
        response += `🎯 **Landkreis Oldenburg - Ihre Ansprechpartner:**\n\n`;
        response += `📞 **Hotline:** **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        response += `📋 **Online-Services:**\n`;
        response += `→ [Bürgerportal](https://www.oldenburg-kreis.de)\n`;
        response += `→ [Terminvereinbarung](https://www.oldenburg-kreis.de/buergerservice/termine)\n\n`;
        response += `🎯 **Wie kann ich Ihnen konkret helfen?**\n`;
        response += `Sagen Sie mir, was Sie benötigen - ich unterstütze Sie gerne!`;
        
        return { response };
    }
    
    generateKFZZulassungResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        // Dynamische Begrüßung basierend auf Persona
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        // Konkrete Fragen erkennen
        const concreteQuestion = this.analyzeConcreteQuestion(query, 'kfz_zulassung');
        
        let response = `${greeting}\n\n`;
        
        if (concreteQuestion.hasQuestion) {
            response += `${concreteQuestion.answer}\n\n`;
        }
        
        response += `🎯 **KFZ-Zulassung im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Online-Termin buchen:**\n`;
        response += `→ [Terminvereinbarung KFZ-Zulassung](https://www.oldenburg-kreis.de/buergerservice/kfz-zulassung/terminvereinbarung)\n\n`;
        response += `📄 **2. Formulare ausfüllen:**\n`;
        response += `→ [Antragsformulare KFZ](https://www.oldenburg-kreis.de/buergerservice/kfz-zulassung/formulare)\n\n`;
        response += `📞 **3. Sofort anrufen:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (urgency.level === 'critical') {
            response += `🚨 **Dringend?** Ruf sofort an oder komm vorbei!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Klick auf den Termin-Link oder ruf direkt an!\n\n`;
        response += `Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!`;
        
        return { response };
    }
    
    generateFührerscheinResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Führerschein im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Fahrschule finden:**\n`;
        response += `→ [Fahrschulen-Verzeichnis](https://www.oldenburg-kreis.de/buergerservice/fuehrerschein/fahrschulen)\n\n`;
        response += `📄 **2. Antrag stellen:**\n`;
        response += `→ [Führerschein-Antrag](https://www.oldenburg-kreis.de/buergerservice/fuehrerschein/antrag)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (persona.type === 'youth' || persona.type === 'student') {
            response += `🎓 **Für Jugendliche:** Es gibt spezielle Förderungen und Beratungen!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Informiere dich über Fahrschulen oder ruf an!`;
        
        return { response };
    }
    
    generateBauantragResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Bauantrag im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Bauantrag stellen:**\n`;
        response += `→ [Bauantrag-Formular](https://www.oldenburg-kreis.de/buergerservice/bauen/bauantrag)\n\n`;
        response += `📄 **2. Unterlagen bereithalten:**\n`;
        response += `→ [Unterlagen-Liste](https://www.oldenburg-kreis.de/buergerservice/bauen/unterlagen)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (urgency.level === 'critical') {
            response += `🚨 **Dringend?** Ruf sofort an für Express-Bearbeitung!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Lade das Formular herunter oder ruf an!`;
        
        return { response };
    }
    
    generateGewerbeResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Gewerbeanmeldung im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Gewerbe anmelden:**\n`;
        response += `→ [Gewerbeanmeldung](https://www.oldenburg-kreis.de/buergerservice/gewerbe/anmeldung)\n\n`;
        response += `📄 **2. Formulare ausfüllen:**\n`;
        response += `→ [Gewerbe-Formulare](https://www.oldenburg-kreis.de/buergerservice/gewerbe/formulare)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (persona.type === 'small_business') {
            response += `💼 **Für Kleinunternehmer:** Es gibt spezielle Beratungen und Förderungen!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Melde dein Gewerbe an oder ruf an!`;
        
        return { response };
    }
    
    generateLandwirtschaftResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Landwirtschaft im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Landwirtschaftliche Beratung:**\n`;
        response += `→ [Landwirtschaftsamt](https://www.oldenburg-kreis.de/buergerservice/landwirtschaft/beratung)\n\n`;
        response += `📄 **2. Anträge und Formulare:**\n`;
        response += `→ [Landwirtschaft-Formulare](https://www.oldenburg-kreis.de/buergerservice/landwirtschaft/formulare)\n\n`;
        response += `📞 **3. Direkter Kontakt:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (persona.type === 'farmer') {
            response += `🚜 **Für Landwirte:** Spezielle Förderungen und Beratungen verfügbar!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Kontaktiere das Landwirtschaftsamt oder ruf an!`;
        
        return { response };
    }
    
    generateHandwerkResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Handwerk im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Handwerkskammer:**\n`;
        response += `→ [Handwerkskammer](https://www.oldenburg-kreis.de/buergerservice/handwerk/kammer)\n\n`;
        response += `📄 **2. Ausbildung und Meister:**\n`;
        response += `→ [Handwerk-Ausbildung](https://www.oldenburg-kreis.de/buergerservice/handwerk/ausbildung)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (persona.type === 'craftsman') {
            response += `🔨 **Für Handwerker:** Spezielle Förderungen und Weiterbildungen!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Kontaktiere die Handwerkskammer oder ruf an!`;
        
        return { response };
    }
    
    generateStudiumResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Studium im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Hochschulen:**\n`;
        response += `→ [Hochschulen-Verzeichnis](https://www.oldenburg-kreis.de/buergerservice/bildung/hochschulen)\n\n`;
        response += `📄 **2. BAföG und Stipendien:**\n`;
        response += `→ [Studienfinanzierung](https://www.oldenburg-kreis.de/buergerservice/bildung/finanzierung)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (persona.type === 'student') {
            response += `🎓 **Für Studenten:** Spezielle Beratungen und Förderungen!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Informiere dich über Hochschulen oder ruf an!`;
        
        return { response };
    }
    
    generateSozialesResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Soziales im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Sozialhilfe und Grundsicherung:**\n`;
        response += `→ [Sozialhilfe](https://www.oldenburg-kreis.de/buergerservice/soziales/hilfe)\n\n`;
        response += `📄 **2. Anträge stellen:**\n`;
        response += `→ [Sozial-Anträge](https://www.oldenburg-kreis.de/buergerservice/soziales/antraege)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (persona.type === 'low_income' || persona.type === 'unemployed') {
            response += `💙 **Für Hilfesuchende:** Spezielle Beratungen und Unterstützungen!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Kontaktiere das Sozialamt oder ruf an!`;
        
        return { response };
    }
    
    generateGesundheitResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Gesundheit im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Gesundheitsamt:**\n`;
        response += `→ [Gesundheitsamt](https://www.oldenburg-kreis.de/buergerservice/gesundheit/amt)\n\n`;
        response += `📄 **2. Impfungen und Vorsorge:**\n`;
        response += `→ [Gesundheitsvorsorge](https://www.oldenburg-kreis.de/buergerservice/gesundheit/vorsorge)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (urgency.level === 'critical') {
            response += `🚨 **Notfall?** Ruf sofort den Notruf: **112**\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Kontaktiere das Gesundheitsamt oder ruf an!`;
        
        return { response };
    }
    
    generateBildungResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Bildung im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Schulen und Bildungseinrichtungen:**\n`;
        response += `→ [Bildungseinrichtungen](https://www.oldenburg-kreis.de/buergerservice/bildung/schulen)\n\n`;
        response += `📄 **2. Kurse und Weiterbildung:**\n`;
        response += `→ [Weiterbildung](https://www.oldenburg-kreis.de/buergerservice/bildung/kurse)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (persona.type === 'low_education') {
            response += `📚 **Für Lernwillige:** Spezielle Kurse und Unterstützungen!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Informiere dich über Bildungseinrichtungen oder ruf an!`;
        
        return { response };
    }
    
    generateUmweltResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Umwelt im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Umweltamt:**\n`;
        response += `→ [Umweltamt](https://www.oldenburg-kreis.de/buergerservice/umwelt/amt)\n\n`;
        response += `📄 **2. Müll und Recycling:**\n`;
        response += `→ [Abfallwirtschaft](https://www.oldenburg-kreis.de/buergerservice/umwelt/abfall)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (persona.type === 'environmentally_conscious') {
            response += `🌱 **Für Umweltbewusste:** Spezielle Programme und Förderungen!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Kontaktiere das Umweltamt oder ruf an!`;
        
        return { response };
    }
    
    generateNotfallResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🚨 **NOTFALL-HILFE:**\n\n`;
        response += `📞 **Sofort anrufen:**\n`;
        response += `→ **Notruf: 112**\n`;
        response += `→ **Polizei: 110**\n\n`;
        response += `📋 **Weitere Notfallnummern:**\n`;
        response += `→ [Notfallnummern](https://www.oldenburg-kreis.de/buergerservice/notfall/nummern)\n\n`;
        response += `📄 **Notfall-Informationen:**\n`;
        response += `→ [Notfall-Infos](https://www.oldenburg-kreis.de/buergerservice/notfall/infos)\n\n`;
        
        if (urgency.level === 'critical') {
            response += `🚨 **KRITISCHER NOTFALL:** Ruf sofort **112** an!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Bei Notfall sofort **112** anrufen!`;
        
        return { response };
    }
    
    generateTourismusResponse(query, personaAnalysis) {
        const { persona, emotionalState, urgency } = personaAnalysis;
        
        const greeting = this.getDynamicGreeting(persona, emotionalState);
        
        let response = `${greeting}\n\n`;
        response += `🎯 **Tourismus im Landkreis Oldenburg:**\n\n`;
        response += `📋 **1. Tourismus-Information:**\n`;
        response += `→ [Tourismus-Info](https://www.oldenburg-kreis.de/tourismus/information)\n\n`;
        response += `📄 **2. Unterkünfte:**\n`;
        response += `→ [Unterkünfte](https://www.oldenburg-kreis.de/tourismus/unterkuenfte)\n\n`;
        response += `📞 **3. Beratung:**\n`;
        response += `→ **04431 85-0** (Mo-Fr 8-16 Uhr)\n\n`;
        
        if (persona.type === 'tourist' || persona.type === 'family_tourist') {
            response += `🏖️ **Für Touristen:** Spezielle Angebote und Informationen!\n\n`;
        }
        
        response += `🎯 **Deine nächste Aktion:** Informiere dich über Tourismus-Angebote oder ruf an!`;
        
        return { response };
    }
    
    // Dynamic Response Helpers
    getDynamicGreeting(persona, emotionalState, language = 'german') {
        // Sprache automatisch bestimmen basierend auf Persona-Kontext
        // Default: Deutsch (norddeutsche Begrüßung)
        const finalLanguage = language || 'german';
        // Norddeutsche Begrüßungen mit System-Prompt konformen Redewendungen
        const norddeutscheGreetings = {
            german: {
                senior: ['Moin!', 'Guten Tag!', 'Hallo!'],
                youth: ['Moin!', 'Hey!', 'Hi!'],
                family: ['Moin!', 'Hallo!', 'Guten Tag!'],
                migrant: ['Moin!', 'Hallo!', 'Guten Tag!'],
                disabled: ['Moin!', 'Hallo!', 'Guten Tag!'],
                farmer: ['Moin!', 'Hallo!', 'Guten Tag!'],
                craftsman: ['Moin!', 'Hallo!', 'Guten Tag!'],
                student: ['Moin!', 'Hey!', 'Hi!'],
                unemployed: ['Moin!', 'Hallo!', 'Guten Tag!'],
                pensioner: ['Moin!', 'Hallo!', 'Guten Tag!'],
                single_parent: ['Moin!', 'Hallo!', 'Guten Tag!'],
                small_business: ['Moin!', 'Hallo!', 'Guten Tag!'],
                child: ['Moin!', 'Hey!', 'Hallo!'],
                commuter: ['Moin!', 'Hallo!', 'Guten Tag!'],
                housing_seeker: ['Moin!', 'Hallo!', 'Guten Tag!'],
                care_dependent: ['Moin!', 'Hallo!', 'Guten Tag!'],
                low_income: ['Moin!', 'Hallo!', 'Guten Tag!'],
                sports_interested: ['Moin!', 'Hey!', 'Hi!'],
                culture_interested: ['Moin!', 'Hallo!', 'Guten Tag!'],
                plattdeutsch_speaker: ['Moin!', 'Hallo!', 'Guten Tag!'],
                low_education: ['Moin!', 'Hallo!', 'Guten Tag!'],
                mobility_needs: ['Moin!', 'Hallo!', 'Guten Tag!'],
                tourist: ['Moin!', 'Hallo!', 'Guten Tag!'],
                camper: ['Moin!', 'Hallo!', 'Guten Tag!'],
                accommodation_seeker: ['Moin!', 'Hallo!', 'Guten Tag!'],
                sightseeing_tourist: ['Moin!', 'Hallo!', 'Guten Tag!'],
                active_tourist: ['Moin!', 'Hey!', 'Hi!'],
                family_tourist: ['Moin!', 'Hallo!', 'Guten Tag!'],
                wellness_tourist: ['Moin!', 'Hallo!', 'Guten Tag!'],
                culinary_tourist: ['Moin!', 'Hallo!', 'Guten Tag!'],
                shopping_tourist: ['Moin!', 'Hallo!', 'Guten Tag!'],
                event_tourist: ['Moin!', 'Hallo!', 'Guten Tag!'],
                general: ['Moin!', 'Hallo!', 'Guten Tag!']
            },
            english: {
                general: ['Hello!', 'Hi!', 'Good day!']
            },
            turkish: {
                general: ['Merhaba!', 'Selam!', 'İyi günler!']
            },
            arabic: {
                general: ['مرحبا!', 'أهلا!', 'يوم سعيد!']
            },
            polish: {
                general: ['Cześć!', 'Dzień dobry!', 'Witam!']
            },
            russian: {
                general: ['Привет!', 'Здравствуйте!', 'Добрый день!']
            },
            romanian: {
                general: ['Salut!', 'Bună ziua!', 'Bună!']
            },
            ukrainian: {
                general: ['Привіт!', 'Добрий день!', 'Вітаю!']
            },
            dutch: {
                general: ['Hallo!', 'Hoi!', 'Goedendag!']
            },
            danish: {
                general: ['Hej!', 'Goddag!', 'Hallo!']
            },
            plattdeutsch: {
                general: ['Moin!', 'Hallo!', 'Guten Dag!']
            }
        };
        
        const languageGreetings = norddeutscheGreetings[finalLanguage] || norddeutscheGreetings.german;
        const personaGreetings = languageGreetings[persona.type] || languageGreetings.general;
        const randomGreeting = personaGreetings[Math.floor(Math.random() * personaGreetings.length)];
        
        // System-Prompt konforme Einleitung
        const introductions = {
            german: 'Ich bin KAYA, Ihr kommunaler KI-Assistent für den Landkreis Oldenburg.',
            english: 'I am KAYA, your municipal AI assistant for Landkreis Oldenburg.',
            turkish: 'Ben KAYA, Landkreis Oldenburg için belediye yapay zeka asistanınızım.',
            arabic: 'أنا KAYA، مساعدك الذكي البلدي لمقاطعة أولدنبورغ.',
            polish: 'Jestem KAYA, Twój miejski asystent AI dla Landkreis Oldenburg.',
            russian: 'Я KAYA, ваш муниципальный ИИ-помощник для Landkreis Oldenburg.',
            romanian: 'Sunt KAYA, asistentul tău comunal AI pentru Landkreis Oldenburg.',
            ukrainian: 'Я KAYA, ваш муніципальний ШІ-помічник для Landkreis Oldenburg.',
            dutch: 'Ik ben KAYA, uw gemeentelijke AI-assistent voor Landkreis Oldenburg.',
            danish: 'Jeg er KAYA, din kommunale AI-assistent for Landkreis Oldenburg.',
            plattdeutsch: 'Ik bin KAYA, dien kommunalen KI-Assistent för den Landkreis Oldenburg.'
        };
        
        const introduction = introductions[finalLanguage] || introductions.german;
        
        return `${randomGreeting} ${introduction}`;
    }
    
    // 5-Schritte-Antwortprinzip nach System-Prompt
    generateSystemPromptResponse(intention, personaAnalysis, query, sessionContext) {
        const { persona, emotionalState, urgency, accessibility } = personaAnalysis;
        
        // Sprache explizit auf Deutsch setzen (außer bei eindeutigem Englisch)
        const queryLower = query.toLowerCase();
        const hasEnglishPhrases = ['hello', 'hi there', 'good morning', 'good afternoon', 'good evening'].some(phrase => 
            queryLower.includes(phrase)
        );
        const hasGermanPhrases = ['moin', 'hallo', 'guten tag', 'guten morgen', 'guten abend'].some(phrase => 
            queryLower.includes(phrase)
        );
        
        // Nur bei eindeutig englischen Anfragen ohne deutsche Indikatoren wechseln
        const finalLanguage = (hasEnglishPhrases && !hasGermanPhrases) ? 'english' : 'german';
        
        // Sprachwechsel prüfen
        const languageSwitch = this.detectLanguageSwitch(query);
        
        // Sprache aus Session-Kontext oder aktuelle Sprache verwenden
        const sessionLanguage = this.determineFinalLanguage(languageSwitch, sessionContext, finalLanguage);
        
        // Empathische, menschliche Antwort generieren
        const response = this.generateEmpatheticResponse(intention, personaAnalysis, query, sessionContext, sessionLanguage);
        
        return { response };
    }
    
    determineFinalLanguage(languageSwitch, sessionContext, currentLanguage) {
        // WICHTIG: Query-Sprache hat höchste Priorität!
        
        // Wenn aktuelle Query eindeutig Englisch/Deutsch ist, verwende diese
        if (currentLanguage === 'english' || currentLanguage === 'german') {
            return currentLanguage;
        }
        
        // Wenn Sprachwechsel erkannt wurde, diese Sprache verwenden
        if (languageSwitch.detected) {
            return languageSwitch.language;
        }
        
        // Session-Kontext prüfen für Sprachkonsistenz (nur wenn Query-Sprache unklar)
        if (sessionContext && sessionContext.conversationHistory && sessionContext.conversationHistory.length > 0) {
            // Letzte Nachrichten durchgehen um Sprache zu finden
            for (let i = sessionContext.conversationHistory.length - 1; i >= 0; i--) {
                const message = sessionContext.conversationHistory[i];
                if (message && message.context && message.context.language) {
                    return message.context.language;
                }
            }
        }
        
        // Fallback: Immer Deutsch als Standard
        return 'german';
    }
    
    // Audio-Chat-Integration
    detectCommunicationMode(query, sessionContext) {
        // Prüfen ob es sich um Audio-Eingabe handelt
        const audioIndicators = ['audio', 'voice', 'spoken', 'speech', 'microphone'];
        const queryLower = query.toLowerCase();
        
        const isAudioInput = audioIndicators.some(indicator => queryLower.includes(indicator));
        
        // Session-Kontext prüfen für Kommunikationsmodus
        let communicationMode = 'text'; // Standard: Text
        
        if (sessionContext && sessionContext.conversationHistory && sessionContext.conversationHistory.length > 0) {
            // Letzte Nachrichten durchgehen um Kommunikationsmodus zu finden
            for (let i = sessionContext.conversationHistory.length - 1; i >= 0; i--) {
                const message = sessionContext.conversationHistory[i];
                if (message && message.context && message.context.communicationMode) {
                    communicationMode = message.context.communicationMode;
                    // console.log('🔍 Kommunikationsmodus gefunden:', message.context.communicationMode);
                    break;
                }
            }
        }
        
        // Audio-Kontext beibehalten: Wenn letzte Nachricht Audio war, bleibt Audio-Modus aktiv
        const shouldMaintainAudioMode = communicationMode === 'audio' && !isAudioInput;
        
        const result = {
            mode: isAudioInput ? 'audio' : (shouldMaintainAudioMode ? 'audio' : communicationMode),
            isAudioInput,
            requiresDualResponse: isAudioInput || communicationMode === 'audio' || shouldMaintainAudioMode
        };
        
        // console.log('🔍 Kommunikationsmodus-Erkennung:', result);
        
        return result;
    }
    
    // Dual-Response-System für Text und Audio
    generateDualResponse(textResponse, communicationMode, language) {
        if (communicationMode.mode === 'audio' || communicationMode.requiresDualResponse) {
            return {
                text: textResponse,
                audio: this.generateAudioResponse(textResponse, language),
                mode: 'dual'
            };
        }
        
        return {
            text: textResponse,
            audio: null,
            mode: 'text'
        };
    }
    
    generateAudioResponse(textResponse, language) {
        // Audio-spezifische Anpassungen
        const audioAdaptations = {
            german: {
                // Kürzere Sätze für Audio
                'Ich löse das für Sie:': 'Ich löse das für Sie.',
                'Los geht\'s!': 'Los geht\'s!',
                'Was ist Ihr nächster Schritt?': 'Was ist Ihr nächster Schritt?'
            },
            english: {
                'I\'ll solve this for you:': 'I\'ll solve this for you.',
                'Let\'s go!': 'Let\'s go!',
                'What\'s your next step?': 'What\'s your next step?'
            }
        };
        
        const languageAdaptations = audioAdaptations[language] || audioAdaptations.german;
        let audioResponse = textResponse;
        
        // Audio-spezifische Anpassungen anwenden
        Object.keys(languageAdaptations).forEach(text => {
            const audio = languageAdaptations[text];
            audioResponse = audioResponse.replace(text, audio);
        });
        
        return audioResponse;
    }
    
    // Empathische, menschliche Antwort-Generierung
    generateEmpatheticResponse(intention, personaAnalysis, query, sessionContext, language) {
        const { persona, emotionalState, urgency, accessibility } = personaAnalysis;
        
        // Sprache explizit auf Deutsch setzen (außer bei eindeutigem Englisch)
        const queryLower = query.toLowerCase();
        const hasEnglishPhrases = ['hello', 'hi there', 'good morning', 'good afternoon', 'good evening'].some(phrase => 
            queryLower.includes(phrase)
        );
        const hasGermanPhrases = ['moin', 'hallo', 'guten tag', 'guten morgen', 'guten abend'].some(phrase => 
            queryLower.includes(phrase)
        );
        
        // Nur bei eindeutig englischen Anfragen ohne deutsche Indikatoren wechseln
        const finalLanguage = (hasEnglishPhrases && !hasGermanPhrases) ? 'english' : 'german';
        
        // User-Namen extrahieren
        const userName = this.extractUserName(query);
        
        // Empathische Begrüßung basierend auf Emotion und Persona
        let response = this.getEmpatheticGreeting(userName, persona, emotionalState, finalLanguage);
        
        // Emotionale Unterstützung bei Frustration/Ängsten
        if (emotionalState.state === 'frustrated' || emotionalState.state === 'anxious') {
            response += this.getEmotionalSupport(emotionalState.state, finalLanguage);
        }
        
        // Zielstrebiges Lösen statt nur Helfen
        response += this.getSolutionOrientedResponse(intention, query, finalLanguage);
        
        // Konkrete Lösungsschritte
        response += this.getConcreteSolutionSteps(intention, urgency, finalLanguage);
        
        // Persönliche Ansprache
        if (userName) {
            response += this.getPersonalAddress(userName, intention, finalLanguage);
        }
        
        // Dynamische Abschlussfrage mit Handlungsaufforderung
        response += this.getActionOrientedClosing(intention, emotionalState, persona, finalLanguage);
        
        // Barrierefreie Anpassungen
        if (accessibility && accessibility.needs.length > 0) {
            response = this.generateAccessibleResponse(response, accessibility.needs, finalLanguage);
        }
        
        return response;
    }
    
    extractUserName(query) {
        // Einfache Namenserkennung mit Filterung
        const namePatterns = [
            /ich bin (\w+)/i,
            /mein name ist (\w+)/i,
            /ich heiße (\w+)/i,
            /ich bin der (\w+)/i,
            /ich bin die (\w+)/i
        ];
        
        // Wörter die keine Namen sind
        const notNames = ['verzweifelt', 'hilflos', 'überfordert', 'verwirrt', 'gestresst', 'nervös', 'unsicher'];
        
        for (const pattern of namePatterns) {
            const match = query.match(pattern);
            if (match && !notNames.includes(match[1].toLowerCase())) {
                return match[1];
            }
        }
        
        return null;
    }
    
    getEmpatheticGreeting(userName, persona, emotionalState, language) {
        // Verwende die übergebene Sprache
        const finalLanguage = language || 'german';
        
        const greetings = {
            german: {
                frustrated: userName ? `Moin ${userName}! Ich verstehe, dass das gerade schwierig ist.` : 'Moin! Ich verstehe, dass das gerade schwierig ist.',
                anxious: userName ? `Moin ${userName}! Keine Sorge, wir kriegen das hin.` : 'Moin! Keine Sorge, wir kriegen das hin.',
                positive: userName ? `Moin ${userName}! Schön, dass Sie da sind.` : 'Moin! Schön, dass Sie da sind.',
                neutral: userName ? `Moin ${userName}! Wie kann ich Ihnen helfen?` : 'Moin! Wie kann ich Ihnen helfen?'
            },
            english: {
                frustrated: userName ? `Hello ${userName}! I understand this is difficult right now.` : 'Hello! I understand this is difficult right now.',
                anxious: userName ? `Hello ${userName}! Don\'t worry, we\'ll figure this out.` : 'Hello! Don\'t worry, we\'ll figure this out.',
                positive: userName ? `Hello ${userName}! Great to see you here.` : 'Hello! Great to see you here.',
                neutral: 'Moin! Wie kann ich Ihnen helfen?'
            }
        };
        
        const languageGreetings = greetings[finalLanguage] || greetings.german;
        return languageGreetings[emotionalState.state] || languageGreetings.neutral;
    }
    
    getEmotionalSupport(emotion, language) {
        // Verwende die übergebene Sprache
        const finalLanguage = language || 'german';
        
        const support = {
            german: {
                frustrated: '\n\nIch weiß, dass das alles kompliziert wirken kann. Aber keine Sorge - Schritt für Schritt kriegen wir das hin. ',
                anxious: '\n\nIch bin hier, um Ihnen zu helfen. Gemeinsam finden wir eine Lösung. '
            },
            english: {
                frustrated: '\n\nI know this can seem complicated. But don\'t worry - step by step we\'ll get this done. ',
                anxious: '\n\nI\'m here to help you. Together we\'ll find a solution. '
            }
        };
        
        const languageSupport = support[finalLanguage] || support.german;
        return languageSupport[emotion] || '';
    }
    
    getConcreteHelp(intention, query, language) {
        // Verwende die übergebene Sprache
        const finalLanguage = language || 'german';
        
        // Konkrete Hilfe basierend auf Intention und Query
        const help = {
            german: {
                kfz_zulassung: 'Bei der KFZ-Zulassung helfe ich Ihnen gerne. ',
                führerschein: 'Beim Führerschein unterstütze ich Sie gerne. ',
                bauantrag: 'Bei Bauanträgen bin ich Ihr Ansprechpartner. ',
                gewerbe: 'Bei der Gewerbeanmeldung helfe ich Ihnen. ',
                general: 'Ich helfe Ihnen gerne bei Ihrem Anliegen. '
            },
            english: {
                kfz_zulassung: 'I\'d be happy to help you with vehicle registration. ',
                führerschein: 'I\'d be happy to help you with driver\'s license. ',
                bauantrag: 'I\'m your contact for building permits. ',
                gewerbe: 'I\'d be happy to help you with business registration. ',
                general: 'I\'d be happy to help you with your request. '
            }
        };
        
        const languageHelp = help[finalLanguage] || help.german;
        return languageHelp[intention] || languageHelp.general;
    }
    
    getPersonalAddress(userName, intention, language) {
        // Verwende die übergebene Sprache
        const finalLanguage = language || 'german';
        
        const address = {
            german: {
                kfz_zulassung: `${userName}, bei der KFZ-Zulassung geht es so: `,
                führerschein: `${userName}, beim Führerschein ist das so: `,
                bauantrag: `${userName}, bei Bauanträgen läuft das so: `,
                gewerbe: `${userName}, bei der Gewerbeanmeldung ist das so: `,
                general: `${userName}, so funktioniert das: `
            },
            english: {
                kfz_zulassung: `${userName}, vehicle registration works like this: `,
                führerschein: `${userName}, driver\'s license works like this: `,
                bauantrag: `${userName}, building permits work like this: `,
                gewerbe: `${userName}, business registration works like this: `,
                general: `${userName}, this is how it works: `
            }
        };
        
        const languageAddress = address[finalLanguage] || address.german;
        return languageAddress[intention] || languageAddress.general;
    }
    
    getSolutionOrientedResponse(intention, query, language) {
        // Verwende die übergebene Sprache
        const finalLanguage = language || 'german';
        
        const solutions = {
            german: {
                kfz_zulassung: 'Ich löse das für Sie: ',
                führerschein: 'Ich löse das für Sie: ',
                bauantrag: 'Ich löse das für Sie: ',
                gewerbe: 'Ich löse das für Sie: ',
                general: 'Ich löse das für Sie: '
            },
            english: {
                kfz_zulassung: 'I\'ll solve this for you: ',
                führerschein: 'I\'ll solve this for you: ',
                bauantrag: 'I\'ll solve this for you: ',
                gewerbe: 'I\'ll solve this for you: ',
                general: 'I\'ll solve this for you: '
            }
        };
        
        const languageSolutions = solutions[finalLanguage] || solutions.german;
        return languageSolutions[intention] || languageSolutions.general;
    }
    
    getConcreteSolutionSteps(intention, urgency, language) {
        // Verwende die übergebene Sprache
        const finalLanguage = language || 'german';
        
        const steps = {
            german: {
                kfz_zulassung: urgency.level === 'critical' ? 
                    '1. Sofort anrufen: 04431 85-0\n2. Notfall-Termin vereinbaren\n3. Unterlagen mitbringen\n\n' :
                    '1. Termin online buchen\n2. Unterlagen vorbereiten\n3. Zur Zulassungsstelle gehen\n\n',
                führerschein: '1. Fahrschule finden\n2. Anmelden und Prüfungen machen\n3. Führerschein beantragen\n\n',
                bauantrag: '1. Bauplan erstellen\n2. Antrag stellen\n3. Genehmigung abwarten\n\n',
                gewerbe: '1. Gewerbeanmeldung ausfüllen\n2. Unterlagen einreichen\n3. Gewerbeschein erhalten\n\n',
                general: '1. Kontakt aufnehmen\n2. Unterlagen bereitstellen\n3. Bearbeitung abwarten\n\n'
            },
            english: {
                kfz_zulassung: urgency.level === 'critical' ? 
                    '1. Call immediately: 04431 85-0\n2. Book emergency appointment\n3. Bring documents\n\n' :
                    '1. Book appointment online\n2. Prepare documents\n3. Go to registration office\n\n',
                führerschein: '1. Find driving school\n2. Register and take exams\n3. Apply for driver\'s license\n\n',
                bauantrag: '1. Create building plan\n2. Submit application\n3. Wait for approval\n\n',
                gewerbe: '1. Fill out business registration\n2. Submit documents\n3. Receive business license\n\n',
                general: '1. Make contact\n2. Prepare documents\n3. Wait for processing\n\n'
            }
        };
        
        const languageSteps = steps[finalLanguage] || steps.german;
        return languageSteps[intention] || languageSteps.general;
    }
    
    getActionOrientedClosing(intention, emotionalState, persona, language) {
        // Verwende die übergebene Sprache
        const finalLanguage = language || 'german';
        
        const closings = {
            german: {
                frustrated: 'Jetzt handeln wir! Was brauchen Sie zuerst?',
                anxious: 'Ich führe Sie Schritt für Schritt. Womit starten wir?',
                positive: 'Perfekt! Dann machen wir das jetzt!',
                neutral: 'Los geht\'s! Was ist Ihr nächster Schritt?'
            },
            english: {
                frustrated: 'Let\'s act now! What do you need first?',
                anxious: 'I\'ll guide you step by step. Where do we start?',
                positive: 'Perfect! Let\'s do this now!',
                neutral: 'Let\'s go! What\'s your next step?'
            }
        };
        
        const languageClosings = closings[finalLanguage] || closings.german;
        return languageClosings[emotionalState.state] || languageClosings.neutral;
    }
    
    getDynamicClosing(intention, emotionalState, persona, language) {
        // Verwende die übergebene Sprache
        const finalLanguage = language || 'german';
        
        const closings = {
            german: {
                frustrated: 'Kriegen wir zusammen hin!',
                anxious: 'Ich bin für Sie da.',
                positive: 'Perfekt!',
                neutral: 'Gerne helfe ich weiter.'
            },
            english: {
                frustrated: 'We\'ll get this done together!',
                anxious: 'I\'m here for you.',
                positive: 'Perfect!',
                neutral: 'Happy to help further.'
            }
        };
        
        const languageClosings = closings[finalLanguage] || closings.german;
        return languageClosings[emotionalState.state] || languageClosings.neutral;
    }
    
    getGoalReflection(intention, query, language) {
        const reflections = {
            german: {
                kfz_zulassung: 'Butter bei die Fische: Sie möchten Ihr Fahrzeug im Landkreis Oldenburg zulassen.',
                führerschein: 'Sie möchten einen Führerschein im Landkreis Oldenburg machen.',
                bauantrag: 'Sie möchten einen Bauantrag im Landkreis Oldenburg stellen.',
                gewerbe: 'Sie möchten ein Gewerbe im Landkreis Oldenburg anmelden.',
                landwirtschaft: 'Sie möchten landwirtschaftliche Dienstleistungen im Landkreis Oldenburg nutzen.',
                handwerk: 'Sie möchten handwerkliche Dienstleistungen im Landkreis Oldenburg nutzen.',
                studium: 'Sie möchten studieren oder studienbezogene Dienstleistungen nutzen.',
                soziales: 'Sie möchten soziale Dienstleistungen im Landkreis Oldenburg nutzen.',
                gesundheit: 'Sie möchten gesundheitsbezogene Dienstleistungen im Landkreis Oldenburg nutzen.',
                bildung: 'Sie möchten bildungsbezogene Dienstleistungen im Landkreis Oldenburg nutzen.',
                umwelt: 'Sie möchten umweltbezogene Dienstleistungen im Landkreis Oldenburg nutzen.',
                notfall: 'Sie benötigen sofortige Hilfe im Landkreis Oldenburg.',
                tourismus: 'Sie möchten touristische Angebote im Landkreis Oldenburg nutzen.'
            },
            english: {
                kfz_zulassung: 'You want to register your vehicle in Landkreis Oldenburg.',
                führerschein: 'You want to get a driver\'s license in Landkreis Oldenburg.',
                bauantrag: 'You want to apply for a building permit in Landkreis Oldenburg.',
                gewerbe: 'You want to register a business in Landkreis Oldenburg.',
                landwirtschaft: 'You want to use agricultural services in Landkreis Oldenburg.',
                handwerk: 'You want to use craft services in Landkreis Oldenburg.',
                studium: 'You want to study or use study-related services.',
                soziales: 'You want to use social services in Landkreis Oldenburg.',
                gesundheit: 'You want to use health services in Landkreis Oldenburg.',
                bildung: 'You want to use educational services in Landkreis Oldenburg.',
                umwelt: 'You want to use environmental services in Landkreis Oldenburg.',
                notfall: 'You need immediate help in Landkreis Oldenburg.',
                tourismus: 'You want to use tourist services in Landkreis Oldenburg.'
            }
        };
        
        const languageReflections = reflections['german'] || reflections.german;
        return languageReflections[intention] || languageReflections.general || 'Sie möchten eine Dienstleistung im Landkreis Oldenburg nutzen.';
    }
    
    getActionSteps(intention, persona, urgency, language) {
        const steps = {
            german: {
                kfz_zulassung: [
                    '1. Benötigt: Ausweis, Zulassungsbescheinigung I/II, eVB-Nummer.',
                    '2. Termin online buchen oder Unterlagen digital vorbereiten.',
                    '3. Gebühren vor Ort bezahlen.'
                ],
                führerschein: [
                    '1. Fahrschule finden und anmelden.',
                    '2. Theorie- und Praxisprüfung absolvieren.',
                    '3. Führerschein beantragen.'
                ],
                bauantrag: [
                    '1. Bauplan und Unterlagen vorbereiten.',
                    '2. Bauantrag stellen.',
                    '3. Genehmigung abwarten.'
                ],
                gewerbe: [
                    '1. Gewerbeanmeldung ausfüllen.',
                    '2. Unterlagen einreichen.',
                    '3. Gewerbeschein erhalten.'
                ],
                notfall: [
                    '1. Notruf 112 wählen.',
                    '2. Sachverhalt schildern.',
                    '3. Anweisungen befolgen.'
                ]
            },
            english: {
                kfz_zulassung: [
                    '1. Required: ID, vehicle registration I/II, eVB number.',
                    '2. Book appointment online or prepare documents digitally.',
                    '3. Pay fees on site.'
                ],
                führerschein: [
                    '1. Find and register at driving school.',
                    '2. Complete theory and practical exam.',
                    '3. Apply for driver\'s license.'
                ],
                bauantrag: [
                    '1. Prepare building plan and documents.',
                    '2. Submit building application.',
                    '3. Wait for approval.'
                ],
                gewerbe: [
                    '1. Fill out business registration.',
                    '2. Submit documents.',
                    '3. Receive business license.'
                ],
                notfall: [
                    '1. Call emergency number 112.',
                    '2. Describe the situation.',
                    '3. Follow instructions.'
                ]
            }
        };
        
        const languageSteps = steps['german'] || steps.german;
        const intentionSteps = languageSteps[intention] || languageSteps.general || ['1. Kontaktieren Sie uns.', '2. Unterlagen einreichen.', '3. Bearbeitung abwarten.'];
        
        return intentionSteps.join('\n');
    }
    
    getDirectLinks(intention, language) {
        const links = {
            german: {
                kfz_zulassung: '📋 Terminvereinbarung: [Link zur Online-Terminbuchung](https://www.oldenburg-kreis.de/buergerservice/kfz-zulassung/terminvereinbarung)',
                führerschein: '📋 Fahrschulen: [Link zu Fahrschulen-Verzeichnis](https://www.oldenburg-kreis.de/buergerservice/fuehrerschein/fahrschulen)',
                bauantrag: '📋 Bauantrag: [Link zum Bauantrag-Formular](https://www.oldenburg-kreis.de/buergerservice/bauen/bauantrag)',
                gewerbe: '📋 Gewerbeanmeldung: [Link zur Gewerbeanmeldung](https://www.oldenburg-kreis.de/buergerservice/gewerbe/anmeldung)',
                notfall: '📋 Notfallnummern: [Link zu Notfallnummern](https://www.oldenburg-kreis.de/buergerservice/notfall/nummern)'
            },
            english: {
                kfz_zulassung: '📋 Appointment booking: [Link to online appointment booking](https://www.oldenburg-kreis.de/buergerservice/kfz-zulassung/terminvereinbarung)',
                führerschein: '📋 Driving schools: [Link to driving schools directory](https://www.oldenburg-kreis.de/buergerservice/fuehrerschein/fahrschulen)',
                bauantrag: '📋 Building application: [Link to building application form](https://www.oldenburg-kreis.de/buergerservice/bauen/bauantrag)',
                gewerbe: '📋 Business registration: [Link to business registration](https://www.oldenburg-kreis.de/buergerservice/gewerbe/anmeldung)',
                notfall: '📋 Emergency numbers: [Link to emergency numbers](https://www.oldenburg-kreis.de/buergerservice/notfall/nummern)'
            }
        };
        
        const languageLinks = links[language] || links.german;
        return languageLinks[intention] || '';
    }
    
    getContactInfo(intention, urgency, language) {
        const contactInfos = {
            german: {
                general: '📞 **Kontakt:** 04431 85-0 (Mo-Fr 8-16 Uhr)',
                notfall: '📞 **Notruf:** 112 (24/7) | **Polizei:** 110 (24/7)',
                critical: '🚨 **Dringend?** Ruf sofort an oder komm vorbei!'
            },
            english: {
                general: '📞 **Contact:** 04431 85-0 (Mon-Fri 8-16)',
                notfall: '📞 **Emergency:** 112 (24/7) | **Police:** 110 (24/7)',
                critical: '🚨 **Urgent?** Call immediately or come in person!'
            }
        };
        
        const languageContacts = contactInfos[language] || contactInfos.german;
        
        let contact = languageContacts.general;
        
        if (intention === 'notfall') {
            contact = languageContacts.notfall;
        }
        
        if (urgency.level === 'critical') {
            contact += '\n' + languageContacts.critical;
        }
        
        return contact;
    }
    
    getNextAction(intention, persona, language) {
        const nextActions = {
            german: {
                kfz_zulassung: 'Sollen wir den Termin jetzt wählen?',
                führerschein: 'Möchten Sie eine Fahrschule finden?',
                bauantrag: 'Möchten Sie das Formular starten?',
                gewerbe: 'Möchten Sie die Anmeldung beginnen?',
                notfall: 'Brauchen Sie weitere Hilfe?',
                general: 'Wie kann ich Ihnen weiterhelfen?'
            },
            english: {
                kfz_zulassung: 'Shall we book the appointment now?',
                führerschein: 'Would you like to find a driving school?',
                bauantrag: 'Would you like to start the form?',
                gewerbe: 'Would you like to begin the registration?',
                notfall: 'Do you need further assistance?',
                general: 'How can I help you further?'
            }
        };
        
        const languageActions = nextActions[language] || nextActions.german;
        return languageActions[intention] || languageActions.general;
    }
    
    getNorddeutschePhrases(emotionalState, urgency, language) {
        if (language !== 'german') {
            return { intro: '', outro: '' };
        }
        
        const phrases = {
            intro: {
                frustrated: 'Kriegen wir hin.',
                anxious: 'Keine Sorge.',
                positive: 'Das passt.',
                neutral: 'Kurz und schnackig:',
                critical: 'Sofort-Hilfe:'
            },
            outro: {
                frustrated: 'Das schaffen wir zusammen.',
                anxious: 'Ich bin für Sie da.',
                positive: 'Perfekt!',
                neutral: 'Gerne helfe ich weiter.',
                critical: 'Sofort handeln!'
            }
        };
        
        const emotion = emotionalState.state;
        const urgencyLevel = urgency.level;
        
        let intro = phrases.intro[emotion] || phrases.intro.neutral;
        let outro = phrases.outro[emotion] || phrases.outro.neutral;
        
        if (urgencyLevel === 'critical') {
            intro = phrases.intro.critical;
            outro = phrases.outro.critical;
        }
        
        return { intro, outro };
    }
    
    // Quellenhinweise und Aktualität nach System-Prompt
    getSourceInfo(intention, language) {
        const sources = {
            german: {
                kfz_zulassung: {
                    source: 'Zulassungsstelle Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/kfz-zulassung'
                },
                führerschein: {
                    source: 'Führerscheinstelle Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/fuehrerschein'
                },
                bauantrag: {
                    source: 'Bauamt Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/bauen'
                },
                gewerbe: {
                    source: 'Gewerbeamt Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/gewerbe'
                },
                notfall: {
                    source: 'Notfallzentrale Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/notfall'
                },
                general: {
                    source: 'Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de'
                }
            },
            english: {
                kfz_zulassung: {
                    source: 'Vehicle Registration Office Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/kfz-zulassung'
                },
                führerschein: {
                    source: 'Driver\'s License Office Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/fuehrerschein'
                },
                bauantrag: {
                    source: 'Building Authority Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/bauen'
                },
                gewerbe: {
                    source: 'Business Registration Office Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/gewerbe'
                },
                notfall: {
                    source: 'Emergency Center Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de/buergerservice/notfall'
                },
                general: {
                    source: 'Landkreis Oldenburg',
                    lastUpdated: '01/2025',
                    url: 'https://www.oldenburg-kreis.de'
                }
            }
        };
        
        const languageSources = sources[language] || sources.german;
        const sourceInfo = languageSources[intention] || languageSources.general;
        
        return `📋 **Quelle:** ${sourceInfo.source} | **Stand:** ${sourceInfo.lastUpdated}`;
    }
    
    // Barrierefreie Antwort-Generierung nach System-Prompt
    generateAccessibleResponse(baseResponse, accessibilityNeeds, language) {
        let accessibleResponse = baseResponse;
        
        // Einfache Sprache für niedrige Bildung
        if (accessibilityNeeds.includes('simple_language') || accessibilityNeeds.includes('low_education')) {
            accessibleResponse = this.simplifyLanguage(accessibleResponse, language);
        }
        
        // Vorlesen-Angebot hinzufügen
        if (accessibilityNeeds.includes('visual') || accessibilityNeeds.includes('hearing')) {
            const readAloudOffers = {
                german: '\n\n📢 **Soll ich Ihnen die Schritte vorlesen?** Einfach "ja" antworten!',
                english: '\n\n📢 **Shall I read the steps aloud?** Just reply "yes"!',
                turkish: '\n\n📢 **Adımları size okumamı ister misiniz?** Sadece "evet" yanıtlayın!',
                arabic: '\n\n📢 **هل تريدون أن أقرأ الخطوات بصوت عالٍ؟** فقط ردوا "نعم"!',
                polish: '\n\n📢 **Czy mam przeczytać kroki na głos?** Po prostu odpowiedz "tak"!',
                russian: '\n\n📢 **Хотите, чтобы я прочитал шаги вслух?** Просто ответьте "да"!',
                romanian: '\n\n📢 **Vreți să citesc pașii cu voce tare?** Doar răspundeți "da"!',
                ukrainian: '\n\n📢 **Хочете, щоб я прочитав кроки вголос?** Просто відповідьте "так"!',
                dutch: '\n\n📢 **Zal ik de stappen hardop voorlezen?** Antwoord gewoon "ja"!',
                danish: '\n\n📢 **Skal jeg læse trinnene højt?** Bare svar "ja"!',
                plattdeutsch: '\n\n📢 **Sall ik di de Stappen vörlesen?** Antwoort eenfach "ja"!'
            };
            
            accessibleResponse += readAloudOffers[language] || readAloudOffers.german;
        }
        
        // Langsame Telefonnummern für Hörbehinderte
        if (accessibilityNeeds.includes('hearing')) {
            accessibleResponse = accessibleResponse.replace(
                /(\d{5})\s*(\d{2,3})/g, 
                '$1 - $2 (langsam gesprochen)'
            );
        }
        
        return accessibleResponse;
    }
    
    simplifyLanguage(text, language) {
        if (language !== 'german') {
            return text; // Vereinfachung nur für Deutsch implementiert
        }
        
        // Einfache Sprache: kurze Sätze, einfache Wörter
        const simplifications = {
            'Dienstleistung': 'Service',
            'Zulassungsbescheinigung': 'Fahrzeugpapier',
            'Elektronische Versicherungsbestätigung': 'Versicherungspapier',
            'Terminvereinbarung': 'Termin machen',
            'Gebühren': 'Kosten',
            'Unterlagen': 'Papiere',
            'Bearbeitung': 'Bearbeitung',
            'Genehmigung': 'Erlaubnis',
            'Antrag': 'Formular',
            'Bewerbung': 'Bewerbung',
            'Ausbildung': 'Lernen',
            'Praktikum': 'Arbeiten lernen'
        };
        
        let simplifiedText = text;
        Object.keys(simplifications).forEach(complex => {
            const simple = simplifications[complex];
            simplifiedText = simplifiedText.replace(new RegExp(complex, 'g'), simple);
        });
        
        return simplifiedText;
    }
    
    // Sprachwechsel-Logik nach System-Prompt
    detectLanguageSwitch(query) {
        const queryLower = query.toLowerCase();
        
        // Nur bei eindeutig englischen Anfragen wechseln
        const englishPhrases = ['hello', 'hi there', 'good morning', 'good afternoon', 'good evening'];
        const germanPhrases = ['moin', 'hallo', 'guten tag', 'guten morgen', 'guten abend'];
        
        const hasEnglishPhrases = englishPhrases.some(phrase => 
            queryLower.includes(phrase)
        );
        
        const hasGermanPhrases = germanPhrases.some(phrase => 
            queryLower.includes(phrase)
        );
        
        // Nur wechseln wenn eindeutig englisch UND nicht deutsch
        if (hasEnglishPhrases && !hasGermanPhrases) {
            return {
                detected: true,
                language: 'english',
                switchPhrase: 'Shall I continue in English?'
            };
        }
        
        return {
            detected: false,
            language: 'german',
            switchPhrase: null
        };
    }
    
    // Prompt-konforme Beispielantworten nach System-Prompt
    generateExampleResponse(intention, language) {
        const examples = {
            german: {
                kfz_zulassung: `Butter bei die Fische: Sie möchten Ihr Fahrzeug im Landkreis Oldenburg zulassen.

1. Benötigt: Ausweis, Zulassungsbescheinigung I/II, eVB-Nummer.
2. Termin online buchen oder Unterlagen digital vorbereiten.
3. Gebühren vor Ort bezahlen.

📋 Terminvereinbarung: [Link zur Online-Terminbuchung](https://www.oldenburg-kreis.de/buergerservice/kfz-zulassung/terminvereinbarung)

📞 **Kontakt:** 04431 85-0 (Mo-Fr 8-16 Uhr)

Sollen wir den Termin jetzt wählen?`,

                wohngeld: `Ihr Ziel: Wohngeld beantragen.

1. Formular öffnen.
2. Nachweise zu Einkommen/Miete hochladen.
3. Antrag absenden.

📋 Direktlink: [Link zur Online-Beantragung](https://www.oldenburg-kreis.de/buergerservice/soziales/wohngeld)

Möchten Sie starten?`,

                ratsinfo: `Nächster öffentlicher Termin: [Datum, Uhrzeit], Gremium: [Name]. Themen: [3 Stichworte].

📋 Tagesordnung als PDF anzeigen: [Link zur Tagesordnung](https://oldenburg-kreis.ratsinfomanagement.net)

Tagesordnung als PDF anzeigen?`,

                stellen: `Aktuelle Stellen (Top 3): [Titel] – Frist [Datum]; [Titel] – Frist [Datum]; [Titel] – Frist [Datum]

📋 Alle anzeigen: [Link zum Stellenportal](https://www.oldenburg-kreis.de/stellenportal)

Soll ich eine Benachrichtigung setzen?`
            },
            english: {
                kfz_zulassung: `You want to register your vehicle in Landkreis Oldenburg.

1. Required: ID, vehicle registration I/II, eVB number.
2. Book appointment online or prepare documents digitally.
3. Pay fees on site.

📋 Appointment booking: [Link to online appointment booking](https://www.oldenburg-kreis.de/buergerservice/kfz-zulassung/terminvereinbarung)

📞 **Contact:** 04431 85-0 (Mon-Fri 8-16)

Shall we book the appointment now?`,

                wohngeld: `Your goal: Apply for housing benefit.

1. Open form.
2. Upload income/rent documents.
3. Submit application.

📋 Direct link: [Link to online application](https://www.oldenburg-kreis.de/buergerservice/soziales/wohngeld)

Would you like to start?`,

                ratsinfo: `Next public meeting: [Date, Time], Committee: [Name]. Topics: [3 keywords].

📋 View agenda as PDF: [Link to agenda](https://oldenburg-kreis.ratsinfomanagement.net)

View agenda as PDF?`,

                stellen: `Current positions (Top 3): [Title] – Deadline [Date]; [Title] – Deadline [Date]; [Title] – Deadline [Date]

📋 View all: [Link to job portal](https://www.oldenburg-kreis.de/stellenportal)

Shall I set a notification?`
            }
        };
        
        const languageExamples = examples[language] || examples.german;
        return languageExamples[intention] || languageExamples.general || 'Wie kann ich Ihnen weiterhelfen?';
    }
    
    analyzeConcreteQuestion(query, intentionType) {
        const queryLower = query.toLowerCase();
        
        // Konkrete Fragen-Keywords
        const questionTypes = {
            fahren: ['darf ich', 'kann ich', 'ist das erlaubt', 'losfahren', 'fahren'],
            kosten: ['was kostet', 'kosten', 'preis', 'gebühr', 'bezahlen'],
            dauer: ['wie lange', 'dauer', 'zeit', 'wann', 'termin'],
            unterlagen: ['unterlagen', 'dokumente', 'papiere', 'was brauche ich'],
            wo: ['wo ist', 'wo finde ich', 'adresse', 'ort', 'standort'],
            online: ['online', 'internet', 'digital', 'website', 'app']
        };
        
        const answers = {
            kfz_zulassung: {
                fahren: '❌ **Nein, du darfst NICHT mit dem neuen Auto fahren!** Du brauchst zuerst eine gültige Zulassung und Versicherung.',
                kosten: '💰 **Kosten:** Zulassung ca. 30-50€, Kennzeichen ca. 20-30€, Versicherung je nach Fahrzeug.',
                dauer: '⏰ **Dauer:** Mit Termin ca. 30 Minuten, ohne Termin kann es länger dauern.',
                unterlagen: '📋 **Unterlagen:** Personalausweis, eVB-Nummer, Fahrzeugbrief, Fahrzeugschein, ggf. altes Kennzeichen.',
                wo: '📍 **Standort:** Zulassungsstelle im Kreishaus, Delmenhorster Str. 6, 27793 Wildeshausen.',
                online: '💻 **Online:** Terminvereinbarung und Formulare online verfügbar.'
            }
        };
        
        const intentionAnswers = answers[intentionType] || {};
        
        for (const [questionType, keywords] of Object.entries(questionTypes)) {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
                const answer = intentionAnswers[questionType];
                if (answer) {
                    return {
                        hasQuestion: true,
                        questionType,
                        answer
                    };
                }
            }
        }
        
        return {
            hasQuestion: false,
            questionType: null,
            answer: null
        };
    }
    
    // Performance Monitoring
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            averageResponseTime: Math.round(this.metrics.averageResponseTime),
            successRate: Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100)
        };
    }
    
    // Health Check
    healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            cache: {
                size: this.cache.size,
                hitRate: Math.round(this.metrics.cacheHitRate * 100)
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        };
    }
}

module.exports = KAYACharacterHandler;
