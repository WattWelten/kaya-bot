const axios = require('axios');
const costTracker = require('./services/cost_tracker');

/**
 * KAYA LLM Service - OpenAI Integration
 * 
 * Dieser Service integriert OpenAI für intelligente Antworten
 * mit Fallback auf lokale Templates bei Fehlern.
 */

class LLMService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4o-mini'; // Kostenoptimiertes Modell
        this.maxTokens = 500;
        this.temperature = 0.7;
        
        // Circuit Breaker für Fehlerbehandlung
        this.circuitBreaker = {
            isOpen: false,
            failureCount: 0,
            lastFailureTime: 0,
            timeout: 60000 // 1 Minute
        };
        
        console.log('🤖 LLM Service initialisiert (OpenAI aktiviert)');
    }
    
    /**
     * Generiert intelligente Antwort mit OpenAI
     * 
     * @param {string} query - Die Benutzeranfrage
     * @param {object} context - Kontext (Persona, Intention, etc.)
     * @returns {Promise<object>} - {response: string, success: boolean}
     */
    async generateResponse(query, context = {}) {
        try {
            // Circuit Breaker prüfen
            if (this.circuitBreaker.isOpen) {
                if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
                    this.circuitBreaker.isOpen = false;
                    this.circuitBreaker.failureCount = 0;
                    console.log('🔧 Circuit Breaker: Geschlossen, versuche erneut');
                } else {
                    console.log('⚠️ Circuit Breaker: Offen, Fallback aktiviert');
                    return { response: null, success: false, reason: 'circuit_breaker' };
                }
            }
            
            // OpenAI API Call
            const response = await axios.post(
                this.openaiApiUrl,
                {
                    model: this.model,
                    messages: this.buildMessages(query, context),
                    max_tokens: this.maxTokens,
                    temperature: this.temperature,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 Sekunden Timeout
                }
            );
            
            // Erfolgreiche Antwort
            this.circuitBreaker.isOpen = false;
            this.circuitBreaker.failureCount = 0;
            
            const aiResponse = response.data.choices[0].message.content;
            
            // Kosten tracken
            const inputTokens = response.data.usage.prompt_tokens;
            const outputTokens = response.data.usage.completion_tokens;
            costTracker.trackOpenAI(inputTokens, outputTokens);
            
            console.log('✅ OpenAI Antwort erhalten:', aiResponse.substring(0, 100));
            
            return {
                response: aiResponse,
                success: true,
                usage: response.data.usage
            };
            
        } catch (error) {
            // Fehlerbehandlung
            this.handleError(error);
            return {
                response: null,
                success: false,
                reason: error.message
            };
        }
    }
    
    /**
     * Baut die Messages für OpenAI
     * 
     * @param {string} query - Die Benutzeranfrage
     * @param {object} context - Kontext
     * @returns {Array} - Messages für OpenAI
     */
    buildMessages(query, context) {
        const systemPrompt = this.buildSystemPrompt(context);
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];
        
        // NEU: Conversation History hinzufügen (letzte 5 Nachrichten)
        if (context.conversationHistory && context.conversationHistory.length > 0) {
            const history = context.conversationHistory.slice(-5); // Max. 5 für Token-Effizienz
            
            history.forEach(msg => {
                // Prüfe ob Nachricht noch nicht aktuell ist (doppelte Vermeidung)
                if (msg.content && msg.content !== query) {
                    messages.push({
                        role: msg.role === 'user' ? 'user' : 'assistant',
                        content: msg.content
                    });
                }
            });
            
            console.log(`📝 ${history.length} Historie-Nachrichten an LLM übergeben`);
        }
        
        // Aktuelle Query hinzufügen
        messages.push({
            role: 'user',
            content: query
        });
        
        return messages;
    }
    
    /**
     * Erstellt System-Prompt für KAYA
     * 
     * @param {object} context - Kontext (Persona, Intention, etc.)
     * @returns {string} - System-Prompt
     */
    buildSystemPrompt(context) {
        const { persona, emotionalState, urgency, language = 'german', userData } = context;
        
        let prompt = `Du bist KAYA vom Landkreis Oldenburg. Antworte kurz, konkret, lösungsorientiert.

REGELN:
1. KEINE Begrüßung ("Moin!") - nur direkt zur Sache
2. IMMER mindestens 1 Markdown-Link: [Text](URL)
3. Keine vagen Fragen - direkte Lösungen anbieten
4. Max. 3 kurze Sätze

BEISPIEL:
Frage: "Grundstück gekauft"
Antwort: "Für den Bauantrag brauchst du die [Formulare hier](https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/). Ruf an (04431 85-0) für Beratung. Hast du den Bebauungsplan geprüft?"

LINKS (immer verwenden - VERIFIZIERT!):
- Bauanträge: https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/
- Jobcenter: https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/jobcenter-landkreis-oldenburg/
- KFZ/Führerschein: https://www.oldenburg-kreis.de/online-kreishaus/fuehrerscheinstelle/
- Bürgerdienste: https://www.oldenburg-kreis.de/online-kreishaus/
- Kreistag: https://oldenburg-kreis.ratsinfomanagement.net/sitzungen/`;

        // NEU: User-Kontext hinzufügen
        if (userData && userData.name) {
            prompt += `\n\n👤 WICHTIG: Der Nutzer heißt ${userData.name}. Nutze den Namen in JEDER Antwort persönlich! Beispiel: "Sarah, für dein Anliegen..." oder "Michael, du kannst hier...". Sei persönlich und verständnisvoll!`;
        }
        
        // Context-Historie Check
        if (context.conversationHistory && context.conversationHistory.length > 1) {
            prompt += `\n\n🔍 HINWEIS: Dies ist NICHT die erste Nachricht. Der Nutzer kennt dich bereits. Referenziere vorherige Gespräche wenn relevant.`;
        }
        
        prompt += `\n\nJETZT ANTWORTEN:`;

        // Persona-spezifische Anpassungen
        if (persona && persona.persona) {
            const personaPrompts = {
                'unemployed': 'Der Bürger ist arbeitslos/arbeitssuchend - sei besonders respektvoll, ermutigend und ressourcenorientiert. Zeige Verständnis für schwierige Lebenslagen.',
                'unemployed_longterm': 'Der Bürger ist langzeitarbeitslos - sei besonders empathisch, geduldig und lösungsorientiert. Biete konkrete Hilfsangebote an.',
                'senior': 'Der Bürger ist Senior - verwende einfache Sprache, keine Anglizismen, mehr Zeit für Erklärungen. Stelle sicher, dass alles verstanden wurde.',
                'senior_active': 'Der Bürger ist aktiver Senior - verwende klare, direkte Sprache. Biete optionale Details an.',
                'disabled': 'Der Bürger hat eine Behinderung - sei praktisch und lösungsorientiert. Frage nach Bedarfen, nicht nach Einschränkungen.',
                'disabled_worker': 'Der Bürger hat eine Behinderung im Arbeitsleben - fokussiere auf Teilhabe-Möglichkeiten und Unterstützungsangebote.',
                'migrant': 'Der Bürger ist Migrant - verwende einfache Sprache, kurze Sätze, kulturelle Sensibilität. Erkläre Verwaltungsprozesse besonders klar.',
                'family': 'Der Bürger kommt mit Familie - berücksichtige Bedürfnisse von Kindern und Eltern.',
                'entrepreneur': 'Der Bürger ist Unternehmer/Gründer - fokussiere auf Wirtschaftsförderung, Fördermittel, Gründungsberatung.',
                'political_interested': 'Der Bürger interessiert sich für Politik - biete Details zu Kreistag, Fraktionen, Gremien, Vorlagen.',
                'tourist': 'Der Bürger ist Tourist - sei einladend, fokussiere auf Sehenswürdigkeiten, Kultur, Unterkünfte.',
                'farmer': 'Der Bürger ist Landwirt - kenne die spezifischen Bedarfe (EU-Förderung, Tierhaltung, Agrarstruktur).',
                'student': 'Der Bürger ist Student - fokussiere auf Hochschulen, BAföG, Semesterticket, Studienfinanzierung.',
                'craftsman': 'Der Bürger ist Handwerker - kenne Handwerkskammer, Meisterprüfung, Ausbildungsordnungen.',
                'pensioner': 'Der Bürger ist Rentner - fokussiere auf Rente, Altersvorsorge, Seniorenberatung.',
                'single_parent': 'Der Bürger ist Alleinerziehend - berücksichtige Kinderbetreuung, Unterhaltsvorschuss, Zeitdruck.',
                'small_business': 'Der Bürger ist Kleinunternehmer - fokussiere auf Gewerbe, Steuern, Fördermittel.',
                'child': 'Der Bürger ist Kind/Schüler - verwende einfache, freundliche Sprache, erkläre Verwaltungsabläufe kindgerecht.',
                'care_dependent': 'Der Bürger ist pflegebedürftig - fokussiere auf Pflegeleistungen, Pflegedienste, Eingliederungshilfe.',
                'low_income': 'Der Bürger hat niedriges Einkommen - zeige alle verfügbaren Unterstützungsangebote auf.'
            };
            
            const personaPrompt = personaPrompts[persona.persona] || `Der Bürger ist ${persona.persona}`;
            prompt += `\n\nPERSONA KONTEXT: ${personaPrompt}`;
        }
        
        // Emotionale Zustände
        if (emotionalState && emotionalState.state) {
            const emotionPrompts = {
                frustrated: 'Der Bürger ist frustriert - sei besonders empathisch und lösungsorientiert. Zeige Verständnis, biete sofort konkrete Lösungen.',
                anxious: 'Der Bürger ist unsicher - sei beruhigend und unterstützend. Erkläre Schritt für Schritt, nimm Ängste ernst.',
                positive: 'Der Bürger ist motiviert - sei enthusiastisch und bestärkend. Biete proaktive Unterstützung.',
                neutral: 'Der Bürger ist neutral - sei professionell und hilfreich.',
                urgent: 'Der Bürger hat zeitlichen Druck - reagiere schnell und zielführend, biete sofort Lösungen an.',
                confused: 'Der Bürger ist verwirrt - erkläre einfach und strukturiert, frage nach Verständnis.'
            };
            prompt += `\n\nEMOTIONALER ZUSTAND: ${emotionPrompts[emotionalState.state] || ''}`;
        }
        
        // Dringlichkeit
        if (urgency && urgency.level === 'critical') {
            prompt += `\n\nDRINGLICHKEIT: KRITISCH - Biete sofort Hilfe (Telefonnummer, Termine)`;
        }
        
        prompt += `\n\nANTWORTE JETZT auf die Anfrage. Sei konkret, hilfreich und norddeutsch.`;
        
        return prompt;
    }
    
    /**
     * Fehlerbehandlung mit Circuit Breaker
     * 
     * @param {Error} error - Der Fehler
     */
    handleError(error) {
        this.circuitBreaker.failureCount++;
        this.circuitBreaker.lastFailureTime = Date.now();
        
        // Bei 3 Fehlern: Circuit Breaker öffnen
        if (this.circuitBreaker.failureCount >= 3) {
            this.circuitBreaker.isOpen = true;
            console.error('🔴 Circuit Breaker: GEÖFFNET nach 3 Fehlern');
        }
        
        // Log Fehler
        if (error.response) {
            console.error('❌ OpenAI API Fehler:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('❌ OpenAI API Fehler: Keine Antwort vom Server');
        } else {
            console.error('❌ OpenAI API Fehler:', error.message);
        }
    }
    
    /**
     * Prüft ob Service verfügbar ist
     * 
     * @returns {boolean}
     */
    isAvailable() {
        return !!this.openaiApiKey && !this.circuitBreaker.isOpen;
    }
    
    /**
     * Gibt Status zurück
     * 
     * @returns {object}
     */
    getStatus() {
        return {
            available: this.isAvailable(),
            circuitBreakerOpen: this.circuitBreaker.isOpen,
            failureCount: this.circuitBreaker.failureCount,
            hasApiKey: !!this.openaiApiKey
        };
    }
}

module.exports = LLMService;

