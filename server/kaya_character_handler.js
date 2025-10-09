class KAYACharacterHandler {
    constructor() {
        this.agentHandler = null; // Lazy loading für Agent Handler
        this.llmService = null; // Lazy loading
        this.useLLM = process.env.USE_LLM === 'true';
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
    
    async generateResponse(query, userMessage) {
        // Bestimme zuständigen Agent
        const agent = this.getAgentHandler().routeToAgent(query);
        
        let response;
        if (agent === 'kaya') {
            response = this.generateKAYAResponse(query);
        } else {
            response = this.generateAgentResponse(agent, query);
        }

        // LLM-Enhancement DEAKTIVIERT - Link-Texte werden überschrieben
        // Das LLM ignoriert alle Anweisungen und überschreibt Link-Texte mit "[Landkreis-Services]"
        // Daher verwenden wir nur die Character Handler Antworten
        console.log('⚠️ LLM-Enhancement deaktiviert - Link-Texte bleiben erhalten');

        return response;
    }
    
    generateKAYAResponse(query) {
        const greeting = "Moin! Ich bin KAYA, Ihr kommunaler KI-Assistent.";
        
        return {
            agent: 'kaya',
            response: `${greeting} Wie kann ich Ihnen heute helfen?`,
            suggestions: [
                "Formulare und Anträge",
                "Kontakte und Öffnungszeiten", 
                "Stellenausschreibungen",
                "Ratsinfo und Sitzungen"
            ]
        };
    }
    
    generateAgentResponse(agent, query) {
        const agentData = this.getAgentHandler().searchAgentData(agent, query);
        
        console.log(`Agent ${agent}: ${agentData.length} Ergebnisse für "${query}"`);
        
        if (agentData.length === 0) {
            // Fallback: Zeige allgemeine Informationen über den Agent
            const agentInfo = this.getAgentInfo(agent);
            return {
                agent: agent,
                response: `Gerne helfe ich Ihnen bei ${agentInfo.description}. ${agentInfo.suggestion}`,
                fallback: true,
                suggestion: agentInfo.suggestion,
                confidence: 0, // Keine Daten = niedrige Konfidenz
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