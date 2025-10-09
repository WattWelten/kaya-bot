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
        
        // Bestimme zuständigen Agent
        const agent = this.getAgentHandler().routeToAgent(query);
        
        let response;
        if (agent === 'kaya') {
            response = this.generateKAYAResponse(query, personaAnalysis);
        } else {
            response = this.generateAgentResponse(agent, query, personaAnalysis);
        }

        // Context-Memory: KAYA-Antwort hinzufügen
        this.contextMemory.addMessage(sessionId, response.response, 'kaya', {
            agent: agent,
            persona: personaAnalysis.persona.persona,
            emotionalState: personaAnalysis.emotionalState.state,
            urgency: personaAnalysis.urgency.level
        });

        // LLM-Enhancement mit Context
        if (this.useLLM && !response.fallback) {
            try {
                const llmService = this.getLLMService();
                const contextPrompt = this.contextMemory.generateContextPrompt(session);
                response = await llmService.enhanceResponseWithContext(response, query, contextPrompt, personaAnalysis);
            } catch (error) {
                console.error('LLM-Enhancement Fehler:', error);
                // Verwende ursprüngliche Antwort als Fallback
            }
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
     * Analysiert die wahre Intention des Bürgers
     */
    analyzeCitizenIntention(query) {
        const lowerQuery = query.toLowerCase();
        
        // Bauantrag-Intentionen
        if (lowerQuery.includes('bauantrag') || lowerQuery.includes('bauen') || lowerQuery.includes('haus')) {
            return {
                type: 'bauantrag',
                urgency: lowerQuery.includes('eilig') || lowerQuery.includes('dringend') ? 'high' : 'normal',
                needs: ['formulare', 'unterlagen', 'termin', 'kosten'],
                location: this.extractLocation(query)
            };
        }
        
        // Formular-Intentionen
        if (lowerQuery.includes('formular') || lowerQuery.includes('antrag') || lowerQuery.includes('beantragen')) {
            return {
                type: 'formular',
                urgency: 'normal',
                needs: ['download', 'ausfüllen', 'einreichen'],
                specific: this.extractSpecificForm(query)
            };
        }
        
        // Kontakt-Intentionen
        if (lowerQuery.includes('kontakt') || lowerQuery.includes('telefon') || lowerQuery.includes('anrufen')) {
            return {
                type: 'kontakt',
                urgency: 'high',
                needs: ['telefonnummer', 'email', 'adresse', 'öffnungszeiten']
            };
        }
        
        // Führerschein-Intentionen
        if (lowerQuery.includes('führerschein') || lowerQuery.includes('führerschein') || lowerQuery.includes('fahrerlaubnis')) {
            return {
                type: 'führerschein',
                urgency: lowerQuery.includes('eilig') || lowerQuery.includes('dringend') ? 'high' : 'normal',
                needs: ['termin', 'formulare', 'unterlagen', 'kosten'],
                location: this.extractLocation(query)
            };
        }
        
        // Gewerbe-Intentionen
        if (lowerQuery.includes('gewerbe') || lowerQuery.includes('gewerbeanmeldung') || lowerQuery.includes('selbständig')) {
            return {
                type: 'gewerbe',
                urgency: 'normal',
                needs: ['formulare', 'unterlagen', 'beratung'],
                location: this.extractLocation(query)
            };
        }
        
        // KFZ-Zulassung-Intentionen
        if (lowerQuery.includes('auto') || lowerQuery.includes('fahrzeug') || lowerQuery.includes('zulassen') || 
            lowerQuery.includes('kfz') || lowerQuery.includes('kennzeichen') || lowerQuery.includes('zulassung')) {
            return {
                type: 'kfz_zulassung',
                urgency: lowerQuery.includes('eilig') || lowerQuery.includes('dringend') ? 'high' : 'normal',
                needs: ['termin', 'formulare', 'unterlagen', 'kosten'],
                location: this.extractLocation(query)
            };
        }
        
        // Termin-Intentionen
        if (lowerQuery.includes('termin') || lowerQuery.includes('vereinbaren') || lowerQuery.includes('wann')) {
            return {
                type: 'termin',
                urgency: 'normal',
                needs: ['online_termin', 'öffnungszeiten', 'verfügbarkeit']
            };
        }
        
        // Allgemeine Information
        return {
            type: 'information',
            urgency: 'normal',
            needs: ['übersicht', 'erklärung', 'hilfe']
        };
    }

    /**
     * Generiert direkte, bürgerzentrierte Antworten
     */
    generateDirectResponse(query, intention, personaAnalysis) {
        const tone = personaAnalysis?.emotionalState?.state === 'frustrated' ? 'beruhigend' : 'freundlich';
        
        switch (intention.type) {
            case 'bauantrag':
                return this.generateBauantragResponse(intention, tone);
            case 'formular':
                return this.generateFormularResponse(intention, tone);
            case 'kontakt':
                return this.generateKontaktResponse(intention, tone);
            case 'termin':
                return this.generateTerminResponse(intention, tone);
            case 'kfz_zulassung':
                return this.generateKFZZulassungResponse(intention, tone);
            case 'führerschein':
                return this.generateFührerscheinResponse(intention, tone);
            case 'gewerbe':
                return this.generateGewerbeResponse(intention, tone);
            default:
                return this.generateGeneralResponse(query, tone);
        }
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