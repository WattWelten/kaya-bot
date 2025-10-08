const KAYAAgentHandler = require('./kaya_agent_handler');
const LLMService = require('./llm_service');

class KAYACharacterHandler {
    constructor() {
        this.agentHandler = new KAYAAgentHandler();
        this.llmService = new LLMService();
        this.useLLM = process.env.USE_LLM === 'true';
        
        // Bürgerzentrierte Perspektiven
        this.citizenPersonas = {
            'familie': ['kind', 'kita', 'schule', 'familie', 'eltern', 'betreuung', 'jugend'],
            'unternehmen': ['gewerbe', 'firma', 'unternehmen', 'bewerbung', 'stellen', 'arbeit'],
            'senioren': ['pflege', 'senioren', 'alt', 'rente', 'hilfe', 'betreuung'],
            'bauherren': ['bau', 'bauantrag', 'genehmigung', 'grundstück', 'haus', 'wohnung'],
            'allgemein': ['antrag', 'formular', 'dokument', 'bescheinigung', 'urkunde']
        };
    }
    
    async generateResponse(query, userMessage) {
        // Bestimme zuständigen Agent
        const agent = this.agentHandler.routeToAgent(query);
        
        let response;
        if (agent === 'kaya') {
            response = this.generateKAYAResponse(query);
        } else {
            response = this.generateAgentResponse(agent, query);
        }

        // LLM-Enhancement falls aktiviert
        if (this.useLLM && !response.fallback) {
            try {
                response = await this.llmService.enhanceResponse(response, query);
            } catch (error) {
                console.error('LLM-Enhancement Fehler:', error);
                // Verwende ursprüngliche Antwort als Fallback
            }
        }

        return response;
    }
    
    generateKAYAResponse(query) {
        const greeting = "Moin! Ich bin KAYA, Ihr kommunaler KI-Assistent für den Landkreis Oldenburg.";
        
        // Erkenne Bürgerperspektive
        const persona = this.detectCitizenPersona(query);
        const personalizedGreeting = this.getPersonalizedGreeting(persona);
        
        return {
            agent: 'kaya',
            response: `${greeting} ${personalizedGreeting}`,
            suggestions: this.getContextualSuggestions(persona),
            persona: persona
        };
    }
    
    detectCitizenPersona(query) {
        const queryLower = query.toLowerCase();
        
        for (const [persona, keywords] of Object.entries(this.citizenPersonas)) {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
                return persona;
            }
        }
        
        return 'allgemein';
    }
    
    getPersonalizedGreeting(persona) {
        const greetings = {
            'familie': "Ich helfe Ihnen gerne bei allen Fragen rund um Familie, Kinderbetreuung und Bildung. Was benötigen Sie für Ihr Kind oder Ihre Familie?",
            'unternehmen': "Gerne unterstütze ich Sie bei gewerblichen Angelegenheiten, Anträgen und Verwaltungsaufgaben. Womit kann ich Ihnen helfen?",
            'senioren': "Ich bin da, um Ihnen bei allen Fragen rund um Pflege, Unterstützung und Seniorenangebote zu helfen. Was beschäftigt Sie?",
            'bauherren': "Bei Bauvorhaben und Baugenehmigungen begleite ich Sie gerne durch den Prozess. Was planen Sie zu bauen?",
            'allgemein': "Wie kann ich Ihnen heute helfen? Ich unterstütze Sie bei allen Anliegen rund um den Landkreis Oldenburg."
        };
        
        return greetings[persona] || greetings['allgemein'];
    }
    
    getContextualSuggestions(persona) {
        const suggestions = {
            'familie': [
                "Kita-Anmeldung",
                "Schulangelegenheiten", 
                "Familienberatung",
                "Jugendhilfe"
            ],
            'unternehmen': [
                "Gewerbeanmeldung",
                "Stellenausschreibungen",
                "Fördermöglichkeiten",
                "Wirtschaftsförderung"
            ],
            'senioren': [
                "Pflegegeld beantragen",
                "Seniorenberatung",
                "Betreuungsangebote",
                "Hilfe im Alltag"
            ],
            'bauherren': [
                "Baugenehmigung",
                "Bauantrag stellen",
                "Bauaufsicht",
                "Grundstücksangelegenheiten"
            ],
            'allgemein': [
                "Formulare und Anträge",
                "Kontakte und Öffnungszeiten", 
                "Stellenausschreibungen",
                "Ratsinfo und Sitzungen"
            ]
        };
        
        return suggestions[persona] || suggestions['allgemein'];
    }
    
    generateAgentResponse(agent, query) {
        const agentData = this.agentHandler.searchAgentData(agent, query);
        
        console.log(`Agent ${agent}: ${agentData.length} Ergebnisse für "${query}"`);
        
        if (agentData.length === 0) {
            // Fallback: Zeige allgemeine Informationen über den Agent
            const agentInfo = this.getAgentInfo(agent);
            return {
                agent: agent,
                response: `Gerne helfe ich Ihnen bei ${agentInfo.description}. ${agentInfo.suggestion}`,
                fallback: true,
                suggestion: agentInfo.suggestion,
                confidence: 0,
                source: 'fallback'
            };
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
        const persona = this.detectCitizenPersona(query);
        
        // Empathische Einleitung basierend auf dem Anliegen
        let empatheticIntro = this.getEmpatheticIntro(agent, queryLower, persona);
        
        // Erkläre den Prozess und begleite den Bürger
        let processExplanation = this.explainProcess(agent, queryLower, persona);
        
        // Zeige die konkreten Optionen mit Erklärungen
        let options = this.presentOptionsWithGuidance(data, persona);
        
        // Aktive Nachfragen für weitere Unterstützung
        let followUpQuestions = this.generateFollowUpQuestions(agent, queryLower, persona);
        
        return `${empatheticIntro}\n\n${processExplanation}\n\n${options}\n\n${followUpQuestions}`;
    }
    
    getEmpatheticIntro(agent, queryLower, persona) {
        const intros = {
            'buergerdienste': {
                'familie': [
                    "Das verstehe ich gut! Als Familie haben Sie viele wichtige Angelegenheiten zu regeln.",
                    "Gerne unterstütze ich Sie bei diesem wichtigen Schritt für Ihre Familie.",
                    "Ich weiß, wie wichtig solche Angelegenheiten für Familien sind."
                ],
                'unternehmen': [
                    "Als Unternehmer haben Sie viel zu organisieren - ich helfe Ihnen gerne dabei.",
                    "Gewerbliche Angelegenheiten können komplex sein, lassen Sie uns das Schritt für Schritt angehen.",
                    "Ich unterstütze Sie gerne bei Ihrem Vorhaben."
                ],
                'senioren': [
                    "Ich verstehe, dass solche Angelegenheiten wichtig für Sie sind.",
                    "Gerne helfe ich Ihnen bei diesem wichtigen Schritt.",
                    "Lassen Sie uns das gemeinsam angehen."
                ],
                'bauherren': [
                    "Ein Bauvorhaben ist ein großer Schritt - ich begleite Sie gerne durch den Prozess.",
                    "Baugenehmigungen können komplex sein, aber wir schaffen das zusammen.",
                    "Ich helfe Ihnen gerne bei Ihrem Bauvorhaben."
                ],
                'allgemein': [
                    "Gerne helfe ich Ihnen bei diesem Anliegen.",
                    "Das kann ich für Sie klären!",
                    "Ich unterstütze Sie gerne dabei."
                ]
            },
            'ratsinfo': {
                'allgemein': [
                    "Transparenz ist wichtig - gerne informiere ich Sie über die politischen Entscheidungen.",
                    "Als Bürger haben Sie das Recht auf Information - ich helfe Ihnen dabei.",
                    "Gerne erkläre ich Ihnen die politischen Prozesse im Landkreis."
                ]
            },
            'stellenportal': {
                'unternehmen': [
                    "Als Arbeitgeber suchen Sie die besten Mitarbeiter - ich helfe Ihnen dabei.",
                    "Gerne unterstütze ich Sie bei der Personalsuche.",
                    "Ich begleite Sie gerne durch den Bewerbungsprozess."
                ],
                'allgemein': [
                    "Eine neue Stelle ist ein wichtiger Schritt - ich helfe Ihnen gerne dabei.",
                    "Gerne unterstütze ich Sie bei Ihrer Jobsuche.",
                    "Ich begleite Sie gerne durch den Bewerbungsprozess."
                ]
            }
        };
        
        const agentIntros = intros[agent] || intros['buergerdienste'];
        const personaIntros = agentIntros[persona] || agentIntros['allgemein'];
        
        return personaIntros[Math.floor(Math.random() * personaIntros.length)];
    }
    
    explainProcess(agent, queryLower, persona) {
        const explanations = {
            'buergerdienste': {
                'familie': "Hier ist der typische Ablauf für Familienangelegenheiten:\n1. 📋 Antrag ausfüllen\n2. 📄 Dokumente zusammenstellen\n3. 📅 Termin vereinbaren\n4. ✅ Bearbeitung und Bescheid",
                'unternehmen': "Für gewerbliche Angelegenheiten läuft es meist so ab:\n1. 📋 Antrag stellen\n2. 📄 Nachweise einreichen\n3. ⏱️ Bearbeitungszeit abwarten\n4. ✅ Genehmigung erhalten",
                'bauherren': "Der Bauprozess läuft in diesen Schritten ab:\n1. 📋 Bauantrag einreichen\n2. 📄 Pläne und Nachweise\n3. 🔍 Prüfung durch Bauamt\n4. ✅ Baugenehmigung erhalten",
                'allgemein': "Der typische Ablauf ist:\n1. 📋 Antrag ausfüllen\n2. 📄 Dokumente bereitstellen\n3. 📅 Einreichen oder Termin\n4. ✅ Bearbeitung und Bescheid"
            },
            'ratsinfo': "Die politischen Prozesse im Landkreis:\n1. 📅 Sitzungstermine einsehen\n2. 📄 Tagesordnungen prüfen\n3. 🗳️ Beschlüsse verfolgen\n4. 📞 Bei Fragen nachfragen",
            'stellenportal': "Der Bewerbungsprozess:\n1. 🔍 Stellenausschreibungen durchsuchen\n2. 📋 Bewerbung vorbereiten\n3. 📤 Bewerbung einreichen\n4. 📞 Nachfassen bei Interesse"
        };
        
        const agentExplanations = explanations[agent] || explanations['buergerdienste'];
        const personaExplanations = agentExplanations[persona] || agentExplanations['allgemein'];
        
        return personaExplanations;
    }
    
    presentOptionsWithGuidance(data, persona) {
        if (data.length === 0) return "Leider habe ich keine passenden Informationen gefunden.";
        
        let options = "**Hier sind Ihre konkreten Optionen:**\n\n";
        
        data.forEach((item, index) => {
            const stepNumber = index + 1;
            const title = this.createDescriptiveLinkText(item.title, item.url);
            
            options += `**${stepNumber}. ${title}**\n`;
            
            // Erkläre, was der Bürger hier findet
            if (item.content && item.content.length > 100) {
                const summary = item.content.substring(0, 150) + '...';
                options += `   ${summary}\n`;
            }
            
            // Zeige konkrete Kontakte
            if (item.contacts && item.contacts.length > 0) {
                options += `   📞 **Direkter Kontakt:** `;
                item.contacts.forEach((contact, idx) => {
                    options += `${contact.value}`;
                    if (idx < item.contacts.length - 1) options += ` oder `;
                });
                options += `\n`;
            }
            
            // Zeige verfügbare Formulare
            if (item.forms && item.forms.length > 0) {
                options += `   📋 **Formulare:** `;
                item.forms.forEach((form, idx) => {
                    options += `${form.title}`;
                    if (idx < item.forms.length - 1) options += `, `;
                });
                options += `\n`;
            }
            
            options += `   🔗 **Direktlink:** ${item.url}\n\n`;
        });
        
        return options;
    }
    
    generateFollowUpQuestions(agent, queryLower, persona) {
        const followUps = {
            'buergerdienste': {
                'familie': [
                    "Brauchen Sie Hilfe bei der Antragstellung?",
                    "Haben Sie Fragen zu den erforderlichen Dokumenten?",
                    "Möchten Sie einen Termin vereinbaren?",
                    "Soll ich Ihnen weitere Familienangelegenheiten zeigen?"
                ],
                'unternehmen': [
                    "Haben Sie Fragen zum Antragsverfahren?",
                    "Benötigen Sie Hilfe bei der Dokumentenzusammenstellung?",
                    "Möchten Sie weitere gewerbliche Services sehen?",
                    "Soll ich Ihnen Fördermöglichkeiten zeigen?"
                ],
                'bauherren': [
                    "Haben Sie Fragen zum Bauverfahren?",
                    "Benötigen Sie Hilfe bei der Antragstellung?",
                    "Möchten Sie weitere Bauangelegenheiten sehen?",
                    "Soll ich Ihnen Kontakte zur Bauaufsicht geben?"
                ],
                'allgemein': [
                    "Haben Sie Fragen zum Verfahren?",
                    "Benötigen Sie Hilfe bei der Antragstellung?",
                    "Möchten Sie weitere Informationen?",
                    "Soll ich Ihnen Kontakte geben?"
                ]
            },
            'ratsinfo': [
                "Möchten Sie über eine bestimmte Sitzung informiert werden?",
                "Haben Sie Fragen zu einem Beschluss?",
                "Soll ich Ihnen die nächsten Termine zeigen?",
                "Möchten Sie Kontakt zu einem Gremium?"
            ],
            'stellenportal': [
                "Haben Sie Fragen zu einer bestimmten Stelle?",
                "Möchten Sie Hilfe bei der Bewerbung?",
                "Soll ich Ihnen weitere Stellen zeigen?",
                "Benötigen Sie Kontakte zur Personalabteilung?"
            ]
        };
        
        const agentFollowUps = followUps[agent] || followUps['buergerdienste'];
        const personaFollowUps = agentFollowUps[persona] || agentFollowUps['allgemein'];
        
        const selectedQuestions = personaFollowUps.slice(0, 2);
        
        return `**Wie kann ich Ihnen weiterhelfen?**\n\n${selectedQuestions.map(q => `• ${q}`).join('\n')}`;
    }
    
    createDescriptiveLinkText(title, url) {
        // Erstelle aussagekräftige Link-Texte basierend auf Inhalt
        const titleLower = title.toLowerCase();
        const urlLower = url.toLowerCase();
        
        // Spezifische Mappings für bessere Lesbarkeit
        if (titleLower.includes('bauantrag') || titleLower.includes('baugenehmigung')) {
            return '🏗️ Bauantrag-Formular und Verfahren';
        }
        if (titleLower.includes('geburtsurkunde')) {
            return '👶 Geburtsurkunde beantragen';
        }
        if (titleLower.includes('ratsinfo') || titleLower.includes('kreistag')) {
            return '🏛️ Kreistagsinformationen und Sitzungen';
        }
        if (titleLower.includes('jugend') || titleLower.includes('familie')) {
            return '👨‍👩‍👧‍👦 Jugendamt und Familienberatung';
        }
        if (titleLower.includes('stellen') || titleLower.includes('bewerbung')) {
            return '💼 Stellenausschreibungen und Bewerbungen';
        }
        if (titleLower.includes('kontakt') || titleLower.includes('ansprechpartner')) {
            return '📞 Ansprechpartner und Kontakte';
        }
        
        // Fallback: Verwende den Titel, aber kürzer
        return title.length > 60 ? title.substring(0, 60) + '...' : title;
    }
    
    extractLinks(data) {
        const links = [];
        
        data.forEach(item => {
            // Hauptlink
            links.push({
                title: this.createDescriptiveLinkText(item.title, item.url),
                url: item.url,
                type: 'main'
            });
            
            // Formular-Links
            if (item.forms && item.forms.length > 0) {
                item.forms.forEach(form => {
                    links.push({
                        title: `📋 ${form.title}`,
                        url: form.url,
                        type: 'form'
                    });
                });
            }
        });
        
        return links;
    }
    
    getAgentInfo(agent) {
        const agentInfos = {
            'buergerdienste': {
                description: 'Bürgerdiensten und Verwaltungsangelegenheiten',
                suggestion: 'Ich kann Ihnen bei Formularen, Anträgen und Dienstleistungen helfen.'
            },
            'ratsinfo': {
                description: 'politischen Informationen und Kreistagsangelegenheiten',
                suggestion: 'Ich zeige Ihnen Sitzungstermine, Beschlüsse und politische Prozesse.'
            },
            'stellenportal': {
                description: 'Stellenausschreibungen und Bewerbungen',
                suggestion: 'Ich helfe Ihnen bei der Jobsuche und Bewerbungsprozessen.'
            },
            'kontakte': {
                description: 'Kontakten und Ansprechpartnern',
                suggestion: 'Ich gebe Ihnen die richtigen Kontakte für Ihr Anliegen.'
            },
            'jugend': {
                description: 'Jugend- und Familienangelegenheiten',
                suggestion: 'Ich unterstütze Sie bei Fragen rund um Familie und Jugend.'
            },
            'soziales': {
                description: 'sozialen Angelegenheiten und Unterstützung',
                suggestion: 'Ich helfe Ihnen bei sozialen Fragen und Hilfsangeboten.'
            }
        };
        
        return agentInfos[agent] || agentInfos['buergerdienste'];
    }
}

module.exports = KAYACharacterHandler;
