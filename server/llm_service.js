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
        this.maxTokens = 150; // Für empathische, längere Antworten (60-80 Wörter)
        this.temperature = 0.8; // Kreativer für persönlichere Antworten
        
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
            
            // Token-Ökonomie prüfen
            this.trackTokenEconomy(outputTokens, query);
            
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
                    const role = msg.sender === 'user' ? 'user' : 'assistant';
                    messages.push({
                        role: role,
                        content: msg.content
                    });
                    console.log(`📝 History: ${role} - "${msg.content.substring(0, 50)}..."`);
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
        const { persona, emotionalState, urgency, language = 'german', userData, isFirstMessage } = context;
        
        // KAYA - HERZLICH, EMPATHISCH, NORDDEUTSCH
        let prompt = `Du bist KAYA - die herzliche Empfangs-Mitarbeiterin vom Landkreis Oldenburg.

🎭 DEINE PERSÖNLICHKEIT:
- Norddeutsch: Bodenständig, direkt, herzlich ("Moin", "parat", "Dat", "bestimmt")
- Empathisch: REAGIERE IMMER auf Emotionen!
  • "Ich habe ein Auto gekauft" → "Super, Glückwunsch zum neuen Auto! 🚗 Das freut mich!"
  • "Ich habe ein Problem" → "Oh, das tut mir leid. Lass uns das lösen."
  • "Ich bin unsicher" → "Keine Sorge, ich helfe dir gerne!"
- Freundlich: Glückwünsche, Verständnis, Ermutigung
- Humor: Subtil norddeutsch (max. 1x pro Dialog)
  • "Butter bei die Fische:"
  • "Dat kriegen wir hin!"
  • "Kurz und knackig:"

💬 DIALOG-STRUKTUR (WICHTIG - 4 STU UND:

1. EMPATHIE (1-2 Sätze) - REAGIERE AUF EMOTION:
   - "gekauft/neu/geschafft" → "Super! Glückwunsch! 🚗"
   - "problem/fehler/ärger" → "Oh, das tut mir leid. Lass uns das lösen."
   - "wie/was/wo" → "Gute Frage! Das erkläre ich dir gerne."

2. KONTEXT (1 Satz):
   - "Du willst es bestimmt jetzt zulassen, oder?"

3. LÖSUNG (2-3 Sätze mit Details):
   - "Dazu brauchst du einen Termin bei der [KFZ-Zulassungsstelle](URL)"
   - "Bring bitte Fahrzeugbrief, Versicherungsbestätigung und deinen Perso mit."

4. NACHFRAGE (1 Satz):
   - "Hast du die Unterlagen schon parat?"
   - "Passt dat so?"
   - "Brauchst du noch was?"

LÄNGE: 60-80 Wörter (4-6 Sätze, nicht mehr 30-40!)

🔗 LINKS (ZWINGEND - IMMER EINBAUEN!):
Format: [Beschreibung](vollständige-URL)

VERIFIZIERTE LINKS (NUR DIESE!):
- KFZ/Führerschein: https://www.oldenburg-kreis.de/fuehrerscheinstelle/
- Jobcenter: https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/jobcenter-landkreis-oldenburg/
- Bauanträge: https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/
- Bürgerdienste: https://www.oldenburg-kreis.de/
- Kreistag: https://oldenburg-kreis.ratsinfomanagement.net/sitzungen/

DU MUSST IMMER einen Link einbauen!

😊 EMOJIS (sparsam, max. 1 pro Antwort):
- 🚗 Auto, KFZ
- 🏡 Haus, Bauen
- 📄 Formular, Antrag
- ✅ Erledigt, Check
- 💼 Arbeit, Jobcenter

NUR wenn es WIRKLICH passt - nicht forcieren!

🚨 SICHERHEIT:
- Keine Rechtsberatung
- Notfälle: SOFORT 112/110 nennen`;

        // User-Kontext
        if (userData && userData.name) {
            prompt += `\n\n👤 Der Nutzer heißt ${userData.name}. Nutze den Namen NATÜRLICH und PERSONLICH.`;
        }
        
        // Emotion-Detection für empathische Reaktion
        const emotionPrefix = this.detectEmotionPrefix(query);
        if (emotionPrefix) {
            prompt += `\n\n🎭 EMOTIONALE REAKTION: Beginne deine Antwort mit: "${emotionPrefix}"`;
        }
        
        // Conversation History
        if (context.conversationHistory && context.conversationHistory.length > 1) {
            prompt += `\n\n📝 Du kennst die vorherige Nachricht. Antworte KOHÄRENT und beziehe dich auf den Kontext.`;
        }
        
        // Erste Nachricht
        if (isFirstMessage) {
            prompt += `\n\n🎯 Erste Nachricht: Beginne mit "Moin!" dann eine Frage "Wie kann ich helfen?"`;
        } else {
            prompt += `\n\n🎯 KEINE Begrüßung - direkt zur Antwort.`;
        }
        
        prompt += `\n\nJETZT: Antworte empathisch, norddeutsch, 60-80 Wörter, immer 1 Link. Bei Unklarheit: NACHFRAGEN.`;

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
     * Erkennt Emotion in Query und gibt passenden Prefix zurück
     * 
     * @param {string} query - User-Query
     * @returns {string|null} - Emotion-Prefix oder null
     */
    detectEmotionPrefix(query) {
        const lowerQuery = query.toLowerCase();
        
        // Positive Emotionen
        const positiveKeywords = [
            'gekauft', 'neu', 'endlich', 'geschafft', 'freue', 
            'glücklich', 'super', 'toll', 'prima', 'schön', 'gefallen'
        ];
        
        // Negative Emotionen
        const negativeKeywords = [
            'problem', 'fehler', 'ärger', 'kaputt',
            'schlecht', 'falsch', 'sorge', 'unsicher', 'nicht funktioniert'
        ];
        
        // Frage-Wörter
        const questionKeywords = [
            'wie', 'was', 'wo', 'wann', 'warum', 'welche', 'womit'
        ];
        
        if (positiveKeywords.some(kw => lowerQuery.includes(kw))) {
            const prefixes = [
                'Super! Das freut mich!',
                'Toll! Glückwunsch!',
                'Prima! Das ist ja schön!',
                'Klasse! Herzlichen Glückwunsch!',
                'Moin! Super, das freut mich!'
            ];
            return prefixes[Math.floor(Math.random() * prefixes.length)];
        }
        
        if (negativeKeywords.some(kw => lowerQuery.includes(kw))) {
            const prefixes = [
                'Oh, das tut mir leid.',
                'Das ist ärgerlich. Lass uns das lösen.',
                'Verstehe. Das ist nicht schön.',
                'Oh je. Keine Sorge, ich helfe dir.',
                'Das ist nicht schön. Gemeinsam kriegen wir das hin!'
            ];
            return prefixes[Math.floor(Math.random() * prefixes.length)];
        }
        
        if (questionKeywords.some(kw => lowerQuery.includes(kw))) {
            const prefixes = [
                'Gute Frage!',
                'Klar, das erkläre ich dir gerne.',
                'Moin! Dazu kann ich dir was sagen:',
                'Gerne helfe ich dir damit.'
            ];
            return prefixes[Math.floor(Math.random() * prefixes.length)];
        }
        
        return null;
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
    
    /**
     * Prüft Token-Ökonomie (Ziel: 80-220 Tokens)
     * 
     * @param {number} outputTokens - Anzahl Output-Tokens
     * @param {string} query - Query zur Kontext-Anzeige
     * @returns {object} - Metrics
     */
    trackTokenEconomy(outputTokens, query) {
        const target = { min: 60, max: 150 }; // Für empathische, längere Antworten (60-80 Wörter)
        
        if (outputTokens < target.min) {
            console.warn(`⚠️ Antwort zu kurz: ${outputTokens} Tokens (Ziel: ${target.min}-${target.max})`);
        } else if (outputTokens > target.max) {
            console.warn(`⚠️ Antwort zu lang: ${outputTokens} Tokens (Ziel: ${target.min}-${target.max})`);
        } else {
            console.log(`✅ Token-Ökonomie perfekt für empathischen Dialog: ${outputTokens} Tokens`);
        }
        
        // Metrics für Monitoring
        return {
            tokens: outputTokens,
            withinTarget: outputTokens >= target.min && outputTokens <= target.max,
            efficiency: (target.max - outputTokens) / target.max
        };
    }
}

module.exports = LLMService;

