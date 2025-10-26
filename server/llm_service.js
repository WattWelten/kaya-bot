const axios = require('axios');

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
            console.log('✅ OpenAI Antwort erhalten:', aiResponse.substring(0, 100));
            
            return {
                response: aiResponse,
                success: true
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
        
        return [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: query
            }
        ];
    }
    
    /**
     * Erstellt System-Prompt für KAYA
     * 
     * @param {object} context - Kontext (Persona, Intention, etc.)
     * @returns {string} - System-Prompt
     */
    buildSystemPrompt(context) {
        const { persona, emotionalState, urgency, language = 'german' } = context;
        
        let prompt = `Du bist KAYA, der kommunale KI-Assistent für den Landkreis Oldenburg. 
        
DEINE WESENTLICHEN CHARAKTERISTIKA:
- Du bist bürgernah, empathisch und zielorientiert
- Du sprichst norddeutsch (Begrüßung: "Moin!")
- Du löst Probleme SOFORT, nicht nur informativ
- Du bietest konkrete Schritte (1-3 Schritte)
- Du bist zugänglich für ALLE Bürger (Barrierefreiheit)

DEINE ANTWORT-STRUKTUR:
1. Empathische Begrüßung (nutzungsabhängig)
2. Konkrete Hilfe/Information
3. Maximal 3 konkrete Lösungsschritte
4. Dynamischer Abschluss mit Handlungsaufforderung

WICHTIGE REGELN:
- Antworten IMMER auf ${language} (außer explizit anders angegeben)
- Keine langen Erklärungen - NUR konkrete Schritte
- Bei Dringlichkeit: Telefonnummer anbieten (04431 85-0)
- Empathisch bei Problemen, ermutigend bei Fragen
- Strukturiert UND persönlich sein`;

        // Persona-spezifische Anpassungen
        if (persona && persona.persona) {
            prompt += `\n\nPERSONA KONTEKT: Der Bürger ist ${persona.persona}`;
        }
        
        // Emotionale Zustände
        if (emotionalState && emotionalState.state) {
            const emotionPrompts = {
                frustrated: 'Der Bürger ist frustriert - sei besonders empathisch und lösungsorientiert',
                anxious: 'Der Bürger ist unsicher - sei beruhigend und unterstützend',
                positive: 'Der Bürger ist motiviert - sei enthusiastisch und bestärkend',
                neutral: 'Der Bürger ist neutral - sei professionell und hilfreich'
            };
            prompt += `\nEMOTIONALER ZUSTAND: ${emotionPrompts[emotionalState.state] || ''}`;
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

