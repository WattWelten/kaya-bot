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
        
        const agent = this.getAgentHandler().routeToAgent(query, sessionContext);
        
        let response;
        if (agent === 'kaya') {
            response = this.generateKAYAResponse(query, personaAnalysis);
        } else {
            response = this.generateAgentResponse(agent, query, personaAnalysis);
        }

        // Context-Memory: KAYA-Antwort hinzufügen mit Intention
        const intention = this.analyzeCitizenIntention(query);
        this.contextMemory.addMessage(sessionId, response.response, 'kaya', {
            agent: agent,
            persona: personaAnalysis.persona.persona,
            emotionalState: personaAnalysis.emotionalState.state,
            urgency: intention.urgency,
            intention: intention // Speichere die Intention für Kontext
        });

        // LLM-Enhancement nur für allgemeine Anfragen, NICHT für Action-orientierte Antworten
        if (this.useLLM && !response.fallback && agent === 'kaya' && !this.isActionOrientedResponse(intention)) {
            try {
                const llmService = this.getLLMService();
                const contextPrompt = this.contextMemory.generateContextPrompt(session);
                response = await llmService.enhanceResponseWithContext(response, query, contextPrompt, personaAnalysis);
            } catch (error) {
                console.error('LLM-Enhancement Fehler:', error);
                // Verwende ursprüngliche Antwort als Fallback
            }
        } else if (agent === 'kaya' && this.isActionOrientedResponse(intention)) {
            console.log('🎯 Action-orientierte Antwort - LLM-Enhancement übersprungen');
        }

        return response;
    }
    
    generateKAYAResponse(query, personaAnalysis = null) {
        // Bürgerzentrierte Dialog-Optimierung
        const intention = this.analyzeCitizenIntention(query);
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
    analyzeCitizenIntention(query) {
        const lowerQuery = query.toLowerCase();
        
        // 1. URGENCY-Analyse (für alle Bürger)
        const urgency = this.analyzeUrgency(lowerQuery);
        
        // 2. EMOTIONAL STATE (für alle Bürger)
        const emotionalState = this.analyzeEmotionalState(lowerQuery);
        
        // 3. ACCESSIBILITY NEEDS (inklusiv für alle Bürger)
        const accessibilityNeeds = this.analyzeAccessibilityNeeds(lowerQuery);
        
        // 4. LOCATION (für alle Bürger)
        const location = this.extractLocation(query);
        
        // 5. SPECIFIC INTENTION (erweitert für alle Anliegen)
        const specificIntention = this.analyzeSpecificIntention(lowerQuery);
        
        return {
            type: specificIntention.type,
            urgency: urgency,
            emotionalState: emotionalState,
            accessibilityNeeds: accessibilityNeeds,
            location: location,
            needs: specificIntention.needs,
            specific: specificIntention.specific,
            citizenType: this.analyzeCitizenType(lowerQuery),
            language: this.analyzeLanguage(query)
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
        if (query.includes('senior') || query.includes('rentner') || query.includes('alt')) {
            return 'senior';
        }
        if (query.includes('jugend') || query.includes('schüler') || query.includes('student')) {
            return 'youth';
        }
        if (query.includes('familie') || query.includes('kind') || query.includes('baby')) {
            return 'family';
        }
        if (query.includes('geflüchtet') || query.includes('migrant') || query.includes('ausländer')) {
            return 'migrant';
        }
        if (query.includes('behindert') || query.includes('beeinträchtigt')) {
            return 'disabled';
        }
        return 'general';
    }

    /**
     * Analysiert Sprache (inklusiv)
     */
    analyzeLanguage(query) {
        // Einfache Erkennung von nicht-deutschen Wörtern
        const englishWords = ['hello', 'help', 'please', 'thank you'];
        const turkishWords = ['merhaba', 'yardım', 'lütfen'];
        
        if (englishWords.some(word => query.toLowerCase().includes(word))) {
            return 'english';
        }
        if (turkishWords.some(word => query.toLowerCase().includes(word))) {
            return 'turkish';
        }
        return 'german';
    }

    /**
     * Analysiert spezifische Intention (erweitert für alle Anliegen)
     */
    analyzeSpecificIntention(query) {
        // Erweiterte Kategorien für alle Bürgeranliegen
        const intentions = [
            // Verwaltung
            { keywords: ['bauantrag', 'bauen', 'haus', 'gebäude'], type: 'bauantrag', needs: ['formulare', 'unterlagen', 'termin', 'kosten'] },
            { keywords: ['auto', 'fahrzeug', 'zulassen', 'kfz', 'kennzeichen'], type: 'kfz_zulassung', needs: ['termin', 'formulare', 'unterlagen', 'kosten'] },
            { keywords: ['führerschein', 'fahrerlaubnis'], type: 'führerschein', needs: ['termin', 'formulare', 'unterlagen', 'kosten'] },
            { keywords: ['gewerbe', 'gewerbeanmeldung', 'selbständig'], type: 'gewerbe', needs: ['formulare', 'unterlagen', 'beratung'] },
            
            // Soziales
            { keywords: ['kindergeld', 'elterngeld', 'sozialhilfe'], type: 'soziales', needs: ['formulare', 'beratung', 'unterlagen'] },
            { keywords: ['wohngeld', 'miete', 'wohnung'], type: 'wohngeld', needs: ['formulare', 'beratung', 'unterlagen'] },
            { keywords: ['pflege', 'pflegegeld', 'pflegeheim'], type: 'pflege', needs: ['beratung', 'formulare', 'unterlagen'] },
            
            // Gesundheit
            { keywords: ['gesundheit', 'arzt', 'krankenhaus'], type: 'gesundheit', needs: ['kontakt', 'informationen', 'termin'] },
            { keywords: ['impfung', 'impfpass'], type: 'impfung', needs: ['termin', 'informationen', 'formulare'] },
            
            // Bildung
            { keywords: ['schule', 'kindergarten', 'bildung'], type: 'bildung', needs: ['anmeldung', 'informationen', 'kontakt'] },
            { keywords: ['studium', 'universität', 'hochschule'], type: 'studium', needs: ['informationen', 'beratung', 'anmeldung'] },
            
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
     * UNIVERSALE Bürgerzentrierte Antwort-Generierung
     * Funktioniert für ALLE Bürger und ALLE Anliegen
     */
    generateDirectResponse(query, intention, personaAnalysis) {
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
     * Bürger-Typ-Anpassungen (inklusiv)
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
            general: {
                tone: 'professional_friendly',
                structure: 'standard_format',
                emphasis: 'comprehensive_info'
            }
        };
        
        return adaptations[citizenType] || adaptations.general;
    }

    /**
     * Sprach-Anpassungen (inklusiv)
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
            german: {
                greeting: 'Moin!',
                closing: 'Gerne helfe ich Ihnen weiter!',
                emphasis: '🇩🇪'
            }
        };
        
        return adaptations[language] || adaptations.german;
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
        
        return {
            response: `Moin! Gerne helfe ich Ihnen beim Bauantrag${location}.${urgency}

**Was Sie brauchen:**
1. **Formulare:** [Bauantrag online](https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/bauantrag-online/)
2. **Unterlagen:** [Anträge und Formulare](https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/)
3. **Termin:** [Online-Terminvereinbarung](https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/online-terminvereinbarung/)

**Direkter Kontakt:**
• **Tel.: 04431 85-0** (Mo-Fr 8-16 Uhr)
• **E-Mail:** kontakt@landkreis-oldenburg.de

Haben Sie bereits alle Unterlagen oder brauchen Sie Hilfe bei einem bestimmten Schritt?`,
            links: [
                { title: 'Bauantrag online', url: 'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/bauantrag-online/' },
                { title: 'Anträge und Formulare', url: 'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/' },
                { title: 'Online-Terminvereinbarung', url: 'https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/online-terminvereinbarung/' }
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
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir sofort bei der KFZ-Zulassung${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Online-Termin buchen:**
   → [Terminvereinbarung KFZ-Zulassung](https://www.oldenburg-kreis.de/verkehr/kfz-zulassung/terminvereinbarung/)

**2. 📄 Formulare ausfüllen:**
   → [Antragsformulare KFZ](https://www.oldenburg-kreis.de/verkehr/kfz-zulassung/formulare/)

**3. 📞 Sofort anrufen:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Termin-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Terminvereinbarung KFZ-Zulassung', url: 'https://www.oldenburg-kreis.de/verkehr/kfz-zulassung/terminvereinbarung/' },
                { title: 'Antragsformulare KFZ', url: 'https://www.oldenburg-kreis.de/verkehr/kfz-zulassung/formulare/' }
            ]
        };
    }

    generateFührerscheinResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        const urgency = intention.urgency === 'high' ? ' Ich verstehe, dass es eilig ist.' : '';
        
        return {
            response: `Moin! Gerne helfe ich dir beim Führerschein${location}.${urgency}

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Online-Termin buchen:**
   → [Terminvereinbarung Führerscheine](https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/terminvereinbarung-fuehrerscheine/)

**2. 📄 Anträge und Formulare:**
   → [Führerschein-Anträge](https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/antragsarten-erforderliche-unterlagen-kosten-etc-/)

**3. 📞 Sofort anrufen:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Termin-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Terminvereinbarung Führerscheine', url: 'https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/terminvereinbarung-fuehrerscheine/' },
                { title: 'Führerschein-Anträge', url: 'https://www.oldenburg-kreis.de/ordnung-und-verkehr/fuehrerscheinstelle/antragsarten-erforderliche-unterlagen-kosten-etc-/' }
            ]
        };
    }

    generateGewerbeResponse(intention, tone) {
        const location = intention.location ? ` in ${intention.location}` : '';
        
        return {
            response: `Moin! Perfekt - ich helfe dir bei der Gewerbeanmeldung${location}.

**🎯 Hier ist dein direkter Weg:**

**1. 📋 Online-Formular:**
   → [Gewerbeanmeldung online](https://www.oldenburg-kreis.de/wirtschaft/gewerbeanmeldung/)

**2. 📄 Anträge und Formulare:**
   → [Gewerbe-Anträge](https://www.oldenburg-kreis.de/wirtschaft/gewerbeanmeldung/antraege-und-formulare/)

**3. 📞 Beratung:**
   → **04431 85-0** (Mo-Fr 8-16 Uhr)

**🎯 Deine nächste Aktion:** Klick auf den Gewerbe-Link oder ruf direkt an!

**Brauchst du Hilfe bei den Unterlagen? Sag mir, was du schon hast!**`,
            links: [
                { title: 'Gewerbeanmeldung online', url: 'https://www.oldenburg-kreis.de/wirtschaft/gewerbeanmeldung/' },
                { title: 'Gewerbe-Anträge', url: 'https://www.oldenburg-kreis.de/wirtschaft/gewerbeanmeldung/antraege-und-formulare/' }
            ]
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
}

module.exports = KAYACharacterHandler;