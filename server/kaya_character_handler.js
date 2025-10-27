const ContextMemory = require('./context_memory');
const AdvancedPersonaDetection = require('./advanced_persona_detection');

class KAYACharacterHandler {
    constructor() {
        this.agentHandler = null; // Lazy loading für Agent Handler
        this.llmService = null; // Lazy loading
        this.useLLM = process.env.USE_LLM === 'true';
        this.contextMemory = new ContextMemory();
        this.personaDetection = new AdvancedPersonaDetection();
    }
    
    // Lazy loading für Agent Handler
    getAgentHandler() {
        if (!this.agentHandler) {
            const KAYAAgentHandler = require('./kaya_agent_handler');
        this.agentHandler = new KAYAAgentHandler();
        }
        return this.agentHandler;
    }
    
    // Lazy loading für LLM Service
    getLLMService() {
        if (!this.llmService) {
            const LLMService = require('./llm_service');
            this.llmService = new LLMService();
        }
        return this.llmService;
    }
    
    async generateResponse(query, userMessage, sessionId = 'default') {
        // Context-Memory: Nachricht zur Session hinzufügen
        this.contextMemory.addMessage(sessionId, query, 'user');
        
        // Persona-Analyse durchführen
        const session = this.contextMemory.getSession(sessionId);
        const personaAnalysis = this.personaDetection.analyzePersona(session.messages, session.context);
        
        console.log(`🧠 Persona-Analyse: ${personaAnalysis.persona.persona} (${personaAnalysis.emotionalState.state}, ${personaAnalysis.urgency.level})`);
        
        // Bestimme zuständigen Agent mit Session-Kontext
        const sessionContext = {
            previousIntention: session.messages.length > 1 ? 
                session.messages[session.messages.length - 2].context?.intention : null,
            conversationHistory: session.messages.slice(-3) // Letzte 3 Nachrichten
        };
        
        // DEBUG: Session-Kontext ausgeben
        console.log(`🔍 Session-Kontext Debug:`);
        console.log(`  - Session-ID: ${sessionId}`);
        console.log(`  - Messages: ${session.messages.length}`);
        console.log(`  - Previous Intention: ${sessionContext.previousIntention?.type || 'KEINE'}`);
        console.log(`  - Query: ${query}`);
        
        const agent = this.getAgentHandler().routeToAgent(query, sessionContext);
        
        let response;
        if (agent === 'kaya') {
            response = this.generateKAYAResponse(query, personaAnalysis, sessionContext);
        } else {
            response = this.generateAgentResponse(agent, query, personaAnalysis);
        }

        // Context-Memory: KAYA-Antwort hinzufügen mit Intention
        const intention = this.analyzeCitizenIntention(query, sessionContext);
        this.contextMemory.addMessage(sessionId, response.response, 'kaya', {
            agent: agent,
            persona: personaAnalysis.persona.persona,
            emotionalState: personaAnalysis.emotionalState.state,
            urgency: intention.urgency,
            intention: intention // Speichere die Intention für Kontext
        });

        // LLM-Enhancement DEAKTIVIERT für bürgernähere Antworten
        // Bürger wollen direkte Lösungen, nicht lange Erklärungen!
        console.log('🎯 LLM-Enhancement deaktiviert - Bürgerzentrierte direkte Antworten');

        // Emotion für Avatar-Mimik hinzufügen
        response.emotion = personaAnalysis.emotionalState.state || 'neutral';
        response.emotionConfidence = personaAnalysis.emotionalState.confidence || 50;
        
        console.log(`😊 Emotion: ${response.emotion} (${response.emotionConfidence}%)`);

        return response;
    }
    
    generateKAYAResponse(query, personaAnalysis = null, sessionContext = null) {
        // Bürgerzentrierte Dialog-Optimierung mit Kontext
        const intention = this.analyzeCitizenIntention(query, sessionContext);
        const response = this.generateDirectResponse(query, intention, personaAnalysis);
        
        return {
            agent: 'kaya',
            response: response.response,
            links: response.links,
            confidence: 0.9,
            source: 'kaya',
            enhanced: false,
            context: {
                persona: personaAnalysis?.persona?.persona || 'standard_citizen',
                emotionalState: personaAnalysis?.emotionalState?.state || 'neutral',
                urgency: intention.urgency
            }
        };
    }

    /**
     * UNIVERSALE Bürgerzentrierte Intention-Analyse
     * Funktioniert für ALLE Bürger und ALLE Anliegen
     */
    analyzeCitizenIntention(query, sessionContext = null) {
        const lowerQuery = query.toLowerCase();
        
        // 1. URGENCY-Analyse (für alle Bürger)
        const urgency = this.analyzeUrgency(lowerQuery);
        
        // 2. EMOTIONAL STATE (für alle Bürger)
        const emotionalState = this.analyzeEmotionalState(lowerQuery);
        
        // 3. ACCESSIBILITY NEEDS (inklusiv für alle Bürger)
        const accessibilityNeeds = this.analyzeAccessibilityNeeds(lowerQuery);
        
        // 4. LOCATION (für alle Bürger)
        const location = this.extractLocation(query);
        
        // 5. SPECIFIC INTENTION (erweitert für alle Anliegen mit Kontext)
        const specificIntention = this.analyzeSpecificIntention(lowerQuery, sessionContext);
        
        return {
            type: specificIntention.type,
            urgency: urgency,
            emotionalState: emotionalState,
            accessibilityNeeds: accessibilityNeeds,
            location: location,
            needs: specificIntention.needs,
            specific: specificIntention.specific,
            citizenType: this.analyzeCitizenType(lowerQuery),
            language: this.analyzeLanguage(query),
            query: query // Speichere die ursprüngliche Query für konkrete Fragen
        };
    }

    /**
     * Analysiert Dringlichkeit für alle Bürger
     */
    analyzeUrgency(query) {
        const urgentKeywords = ['eilig', 'dringend', 'sofort', 'heute', 'morgen', 'schnell', 'notfall'];
        const veryUrgentKeywords = ['notfall', 'kritisch', 'lebensgefahr', 'sofort'];
        
        if (veryUrgentKeywords.some(keyword => query.includes(keyword))) {
            return 'critical';
        }
        if (urgentKeywords.some(keyword => query.includes(keyword))) {
            return 'high';
        }
        return 'normal';
    }

    /**
     * Analysiert emotionalen Zustand für alle Bürger
     */
    analyzeEmotionalState(query) {
        const frustratedKeywords = ['frustriert', 'ärgerlich', 'verwirrt', 'hilflos', 'verzweifelt'];
        const anxiousKeywords = ['sorge', 'angst', 'unsicher', 'nervös'];
        const positiveKeywords = ['freundlich', 'danke', 'hilfreich', 'gut'];
        
        if (frustratedKeywords.some(keyword => query.includes(keyword))) {
            return 'frustrated';
        }
        if (anxiousKeywords.some(keyword => query.includes(keyword))) {
            return 'anxious';
        }
        if (positiveKeywords.some(keyword => query.includes(keyword))) {
            return 'positive';
        }
        return 'neutral';
    }

    /**
     * Analysiert Barrierefreiheits-Bedürfnisse (inklusiv)
     */
    analyzeAccessibilityNeeds(query) {
        const needs = [];
        
        if (query.includes('blind') || query.includes('sehbehindert')) {
            needs.push('visual');
        }
        if (query.includes('taub') || query.includes('hörbehindert')) {
            needs.push('hearing');
        }
        if (query.includes('rollstuhl') || query.includes('behindert')) {
            needs.push('mobility');
        }
        if (query.includes('einfach') || query.includes('leicht')) {
            needs.push('simple_language');
        }
        
        return needs;
    }

    /**
     * Analysiert Bürger-Typ (inklusiv für alle)
     */
    analyzeCitizenType(query) {
        const lowerQuery = query.toLowerCase();
        
        // Erweiterte Landkreis-spezifische Erkennung basierend auf Bevölkerungsstruktur
        if (lowerQuery.includes('landwirt') || lowerQuery.includes('bauer') || lowerQuery.includes('hof') || 
            lowerQuery.includes('kuh') || lowerQuery.includes('schwein') || lowerQuery.includes('eu-antrag')) {
            return 'farmer';
        }
        if (lowerQuery.includes('handwerker') || lowerQuery.includes('meister') || lowerQuery.includes('kammer') || 
            lowerQuery.includes('ausbildung') || lowerQuery.includes('lehre')) {
            return 'craftsman';
        }
        if (lowerQuery.includes('student') || lowerQuery.includes('studium') || lowerQuery.includes('bafög') || 
            lowerQuery.includes('wohnheim') || lowerQuery.includes('semester')) {
            return 'student';
        }
        if (lowerQuery.includes('arbeitssuchend') || lowerQuery.includes('alg') || lowerQuery.includes('jobcenter') || 
            lowerQuery.includes('weiterbildung') || lowerQuery.includes('arbeitslos')) {
            return 'unemployed';
        }
        if (lowerQuery.includes('senior') || lowerQuery.includes('rentner') || lowerQuery.includes('alt') || 
            lowerQuery.includes('pension') || lowerQuery.includes('ruhestand')) {
            return 'senior';
        }
        if (lowerQuery.includes('jugend') || lowerQuery.includes('schüler') || lowerQuery.includes('ausbildung')) {
            return 'youth';
        }
        if (lowerQuery.includes('familie') || lowerQuery.includes('kind') || lowerQuery.includes('baby') || 
            lowerQuery.includes('alleinerziehend') || lowerQuery.includes('unterhalt')) {
            return 'family';
        }
        if (lowerQuery.includes('geflüchtet') || lowerQuery.includes('migrant') || lowerQuery.includes('ausländer') || 
            lowerQuery.includes('asyl') || lowerQuery.includes('integration') || lowerQuery.includes('sprachkurs')) {
            return 'migrant';
        }
        if (lowerQuery.includes('behindert') || lowerQuery.includes('beeinträchtigt') || lowerQuery.includes('schwerbehindertenausweis') || 
            lowerQuery.includes('eingliederungshilfe')) {
            return 'disabled';
        }
        if (lowerQuery.includes('eu') || lowerQuery.includes('aufenthaltsrecht') || lowerQuery.includes('freizügigkeit')) {
            return 'eu_citizen';
        }
        if (lowerQuery.includes('kleinunternehmer') || lowerQuery.includes('steuern') || lowerQuery.includes('buchhaltung') || 
            lowerQuery.includes('gewerbesteuer')) {
            return 'small_business';
        }
        
        // NEUE KRITISCHE PERSONAS basierend auf Bevölkerungsstruktur
        if (lowerQuery.includes('kind') || lowerQuery.includes('kindergarten') || lowerQuery.includes('spielplatz') || 
            lowerQuery.includes('schule') || lowerQuery.includes('spiel') || lowerQuery.includes('baby')) {
            return 'child';
        }
        if (lowerQuery.includes('pendler') || lowerQuery.includes('pendeln') || lowerQuery.includes('bus') || 
            lowerQuery.includes('bahn') || lowerQuery.includes('fahrplan') || lowerQuery.includes('verkehr')) {
            return 'commuter';
        }
        if (lowerQuery.includes('wohnung') || lowerQuery.includes('miete') || lowerQuery.includes('wohnen') || 
            lowerQuery.includes('mietvertrag') || lowerQuery.includes('wohnungssuche')) {
            return 'housing_seeker';
        }
        if (lowerQuery.includes('pflege') || lowerQuery.includes('pflegebedürftig') || lowerQuery.includes('betreuung') || 
            lowerQuery.includes('pflegestützpunkt') || lowerQuery.includes('pflegeheim')) {
            return 'care_dependent';
        }
        if (lowerQuery.includes('armut') || lowerQuery.includes('arm') || lowerQuery.includes('sozialhilfe') || 
            lowerQuery.includes('wohngeld') || lowerQuery.includes('grundsicherung')) {
            return 'low_income';
        }
        if (lowerQuery.includes('sport') || lowerQuery.includes('verein') || lowerQuery.includes('fitness') || 
            lowerQuery.includes('schwimmen') || lowerQuery.includes('fußball')) {
            return 'sports_interested';
        }
        if (lowerQuery.includes('kultur') || lowerQuery.includes('museum') || lowerQuery.includes('veranstaltung') || 
            lowerQuery.includes('konzert') || lowerQuery.includes('theater')) {
            return 'culture_interested';
        }
        if (lowerQuery.includes('platt') || lowerQuery.includes('plattdeutsch') || lowerQuery.includes('moin') || 
            lowerQuery.includes('hülp') || lowerQuery.includes('tradition')) {
            return 'plattdeutsch_speaker';
        }
        if (lowerQuery.includes('einfach') || lowerQuery.includes('verstehe nicht') || lowerQuery.includes('hilfe') || 
            lowerQuery.includes('erklären') || lowerQuery.includes('langsam')) {
            return 'low_education';
        }
        if (lowerQuery.includes('mobil') || lowerQuery.includes('fahrrad') || lowerQuery.includes('e-mobilität') || 
            lowerQuery.includes('ladesäule') || lowerQuery.includes('radweg')) {
            return 'mobility_needs';
        }
        
        // KRITISCHE TOURISMUS-PERSONAS basierend auf 425.000 Übernachtungen (2024)
        if (lowerQuery.includes('urlaub') || lowerQuery.includes('ferien') || lowerQuery.includes('reise') || 
            lowerQuery.includes('besucher') || lowerQuery.includes('gast') || lowerQuery.includes('tourist')) {
            return 'tourist';
        }
        if (lowerQuery.includes('camping') || lowerQuery.includes('zelt') || lowerQuery.includes('wohnmobil') || 
            lowerQuery.includes('glamping') || lowerQuery.includes('campingplatz')) {
            return 'camper';
        }
        if (lowerQuery.includes('hotel') || lowerQuery.includes('unterkunft') || lowerQuery.includes('übernachtung') || 
            lowerQuery.includes('ferienwohnung') || lowerQuery.includes('pension')) {
            return 'accommodation_seeker';
        }
        if (lowerQuery.includes('sehenswürdigkeit') || lowerQuery.includes('attraktion') || lowerQuery.includes('museum') || 
            lowerQuery.includes('denkmal') || lowerQuery.includes('wildeshausen') || lowerQuery.includes('dötlingen')) {
            return 'sightseeing_tourist';
        }
        if (lowerQuery.includes('radweg') || lowerQuery.includes('wanderweg') || lowerQuery.includes('aktivurlaub') || 
            lowerQuery.includes('sporturlaub') || lowerQuery.includes('natur')) {
            return 'active_tourist';
        }
        if (lowerQuery.includes('familienurlaub') || lowerQuery.includes('kinderfreundlich') || lowerQuery.includes('familie') || 
            lowerQuery.includes('spielplatz') || lowerQuery.includes('kinderspiel')) {
            return 'family_tourist';
        }
        if (lowerQuery.includes('wellness') || lowerQuery.includes('entspannung') || lowerQuery.includes('spa') || 
            lowerQuery.includes('massage') || lowerQuery.includes('erholung')) {
            return 'wellness_tourist';
        }
        if (lowerQuery.includes('kulinarisch') || lowerQuery.includes('restaurant') || lowerQuery.includes('essen') || 
            lowerQuery.includes('regional') || lowerQuery.includes('speise')) {
            return 'culinary_tourist';
        }
        if (lowerQuery.includes('shopping') || lowerQuery.includes('einkaufen') || lowerQuery.includes('markt') || 
            lowerQuery.includes('boutique') || lowerQuery.includes('geschäft')) {
            return 'shopping_tourist';
        }
        if (lowerQuery.includes('veranstaltung') || lowerQuery.includes('festival') || lowerQuery.includes('konzert') || 
            lowerQuery.includes('event') || lowerQuery.includes('feier')) {
            return 'event_tourist';
        }
        
        return 'general';
    }

    /**
     * Analysiert Sprache (inklusiv) mit erweiterter Erkennung für Landkreis Oldenburg
     */
    analyzeLanguage(query) {
        const lowerQuery = query.toLowerCase();
        
        // Erweiterte Sprach-Erkennung basierend auf Bevölkerungsstruktur Landkreis Oldenburg
        const englishWords = ['hello', 'help', 'please', 'thank you', 'sorry', 'excuse me', 'i need', 'can you'];
        const turkishWords = ['merhaba', 'yardım', 'lütfen', 'teşekkür', 'özür', 'yardım edin', 'nasıl', 'ne'];
        const arabicWords = ['مرحبا', 'مساعدة', 'من فضلك', 'شكرا', 'أحتاج', 'كيف'];
        const polishWords = ['dzień dobry', 'pomoc', 'proszę', 'dziękuję', 'potrzebuję', 'jak'];
        const russianWords = ['привет', 'помощь', 'пожалуйста', 'спасибо', 'нужен', 'как'];
        const romanianWords = ['bună', 'ajutor', 'vă rog', 'mulțumesc', 'am nevoie', 'cum'];
        const ukrainianWords = ['привіт', 'допомога', 'будь ласка', 'дякую', 'потрібно', 'як'];
        const dutchWords = ['hallo', 'hulp', 'alsjeblieft', 'dank je', 'ik heb nodig', 'hoe'];
        const danishWords = ['hej', 'hjælp', 'tak', 'undskyld', 'jeg har brug for', 'hvordan'];
        const plattdeutschWords = ['moin', 'hülp', 'bitte', 'danke', 'ik bruuk', 'wo'];
        
        if (englishWords.some(word => lowerQuery.includes(word))) {
            return 'english';
        }
        if (turkishWords.some(word => lowerQuery.includes(word))) {
            return 'turkish';
        }
        if (arabicWords.some(word => lowerQuery.includes(word))) {
            return 'arabic';
        }
        if (polishWords.some(word => lowerQuery.includes(word))) {
            return 'polish';
        }
        if (russianWords.some(word => lowerQuery.includes(word))) {
            return 'russian';
        }
        if (romanianWords.some(word => lowerQuery.includes(word))) {
            return 'romanian';
        }
        if (ukrainianWords.some(word => lowerQuery.includes(word))) {
            return 'ukrainian';
        }
        if (dutchWords.some(word => lowerQuery.includes(word))) {
            return 'dutch';
        }
        if (danishWords.some(word => lowerQuery.includes(word))) {
            return 'danish';
        }
        if (plattdeutschWords.some(word => lowerQuery.includes(word))) {
            return 'plattdeutsch';
        }
        return 'german';
    }

    /**
     * Analysiert Tipp-Verhalten für Persona-Erkennung
     */
    analyzeTypingBehavior(query, sessionContext = null) {
        const behavior = {
            typingSpeed: this.estimateTypingSpeed(query),
            languageLevel: this.analyzeLanguageLevel(query),
            formality: this.analyzeFormality(query),
            urgency: this.analyzeUrgencyFromTyping(query)
        };
        
        return behavior;
    }

    /**
     * Schätzt Tipp-Geschwindigkeit basierend auf Query-Länge und Zeit
     */
    estimateTypingSpeed(query) {
        // Vereinfachte Schätzung basierend auf Query-Charakteristika
        if (query.length < 10) return 'fast'; // Kurze, direkte Anfragen
        if (query.length > 100) return 'slow'; // Lange, detaillierte Anfragen
        return 'normal';
    }

    /**
     * Analysiert Sprach-Niveau
     */
    analyzeLanguageLevel(query) {
        const lowerQuery = query.toLowerCase();
        
        // Einfache Sprache
        if (lowerQuery.includes('hilfe') || lowerQuery.includes('brauche') || lowerQuery.includes('kann nicht')) {
            return 'simple';
        }
        
        // Komplexe Sprache
        if (lowerQuery.includes('beantragen') || lowerQuery.includes('erforderlich') || lowerQuery.includes('voraussetzung')) {
            return 'complex';
        }
        
        return 'normal';
    }

    /**
     * Analysiert Formellität
     */
    analyzeFormality(query) {
        const lowerQuery = query.toLowerCase();
        
        // Formell
        if (lowerQuery.includes('sie') || lowerQuery.includes('ihr') || lowerQuery.includes('bitte')) {
            return 'formal';
        }
        
        // Informell
        if (lowerQuery.includes('du') || lowerQuery.includes('dein') || lowerQuery.includes('hey')) {
            return 'informal';
        }
        
        return 'neutral';
    }

    /**
     * Analysiert spezifische Intention (erweitert für alle Anliegen)
     */
    analyzeSpecificIntention(query, sessionContext = null) {
        // Erweiterte Kategorien für alle Bürgeranliegen - Landkreis-spezifisch
        const intentions = [
            // Verwaltung
            { keywords: ['bauantrag', 'bauen', 'haus', 'gebäude'], type: 'bauantrag', needs: ['formulare', 'unterlagen', 'termin', 'kosten'] },
            { keywords: ['auto', 'fahrzeug', 'zulassen', 'kfz', 'kennzeichen', 'zulassungsbescheinigung', 'evb', 'versicherung', 'fahrzeugbrief', 'fahrzeugschein'], type: 'kfz_zulassung', needs: ['termin', 'formulare', 'unterlagen', 'kosten'] },
            { keywords: ['führerschein', 'fahrerlaubnis'], type: 'führerschein', needs: ['termin', 'formulare', 'unterlagen', 'kosten'] },
            { keywords: ['gewerbe', 'gewerbeanmeldung', 'selbständig'], type: 'gewerbe', needs: ['formulare', 'unterlagen', 'beratung'] },
            
            // Landwirtschaft
            { keywords: ['landwirt', 'bauer', 'hof', 'kuh', 'schwein', 'eu-antrag'], type: 'landwirtschaft', needs: ['eu-anträge', 'tierhaltung', 'agrarberatung'] },
            { keywords: ['tierhaltung', 'stall', 'weide', 'futter'], type: 'tierhaltung', needs: ['genehmigung', 'tierschutz', 'veterinär'] },
            
            // Handwerk
            { keywords: ['handwerker', 'meister', 'kammer', 'ausbildung'], type: 'handwerk', needs: ['meisterprüfung', 'handwerkskammer', 'ausbildung'] },
            { keywords: ['lehre', 'ausbildung', 'geselle'], type: 'ausbildung', needs: ['ausbildungsplatz', 'berufsschule', 'prüfung'] },
            
            // Studium
            { keywords: ['studium', 'universität', 'hochschule', 'bafög'], type: 'studium', needs: ['bafög-antrag', 'wohnheim', 'semesterticket'] },
            { keywords: ['bafög', 'studentenwerk', 'wohnheim'], type: 'bafög', needs: ['antrag', 'unterlagen', 'beratung'] },
            
            // Arbeitslosigkeit
            { keywords: ['arbeitssuchend', 'alg', 'jobcenter', 'weiterbildung'], type: 'arbeitslosigkeit', needs: ['alg-antrag', 'jobcenter', 'weiterbildung'] },
            { keywords: ['arbeitslos', 'arbeitsamt', 'bewerbung'], type: 'arbeitslosigkeit', needs: ['alg-antrag', 'jobcenter', 'weiterbildung'] },
            
            // Rente
            { keywords: ['rente', 'pension', 'ruhestand'], type: 'rente', needs: ['rentenantrag', 'pension', 'seniorenservices'] },
            { keywords: ['senioren', 'älter', 'ruhestand'], type: 'senioren', needs: ['seniorenservices', 'pflege', 'betreuung'] },
            
            // Alleinerziehende
            { keywords: ['alleinerziehend', 'unterhalt', 'kindergeld'], type: 'alleinerziehende', needs: ['kindergeld-antrag', 'unterhaltsvorschuss', 'betreuung'] },
            { keywords: ['unterhaltsvorschuss', 'alleinerziehend'], type: 'unterhalt', needs: ['antrag', 'unterlagen', 'beratung'] },
            
            // Behinderung
            { keywords: ['behindert', 'schwerbehindertenausweis', 'eingliederungshilfe'], type: 'behinderung', needs: ['schwerbehindertenausweis', 'eingliederungshilfe', 'barrierefreiheit'] },
            { keywords: ['beeinträchtigt', 'behinderung', 'inklusion'], type: 'behinderung', needs: ['schwerbehindertenausweis', 'eingliederungshilfe', 'barrierefreiheit'] },
            
            // Migration
            { keywords: ['geflüchtet', 'asyl', 'integration', 'sprachkurs'], type: 'migration', needs: ['asylverfahren', 'sprachkurs', 'integration'] },
            { keywords: ['migrant', 'ausländer', 'aufenthaltsrecht'], type: 'aufenthaltsrecht', needs: ['aufenthaltsrecht', 'arbeitserlaubnis', 'familiennachzug'] },
            
            // EU-Bürger
            { keywords: ['eu', 'freizügigkeit', 'aufenthaltsrecht'], type: 'eu_bürger', needs: ['aufenthaltsrecht', 'arbeitserlaubnis', 'familiennachzug'] },
            
            // Kleinunternehmer
            { keywords: ['kleinunternehmer', 'steuern', 'buchhaltung'], type: 'kleinunternehmer', needs: ['kleinunternehmerregelung', 'gewerbesteuer', 'buchhaltung'] },
            { keywords: ['gewerbesteuer', 'steuerberater', 'buchhaltung'], type: 'steuern', needs: ['steuerberatung', 'buchhaltung', 'gewerbesteuer'] },
            
            // Soziales
            { keywords: ['kindergeld', 'elterngeld', 'sozialhilfe'], type: 'soziales', needs: ['formulare', 'beratung', 'unterlagen'] },
            { keywords: ['wohngeld', 'miete', 'wohnung'], type: 'wohngeld', needs: ['formulare', 'beratung', 'unterlagen'] },
            { keywords: ['pflege', 'pflegegeld', 'pflegeheim'], type: 'pflege', needs: ['beratung', 'formulare', 'unterlagen'] },
            
            // Gesundheit
            { keywords: ['gesundheit', 'arzt', 'krankenhaus'], type: 'gesundheit', needs: ['kontakt', 'informationen', 'termin'] },
            { keywords: ['impfung', 'impfpass'], type: 'impfung', needs: ['termin', 'informationen', 'formulare'] },
            
            // Bildung
            { keywords: ['schule', 'kindergarten', 'bildung'], type: 'bildung', needs: ['anmeldung', 'informationen', 'kontakt'] },
            
            // Umwelt
            { keywords: ['müll', 'abfall', 'entsorgung'], type: 'umwelt', needs: ['informationen', 'termin', 'kosten'] },
            { keywords: ['wasser', 'kanalisation'], type: 'wasser', needs: ['informationen', 'kontakt', 'kosten'] },
            
            // Allgemeine Verwaltung
            { keywords: ['formular', 'antrag', 'beantragen'], type: 'formular', needs: ['download', 'ausfüllen', 'einreichen'] },
            { keywords: ['termin', 'vereinbaren', 'wann'], type: 'termin', needs: ['online_termin', 'öffnungszeiten', 'verfügbarkeit'] },
            { keywords: ['kontakt', 'telefon', 'anrufen'], type: 'kontakt', needs: ['telefonnummer', 'email', 'adresse', 'öffnungszeiten'] },
            { keywords: ['öffnungszeiten', 'wann', 'geöffnet'], type: 'öffnungszeiten', needs: ['zeiten', 'kontakt', 'adresse'] },
            
            // Notfälle
            { keywords: ['notfall', 'hilfe', 'krisen'], type: 'notfall', needs: ['sofortige_hilfe', 'kontakt', 'informationen'] }
        ];
        
        // KONTEXT-BASIERTE INTENTION-ERKENNUNG FÜR ALLE BEREICHE
        if (sessionContext && sessionContext.previousIntention) {
            const previousType = sessionContext.previousIntention.type;
            
            // KFZ-Follow-up Erkennung
            if (previousType === 'kfz_zulassung') {
                const kfzFollowUpKeywords = ['zulassungsbescheinigung', 'evb', 'versicherung', 'fahrzeugbrief', 'fahrzeugschein', 'unterlagen', 'dokumente', 'papiere', 'kennzeichen', 'nummernschild'];
                if (kfzFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'kfz_zulassung',
                        needs: ['termin', 'formulare', 'unterlagen', 'kosten'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Bauantrag-Follow-up Erkennung
            if (previousType === 'bauantrag') {
                const bauFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'grundstück', 'bauplan', 'genehmigung', 'grundriss', 'statik', 'architekt', 'bauherr'];
                if (bauFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'bauantrag',
                        needs: ['formulare', 'unterlagen', 'termin', 'kosten'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Führerschein-Follow-up Erkennung
            if (previousType === 'führerschein') {
                const fsFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'prüfung', 'theorie', 'praxis', 'fahrschule', 'sehtest', 'erstehilfe', 'führerscheinantrag'];
                if (fsFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'führerschein',
                        needs: ['termin', 'formulare', 'unterlagen', 'kosten'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Gewerbe-Follow-up Erkennung
            if (previousType === 'gewerbe') {
                const gewerbeFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'gewerbeschein', 'handelsregister', 'steuernummer', 'finanzamt', 'ihk'];
                if (gewerbeFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'gewerbe',
                        needs: ['formulare', 'unterlagen', 'beratung'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Landwirtschaft-Follow-up Erkennung
            if (previousType === 'landwirtschaft') {
                const landwirtschaftFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'eu-antrag', 'agrarantrag', 'flächennachweis', 'tierbestand', 'hofbescheinigung', 'flaeche', 'hektar', 'acker', 'wiese', 'weide'];
                if (landwirtschaftFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'landwirtschaft',
                        needs: ['eu-anträge', 'tierhaltung', 'agrarberatung'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Handwerk-Follow-up Erkennung
            if (previousType === 'handwerk') {
                const handwerkFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'meisterprüfung', 'gesellenprüfung', 'handwerkskammer', 'ausbildungsnachweis', 'berufserfahrung'];
                if (handwerkFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'handwerk',
                        needs: ['meisterprüfung', 'handwerkskammer', 'ausbildung'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Studium-Follow-up Erkennung
            if (previousType === 'studium') {
                const studiumFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'bafög', 'studienbescheinigung', 'immatrikulation', 'semesterticket', 'wohnheim'];
                if (studiumFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'studium',
                        needs: ['bafög-antrag', 'wohnheim', 'semesterticket'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // BAföG-Follow-up Erkennung
            if (previousType === 'bafög') {
                const bafögFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'einkommen', 'eltern', 'studienbescheinigung', 'bankauszug', 'miete'];
                if (bafögFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'bafög',
                        needs: ['antrag', 'unterlagen', 'beratung'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Arbeitslosigkeit-Follow-up Erkennung
            if (previousType === 'arbeitslosigkeit') {
                const arbeitslosigkeitFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'alg', 'arbeitslosengeld', 'bewerbung', 'jobcenter', 'arbeitsamt'];
                if (arbeitslosigkeitFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'arbeitslosigkeit',
                        needs: ['alg-antrag', 'jobcenter', 'weiterbildung'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Rente-Follow-up Erkennung
            if (previousType === 'rente') {
                const renteFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'rentenantrag', 'versicherungsverlauf', 'arbeitszeugnis', 'pension'];
                if (renteFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'rente',
                        needs: ['rentenantrag', 'pension', 'seniorenservices'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Senioren-Follow-up Erkennung
            if (previousType === 'senioren') {
                const seniorenFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'pflege', 'betreuung', 'seniorenheim', 'ambulante', 'stationäre'];
                if (seniorenFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'senioren',
                        needs: ['seniorenservices', 'pflege', 'betreuung'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Alleinerziehende-Follow-up Erkennung
            if (previousType === 'alleinerziehende') {
                const alleinerziehendeFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'kindergeld', 'unterhalt', 'vater', 'mutter', 'sorge'];
                if (alleinerziehendeFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'alleinerziehende',
                        needs: ['kindergeld-antrag', 'unterhaltsvorschuss', 'betreuung'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Behinderung-Follow-up Erkennung
            if (previousType === 'behinderung') {
                const behinderungFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'schwerbehindertenausweis', 'eingliederungshilfe', 'barrierefreiheit', 'hilfsmittel'];
                if (behinderungFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'behinderung',
                        needs: ['schwerbehindertenausweis', 'eingliederungshilfe', 'barrierefreiheit'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Migration-Follow-up Erkennung
            if (previousType === 'migration') {
                const migrationFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'asyl', 'aufenthalt', 'sprachkurs', 'integration', 'pass'];
                if (migrationFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'migration',
                        needs: ['asylverfahren', 'sprachkurs', 'integration'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Kleinunternehmer-Follow-up Erkennung
            if (previousType === 'kleinunternehmer') {
                const kleinunternehmerFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'steuern', 'gewerbesteuer', 'umsatzsteuer', 'buchhaltung', 'finanzamt'];
                if (kleinunternehmerFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'kleinunternehmer',
                        needs: ['kleinunternehmerregelung', 'gewerbesteuer', 'buchhaltung'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Soziales-Follow-up Erkennung
            if (previousType === 'soziales') {
                const sozialesFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'kindergeld', 'elterngeld', 'sozialhilfe', 'grundsicherung'];
                if (sozialesFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'soziales',
                        needs: ['formulare', 'beratung', 'unterlagen'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Gesundheit-Follow-up Erkennung
            if (previousType === 'gesundheit') {
                const gesundheitFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'arzt', 'krankenhaus', 'behandlung', 'rezept', 'krankenkasse'];
                if (gesundheitFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'gesundheit',
                        needs: ['kontakt', 'informationen', 'termin'],
                        specific: 'follow_up'
                    };
                }
            }
            
            // Bildung-Follow-up Erkennung
            if (previousType === 'bildung') {
                const bildungFollowUpKeywords = ['unterlagen', 'dokumente', 'papiere', 'schule', 'kindergarten', 'anmeldung', 'zeugnis', 'noten'];
                if (bildungFollowUpKeywords.some(keyword => query.includes(keyword))) {
                    return {
                        type: 'bildung',
                        needs: ['anmeldung', 'informationen', 'kontakt'],
                        specific: 'follow_up'
                    };
                }
            }
        }
        
        // Suche passende Intention
        for (const intention of intentions) {
            if (intention.keywords.some(keyword => query.includes(keyword))) {
                return {
                    type: intention.type,
                    needs: intention.needs,
                    specific: this.extractSpecificForm(query)
                };
            }
        }
        
        // Fallback für unbekannte Anliegen
        return {
            type: 'general_inquiry',
            needs: ['informationen', 'beratung', 'kontakt'],
            specific: null
        };
    }

    /**
     * Prüft, ob es sich um eine Action-orientierte Antwort handelt
     */
    isActionOrientedResponse(intention) {
        const actionOrientedTypes = [
            'bauantrag', 'kfz_zulassung', 'führerschein', 'gewerbe',
            'soziales', 'wohngeld', 'pflege', 'gesundheit', 'impfung',
            'bildung', 'studium', 'umwelt', 'wasser', 'notfall',
            'formular', 'termin', 'kontakt', 'öffnungszeiten'
        ];
        
        return actionOrientedTypes.includes(intention.type);
    }

    /**
     * Prüft, ob es sich um eine Begrüßung handelt
     */
    isGreeting(query) {
        const greetings = ['moin', 'hallo', 'hi', 'hey', 'guten tag', 'guten morgen', 'guten abend'];
        const queryLower = query.toLowerCase().trim();
        
        return greetings.includes(queryLower) || queryLower.length <= 10;
    }

    /**
     * UNIVERSALE Bürgerzentrierte Antwort-Generierung
     * Funktioniert für ALLE Bürger und ALLE Anliegen
     */
    generateDirectResponse(query, intention, personaAnalysis) {
        // BEGRÜSSUNGEN - Keine LLM-Enhancement
        if (this.isGreeting(query)) {
            return this.generateGreetingResponse(intention, personaAnalysis);
        }
        
        // 1. TONE basierend auf emotionalem Zustand
        const tone = this.determineTone(intention.emotionalState, intention.urgency);
        
        // 2. ACCESSIBILITY-Anpassungen
        const accessibilityAdaptations = this.getAccessibilityAdaptations(intention.accessibilityNeeds);
        
        // 3. CITIZEN-TYPE-Anpassungen
        const citizenAdaptations = this.getCitizenTypeAdaptations(intention.citizenType);
        
        // 4. LANGUAGE-Anpassungen
        const languageAdaptations = this.getLanguageAdaptations(intention.language);
        
        // 5. Spezifische Antwort generieren
        const baseResponse = this.generateSpecificResponse(intention, tone);
        
        // 6. Alle Anpassungen kombinieren
        return this.combineAdaptations(baseResponse, {
            accessibility: accessibilityAdaptations,
            citizenType: citizenAdaptations,
            language: languageAdaptations,
            urgency: intention.urgency
        });
    }

    /**
     * Generiert dynamische, persona-adaptierte Begrüßungen
     */
    generateGreetingResponse(intention, personaAnalysis) {
        const citizenType = intention.citizenType;
        const language = intention.language;
        const emotionalState = intention.emotionalState;
        
        // DYNAMISCHE BEGRÜSSUNGEN basierend auf Persona und Sprache
        const greetings = {
            // DEUTSCHE BEGRÜSSUNGEN
            german: {
                senior: "Guten Tag! Ich bin KAYA, Ihr digitaler Assistent. Was kann ich für Sie tun?",
                youth: "Hey! Ich bin KAYA. Wie kann ich dir helfen?",
                family: "Hallo! Ich bin KAYA. Wie kann ich Ihrer Familie helfen?",
                migrant: "Hallo! Ich bin KAYA. Wie kann ich Ihnen helfen?",
                disabled: "Hallo! Ich bin KAYA, Ihr barrierefreier Assistent. Was kann ich für Sie tun?",
                farmer: "Moin! Ich bin KAYA. Was brauchst du für deinen Hof?",
                craftsman: "Moin! Ich bin KAYA. Wie kann ich dir bei deinem Handwerk helfen?",
                student: "Hey! Ich bin KAYA. Was brauchst du für dein Studium?",
                tourist: "Hallo! Ich bin KAYA, Ihr Reiseführer für den Landkreis. Was möchten Sie entdecken?",
                camper: "Moin! Ich bin KAYA. Wo möchtet ihr campen?",
                general: "Hallo! Ich bin KAYA. Wie kann ich Ihnen helfen?"
            },
            // ENGLISCHE BEGRÜSSUNGEN
            english: {
                senior: "Good day! I'm KAYA, your digital assistant. How can I help you?",
                youth: "Hey! I'm KAYA. What do you need?",
                family: "Hello! I'm KAYA. How can I help your family?",
                migrant: "Hello! I'm KAYA. How can I assist you?",
                disabled: "Hello! I'm KAYA, your accessible assistant. What can I do for you?",
                farmer: "Hello! I'm KAYA. What do you need for your farm?",
                craftsman: "Hello! I'm KAYA. How can I help with your craft?",
                student: "Hey! I'm KAYA. What do you need for your studies?",
                tourist: "Welcome! I'm KAYA, your guide for Landkreis Oldenburg. What would you like to explore?",
                camper: "Hello! I'm KAYA. Where would you like to camp?",
                general: "Hello! I'm KAYA. How can I help you?"
            },
            // TÜRKISCHE BEGRÜSSUNGEN
            turkish: {
                senior: "İyi günler! Ben KAYA, dijital asistanınızım. Size nasıl yardımcı olabilirim?",
                youth: "Merhaba! Ben KAYA. Ne yapabilirim?",
                family: "Merhaba! Ben KAYA. Ailenize nasıl yardımcı olabilirim?",
                migrant: "Merhaba! Ben KAYA. Size nasıl yardımcı olabilirim?",
                disabled: "Merhaba! Ben KAYA, erişilebilir asistanınızım. Size nasıl yardımcı olabilirim?",
                farmer: "Merhaba! Ben KAYA. Çiftliğiniz için ne gerekiyor?",
                craftsman: "Merhaba! Ben KAYA. Zanaatınızda size nasıl yardımcı olabilirim?",
                student: "Merhaba! Ben KAYA. Eğitiminiz için ne gerekiyor?",
                tourist: "Hoş geldiniz! Ben KAYA, Landkreis Oldenburg rehberinizim. Ne keşfetmek istersiniz?",
                camper: "Merhaba! Ben KAYA. Nerede kamp yapmak istersiniz?",
                general: "Merhaba! Ben KAYA. Size nasıl yardımcı olabilirim?"
            },
            // PLATTDEUTSCHE BEGRÜSSUNGEN
            plattdeutsch: {
                senior: "Moin! Ik bin KAYA, dien digitalen Assistent. Wo kann ik di helpen?",
                youth: "Moin! Ik bin KAYA. Wo kann ik di helpen?",
                family: "Moin! Ik bin KAYA. Wo kann ik dien Familie helpen?",
                migrant: "Moin! Ik bin KAYA. Wo kann ik di helpen?",
                disabled: "Moin! Ik bin KAYA, dien toegänglichen Assistent. Wo kann ik di helpen?",
                farmer: "Moin! Ik bin KAYA. Wo bruukst du för dien Hoff?",
                craftsman: "Moin! Ik bin KAYA. Wo kann ik di bi dien Handwark helpen?",
                student: "Moin! Ik bin KAYA. Wo bruukst du för dien Studium?",
                tourist: "Moin! Ik bin KAYA, dien Reisföhrer för den Landkreis. Wo wullt du wat sehn?",
                camper: "Moin! Ik bin KAYA. Wo wullt ji kampern?",
                general: "Moin! Ik bin KAYA. Wo kann ik di helpen?"
            }
        };
        
        // Wähle passende Begrüßung
        const languageGreetings = greetings[language] || greetings.german;
        const greeting = languageGreetings[citizenType] || languageGreetings.general;
        
        // EMOTIONALE ANPASSUNG
        if (emotionalState === 'frustrated') {
            return `${greeting} Ich verstehe, dass es frustrierend sein kann. Lass uns das gemeinsam lösen!`;
        } else if (emotionalState === 'anxious') {
            return `${greeting} Keine Sorge, ich helfe dir gerne!`;
        } else if (emotionalState === 'positive') {
            return `${greeting} Schön, dass du da bist!`;
        }
        
        return {
            response: greeting,
            links: [],
            fallback: false
        };
    }

    /**
     * Bestimmt den richtigen Ton für alle Bürger
     */
    determineTone(emotionalState, urgency) {
        if (urgency === 'critical') {
            return 'urgent_helpful';
        }
        if (emotionalState === 'frustrated') {
            return 'calming_reassuring';
        }
        if (emotionalState === 'anxious') {
            return 'gentle_supportive';
        }
        if (emotionalState === 'positive') {
            return 'enthusiastic_helpful';
        }
        return 'friendly_professional';
    }

    /**
     * Barrierefreiheits-Anpassungen (inklusiv)
     */
    getAccessibilityAdaptations(needs) {
        const adaptations = {
            visual: {
                emphasis: '**', // Markdown für Screen Reader
                structure: 'clear_headers',
                links: 'descriptive_text'
            },
            hearing: {
                emphasis: '📞', // Visuelle Hinweise
                structure: 'written_instructions',
                links: 'text_based'
            },
            mobility: {
                emphasis: '♿', // Barrierefreiheit-Symbol
                structure: 'step_by_step',
                links: 'accessible_locations'
            },
            simple_language: {
                emphasis: '📝', // Einfache Sprache
                structure: 'short_sentences',
                links: 'easy_explanations'
            }
        };
        
        return needs.map(need => adaptations[need]).filter(Boolean);
    }

    /**
     * Bürger-Typ-Anpassungen (inklusiv) für Landkreis Oldenburg
     */
    getCitizenTypeAdaptations(citizenType) {
        const adaptations = {
            senior: {
                tone: 'respectful_patient',
                structure: 'detailed_step_by_step',
                emphasis: 'clear_explanations'
            },
            youth: {
                tone: 'modern_friendly',
                structure: 'quick_direct',
                emphasis: 'digital_options'
            },
            family: {
                tone: 'warm_supportive',
                structure: 'family_focused',
                emphasis: 'child_friendly_options'
            },
            migrant: {
                tone: 'welcoming_helpful',
                structure: 'multilingual_support',
                emphasis: 'cultural_sensitivity'
            },
            disabled: {
                tone: 'inclusive_supportive',
                structure: 'accessible_format',
                emphasis: 'accommodation_options'
            },
            // NEUE KRITISCHE PERSONAS basierend auf Bevölkerungsstruktur
            child: {
                tone: 'playful_encouraging',
                structure: 'simple_visual',
                emphasis: 'fun_interactive'
            },
            commuter: {
                tone: 'efficient_direct',
                structure: 'quick_info',
                emphasis: 'time_sensitive'
            },
            housing_seeker: {
                tone: 'supportive_understanding',
                structure: 'step_by_step',
                emphasis: 'practical_solutions'
            },
            care_dependent: {
                tone: 'gentle_caring',
                structure: 'detailed_support',
                emphasis: 'family_involvement'
            },
            low_income: {
                tone: 'respectful_helpful',
                structure: 'clear_guidance',
                emphasis: 'financial_support'
            },
            sports_interested: {
                tone: 'energetic_motivating',
                structure: 'action_oriented',
                emphasis: 'community_activities'
            },
            culture_interested: {
                tone: 'cultured_engaging',
                structure: 'event_focused',
                emphasis: 'cultural_offerings'
            },
            plattdeutsch_speaker: {
                tone: 'regional_warm',
                structure: 'traditional_format',
                emphasis: 'local_identity'
            },
            low_education: {
                tone: 'patient_explaining',
                structure: 'simple_language',
                emphasis: 'step_by_step'
            },
            mobility_needs: {
                tone: 'practical_helpful',
                structure: 'location_based',
                emphasis: 'accessibility_info'
            },
            // KRITISCHE TOURISMUS-PERSONAS basierend auf 425.000 Übernachtungen (2024)
            tourist: {
                tone: 'welcoming_enthusiastic',
                structure: 'discovery_focused',
                emphasis: 'local_highlights'
            },
            camper: {
                tone: 'adventurous_outdoor',
                structure: 'nature_focused',
                emphasis: 'camping_facilities'
            },
            accommodation_seeker: {
                tone: 'helpful_accommodating',
                structure: 'booking_focused',
                emphasis: 'comfort_options'
            },
            sightseeing_tourist: {
                tone: 'cultural_engaging',
                structure: 'attraction_focused',
                emphasis: 'historical_significance'
            },
            active_tourist: {
                tone: 'energetic_adventurous',
                structure: 'activity_focused',
                emphasis: 'outdoor_experiences'
            },
            family_tourist: {
                tone: 'family_friendly_warm',
                structure: 'child_safe_focused',
                emphasis: 'family_activities'
            },
            wellness_tourist: {
                tone: 'calm_relaxing',
                structure: 'wellness_focused',
                emphasis: 'relaxation_options'
            },
            culinary_tourist: {
                tone: 'appetizing_engaging',
                structure: 'food_focused',
                emphasis: 'regional_specialties'
            },
            shopping_tourist: {
                tone: 'exciting_helpful',
                structure: 'shopping_focused',
                emphasis: 'local_products'
            },
            event_tourist: {
                tone: 'festive_engaging',
                structure: 'event_focused',
                emphasis: 'entertainment_options'
            },
            general: {
                tone: 'professional_friendly',
                structure: 'standard_format',
                emphasis: 'comprehensive_info'
            }
        };
        
        return adaptations[citizenType] || adaptations.general;
    }

    /**
     * Sprach-Anpassungen (inklusiv) für Landkreis Oldenburg
     */
    getLanguageAdaptations(language) {
        const adaptations = {
            english: {
                greeting: 'Hello!',
                closing: 'If you need help in German, just ask!',
                emphasis: '🇬🇧'
            },
            turkish: {
                greeting: 'Merhaba!',
                closing: 'Almanca yardıma ihtiyacınız varsa, sadece sorun!',
                emphasis: '🇹🇷'
            },
            arabic: {
                greeting: 'مرحبا!',
                closing: 'إذا كنت تحتاج مساعدة باللغة الألمانية، فقط اسأل!',
                emphasis: '🇸🇦'
            },
            polish: {
                greeting: 'Dzień dobry!',
                closing: 'Jeśli potrzebujesz pomocy w języku niemieckim, po prostu zapytaj!',
                emphasis: '🇵🇱'
            },
            russian: {
                greeting: 'Привет!',
                closing: 'Если вам нужна помощь на немецком языке, просто спросите!',
                emphasis: '🇷🇺'
            },
            romanian: {
                greeting: 'Bună!',
                closing: 'Dacă aveți nevoie de ajutor în limba germană, doar întrebați!',
                emphasis: '🇷🇴'
            },
            ukrainian: {
                greeting: 'Привіт!',
                closing: 'Якщо вам потрібна допомога німецькою мовою, просто запитайте!',
                emphasis: '🇺🇦'
            },
            dutch: {
                greeting: 'Hallo!',
                closing: 'Als je hulp nodig hebt in het Duits, vraag het gewoon!',
                emphasis: '🇳🇱'
            },
            danish: {
                greeting: 'Hej!',
                closing: 'Hvis du har brug for hjælp på tysk, spørg bare!',
                emphasis: '🇩🇰'
            },
            plattdeutsch: {
                greeting: 'Moin!',
                closing: 'Ik helpe di gern wieter!',
                emphasis: '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
            },
            german: {
                greeting: 'Moin!',
                closing: '',
                emphasis: '🇩🇪'
            }
        };
        
        return adaptations[language] || adaptations.german;
    }

    /**
     * Universelle Funktion für konkrete Fragen-Erkennung
     */
    analyzeConcreteQuestion(query, intentionType) {
        const lowerQuery = query.toLowerCase();
        
        // Universelle Keywords für alle Bereiche
        const fahrenKeywords = ['darf ich', 'kann ich', 'ist das erlaubt', 'darf ich damit', 'kann ich damit'];
        const fahrenActions = ['fahren', 'losfahren', 'fahren', 'fahre', 'fahrt'];
        const fahrenQuestions = ['was passiert', 'was kostet', 'wie lange', 'wie teuer', 'wie viel'];
        const emotionalKeywords = ['kompliziert', 'schwierig', 'verstehe nicht', 'angst', 'sorge', 'nervös', 'eilig', 'heute noch', 'schnell'];
        const practicalKeywords = ['unterlagen', 'dokumente', 'papiere', 'wo ist', 'adresse', 'ort', 'online', 'internet', 'digital'];
        const targetGroupKeywords = ['sohn', 'tochter', 'kinder', 'deutsch', 'sprache', 'verstehe', 'laufen', 'rollstuhl', 'behindert'];
        
        // Prüfe ob konkrete Frage erkannt wird
        const isConcreteQuestion = (fahrenKeywords.some(keyword => lowerQuery.includes(keyword)) && 
             fahrenActions.some(action => lowerQuery.includes(action))) ||
            fahrenQuestions.some(question => lowerQuery.includes(question)) ||
            emotionalKeywords.some(keyword => lowerQuery.includes(keyword)) ||
            practicalKeywords.some(keyword => lowerQuery.includes(keyword)) ||
            targetGroupKeywords.some(keyword => lowerQuery.includes(keyword));
        
        if (!isConcreteQuestion) return null;
        
        // Erkenne spezifische Fragen
        let specificAnswer = '';
        let emotionalSupport = '';
        let targetGroupHelp = '';
        
        // EMOTIONALE ZUSTÄNDE ERKENNEN
        if (lowerQuery.includes('kompliziert') || lowerQuery.includes('schwierig') || lowerQuery.includes('verstehe nicht')) {
            emotionalSupport = '**Keine Sorge!** Ich erkläre dir alles Schritt für Schritt. Das ist gar nicht so kompliziert! 😊\n\n';
        } else if (lowerQuery.includes('angst') || lowerQuery.includes('sorge') || lowerQuery.includes('nervös')) {
            emotionalSupport = '**Alles gut!** Wir sind hier um dir zu helfen. Das Amt ist freundlich und hilfsbereit! 🤗\n\n';
        } else if (lowerQuery.includes('eilig') || lowerQuery.includes('heute noch') || lowerQuery.includes('schnell')) {
            emotionalSupport = '**Verstehe ich!** Lass uns das schnell lösen. Du kannst noch heute einen Termin bekommen! ⚡\n\n';
        }
        
        // SPEZIFISCHE FRAGEN
        if (lowerQuery.includes('was passiert')) {
            specificAnswer = this.getConsequenceAnswer(intentionType);
        } else if (lowerQuery.includes('was kostet') || lowerQuery.includes('wie teuer') || lowerQuery.includes('wie viel')) {
            specificAnswer = this.getCostAnswer(intentionType);
        } else if (lowerQuery.includes('wie lange')) {
            specificAnswer = this.getTimeAnswer(intentionType);
        } else if (lowerQuery.includes('unterlagen') || lowerQuery.includes('dokumente') || lowerQuery.includes('papiere')) {
            specificAnswer = this.getDocumentAnswer(intentionType);
        } else if (lowerQuery.includes('wo ist') || lowerQuery.includes('adresse') || lowerQuery.includes('ort')) {
            specificAnswer = this.getLocationAnswer(intentionType);
        } else if (lowerQuery.includes('online') || lowerQuery.includes('internet') || lowerQuery.includes('digital')) {
            specificAnswer = this.getOnlineAnswer(intentionType);
        }
        
        // ZIELGRUPPEN-SPEZIFISCHE HILFE
        if (lowerQuery.includes('sohn') || lowerQuery.includes('tochter') || lowerQuery.includes('kinder')) {
            targetGroupHelp = '**Für Senioren:** Dein Sohn kann dir helfen! Du kannst auch eine Vollmacht mitbringen.\n\n';
        } else if (lowerQuery.includes('deutsch') || lowerQuery.includes('sprache') || lowerQuery.includes('verstehe')) {
            targetGroupHelp = '**Mehrsprachige Hilfe:** Wir haben Dolmetscher! Ruf einfach an: 04431 85-0\n\n';
        } else if (lowerQuery.includes('laufen') || lowerQuery.includes('rollstuhl') || lowerQuery.includes('behindert')) {
            targetGroupHelp = '**Barrierefreiheit:** Das Gebäude ist rollstuhlgerecht! Parkplätze direkt vor der Tür.\n\n';
        }
        
        return {
            specificAnswer,
            emotionalSupport,
            targetGroupHelp
        };
    }
    
    /**
     * Hilfsfunktionen für spezifische Antworten
     */
    getConsequenceAnswer(intentionType) {
        const consequences = {
            'kfz_zulassung': '**Was passiert wenn du ohne Zulassung fährst:**\n• **Bußgeld:** 70-120€\n• **Punkte:** 1 Punkt in Flensburg\n• **Versicherung:** Deckt NICHT bei Unfall\n• **Polizei:** Kann Fahrzeug beschlagnahmen\n\n',
            'bauantrag': '**Was passiert ohne Baugenehmigung:**\n• **Bußgeld:** 500-50.000€\n• **Rückbau:** Muss abgerissen werden\n• **Versicherung:** Deckt NICHT bei Schäden\n• **Nachbarn:** Können klagen\n\n',
            'führerschein': '**Was passiert ohne Führerschein:**\n• **Bußgeld:** 10-15€\n• **Fahrzeug:** Wird beschlagnahmt\n• **Versicherung:** Deckt NICHT bei Unfall\n• **Strafverfahren:** Möglich\n\n'
        };
        return consequences[intentionType] || '**Konsequenzen:** Ohne Genehmigung kann es teuer werden!\n\n';
    }
    
    getCostAnswer(intentionType) {
        const costs = {
            'kfz_zulassung': '**Was kostet die KFZ-Zulassung:**\n• **Zulassung:** 26,80€\n• **Kennzeichen:** 10,20€\n• **EVB-Nummer:** 7,50€\n• **Gesamt:** ca. 45€\n\n',
            'bauantrag': '**Was kostet ein Bauantrag:**\n• **Baugenehmigung:** 0,5% des Bauwerts\n• **Grundgebühr:** 25€\n• **Nebenkosten:** 50-200€\n• **Gesamt:** je nach Bauvorhaben\n\n',
            'führerschein': '**Was kostet ein Führerschein:**\n• **Antrag:** 43,40€\n• **Führerschein:** 24,30€\n• **Sehtest:** 6,43€\n• **Gesamt:** ca. 75€\n\n'
        };
        return costs[intentionType] || '**Kosten:** Je nach Anliegen unterschiedlich. Ruf an: 04431 85-0\n\n';
    }
    
    getTimeAnswer(intentionType) {
        const times = {
            'kfz_zulassung': '**Wie lange dauert die Zulassung:**\n• **Termin:** 15-30 Minuten\n• **Bearbeitung:** Sofort\n• **Kennzeichen:** Sofort verfügbar\n• **Fahrzeugschein:** Sofort mit\n\n',
            'bauantrag': '**Wie lange dauert ein Bauantrag:**\n• **Bearbeitung:** 1-3 Monate\n• **Genehmigung:** 2-4 Wochen\n• **Widerspruch:** 1 Monat\n• **Baubeginn:** Nach Genehmigung\n\n',
            'führerschein': '**Wie lange dauert ein Führerschein:**\n• **Antrag:** 15-30 Minuten\n• **Bearbeitung:** 2-4 Wochen\n• **Führerschein:** Per Post\n• **Gültigkeit:** 15 Jahre\n\n'
        };
        return times[intentionType] || '**Bearbeitungszeit:** Je nach Anliegen unterschiedlich. Ruf an: 04431 85-0\n\n';
    }
    
    getDocumentAnswer(intentionType) {
        const documents = {
            'kfz_zulassung': '**Welche Unterlagen du brauchst:**\n• **Personalausweis** oder Reisepass\n• **EVB-Nummer** von der Versicherung\n• **Fahrzeugbrief** und Fahrzeugschein\n• **Altes Kennzeichen** (falls gewünscht)\n\n',
            'bauantrag': '**Welche Unterlagen du brauchst:**\n• **Grundstücksnachweis** (Grundbuchauszug)\n• **Bauzeichnungen** (Maßstab 1:100)\n• **Statik** (bei größeren Bauten)\n• **Baubeschreibung** und Kostenberechnung\n\n',
            'führerschein': '**Welche Unterlagen du brauchst:**\n• **Personalausweis** oder Reisepass\n• **Sehtest** (nicht älter als 2 Jahre)\n• **Erste-Hilfe-Kurs** (nicht älter als 2 Jahre)\n• **Biometrisches Foto** (35x45mm)\n\n'
        };
        return documents[intentionType] || '**Unterlagen:** Je nach Anliegen unterschiedlich. Ruf an: 04431 85-0\n\n';
    }
    
    getLocationAnswer(intentionType) {
        return '**Wo ist die zuständige Stelle:**\n• **Adresse:** Delmenhorster Straße 6, 27793 Wildeshausen\n• **Öffnungszeiten:** Mo-Do 8-16 Uhr, Fr 8-13 Uhr\n• **Parkplätze:** Direkt vor dem Gebäude\n• **Barrierefrei:** Rollstuhlgerecht\n\n';
    }
    
    getOnlineAnswer(intentionType) {
        return '**Online-Services:**\n• **Termin buchen:** Online möglich\n• **Formulare:** Online ausfüllen\n• **Antrag:** Teilweise online\n• **Status:** Online abfragen\n\n';
    }

    /**
     * Generiert spezifische Antworten für alle Anliegen
     */
    generateSpecificResponse(intention, tone) {
        const responseMap = {
            // Verwaltung
            'bauantrag': () => this.generateBauantragResponse(intention, tone),
            'kfz_zulassung': () => this.generateKFZZulassungResponse(intention, tone),
            'führerschein': () => this.generateFührerscheinResponse(intention, tone),
            'gewerbe': () => this.generateGewerbeResponse(intention, tone),
            
            // Soziales
            'soziales': () => this.generateSozialesResponse(intention, tone),
            'wohngeld': () => this.generateWohngeldResponse(intention, tone),
            'pflege': () => this.generatePflegeResponse(intention, tone),
            
            // Gesundheit
            'gesundheit': () => this.generateGesundheitResponse(intention, tone),
            'impfung': () => this.generateImpfungResponse(intention, tone),
            
            // Bildung
            'bildung': () => this.generateBildungResponse(intention, tone),
            'studium': () => this.generateStudiumResponse(intention, tone),
            
            // Umwelt
            'umwelt': () => this.generateUmweltResponse(intention, tone),
            'wasser': () => this.generateWasserResponse(intention, tone),
            
            // Allgemeine Verwaltung
            'formular': () => this.generateFormularResponse(intention, tone),
            'termin': () => this.generateTerminResponse(intention, tone),
            'kontakt': () => this.generateKontaktResponse(intention, tone),
            'öffnungszeiten': () => this.generateÖffnungszeitenResponse(intention, tone),
            
            // Notfälle
            'notfall': () => this.generateNotfallResponse(intention, tone),
            
            // Erweiterte Landkreis-spezifische Anliegen
            'landwirtschaft': () => this.generateLandwirtschaftResponse(intention, tone),
            'tierhaltung': () => this.generateTierhaltungResponse(intention, tone),
            'handwerk': () => this.generateHandwerkResponse(intention, tone),
            'ausbildung': () => this.generateAusbildungResponse(intention, tone),
            'studium': () => this.generateStudiumResponse(intention, tone),
            'bafög': () => this.generateBafögResponse(intention, tone),
            'arbeitslosigkeit': () => this.generateArbeitslosigkeitResponse(intention, tone),
            'rente': () => this.generateRenteResponse(intention, tone),
            'senioren': () => this.generateSeniorenResponse(intention, tone),
            'alleinerziehende': () => this.generateAlleinerziehendeResponse(intention, tone),
            'unterhalt': () => this.generateUnterhaltResponse(intention, tone),
            'behinderung': () => this.generateBehinderungResponse(intention, tone),
            'migration': () => this.generateMigrationResponse(intention, tone),
            'aufenthaltsrecht': () => this.generateAufenthaltsrechtResponse(intention, tone),
            'eu_bürger': () => this.generateEUBürgerResponse(intention, tone),
            'kleinunternehmer': () => this.generateKleinunternehmerResponse(intention, tone),
            'steuern': () => this.generateSteuernResponse(intention, tone),
            
            // Fallback
            'general_inquiry': () => this.generateGeneralResponse(intention, tone)
        };
        
        const responseGenerator = responseMap[intention.type] || responseMap['general_inquiry'];
        return responseGenerator();
    }

    /**
     * Kombiniert alle Anpassungen für universelle Antworten
     */
    combineAdaptations(baseResponse, adaptations) {
        let response = baseResponse.response;
        
        // Accessibility-Anpassungen
        if (adaptations.accessibility.length > 0) {
            adaptations.accessibility.forEach(adaptation => {
                if (adaptation.emphasis) {
                    response = response.replace(/\*\*/g, adaptation.emphasis);
                }
            });
        }
        
        // Citizen-Type-Anpassungen
        if (adaptations.citizenType) {
            const greeting = adaptations.citizenType.tone === 'respectful_patient' ? 'Sehr geehrte Damen und Herren,' : 'Moin!';
            response = response.replace(/Moin!/g, greeting);
        }
        
        // Language-Anpassungen
        if (adaptations.language) {
            response = adaptations.language.greeting + ' ' + response.replace(/Moin!/g, '');
            response += '\n\n' + adaptations.language.closing;
        }
        
        // Urgency-Anpassungen
        if (adaptations.urgency === 'critical') {
            response = '🚨 ' + response;
        }
        
        return {
            response: response,
            links: baseResponse.links,
            urgency: adaptations.urgency,
            accessibility: adaptations.accessibility,
            citizenType: adaptations.citizenType,
            language: adaptations.language
        };
    }

    generateBauantragResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        // Prüfe auf konkrete Fragen
        const concreteQuestion = this.analyzeConcreteQuestion(intention.query, 'bauantrag');
        
        if (concreteQuestion) {
            return {
                response: `Moin! **NEIN, du darfst NICHT einfach losbauen!** 🚫

Du brauchst **erst eine Baugenehmigung**! Ohne Genehmigung ist das **illegal** und kann teuer werden.

${concreteQuestion.emotionalSupport}${concreteQuestion.specificAnswer}${concreteQuestion.targetGroupHelp}**🎯 Hier ist dein direkter Weg zur Baugenehmigung:**

**1. 📋 Online-Bauantrag:**
   → [Bauantrag online](https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/bauantrag-online/)

**2. 📄 Formulare ausfüllen:**
   → [Bauantrag-Formulare](https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/)

**3. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Bauantrag-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
                links: [
                    { title: 'Bauantrag online', url: 'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/bauantrag-online/' },
                    { title: 'Bauantrag-Formulare', url: 'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/' }
                ]
            };
        }
        
        // Standard Bauantrag-Response
        return {
            response: `Moin! Perfekt - ich helfe dir sofort beim Bauantrag${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Online-Bauantrag:**
   → [Bauantrag online](https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/bauantrag-online/)

**2. 📄 Formulare ausfüllen:**
   → [Bauantrag-Formulare](https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/)

**3. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Bauantrag-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Bauantrag online', url: 'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/bauantrag-online/' },
                { title: 'Bauantrag-Formulare', url: 'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/' }
            ]
        };
    }

    generateFormularResponse(intention, tone) {
        const specific = intention.specific ? ` für ${intention.specific}` : '';
        
        return {
            response: `Hier sind die wichtigsten Formulare${specific}:

**Direkte Downloads:**
• [Alle Anträge und Formulare](https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/)
• [Online-Services](https://www.oldenburg-kreis.de/portal/)

**Schnelle Hilfe:**
• **Tel.: 04431 85-0** - Wir helfen beim Ausfüllen
• **E-Mail:** kontakt@landkreis-oldenburg.de

Welches Formular benötigen Sie genau? Dann kann ich Ihnen den direkten Link geben.`,
            links: [
                { title: 'Alle Anträge und Formulare', url: 'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/' },
                { title: 'Online-Services', url: 'https://www.oldenburg-kreis.de/portal/' }
            ]
        };
    }

    generateKontaktResponse(intention, tone) {
        return {
            response: `**Direkte Kontakte:**

**Hauptnummer:** 04431 85-0
• Mo-Fr: 8-16 Uhr
• Für alle Anliegen

**E-Mail:** kontakt@landkreis-oldenburg.de
• Antwort innerhalb 24h

**Adresse:**
Landkreis Oldenburg
Delmenhorster Straße 6
27793 Wildeshausen

**Online-Termin:** [Terminvereinbarung](https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/online-terminvereinbarung/)

Wofür genau brauchen Sie Kontakt? Dann kann ich Ihnen die richtige Abteilung nennen.`,
            links: [
                { title: 'Kontaktformular', url: 'https://www.oldenburg-kreis.de/portal/kontakt.html' },
                { title: 'Online-Terminvereinbarung', url: 'https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/online-terminvereinbarung/' }
            ]
        };
    }

    generateTerminResponse(intention, tone) {
        return {
            response: `**Terminvereinbarung:**

**Online-Termin:** [Terminvereinbarung](https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/online-terminvereinbarung/)
• Schnell und einfach
• Verfügbare Zeiten sofort sichtbar

**Telefonisch:** 04431 85-0
• Mo-Fr: 8-16 Uhr
• Persönliche Beratung

**Öffnungszeiten:**
• Mo-Do: 8-16 Uhr
• Fr: 8-13 Uhr

Für welches Anliegen brauchen Sie einen Termin?`,
            links: [
                { title: 'Online-Terminvereinbarung', url: 'https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/online-terminvereinbarung/' }
            ]
        };
    }

    generateKFZZulassungResponse(intention, tone) {
        const query = intention.query || '';
        const lowerQuery = query.toLowerCase();
        const citizenType = intention.citizenType;
        const language = intention.language;
        const emotionalState = intention.emotionalState;
        const urgency = intention.urgency;
        
        // DYNAMISCHE BEGRÜSSUNG basierend auf Persona
        let greeting = this.getDynamicGreeting(citizenType, language, 'kfz');
        
        // ERKENNE KONKRETE FRAGEN
        const concreteAnswer = this.analyzeConcreteQuestion(query, 'kfz_zulassung');
        
        // DYNAMISCHE ANTWORT-STRUKTUR
        let response = '';
        
        // 1. BEGRÜSSUNG
        response += greeting;
        
        // 2. KONKRETE ANTWORT (falls vorhanden)
        if (concreteAnswer) {
            response += '\n\n' + concreteAnswer.specificAnswer;
            if (concreteAnswer.emotionalSupport) {
                response += concreteAnswer.emotionalSupport;
            }
            if (concreteAnswer.targetGroupHelp) {
                response += concreteAnswer.targetGroupHelp;
            }
        }
        
        // 3. DYNAMISCHE HANDLUNGSANWEISUNGEN
        response += '\n\n' + this.getDynamicActionSteps('kfz_zulassung', citizenType, urgency, language);
        
        // 4. DYNAMISCHE ENDUNG
        response += '\n\n' + this.getDynamicEnding(citizenType, language, emotionalState);
        
        return {
            response: response,
            links: this.getRelevantLinks('kfz_zulassung'),
            fallback: false
        };
    }
    
    /**
     * Generiert dynamische Begrüßungen basierend auf Persona und Kontext
     */
    getDynamicGreeting(citizenType, language, context) {
        const greetings = {
            german: {
                // KFZ-ZULASSUNG
                kfz: {
                    senior: "Guten Tag! Ich helfe Ihnen gerne bei der KFZ-Zulassung.",
                    youth: "Hey! Ich helfe dir bei der Autozulassung.",
                    family: "Hallo! Ich helfe Ihrer Familie bei der KFZ-Zulassung.",
                    farmer: "Moin! Ich helfe dir bei der Traktor-Zulassung.",
                    craftsman: "Moin! Ich helfe dir bei der Werkzeug-Zulassung.",
                    student: "Hey! Ich helfe dir bei der Auto-Zulassung fürs Studium.",
                    tourist: "Hallo! Ich helfe Ihnen bei der KFZ-Zulassung für Ihren Aufenthalt.",
                    general: "Hallo! Ich helfe Ihnen bei der KFZ-Zulassung."
                },
                // FÜHRERSCHEIN
                führerschein: {
                    senior: "Guten Tag! Ich helfe Ihnen gerne beim Führerschein.",
                    youth: "Hey! Ich helfe dir beim Führerschein.",
                    family: "Hallo! Ich helfe Ihrer Familie beim Führerschein.",
                    farmer: "Moin! Ich helfe dir beim Traktor-Führerschein.",
                    craftsman: "Moin! Ich helfe dir beim LKW-Führerschein.",
                    student: "Hey! Ich helfe dir beim Führerschein fürs Studium.",
                    tourist: "Hallo! Ich helfe Ihnen beim Führerschein für Ihren Aufenthalt.",
                    general: "Hallo! Ich helfe Ihnen beim Führerschein."
                },
                // GEWERBE
                gewerbe: {
                    senior: "Guten Tag! Ich helfe Ihnen gerne bei der Gewerbeanmeldung.",
                    youth: "Hey! Ich helfe dir bei der Gewerbeanmeldung.",
                    family: "Hallo! Ich helfe Ihrer Familie bei der Gewerbeanmeldung.",
                    farmer: "Moin! Ich helfe dir bei der landwirtschaftlichen Gewerbeanmeldung.",
                    craftsman: "Moin! Ich helfe dir bei der Handwerks-Gewerbeanmeldung.",
                    student: "Hey! Ich helfe dir bei der Gewerbeanmeldung für dein Studium.",
                    tourist: "Hallo! Ich helfe Ihnen bei der Gewerbeanmeldung für Ihren Aufenthalt.",
                    general: "Hallo! Ich helfe Ihnen bei der Gewerbeanmeldung."
                },
                // BAUANTRAG
                bauantrag: {
                    senior: "Guten Tag! Ich helfe Ihnen gerne beim Bauantrag.",
                    youth: "Hey! Ich helfe dir beim Bauantrag.",
                    family: "Hallo! Ich helfe Ihrer Familie beim Bauantrag.",
                    farmer: "Moin! Ich helfe dir beim landwirtschaftlichen Bauantrag.",
                    craftsman: "Moin! Ich helfe dir beim Handwerks-Bauantrag.",
                    student: "Hey! Ich helfe dir beim Bauantrag für dein Studium.",
                    tourist: "Hallo! Ich helfe Ihnen beim Bauantrag für Ihren Aufenthalt.",
                    general: "Hallo! Ich helfe Ihnen beim Bauantrag."
                },
                // LANDWIRTSCHAFT
                landwirtschaft: {
                    senior: "Guten Tag! Ich helfe Ihnen gerne bei den EU-Anträgen.",
                    youth: "Hey! Ich helfe dir bei den EU-Anträgen.",
                    family: "Hallo! Ich helfe Ihrer Familie bei den EU-Anträgen.",
                    farmer: "Moin! Ich helfe dir bei deinen EU-Anträgen.",
                    craftsman: "Moin! Ich helfe dir bei den EU-Anträgen.",
                    student: "Hey! Ich helfe dir bei den EU-Anträgen.",
                    tourist: "Hallo! Ich helfe Ihnen bei den EU-Anträgen.",
                    general: "Hallo! Ich helfe Ihnen bei den EU-Anträgen."
                },
                // GENERAL
                general: {
                    senior: "Guten Tag! Ich bin KAYA, Ihr digitaler Assistent.",
                    youth: "Hey! Ich bin KAYA, dein digitaler Assistent.",
                    family: "Hallo! Ich bin KAYA, Ihr digitaler Assistent.",
                    farmer: "Moin! Ich bin KAYA, dein digitaler Assistent.",
                    craftsman: "Moin! Ich bin KAYA, dein digitaler Assistent.",
                    student: "Hey! Ich bin KAYA, dein digitaler Assistent.",
                    tourist: "Hallo! Ich bin KAYA, Ihr digitaler Assistent.",
                    general: "Hallo! Ich bin KAYA, Ihr digitaler Assistent."
                }
            },
            english: {
                general: "Hello! I'm KAYA, your digital assistant."
            },
            turkish: {
                general: "Merhaba! Ben KAYA, dijital asistanınızım."
            },
            plattdeutsch: {
                general: "Moin! Ik bin KAYA, dien digitalen Assistent."
            }
        };
        
        // Wähle passende Begrüßung
        const languageGreetings = greetings[language] || greetings.german;
        const contextGreetings = languageGreetings[context] || languageGreetings.general;
        return contextGreetings[citizenType] || contextGreetings.general;
    }
                // LANDWIRTSCHAFT
                landwirtschaft: {
                    senior: "Guten Tag! Ich helfe Ihnen gerne bei Ihren landwirtschaftlichen Anliegen.",
                    youth: "Hey! Ich helfe dir bei deinen landwirtschaftlichen Anliegen.",
                    family: "Hallo! Ich helfe Ihrer Familie bei den landwirtschaftlichen Anliegen.",
                    farmer: "Moin! Ich helfe dir bei deinen Hof-Anliegen.",
                    craftsman: "Moin! Ich helfe dir bei deinen landwirtschaftlichen Anliegen.",
                    student: "Hey! Ich helfe dir bei deinen landwirtschaftlichen Anliegen fürs Studium.",
                    tourist: "Hallo! Ich helfe Ihnen bei den landwirtschaftlichen Anliegen für Ihren Aufenthalt.",
                    general: "Hallo! Ich helfe Ihnen bei Ihren landwirtschaftlichen Anliegen."
                },
                // GENERAL
                general: {
                    senior: "Guten Tag! Ich helfe Ihnen gerne.",
                    youth: "Hey! Ich helfe dir gerne.",
                    family: "Hallo! Ich helfe Ihrer Familie gerne.",
                    farmer: "Moin! Ich helfe dir gerne.",
                    craftsman: "Moin! Ich helfe dir gerne.",
                    student: "Hey! Ich helfe dir gerne.",
                    tourist: "Hallo! Ich helfe Ihnen gerne.",
                    general: "Hallo! Ich helfe Ihnen gerne."
                }
            },
            english: {
                senior: "Good day! I'll help you with your vehicle registration.",
                youth: "Hey! I'll help you register your car.",
                family: "Hello! I'll help your family with vehicle registration.",
                farmer: "Hello! I'll help you register your tractor.",
                craftsman: "Hello! I'll help you register your work vehicle.",
                student: "Hey! I'll help you register your car for university.",
                tourist: "Hello! I'll help you with vehicle registration for your stay.",
                general: "Hello! I'll help you with vehicle registration."
            },
            turkish: {
                senior: "İyi günler! Araç tescilinizde size yardımcı olacağım.",
                youth: "Merhaba! Arabanızı tescil ettirmenizde size yardımcı olacağım.",
                family: "Merhaba! Ailenizin araç tescilinde size yardımcı olacağım.",
                farmer: "Merhaba! Traktörünüzü tescil ettirmenizde size yardımcı olacağım.",
                craftsman: "Merhaba! İş aracınızı tescil ettirmenizde size yardımcı olacağım.",
                student: "Merhaba! Üniversite için arabanızı tescil ettirmenizde size yardımcı olacağım.",
                tourist: "Merhaba! Kalışınız için araç tescilinde size yardımcı olacağım.",
                general: "Merhaba! Araç tescilinizde size yardımcı olacağım."
            },
            plattdeutsch: {
                senior: "Moin! Ik helpe di gern bi de KFZ-Anmeldung.",
                youth: "Moin! Ik helpe di bi de Auto-Anmeldung.",
                family: "Moin! Ik helpe dien Familie bi de KFZ-Anmeldung.",
                farmer: "Moin! Ik helpe di bi de Traktor-Anmeldung.",
                craftsman: "Moin! Ik helpe di bi de Warktüüch-Anmeldung.",
                student: "Moin! Ik helpe di bi de Auto-Anmeldung för dat Studium.",
                tourist: "Moin! Ik helpe di bi de KFZ-Anmeldung för dien Upenthalt.",
                general: "Moin! Ik helpe di bi de KFZ-Anmeldung."
            }
        };
        
        const languageGreetings = greetings[language] || greetings.german;
        const contextGreetings = languageGreetings[context] || languageGreetings.general;
        return contextGreetings[citizenType] || contextGreetings.general;
    }
    
    /**
     * Generiert dynamische Handlungsschritte
     */
    getDynamicActionSteps(context, citizenType, urgency, language) {
        if (urgency === 'critical') {
            return this.getUrgentActionSteps(context, language);
        }
        
        const steps = {
            german: {
                // KFZ-ZULASSUNG
                kfz_zulassung: {
                    senior: "**Ihre nächsten Schritte:**\n1. **Termin buchen:** Online oder telefonisch\n2. **Unterlagen vorbereiten:** Personalausweis, EVB-Nummer, Fahrzeugpapiere\n3. **Zulassung vornehmen:** Persönlich oder mit Vollmacht",
                    youth: "**Deine nächsten Schritte:**\n1. **Termin buchen:** Online oder anrufen\n2. **Unterlagen sammeln:** Personalausweis, EVB-Nummer, Fahrzeugpapiere\n3. **Zulassung machen:** Geh hin oder lass jemanden für dich gehen",
                    family: "**Ihre nächsten Schritte:**\n1. **Termin buchen:** Online oder telefonisch\n2. **Unterlagen vorbereiten:** Personalausweis, EVB-Nummer, Fahrzeugpapiere\n3. **Zulassung vornehmen:** Als Familie oder mit Vollmacht",
                    farmer: "**Deine nächsten Schritte:**\n1. **Termin buchen:** Online oder anrufen\n2. **Unterlagen sammeln:** Personalausweis, EVB-Nummer, Traktorpapiere\n3. **Zulassung machen:** Geh hin oder lass jemanden für dich gehen",
                    general: "**Ihre nächsten Schritte:**\n1. **Termin buchen:** Online oder telefonisch\n2. **Unterlagen vorbereiten:** Personalausweis, EVB-Nummer, Fahrzeugpapiere\n3. **Zulassung vornehmen:** Persönlich oder mit Vollmacht"
                },
                // FÜHRERSCHEIN
                führerschein: {
                    senior: "**Ihre nächsten Schritte:**\n1. **Termin buchen:** Online oder telefonisch\n2. **Unterlagen vorbereiten:** Personalausweis, Führerschein, Sehtest\n3. **Führerschein beantragen:** Persönlich oder mit Vollmacht",
                    youth: "**Deine nächsten Schritte:**\n1. **Termin buchen:** Online oder anrufen\n2. **Unterlagen sammeln:** Personalausweis, Führerschein, Sehtest\n3. **Führerschein machen:** Geh hin oder lass jemanden für dich gehen",
                    family: "**Ihre nächsten Schritte:**\n1. **Termin buchen:** Online oder telefonisch\n2. **Unterlagen vorbereiten:** Personalausweis, Führerschein, Sehtest\n3. **Führerschein beantragen:** Als Familie oder mit Vollmacht",
                    farmer: "**Deine nächsten Schritte:**\n1. **Termin buchen:** Online oder anrufen\n2. **Unterlagen sammeln:** Personalausweis, Traktor-Führerschein, Sehtest\n3. **Führerschein machen:** Geh hin oder lass jemanden für dich gehen",
                    general: "**Ihre nächsten Schritte:**\n1. **Termin buchen:** Online oder telefonisch\n2. **Unterlagen vorbereiten:** Personalausweis, Führerschein, Sehtest\n3. **Führerschein beantragen:** Persönlich oder mit Vollmacht"
                },
                // GEWERBE
                gewerbe: {
                    senior: "**Ihre nächsten Schritte:**\n1. **Gewerbe anmelden:** Online oder persönlich\n2. **Unterlagen vorbereiten:** Personalausweis, Gewerbeschein, Steuernummer\n3. **Gewerbe registrieren:** Persönlich oder mit Vollmacht",
                    youth: "**Deine nächsten Schritte:**\n1. **Gewerbe anmelden:** Online oder persönlich\n2. **Unterlagen sammeln:** Personalausweis, Gewerbeschein, Steuernummer\n3. **Gewerbe registrieren:** Geh hin oder lass jemanden für dich gehen",
                    family: "**Ihre nächsten Schritte:**\n1. **Gewerbe anmelden:** Online oder persönlich\n2. **Unterlagen vorbereiten:** Personalausweis, Gewerbeschein, Steuernummer\n3. **Gewerbe registrieren:** Als Familie oder mit Vollmacht",
                    farmer: "**Deine nächsten Schritte:**\n1. **Gewerbe anmelden:** Online oder persönlich\n2. **Unterlagen sammeln:** Personalausweis, landwirtschaftlicher Gewerbeschein\n3. **Gewerbe registrieren:** Geh hin oder lass jemanden für dich gehen",
                    general: "**Ihre nächsten Schritte:**\n1. **Gewerbe anmelden:** Online oder persönlich\n2. **Unterlagen vorbereiten:** Personalausweis, Gewerbeschein, Steuernummer\n3. **Gewerbe registrieren:** Persönlich oder mit Vollmacht"
                },
                // BAUANTRAG
                bauantrag: {
                    senior: "**Ihre nächsten Schritte:**\n1. **Bauantrag stellen:** Online oder persönlich\n2. **Unterlagen vorbereiten:** Personalausweis, Grundstücksunterlagen, Baupläne\n3. **Bauantrag einreichen:** Persönlich oder mit Vollmacht",
                    youth: "**Deine nächsten Schritte:**\n1. **Bauantrag stellen:** Online oder persönlich\n2. **Unterlagen sammeln:** Personalausweis, Grundstücksunterlagen, Baupläne\n3. **Bauantrag einreichen:** Geh hin oder lass jemanden für dich gehen",
                    family: "**Ihre nächsten Schritte:**\n1. **Bauantrag stellen:** Online oder persönlich\n2. **Unterlagen vorbereiten:** Personalausweis, Grundstücksunterlagen, Baupläne\n3. **Bauantrag einreichen:** Als Familie oder mit Vollmacht",
                    farmer: "**Deine nächsten Schritte:**\n1. **Bauantrag stellen:** Online oder persönlich\n2. **Unterlagen sammeln:** Personalausweis, landwirtschaftliche Unterlagen, Baupläne\n3. **Bauantrag einreichen:** Geh hin oder lass jemanden für dich gehen",
                    general: "**Ihre nächsten Schritte:**\n1. **Bauantrag stellen:** Online oder persönlich\n2. **Unterlagen vorbereiten:** Personalausweis, Grundstücksunterlagen, Baupläne\n3. **Bauantrag einreichen:** Persönlich oder mit Vollmacht"
                },
                // LANDWIRTSCHAFT
                landwirtschaft: {
                    senior: "**Ihre nächsten Schritte:**\n1. **EU-Anträge stellen:** Online oder persönlich\n2. **Unterlagen vorbereiten:** Personalausweis, Flächennachweis, Tierbestand\n3. **Anträge einreichen:** Persönlich oder mit Vollmacht",
                    youth: "**Deine nächsten Schritte:**\n1. **EU-Anträge stellen:** Online oder persönlich\n2. **Unterlagen sammeln:** Personalausweis, Flächennachweis, Tierbestand\n3. **Anträge einreichen:** Geh hin oder lass jemanden für dich gehen",
                    family: "**Ihre nächsten Schritte:**\n1. **EU-Anträge stellen:** Online oder persönlich\n2. **Unterlagen vorbereiten:** Personalausweis, Flächennachweis, Tierbestand\n3. **Anträge einreichen:** Als Familie oder mit Vollmacht",
                    farmer: "**Deine nächsten Schritte:**\n1. **EU-Anträge stellen:** Online oder persönlich\n2. **Unterlagen sammeln:** Personalausweis, Flächennachweis, Tierbestand\n3. **Anträge einreichen:** Geh hin oder lass jemanden für dich gehen",
                    general: "**Ihre nächsten Schritte:**\n1. **EU-Anträge stellen:** Online oder persönlich\n2. **Unterlagen vorbereiten:** Personalausweis, Flächennachweis, Tierbestand\n3. **Anträge einreichen:** Persönlich oder mit Vollmacht"
                },
                // GENERAL
                general: {
                    senior: "**Ihre nächsten Schritte:**\n1. **Termin buchen:** Online oder telefonisch\n2. **Unterlagen vorbereiten:** Personalausweis, relevante Dokumente\n3. **Anliegen klären:** Persönlich oder mit Vollmacht",
                    youth: "**Deine nächsten Schritte:**\n1. **Termin buchen:** Online oder anrufen\n2. **Unterlagen sammeln:** Personalausweis, relevante Dokumente\n3. **Anliegen klären:** Geh hin oder lass jemanden für dich gehen",
                    family: "**Ihre nächsten Schritte:**\n1. **Termin buchen:** Online oder telefonisch\n2. **Unterlagen vorbereiten:** Personalausweis, relevante Dokumente\n3. **Anliegen klären:** Als Familie oder mit Vollmacht",
                    farmer: "**Deine nächsten Schritte:**\n1. **Termin buchen:** Online oder anrufen\n2. **Unterlagen sammeln:** Personalausweis, relevante Dokumente\n3. **Anliegen klären:** Geh hin oder lass jemanden für dich gehen",
                    general: "**Ihre nächsten Schritte:**\n1. **Termin buchen:** Online oder telefonisch\n2. **Unterlagen vorbereiten:** Personalausweis, relevante Dokumente\n3. **Anliegen klären:** Persönlich oder mit Vollmacht"
                }
            },
            english: {
                general: "**Your next steps:**\n1. **Book appointment:** Online or by phone\n2. **Prepare documents:** ID, insurance number, vehicle papers\n3. **Complete registration:** In person or with power of attorney"
            },
            turkish: {
                general: "**Sonraki adımlarınız:**\n1. **Randevu alın:** Online veya telefonla\n2. **Belgeleri hazırlayın:** Kimlik, sigorta numarası, araç belgeleri\n3. **Tescil işlemini tamamlayın:** Şahsen veya vekaletname ile"
            },
            plattdeutsch: {
                general: "**Dien nächsten Schritte:**\n1. **Termin boken:** Online oder telefonisch\n2. **Unnerlagen vörbereiten:** Personalausweis, EVB-Nummer, Fohrtüüch-Papiere\n3. **Anmeldung maken:** Persönlich oder mit Vullmacht"
            }
        };
        
        const languageSteps = steps[language] || steps.german;
        return languageSteps[citizenType] || languageSteps.general;
    }
    
    /**
     * Generiert dynamische Endungen
     */
    getDynamicEnding(citizenType, language, emotionalState) {
        const endings = {
            german: {
                senior: "Haben Sie noch Fragen? Ich helfe Ihnen gerne weiter!",
                youth: "Hast du noch Fragen? Ich helfe dir gerne!",
                family: "Haben Sie noch Fragen? Ich helfe Ihrer Familie gerne!",
                farmer: "Hast du noch Fragen? Ich helfe dir gerne!",
                craftsman: "Hast du noch Fragen? Ich helfe dir gerne!",
                student: "Hast du noch Fragen? Ich helfe dir gerne!",
                tourist: "Haben Sie noch Fragen? Ich helfe Ihnen gerne!",
                general: "Haben Sie noch Fragen? Ich helfe Ihnen gerne!"
            },
            english: {
                general: "Do you have any questions? I'm happy to help!"
            },
            turkish: {
                general: "Başka sorularınız var mı? Size yardımcı olmaktan mutluluk duyarım!"
            },
            plattdeutsch: {
                general: "Hest du noch Fragen? Ik helpe di gern wieter!"
            }
        };
        
        const languageEndings = endings[language] || endings.german;
        let ending = languageEndings[citizenType] || languageEndings.general;
        
        // Emotionale Anpassung
        if (emotionalState === 'frustrated') {
            ending += " Lass uns das gemeinsam lösen!";
        } else if (emotionalState === 'anxious') {
            ending += " Keine Sorge, das schaffen wir!";
        }
        
        return ending;
    }
    
    /**
     * Generiert dringende Handlungsschritte
     */
    getUrgentActionSteps(context, language) {
        const urgentSteps = {
            german: "**SOFORT-HILFE:**\n🚨 **Ruf JETZT an:** 04431 85-0\n🚨 **Oder komm vorbei:** Delmenhorster Straße 6, Wildeshausen\n🚨 **Notfall-Termin:** Möglich!",
            english: "**URGENT HELP:**\n🚨 **Call NOW:** 04431 85-0\n🚨 **Or come by:** Delmenhorster Straße 6, Wildeshausen\n🚨 **Emergency appointment:** Possible!",
            turkish: "**ACİL YARDIM:**\n🚨 **ŞİMDİ ara:** 04431 85-0\n🚨 **Veya gel:** Delmenhorster Straße 6, Wildeshausen\n🚨 **Acil randevu:** Mümkün!",
            plattdeutsch: "**SOFORT-HÜLP:**\n🚨 **Roop NU an:** 04431 85-0\n🚨 **Oder kumm vörbi:** Delmenhorster Straße 6, Wildeshausen\n🚨 **Notfall-Termin:** Mööglich!"
        };
        
        return urgentSteps[language] || urgentSteps.german;
    }
    
    /**
     * Gibt relevante Links zurück
     */
    getRelevantLinks(context) {
        const links = {
            kfz_zulassung: [
                { title: 'Terminvereinbarung KFZ-Zulassung', url: 'https://www.oldenburg-kreis.de/verkehr/kfz-zulassung/terminvereinbarung/' },
                { title: 'Antragsformulare KFZ', url: 'https://www.oldenburg-kreis.de/verkehr/kfz-zulassung/formulare/' }
            ],
            führerschein: [
                { title: 'Terminvereinbarung Führerscheine', url: 'https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/terminvereinbarung-fuehrerscheine/' },
                { title: 'Führerschein-Anträge', url: 'https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/antragsarten-erforderliche-unterlagen-kosten-etc-/' }
            ],
            gewerbe: [
                { title: 'Gewerbeanmeldung online', url: 'https://www.oldenburg-kreis.de/wirtschaft/gewerbeanmeldung/' },
                { title: 'Gewerbe-Formulare', url: 'https://www.oldenburg-kreis.de/wirtschaft/gewerbeanmeldung/formulare/' }
            ],
            bauantrag: [
                { title: 'Bauantrag online', url: 'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/bauantrag-online/' },
                { title: 'Bauantrag-Formulare', url: 'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/' }
            ],
            landwirtschaft: [
                { title: 'EU-Anträge Landwirtschaft', url: 'https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/eu-antraege/' },
                { title: 'Tierhaltung Genehmigungen', url: 'https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/tierhaltung/' }
            ]
        };
        
        return links[context] || [];
    }

    generateFührerscheinResponse(intention, tone) {
        const query = intention.query || '';
        const citizenType = intention.citizenType;
        const language = intention.language;
        const emotionalState = intention.emotionalState;
        const urgency = intention.urgency;
        
        // DYNAMISCHE BEGRÜSSUNG basierend auf Persona
        let greeting = this.getDynamicGreeting(citizenType, language, 'führerschein');
        
        // ERKENNE KONKRETE FRAGEN
        const concreteAnswer = this.analyzeConcreteQuestion(query, 'führerschein');
        
        // DYNAMISCHE ANTWORT-STRUKTUR
        let response = '';
        
        // 1. BEGRÜSSUNG
        response += greeting;
        
        // 2. KONKRETE ANTWORT (falls vorhanden)
        if (concreteAnswer) {
            response += '\n\n' + concreteAnswer.specificAnswer;
            if (concreteAnswer.emotionalSupport) {
                response += concreteAnswer.emotionalSupport;
            }
            if (concreteAnswer.targetGroupHelp) {
                response += concreteAnswer.targetGroupHelp;
            }
        }
        
        // 3. DYNAMISCHE HANDLUNGSANWEISUNGEN
        response += '\n\n' + this.getDynamicActionSteps('führerschein', citizenType, urgency, language);
        
        // 4. DYNAMISCHE ENDUNG
        response += '\n\n' + this.getDynamicEnding(citizenType, language, emotionalState);
        
        return {
            response: response,
            links: this.getRelevantLinks('führerschein'),
            fallback: false
        };
    }

    generateGewerbeResponse(intention, tone) {
        const query = intention.query || '';
        const citizenType = intention.citizenType;
        const language = intention.language;
        const emotionalState = intention.emotionalState;
        const urgency = intention.urgency;
        
        // DYNAMISCHE BEGRÜSSUNG basierend auf Persona
        let greeting = this.getDynamicGreeting(citizenType, language, 'gewerbe');
        
        // ERKENNE KONKRETE FRAGEN
        const concreteAnswer = this.analyzeConcreteQuestion(query, 'gewerbe');
        
        // DYNAMISCHE ANTWORT-STRUKTUR
        let response = '';
        
        // 1. BEGRÜSSUNG
        response += greeting;
        
        // 2. KONKRETE ANTWORT (falls vorhanden)
        if (concreteAnswer) {
            response += '\n\n' + concreteAnswer.specificAnswer;
            if (concreteAnswer.emotionalSupport) {
                response += concreteAnswer.emotionalSupport;
            }
            if (concreteAnswer.targetGroupHelp) {
                response += concreteAnswer.targetGroupHelp;
            }
        }
        
        // 3. DYNAMISCHE HANDLUNGSANWEISUNGEN
        response += '\n\n' + this.getDynamicActionSteps('gewerbe', citizenType, urgency, language);
        
        // 4. DYNAMISCHE ENDUNG
        response += '\n\n' + this.getDynamicEnding(citizenType, language, emotionalState);
        
        return {
            response: response,
            links: this.getRelevantLinks('gewerbe'),
            fallback: false
        };
    }

    generateGeneralResponse(query, tone) {
        return {
            response: `Moin! Ich bin KAYA, Ihr digitaler Assistent für den Landkreis Oldenburg.

**Was kann ich für Sie tun:**
• Formulare und Anträge
• Terminvereinbarungen  
• Kontakte und Öffnungszeiten
• Informationen zu allen Dienstleistungen

**Schnelle Hilfe:**
• **Tel.: 04431 85-0**
• **E-Mail:** kontakt@landkreis-oldenburg.de

Was genau benötigen Sie? Je konkreter Sie fragen, desto besser kann ich helfen!`,
            links: []
        };
    }

    // NEUE UNIVERSALE RESPONSE-FUNKTIONEN FÜR ALLE BÜRGERANLIEGEN

    generateSozialesResponse(intention, tone) {
        return {
            response: `Moin! Gerne helfe ich Ihnen bei sozialen Leistungen.

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Online-Services:**
   → [Soziale Leistungen](https://www.oldenburg-kreis.de/soziales/)

**2. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**3. 📄 Formulare:**
   → [Anträge Soziales](https://www.oldenburg-kreis.de/soziales/antraege/)

**🎯 Ihre nächste Aktion:** Rufen Sie an oder besuchen Sie die Online-Services!

**Brauchen Sie Hilfe bei einem bestimmten Antrag?**`,
            links: [
                { title: 'Soziale Leistungen', url: 'https://www.oldenburg-kreis.de/soziales/' },
                { title: 'Anträge Soziales', url: 'https://www.oldenburg-kreis.de/soziales/antraege/' }
            ]
        };
    }

    generateWohngeldResponse(intention, tone) {
        return {
            response: `Moin! Gerne helfe ich Ihnen beim Wohngeld.

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Wohngeld-Antrag:**
   → [Wohngeld online](https://www.oldenburg-kreis.de/soziales/wohngeld/)

**2. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**3. 📄 Unterlagen:**
   → [Wohngeld-Formulare](https://www.oldenburg-kreis.de/soziales/wohngeld/formulare/)

**🎯 Ihre nächste Aktion:** Antrag online stellen oder anrufen!

**Haben Sie alle Unterlagen bereit?**`,
            links: [
                { title: 'Wohngeld online', url: 'https://www.oldenburg-kreis.de/soziales/wohngeld/' },
                { title: 'Wohngeld-Formulare', url: 'https://www.oldenburg-kreis.de/soziales/wohngeld/formulare/' }
            ]
        };
    }

    generatePflegeResponse(intention, tone) {
        return {
            response: `Moin! Gerne helfe ich Ihnen bei Pflege-Angelegenheiten.

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Pflege-Services:**
   → [Pflegeportal](https://www.oldenburg-kreis.de/soziales/pflege/)

**2. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**3. 📄 Anträge:**
   → [Pflege-Anträge](https://www.oldenburg-kreis.de/soziales/pflege/antraege/)

**🎯 Ihre nächste Aktion:** Beratung anrufen oder Online-Services nutzen!

**Brauchen Sie Hilfe bei der Antragstellung?**`,
            links: [
                { title: 'Pflegeportal', url: 'https://www.oldenburg-kreis.de/soziales/pflege/' },
                { title: 'Pflege-Anträge', url: 'https://www.oldenburg-kreis.de/soziales/pflege/antraege/' }
            ]
        };
    }

    generateGesundheitResponse(intention, tone) {
        return {
            response: `Moin! Gerne helfe ich Ihnen bei Gesundheits-Angelegenheiten.

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Gesundheits-Services:**
   → [Gesundheitsamt](https://www.oldenburg-kreis.de/gesundheit/)

**2. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**3. 📄 Informationen:**
   → [Gesundheits-Info](https://www.oldenburg-kreis.de/gesundheit/informationen/)

**🎯 Ihre nächste Aktion:** Anrufen oder Online-Informationen nutzen!

**Worum geht es genau?**`,
            links: [
                { title: 'Gesundheitsamt', url: 'https://www.oldenburg-kreis.de/gesundheit/' },
                { title: 'Gesundheits-Info', url: 'https://www.oldenburg-kreis.de/gesundheit/informationen/' }
            ]
        };
    }

    generateImpfungResponse(intention, tone) {
        return {
            response: `Moin! Gerne helfe ich Ihnen bei Impfungen.

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Impf-Termin:**
   → [Impf-Terminvereinbarung](https://www.oldenburg-kreis.de/gesundheit/impfungen/)

**2. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**3. 📄 Informationen:**
   → [Impf-Informationen](https://www.oldenburg-kreis.de/gesundheit/impfungen/informationen/)

**🎯 Ihre nächste Aktion:** Termin online buchen oder anrufen!

**Welche Impfung benötigen Sie?**`,
            links: [
                { title: 'Impf-Terminvereinbarung', url: 'https://www.oldenburg-kreis.de/gesundheit/impfungen/' },
                { title: 'Impf-Informationen', url: 'https://www.oldenburg-kreis.de/gesundheit/impfungen/informationen/' }
            ]
        };
    }

    generateBildungResponse(intention, tone) {
        return {
            response: `Moin! Gerne helfe ich Ihnen bei Bildungs-Angelegenheiten.

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Bildungs-Services:**
   → [Bildungsportal](https://www.oldenburg-kreis.de/bildung/)

**2. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**3. 📄 Anmeldungen:**
   → [Schul-Anmeldungen](https://www.oldenburg-kreis.de/bildung/schulen/)

**🎯 Ihre nächste Aktion:** Online-Services nutzen oder anrufen!

**Um welche Bildungseinrichtung geht es?**`,
            links: [
                { title: 'Bildungsportal', url: 'https://www.oldenburg-kreis.de/bildung/' },
                { title: 'Schul-Anmeldungen', url: 'https://www.oldenburg-kreis.de/bildung/schulen/' }
            ]
        };
    }

    generateStudiumResponse(intention, tone) {
        return {
            response: `Moin! Gerne helfe ich Ihnen bei Studien-Angelegenheiten.

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Studien-Informationen:**
   → [Studienberatung](https://www.oldenburg-kreis.de/bildung/studium/)

**2. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**3. 📄 Anträge:**
   → [Studien-Anträge](https://www.oldenburg-kreis.de/bildung/studium/antraege/)

**🎯 Ihre nächste Aktion:** Beratung anrufen oder Online-Info nutzen!

**Welche Studien-Angelegenheit betrifft Sie?**`,
            links: [
                { title: 'Studienberatung', url: 'https://www.oldenburg-kreis.de/bildung/studium/' },
                { title: 'Studien-Anträge', url: 'https://www.oldenburg-kreis.de/bildung/studium/antraege/' }
            ]
        };
    }

    generateUmweltResponse(intention, tone) {
        return {
            response: `Moin! Gerne helfe ich Ihnen bei Umwelt-Angelegenheiten.

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Umwelt-Services:**
   → [Umweltamt](https://www.oldenburg-kreis.de/umwelt/)

**2. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**3. 📄 Informationen:**
   → [Umwelt-Info](https://www.oldenburg-kreis.de/umwelt/informationen/)

**🎯 Ihre nächste Aktion:** Online-Services nutzen oder anrufen!

**Um welches Umwelt-Thema geht es?**`,
            links: [
                { title: 'Umweltamt', url: 'https://www.oldenburg-kreis.de/umwelt/' },
                { title: 'Umwelt-Info', url: 'https://www.oldenburg-kreis.de/umwelt/informationen/' }
            ]
        };
    }

    generateWasserResponse(intention, tone) {
        return {
            response: `Moin! Gerne helfe ich Ihnen bei Wasser-Angelegenheiten.

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Wasser-Services:**
   → [Wasserwirtschaft](https://www.oldenburg-kreis.de/umwelt/wasser/)

**2. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**3. 📄 Informationen:**
   → [Wasser-Info](https://www.oldenburg-kreis.de/umwelt/wasser/informationen/)

**🎯 Ihre nächste Aktion:** Online-Services nutzen oder anrufen!

**Welche Wasser-Angelegenheit betrifft Sie?**`,
            links: [
                { title: 'Wasserwirtschaft', url: 'https://www.oldenburg-kreis.de/umwelt/wasser/' },
                { title: 'Wasser-Info', url: 'https://www.oldenburg-kreis.de/umwelt/wasser/informationen/' }
            ]
        };
    }

    generateÖffnungszeitenResponse(intention, tone) {
        return {
            response: `Moin! Hier sind die Öffnungszeiten des Landkreises Oldenburg:

**🕒 Öffnungszeiten:**

**Verwaltung:**
• **Mo-Do:** 8:00 - 16:00 Uhr
• **Fr:** 8:00 - 13:00 Uhr

**📞 Telefonische Erreichbarkeit:**
• **Mo-Fr:** 8:00 - 16:00 Uhr
• **Tel.:** 04431 85-0

**🎯 Ihre nächste Aktion:** Rufen Sie an oder besuchen Sie uns!

**Brauchen Sie einen Termin?**`,
            links: [
                { title: 'Terminvereinbarung', url: 'https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/online-terminvereinbarung/' }
            ]
        };
    }

    generateNotfallResponse(intention, tone) {
        return {
            response: `🚨 **NOTFALL-HILFE**

**Sofortige Hilfe:**
• **Notruf:** 112 (Feuerwehr/Rettung)
• **Polizei:** 110
• **Ärztlicher Bereitschaftsdienst:** 116 117

**Landkreis Oldenburg:**
• **Tel.:** 04431 85-0 (Mo-Fr 8-16 Uhr)
• **E-Mail:** kontakt@landkreis-oldenburg.de

**🎯 Ihre nächste Aktion:** Bei Notfall sofort 112 anrufen!

**Ist es ein Notfall oder können wir Ihnen anderweitig helfen?**`,
            links: [
                { title: 'Notruf 112', url: 'tel:112' },
                { title: 'Polizei 110', url: 'tel:110' }
            ]
        };
    }

    /**
     * Extrahiert Ortsangaben aus der Anfrage
     */
    extractLocation(query) {
        const locations = ['wildeshausen', 'hude', 'ganderkesee', 'hatten', 'wardenburg', 'dötlingen', 'großenkneten'];
        const lowerQuery = query.toLowerCase();
        
        for (const location of locations) {
            if (lowerQuery.includes(location)) {
                return location.charAt(0).toUpperCase() + location.slice(1);
            }
        }
        return null;
    }

    /**
     * Extrahiert spezifische Formular-Typen
     */
    extractSpecificForm(query) {
        const forms = {
            'bauantrag': 'Bauantrag',
            'führerschein': 'Führerschein',
            'kfz': 'KFZ-Zulassung',
            'gewerbe': 'Gewerbeanmeldung',
            'kita': 'Kita-Anmeldung',
            'wohngeld': 'Wohngeld',
            'sozialhilfe': 'Sozialhilfe'
        };
        
        const lowerQuery = query.toLowerCase();
        for (const [key, value] of Object.entries(forms)) {
            if (lowerQuery.includes(key)) {
                return value;
            }
        }
        return null;
    }
    
    generateAgentResponse(agent, query, personaAnalysis = null) {
        const agentData = this.getAgentHandler().searchAgentData(agent, query);
        
        console.log(`Agent ${agent}: ${agentData.length} Ergebnisse für "${query}"`);
        
        if (agentData.length === 0) {
            // Fallback: Zeige allgemeine Informationen über den Agent
            const agentInfo = this.getAgentInfo(agent);
            let response = {
                agent: agent,
                response: `Gerne helfe ich Ihnen bei ${agentInfo.description}. ${agentInfo.suggestion}`,
                fallback: true,
                suggestion: agentInfo.suggestion,
                confidence: 0, // Keine Daten = niedrige Konfidenz
                source: 'fallback'
            };
            
            // Persona-basierte Anpassungen für Fallback
            if (personaAnalysis) {
                if (personaAnalysis.persona.persona === 'confused_citizen') {
                    response.response = `Keine Sorge, ich helfe Ihnen gerne bei ${agentInfo.description}. ${agentInfo.suggestion}`;
                } else if (personaAnalysis.persona.persona === 'urgent_case') {
                    response.response = `Ich verstehe, dass es eilig ist. Für ${agentInfo.description} kann ich Ihnen schnell helfen. ${agentInfo.suggestion}`;
                }
            }
            
            return response;
        }
        
        // Validiere Datenqualität vor Antwort
        const validatedData = this.validateDataQuality(agentData);
        if (validatedData.length === 0) {
            return {
                agent: agent,
                response: `Ich habe keine verlässlichen Informationen zu "${query}" gefunden. Bitte kontaktieren Sie uns direkt für eine persönliche Beratung.`,
                fallback: true,
                confidence: 0,
                source: 'no_valid_data'
            };
        }
        
        // Erstelle empathische, zielgerichtete Antwort
        const response = this.createEmpatheticResponse(agent, validatedData.slice(0, 3), query);
        
        return {
            agent: agent,
            response: response,
            data: validatedData.slice(0, 3),
            links: this.extractLinks(validatedData.slice(0, 3)),
            confidence: this.calculateConfidence(validatedData, query),
            source: 'agent_data'
        };
    }
    
    validateDataQuality(data) {
        // Validiere Datenqualität - nur verlässliche Daten verwenden
        return data.filter(item => {
            // Mindestanforderungen für valide Daten
            return item.title && 
                   item.title.length > 10 && 
                   item.url && 
                   item.url.startsWith('http') &&
                   item.content && 
                   item.content.length > 50;
        });
    }
    
    calculateConfidence(data, query) {
        if (data.length === 0) return 0;
        
        // Berechne Konfidenz basierend auf Datenqualität und Relevanz
        let confidence = 0.5; // Basis-Konfidenz
        
        // Erhöhe Konfidenz für mehr Daten
        confidence += Math.min(data.length * 0.1, 0.3);
        
        // Erhöhe Konfidenz für exakte Matches
        const queryLower = query.toLowerCase();
        const exactMatches = data.filter(item => 
            item.title.toLowerCase().includes(queryLower) ||
            item.content.toLowerCase().includes(queryLower)
        );
        
        if (exactMatches.length > 0) {
            confidence += 0.2;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    createEmpatheticResponse(agent, data, query) {
        const queryLower = query.toLowerCase();
        
        // Empathische Einleitung basierend auf dem Anliegen
        let empatheticIntro = this.getEmpatheticIntro(agent, queryLower);
        
        // Erkläre den Prozess und begleite den Bürger
        let processExplanation = this.explainProcess(agent, queryLower);
        
        // Zeige die konkreten Optionen mit Erklärungen
        let options = this.presentOptionsWithGuidance(data);
        
        // Aktive Nachfragen für weitere Unterstützung
        let followUpQuestions = this.generateFollowUpQuestions(agent, queryLower);
        
        return `${empatheticIntro}\n\n${processExplanation}\n\n${options}\n\n${followUpQuestions}`;
    }
    
    getEmpatheticIntro(agent, queryLower) {
        const intros = {
            'buergerdienste': [
                "Ich verstehe, dass Behördengänge manchmal kompliziert sein können. Lassen Sie mich Ihnen dabei helfen, den richtigen Weg zu finden.",
                "Gerne unterstütze ich Sie bei Ihrem Anliegen. Ich erkläre Ihnen Schritt für Schritt, was zu tun ist.",
                "Das kann ich für Sie klären! Ich begleite Sie durch den gesamten Prozess.",
                "Kein Problem, ich helfe Ihnen gerne dabei, Ihr Anliegen erfolgreich umzusetzen."
            ],
            'ratsinfo': [
                "Ich kann Ihnen gerne bei Fragen zum Kreistag helfen. Lassen Sie mich die wichtigsten Informationen für Sie zusammenstellen.",
                "Gerne informiere ich Sie über die Kreistagsangelegenheiten. Ich erkläre Ihnen, was Sie wissen müssen.",
                "Das schaue ich gerne für Sie nach. Ich führe Sie durch die verfügbaren Informationen."
            ],
            'stellenportal': [
                "Ich helfe Ihnen gerne bei der Jobsuche. Lassen Sie mich die besten Möglichkeiten für Sie finden.",
                "Gerne unterstütze ich Sie bei Ihrer Karriereplanung. Ich zeige Ihnen, welche Optionen verfügbar sind."
            ],
            'kontakte': [
                "Ich kann Ihnen gerne die richtigen Ansprechpartner nennen. Lassen Sie mich die passenden Kontakte für Sie finden.",
                "Gerne helfe ich Ihnen bei der Kontaktaufnahme. Ich erkläre Ihnen, wen Sie wann erreichen können."
            ]
        };
        
        const agentIntros = intros[agent] || ["Gerne helfe ich Ihnen bei Ihrem Anliegen."];
        return agentIntros[Math.floor(Math.random() * agentIntros.length)];
    }
    
    explainProcess(agent, queryLower) {
        const explanations = {
            'buergerdienste': [
                "Hier ist der Ablauf: Zuerst schauen wir uns an, welche Formulare Sie benötigen, dann erkläre ich Ihnen die einzelnen Schritte und was Sie beachten müssen.",
                "Der Prozess ist eigentlich ganz übersichtlich: Ich zeige Ihnen die benötigten Unterlagen und erkläre, wie Sie vorgehen sollten.",
                "Lassen Sie mich Ihnen den Weg durch die Behörden erklären: Welche Formulare, welche Unterlagen und welche Termine Sie einhalten müssen."
            ],
            'ratsinfo': [
                "Ich erkläre Ihnen gerne, wie Sie an die gewünschten Informationen kommen und was Sie dabei beachten sollten.",
                "Lassen Sie mich Ihnen zeigen, wo Sie die aktuellen Informationen finden und wie Sie sich über neue Entwicklungen informieren können."
            ],
            'stellenportal': [
                "Ich führe Sie gerne durch den Bewerbungsprozess und zeige Ihnen, worauf Sie achten sollten.",
                "Lassen Sie mich Ihnen erklären, wie Sie sich erfolgreich bewerben und welche Unterlagen Sie benötigen."
            ],
            'kontakte': [
                "Ich erkläre Ihnen gerne, wann Sie die verschiedenen Ansprechpartner erreichen und wie Sie am besten vorgehen.",
                "Lassen Sie mich Ihnen zeigen, welche Kontakte für Ihr Anliegen am besten geeignet sind."
            ]
        };
        
        const agentExplanations = explanations[agent] || ["Ich erkläre Ihnen gerne den Prozess."];
        return agentExplanations[Math.floor(Math.random() * agentExplanations.length)];
    }
    
    presentOptionsWithGuidance(data) {
        let options = "";
        
        data.forEach((item, index) => {
            if (item.title) {
                options += `**${item.title}**\n`;
                
                // Füge hilfreiche Erklärung und Anleitung hinzu
                if (item.title.toLowerCase().includes('bauantrag')) {
                    options += "Das ist Ihr Hauptformular für Bauvorhaben. Sie können es online ausfüllen oder ausdrucken. Wichtig: Sammeln Sie alle benötigten Unterlagen vorher (Grundstücksunterlagen, Baupläne, etc.).\n";
                } else if (item.title.toLowerCase().includes('formular')) {
                    options += "Hier finden Sie das benötigte Formular. Ich empfehle Ihnen, es online auszufüllen - das spart Zeit und Fehler.\n";
                } else if (item.title.toLowerCase().includes('kontakt')) {
                    options += "Hier können Sie direkt Kontakt aufnehmen. Ich empfehle Ihnen, vorher anzurufen, um einen Termin zu vereinbaren.\n";
                } else if (item.title.toLowerCase().includes('kreistag')) {
                    options += "Hier finden Sie alle aktuellen Informationen. Schauen Sie regelmäßig vorbei, um über neue Beschlüsse informiert zu bleiben.\n";
                }
                
                if (item.url) {
                    const linkText = this.createDescriptiveLinkText(item.title, item.url);
                    options += `\n📋 **${linkText}:** [${linkText}](${item.url})\n`;
                }
            }
            
            options += "\n";
        });
        
        return options;
    }
    
    generateFollowUpQuestions(agent, queryLower) {
        const followUps = {
            'buergerdienste': [
                "Haben Sie bereits alle benötigten Unterlagen zusammen? Ich kann Ihnen dabei helfen, eine Checkliste zu erstellen.",
                "Möchten Sie, dass ich Ihnen die nächsten Schritte im Detail erkläre?",
                "Gibt es bestimmte Aspekte des Antrags, bei denen Sie unsicher sind?",
                "Soll ich Ihnen auch die Fristen und Bearbeitungszeiten erklären?",
                "Brauchen Sie Hilfe bei der Terminvereinbarung oder haben Sie andere Fragen zum Ablauf?"
            ],
            'ratsinfo': [
                "Möchten Sie mehr über eine bestimmte Sitzung erfahren?",
                "Soll ich Ihnen erklären, wie Sie sich zu bestimmten Themen informieren können?",
                "Interessieren Sie sich für bestimmte Beschlüsse oder Vorlagen?",
                "Möchten Sie wissen, wie Sie sich bei Fragen an den Kreistag wenden können?"
            ],
            'stellenportal': [
                "Welche Art von Stelle suchen Sie genau? Ich kann Ihnen gezielter helfen.",
                "Haben Sie bereits eine Bewerbung vorbereitet? Ich kann Ihnen dabei helfen, sie zu optimieren.",
                "Möchten Sie, dass ich Ihnen Tipps für ein erfolgreiches Vorstellungsgespräch gebe?",
                "Soll ich Ihnen auch andere Stellenportale empfehlen?"
            ],
            'kontakte': [
                "Haben Sie bereits versucht, Kontakt aufzunehmen? Ich kann Ihnen dabei helfen, den richtigen Ansprechpartner zu finden.",
                "Möchten Sie, dass ich Ihnen die besten Zeiten für einen Anruf empfehle?",
                "Soll ich Ihnen auch die E-Mail-Adressen der zuständigen Mitarbeiter geben?",
                "Brauchen Sie Hilfe bei der Vorbereitung Ihres Anliegens?"
            ]
        };
        
        const agentFollowUps = followUps[agent] || ["Wie kann ich Ihnen noch helfen?"];
        const randomFollowUp = agentFollowUps[Math.floor(Math.random() * agentFollowUps.length)];
        
        return randomFollowUp;
    }
    
    getAgentInfo(agent) {
        const agentInfos = {
            'buergerdienste': {
                name: 'Bürgerdienst-Spezialist',
                description: 'Formulare, Anträge und Dienstleistungen',
                suggestion: 'Welches Formular oder welche Dienstleistung benötigen Sie genau?'
            },
            'ratsinfo': {
                name: 'Ratsinfo-Spezialist', 
                description: 'Kreistag, Sitzungen und Beschlüsse',
                suggestion: 'Möchten Sie Informationen zu einer bestimmten Sitzung oder einem Beschluss?'
            },
            'stellenportal': {
                name: 'Stellenportal-Spezialist',
                description: 'Arbeitsplätze und Karriere',
                suggestion: 'Welche Art von Stelle suchen Sie?'
            },
            'kontakte': {
                name: 'Kontakt-Spezialist',
                description: 'Ansprechpartner und Öffnungszeiten',
                suggestion: 'Welchen Bereich oder welches Amt benötigen Sie?'
            },
            'jobcenter': {
                name: 'Jobcenter-Spezialist',
                description: 'Arbeitslosengeld und Jobsuche',
                suggestion: 'Benötigen Sie Hilfe beim Arbeitslosengeld oder bei der Jobsuche?'
            },
            'schule': {
                name: 'Schul-Spezialist',
                description: 'Schulangelegenheiten und Bildung',
                suggestion: 'Welche schulische Angelegenheit betrifft Sie?'
            },
            'jugend': {
                name: 'Jugend-Spezialist',
                description: 'Jugendhilfe und Jugendamt',
                suggestion: 'Welche Jugendhilfe benötigen Sie?'
            },
            'soziales': {
                name: 'Sozial-Spezialist',
                description: 'Sozialhilfe und Sozialleistungen',
                suggestion: 'Welche Sozialleistung benötigen Sie?'
            }
        };
        
        return agentInfos[agent] || {
            name: 'Allgemeiner Assistent',
            description: 'verschiedene Bereiche',
            suggestion: 'Wie kann ich Ihnen helfen?'
        };
    }
    
    createDescriptiveLinkText(title, url) {
        // Basierend auf dem Titel eine aussagekräftige Beschriftung erstellen
        const titleLower = title.toLowerCase();
        const urlLower = url.toLowerCase();
        
        // Spezifische Beschriftungen basierend auf Inhalt
        if (titleLower.includes('bauantrag') || urlLower.includes('bauantrag')) {
            return "Bauantrag-Formular";
        } else if (titleLower.includes('formular') || urlLower.includes('formular')) {
            return "Antragsformular";
        } else if (titleLower.includes('kontakt') || urlLower.includes('kontakt')) {
            return "Kontaktinformationen";
        } else if (titleLower.includes('kreistag') || urlLower.includes('kreistag')) {
            return "Kreistagsinformationen";
        } else if (titleLower.includes('jugend') || urlLower.includes('jugend')) {
            return "Jugendamt-Services";
        } else if (titleLower.includes('krippe') || urlLower.includes('krippe')) {
            return "Krippen-Informationen";
        } else if (titleLower.includes('sozial') || urlLower.includes('sozial')) {
            return "Sozialleistungen";
        } else if (titleLower.includes('amt') || urlLower.includes('amt')) {
            return "Amt-Informationen";
        } else if (titleLower.includes('verwaltung') || urlLower.includes('verwaltung')) {
            return "Verwaltungsservices";
        } else if (titleLower.includes('familie') || urlLower.includes('familie')) {
            return "Familien-Services";
        } else if (titleLower.includes('wirtschaft') || urlLower.includes('wirtschaft')) {
            return "Wirtschaftliche Hilfe";
        } else if (titleLower.includes('eile') || urlLower.includes('eile')) {
            return "Eilhabe-Services";
        } else if (titleLower.includes('sicherung') || urlLower.includes('sicherung')) {
            return "Soziale Sicherung";
        } else if (titleLower.includes('tagespflege') || urlLower.includes('tagespflege')) {
            return "Tagespflege-Informationen";
        } else if (titleLower.includes('luette') || urlLower.includes('luette')) {
            return "Krippe Lüttje Lü";
        } else if (titleLower.includes('kurzvorstellung') || urlLower.includes('kurzvorstellung')) {
            return "Amt-Übersicht";
        } else if (titleLower.includes('landkreis') && titleLower.includes('verwaltung')) {
            return "Landkreis-Verwaltung";
        } else if (titleLower.includes('antragsarten') || urlLower.includes('antragsarten')) {
            return "Antragsarten und Unterlagen";
        } else if (titleLower.includes('favoriten') || urlLower.includes('favoriten')) {
            return "Favoriten-Übersicht";
        } else if (titleLower.includes('eichenprozessionsspinner') || urlLower.includes('eichenprozessionsspinner')) {
            return "Eichenprozessionsspinner-Info";
        } else if (titleLower.includes('landkreis')) {
            return "Landkreis-Services";
        } else {
            // Fallback: Erste paar Wörter des Titels verwenden
            const words = title.split(' ').slice(0, 3);
            return words.join(' ');
        }
    }
    
    extractLinks(data) {
        const links = [];
        data.forEach(item => {
            if (item.url) {
                links.push({
                    title: item.title,
                    url: item.url
                });
            }
        });
        return links;
    }

    // ERWEITERTE LANDKREIS-SPEZIFISCHE RESPONSE-FUNKTIONEN

    generateLandwirtschaftResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen landwirtschaftlichen Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 EU-Anträge:**
   → [EU-Anträge Landwirtschaft](https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/eu-antraege/)

**2. 📄 Tierhaltung:**
   → [Tierhaltung Genehmigungen](https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/tierhaltung/)

**3. 📞 Agrarberatung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den EU-Antrag-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'EU-Anträge Landwirtschaft', url: 'https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/eu-antraege/' },
                { title: 'Tierhaltung Genehmigungen', url: 'https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/tierhaltung/' }
            ]
        };
    }

    generateTierhaltungResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Tierhaltungs-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Genehmigungen:**
   → [Tierhaltung Genehmigungen](https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/tierhaltung/)

**2. 📄 Tierschutz:**
   → [Tierschutz Bestimmungen](https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/tierschutz/)

**3. 📞 Veterinär:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Genehmigung-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Tierhaltung Genehmigungen', url: 'https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/tierhaltung/' },
                { title: 'Tierschutz Bestimmungen', url: 'https://www.oldenburg-kreis.de/wirtschaft/landwirtschaft/tierschutz/' }
            ]
        };
    }

    generateHandwerkResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen handwerklichen Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Meisterprüfung:**
   → [Meisterprüfung Handwerk](https://www.oldenburg-kreis.de/wirtschaft/handwerk/meisterpruefung/)

**2. 📄 Handwerkskammer:**
   → [Handwerkskammer Kontakt](https://www.oldenburg-kreis.de/wirtschaft/handwerk/handwerkskammer/)

**3. 📞 Ausbildung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Meisterprüfung-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Meisterprüfung Handwerk', url: 'https://www.oldenburg-kreis.de/wirtschaft/handwerk/meisterpruefung/' },
                { title: 'Handwerkskammer Kontakt', url: 'https://www.oldenburg-kreis.de/wirtschaft/handwerk/handwerkskammer/' }
            ]
        };
    }

    generateAusbildungResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Ausbildungs-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Ausbildungsplatz:**
   → [Ausbildungsplätze finden](https://www.oldenburg-kreis.de/bildung/ausbildung/)

**2. 📄 Berufsschule:**
   → [Berufsschule Kontakt](https://www.oldenburg-kreis.de/bildung/berufsschule/)

**3. 📞 Prüfung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Ausbildungsplatz-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Ausbildungsplätze finden', url: 'https://www.oldenburg-kreis.de/bildung/ausbildung/' },
                { title: 'Berufsschule Kontakt', url: 'https://www.oldenburg-kreis.de/bildung/berufsschule/' }
            ]
        };
    }

    generateStudiumResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Studien-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 BAföG-Antrag:**
   → [BAföG-Antrag online](https://www.oldenburg-kreis.de/bildung/bafoeg/)

**2. 📄 Wohnheim:**
   → [Wohnheimplatz beantragen](https://www.oldenburg-kreis.de/bildung/wohnheim/)

**3. 📞 Studienberatung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den BAföG-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'BAföG-Antrag online', url: 'https://www.oldenburg-kreis.de/bildung/bafoeg/' },
                { title: 'Wohnheimplatz beantragen', url: 'https://www.oldenburg-kreis.de/bildung/wohnheim/' }
            ]
        };
    }

    generateBafögResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen BAföG-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 BAföG-Antrag:**
   → [BAföG-Antrag online](https://www.oldenburg-kreis.de/bildung/bafoeg/)

**2. 📄 Unterlagen:**
   → [BAföG-Unterlagen](https://www.oldenburg-kreis.de/bildung/bafoeg/unterlagen/)

**3. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den BAföG-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'BAföG-Antrag online', url: 'https://www.oldenburg-kreis.de/bildung/bafoeg/' },
                { title: 'BAföG-Unterlagen', url: 'https://www.oldenburg-kreis.de/bildung/bafoeg/unterlagen/' }
            ]
        };
    }

    generateArbeitslosigkeitResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Arbeitslosigkeits-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 ALG-Antrag:**
   → [ALG-Antrag online](https://www.oldenburg-kreis.de/soziales/alg/)

**2. 📄 Jobcenter:**
   → [Jobcenter Kontakt](https://www.oldenburg-kreis.de/soziales/jobcenter/)

**3. 📞 Weiterbildung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den ALG-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'ALG-Antrag online', url: 'https://www.oldenburg-kreis.de/soziales/alg/' },
                { title: 'Jobcenter Kontakt', url: 'https://www.oldenburg-kreis.de/soziales/jobcenter/' }
            ]
        };
    }

    generateRenteResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Renten-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Rentenantrag:**
   → [Rentenantrag online](https://www.oldenburg-kreis.de/soziales/rente/)

**2. 📄 Pension:**
   → [Pension Informationen](https://www.oldenburg-kreis.de/soziales/pension/)

**3. 📞 Seniorenservices:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Rentenantrag-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Rentenantrag online', url: 'https://www.oldenburg-kreis.de/soziales/rente/' },
                { title: 'Pension Informationen', url: 'https://www.oldenburg-kreis.de/soziales/pension/' }
            ]
        };
    }

    generateSeniorenResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe Ihnen sofort bei Ihren Senioren-Anliegen${location}.${urgency}

**🎯 Hier ist Ihr direkter Weg:**

**1. 📋 Seniorenservices:**
   → [Seniorenservices](https://www.oldenburg-kreis.de/soziales/senioren/)

**2. 📄 Pflege:**
   → [Pflege Informationen](https://www.oldenburg-kreis.de/soziales/pflege/)

**3. 📞 Betreuung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Ihre nächste Aktion:** Klick auf den Seniorenservices-Link oder ruf direkt an!

**Brauchen Sie Hilfe bei den Unterlagen? Sagen Sie mir, was Sie schon haben!**`,
            links: [
                { title: 'Seniorenservices', url: 'https://www.oldenburg-kreis.de/soziales/senioren/' },
                { title: 'Pflege Informationen', url: 'https://www.oldenburg-kreis.de/soziales/pflege/' }
            ]
        };
    }

    generateAlleinerziehendeResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Alleinerziehenden-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Kindergeld-Antrag:**
   → [Kindergeld-Antrag online](https://www.oldenburg-kreis.de/soziales/kindergeld/)

**2. 📄 Unterhaltsvorschuss:**
   → [Unterhaltsvorschuss](https://www.oldenburg-kreis.de/soziales/unterhalt/)

**3. 📞 Betreuung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Kindergeld-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Kindergeld-Antrag online', url: 'https://www.oldenburg-kreis.de/soziales/kindergeld/' },
                { title: 'Unterhaltsvorschuss', url: 'https://www.oldenburg-kreis.de/soziales/unterhalt/' }
            ]
        };
    }

    generateUnterhaltResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Unterhalts-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Unterhaltsvorschuss:**
   → [Unterhaltsvorschuss](https://www.oldenburg-kreis.de/soziales/unterhalt/)

**2. 📄 Antrag:**
   → [Unterhalt-Antrag](https://www.oldenburg-kreis.de/soziales/unterhalt/antrag/)

**3. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Unterhaltsvorschuss-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Unterhaltsvorschuss', url: 'https://www.oldenburg-kreis.de/soziales/unterhalt/' },
                { title: 'Unterhalt-Antrag', url: 'https://www.oldenburg-kreis.de/soziales/unterhalt/antrag/' }
            ]
        };
    }

    generateBehinderungResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Behinderungs-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Schwerbehindertenausweis:**
   → [Schwerbehindertenausweis](https://www.oldenburg-kreis.de/soziales/behinderung/)

**2. 📄 Eingliederungshilfe:**
   → [Eingliederungshilfe](https://www.oldenburg-kreis.de/soziales/eingliederungshilfe/)

**3. 📞 Barrierefreiheit:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Schwerbehindertenausweis-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Schwerbehindertenausweis', url: 'https://www.oldenburg-kreis.de/soziales/behinderung/' },
                { title: 'Eingliederungshilfe', url: 'https://www.oldenburg-kreis.de/soziales/eingliederungshilfe/' }
            ]
        };
    }

    generateMigrationResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Migrations-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Asylverfahren:**
   → [Asylverfahren](https://www.oldenburg-kreis.de/soziales/asyl/)

**2. 📄 Sprachkurs:**
   → [Sprachkurs](https://www.oldenburg-kreis.de/soziales/integration/)

**3. 📞 Integration:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Asylverfahren-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Asylverfahren', url: 'https://www.oldenburg-kreis.de/soziales/asyl/' },
                { title: 'Sprachkurs', url: 'https://www.oldenburg-kreis.de/soziales/integration/' }
            ]
        };
    }

    generateAufenthaltsrechtResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Aufenthaltsrecht-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Aufenthaltsrecht:**
   → [Aufenthaltsrecht](https://www.oldenburg-kreis.de/soziales/aufenthaltsrecht/)

**2. 📄 Arbeitserlaubnis:**
   → [Arbeitserlaubnis](https://www.oldenburg-kreis.de/soziales/arbeitserlaubnis/)

**3. 📞 Familiennachzug:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Aufenthaltsrecht-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Aufenthaltsrecht', url: 'https://www.oldenburg-kreis.de/soziales/aufenthaltsrecht/' },
                { title: 'Arbeitserlaubnis', url: 'https://www.oldenburg-kreis.de/soziales/arbeitserlaubnis/' }
            ]
        };
    }

    generateEUBürgerResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen EU-Bürger-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Aufenthaltsrecht:**
   → [EU-Aufenthaltsrecht](https://www.oldenburg-kreis.de/soziales/eu-aufenthaltsrecht/)

**2. 📄 Arbeitserlaubnis:**
   → [EU-Arbeitserlaubnis](https://www.oldenburg-kreis.de/soziales/eu-arbeitserlaubnis/)

**3. 📞 Familiennachzug:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den EU-Aufenthaltsrecht-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'EU-Aufenthaltsrecht', url: 'https://www.oldenburg-kreis.de/soziales/eu-aufenthaltsrecht/' },
                { title: 'EU-Arbeitserlaubnis', url: 'https://www.oldenburg-kreis.de/soziales/eu-arbeitserlaubnis/' }
            ]
        };
    }

    generateKleinunternehmerResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Kleinunternehmer-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Kleinunternehmerregelung:**
   → [Kleinunternehmerregelung](https://www.oldenburg-kreis.de/wirtschaft/kleinunternehmer/)

**2. 📄 Gewerbesteuer:**
   → [Gewerbesteuer](https://www.oldenburg-kreis.de/wirtschaft/gewerbesteuer/)

**3. 📞 Buchhaltung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Kleinunternehmerregelung-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Kleinunternehmerregelung', url: 'https://www.oldenburg-kreis.de/wirtschaft/kleinunternehmer/' },
                { title: 'Gewerbesteuer', url: 'https://www.oldenburg-kreis.de/wirtschaft/gewerbesteuer/' }
            ]
        };
    }

    generateSteuernResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei deinen Steuer-Anliegen${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Steuerberatung:**
   → [Steuerberatung](https://www.oldenburg-kreis.de/wirtschaft/steuerberatung/)

**2. 📄 Buchhaltung:**
   → [Buchhaltung](https://www.oldenburg-kreis.de/wirtschaft/buchhaltung/)

**3. 📞 Gewerbesteuer:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Steuerberatung-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Steuerberatung', url: 'https://www.oldenburg-kreis.de/wirtschaft/steuerberatung/' },
                { title: 'Buchhaltung', url: 'https://www.oldenburg-kreis.de/wirtschaft/buchhaltung/' }
            ]
        };
    }
}

module.exports = KAYACharacterHandler;