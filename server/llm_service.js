const axios = require('axios');
const http = require('http');
const https = require('https');
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
        this.maxTokens = 70; // Für kurze, menschliche Antworten (30-50 Wörter)
        this.temperature = 0.85; // Etwas kreativer für mehr Persönlichkeit
        
        // Connection Pooling für bessere Performance
        this.httpAgent = new http.Agent({
            keepAlive: true,
            maxSockets: 50,
            maxFreeSockets: 10,
            timeout: 8000
        });
        
        this.httpsAgent = new https.Agent({
            keepAlive: true,
            maxSockets: 50,
            maxFreeSockets: 10,
            timeout: 8000
        });
        
        // Circuit Breaker für Fehlerbehandlung
        this.circuitBreaker = {
            isOpen: false,
            failureCount: 0,
            lastFailureTime: 0,
            timeout: 30000 // 30 Sekunden (optimiert)
        };
        
        console.log('🤖 LLM Service initialisiert (OpenAI aktiviert mit Connection Pooling)');
    }
    
    /**
     * Generiert intelligente Antwort mit OpenAI (STREAMING)
     * 
     * @param {string} query - Die Benutzeranfrage
     * @param {object} context - Kontext (Persona, Intention, etc.)
     * @returns {Promise<Readable>} - Stream für SSE
     */
    async generateResponseStream(query, context = {}) {
        try {
            // Circuit Breaker prüfen
            if (this.circuitBreaker.isOpen) {
                if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
                    this.circuitBreaker.isOpen = false;
                    this.circuitBreaker.failureCount = 0;
                    console.log('🔧 Circuit Breaker: Geschlossen, versuche erneut');
                } else {
                    console.log('⚠️ Circuit Breaker: Offen, kein Streaming möglich');
                    throw new Error('Circuit breaker is open');
                }
            }
            
            console.log('🌊 OpenAI Streaming aktiviert für Query:', query.substring(0, 50));
            
            // OpenAI API Call mit Streaming
            const response = await axios.post(
                this.openaiApiUrl,
                {
                    model: this.model,
                    messages: this.buildMessages(query, context),
                    max_tokens: this.maxTokens,
                    temperature: this.temperature,
                    stream: true // STREAMING aktiviert!
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 8000,
                    responseType: 'stream', // Wichtig für Streaming!
                    httpsAgent: this.httpsAgent, // Connection Pooling
                    httpAgent: this.httpAgent
                }
            );
            
            // Circuit Breaker zurücksetzen
            this.circuitBreaker.isOpen = false;
            this.circuitBreaker.failureCount = 0;
            
            return response.data; // Gibt Readable Stream zurück
            
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    
    /**
     * Generiert intelligente Antwort mit OpenAI (Standard)
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
                    timeout: 8000, // 8 Sekunden Timeout (optimiert)
                    httpsAgent: this.httpsAgent, // Connection Pooling
                    httpAgent: this.httpAgent
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
        
        // KAYA – Kompakt & Effizient (Token-optimiert)
        let prompt = `Du bist KAYA – digitale Assistenz des Landkreises Oldenburg.

Zweck: Schnell, freundlich, zuverlässig – ohne Geschwafel. Führt zum Ziel in 1–3 Schritten.

Ton: Menschlich, bodenständig, klar. Norddeutscher Humor sparsam ("Klar doch, kriegen wir hin."). Keine Floskeln. Standard Sie (duzen wenn Nutzer duzt).

Antwortstil (VARIABILITÄT - nicht immer alle Schritte!):
- Mal direkt zur Sache ("KFZ-Ummeldung? Klar, du brauchst...")
- Mal mit kurzer Einleitung ("Das kriegen wir hin. [Info]. Weiter so...")
- Nutzenversprechen nur wenn sinnvoll (nicht jedes Mal)
- Kernantwort: Fließender Text bevorzugen, Listen nur bei 4+ Items
- Nächster Schritt: Natürlich integriert, nicht immer als separater Absatz
- Quelle nur wenn wirklich relevant
→ Keine Wiederholungen innerhalb 5 Turns.
→ KEINE mechanische Struktur - variiere natürlich!

Interaktion: Max. 1 Rückfrage. Chips nur wenn wirklich relevant. Barrierearm. Listen nur bei 4+ Items, sonst fließender Text.

Agenten: Genau einen pro Schritt (Formular/Auskunft → Dienstleistung, Sozial → Sozial, Kreistag → Ratsinfo, Stellen → Karriere, Kontakt → Kontakt).

RAG: Präzise Abschnitte, keine langen Zitate. Quelle nur bei Bedarf.

Nicht: Rechtberatung, Versprechen, "Ich bin nur KI". Stattdessen: "Dazu habe ich folgende Infos …".

Closers: KEINE automatischen Closers - antworte natürlich und abschließend

VERIFIZIERTE LINKS (NUR DIESE!):
- Startseite: https://www.oldenburg-kreis.de/
- KFZ-Zulassung: https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreisverwaltung/kurzvorstellung-der-aemter/strassenverkehrsamt/
- KFZ-Termine: https://oldenburg-kreis.ratsinfomanagement.net/termine
- Führerschein: https://www.oldenburg-kreis.de/fuehrerscheinstelle/
- Bauanträge: https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/
- Bauamt: https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreisverwaltung/kurzvorstellung-der-aemter/bauordnungsamt/
- Jobcenter: https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/jobcenter-landkreis-oldenburg/
- Gewerbe: https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/gewerbe/
- Jugend & Familie: https://www.oldenburg-kreis.de/jugend-und-familie/
- Kinderbetreuung: https://www.oldenburg-kreis.de/jugend-und-familie/kinderbetreuung/
- Soziales: https://www.oldenburg-kreis.de/gesundheit-und-soziales/
- Gesundheit: https://www.oldenburg-kreis.de/gesundheit-und-soziales/gesundheitsamt/
- Kreistag: https://www.oldenburg-kreis.de/landkreis-und-verwaltung/kreistag/
- Ratsinfo: https://oldenburg-kreis.ratsinfomanagement.net/sitzungen/
- Öffnungszeiten: https://www.oldenburg-kreis.de/portal/seiten/oeffnungszeiten-900000003-21700.html
- Kontaktformular: https://www.oldenburg-kreis.de/portal/kontakt.html
- Telefon: 04431 85-0 (Mo-Fr 8-16 Uhr)
- E-Mail: info@oldenburg-kreis.de

WICHTIG - PERSONEN & POSITIONEN (NUR DIESE VERIFIZIERTEN NAMEN!):
🚨 ERFINDE NIEMALS NAMEN VON PERSONEN!
- Landrat: Dr. Christian Pundt (NICHT Matthias Groote oder andere Namen!)
- Bei Fragen zu Personen: NUR diesen Namen verwenden oder ehrlich sagen "Dazu habe ich keine genauen Infos"

VERIFIZIERTE FAKTEN - E-REchnung & Leitweg-ID (HOHEITLICHER AUFTRAG!):
🚨 KRITISCH - DIESE INFOS SIND VERIFIZIERT UND MÜSSEN IMMER KORREKT SEIN!
- Leitweg-ID: 03458-0-051
- Vorgang: XRechnung im XML-Format (UBL 2.1/CIIl) oder ZUGFeRD 2.0
- Standort: Leitweg-ID steht im Impressum der Website (https://www.oldenburg-kreis.de/landkreis-und-verwaltung/impressum/)
- Prozess: Rechnung erstellen → Leitweg-ID verwenden → Über XRechnung-System senden
- Empfänger: Landkreis Oldenburg
- Zuständig: Finanzdezernat / Rechnungsprüfung
- Kontakt: 04431 85-0
- NIEMALS sagen "kann ich nicht bereitstellen" bei Leitweg-ID - diese Info ist VERIFIZIERT!

WICHTIG - LINK-VALIDIERUNG:
- ERFINDE KEINE LINKS! Nutze nur diese verifizierten URLs!
- Wenn keine passende URL: Verweise auf Startseite + Telefon
- Bei Unsicherheit: "Mehr Infos auf www.oldenburg-kreis.de oder Telefon: 04431 85-0"

🚨 KRITISCH - HOHEITLICHER AUFTRAG - KEINE HALLUZINATIONEN!
Du arbeitest für eine KOMMUNALE VERWALTUNG mit HOHEITLICHEM AUFTRAG. Falsche Informationen sind INKOMPETABEL und können zu rechtlichen Problemen führen!

- Bei VERIFIZIERTEN FAKTEN (siehe oben): IMMER diese nutzen, NIEMALS "kann ich nicht" sagen!
- Bei UNVERIFIZIERTEN Informationen: SAG ES EHRLICH & NATÜRLICH
- Nutze natürliche Unsicherheits-Signale: "Hm, da muss ich passen...", "Genau weiß ich das nicht, aber...", "Da bin ich mir nicht 100% sicher, aber..."
- Dann Verweis auf Bürgerservice (kurz, natürlich):
  "Am besten rufst du kurz an: 04431 85-0. Die helfen dir garantiert weiter!"

- ERFINDE NIEMALS:
  - Öffnungszeiten
  - Telefonnummern
  - E-Mail-Adressen
  - Gebühren/Kosten
  - Bearbeitungszeiten
  - Rechtliche Details
  - Personennamen (außer verifiziert)
  - Verfahrensdetails

- Bei Unsicherheit: IMMER eskalieren zum Bürgerservice!
- BEI VERIFIZIERTEN FAKTEN: IMMER nutzen, nicht sagen "kann ich nicht"!

FEW-SHOTS (nur bei ähnlichen Queries):`;
        
        // Dynamische Few-Shots: Nur wenn Query ähnlich zu Beispielen
        const queryLower = (context.conversationHistory && context.conversationHistory.length > 0 
            ? context.conversationHistory[context.conversationHistory.length - 1]?.content || ''
            : '').toLowerCase();
        
        const addFewShots = queryLower.includes('ummelden') || queryLower.includes('auto') || 
                           queryLower.includes('kreistag') || queryLower.includes('sitzung') ||
                           queryLower.includes('ausbildung') || queryLower.includes('stellen');
        
        if (addFewShots) {
            prompt += `
Beispiel: User "Auto ummelden, was brauche ich?" → KAYA: "Kriegen wir hin: Perso, Fahrzeugbrief, eVB. Weiter: Termin oder online starten?"`;
        }
        
        prompt += `

Merke: Keine Floskeln. Quellen nur wenn nötig.`;

        // User-Kontext
        if (userData && userData.name) {
            prompt += `\n\n👤 Der Nutzer heißt ${userData.name}. Nutze den Namen NATÜRLICH und PERSONLICH.`;
        }
        
        // Conversation History
        if (context.conversationHistory && context.conversationHistory.length > 1) {
            prompt += `\n\n📝 Du kennst die vorherige Nachricht. Antworte KOHÄRENT und beziehe dich auf den Kontext.`;
        }
        
        // Erste Nachricht
        if (isFirstMessage) {
            prompt += `\n\n🎯 ERSTE NACHRICHT: Stelle dich vor: "Moin! Ich bin KAYA, die KI-basierte Assistenz des Landkreis Oldenburg. Wie kann ich dir helfen?"`;
        } else {
            prompt += `\n\n🎯 KEINE Begrüßung - direkt zur Sache.`;
        }
        
        // NEU: Dynamische Links einfügen
        if (context.relevantLinks && context.relevantLinks.length > 0) {
            prompt += `\n\n🔗 VERWENDE DIESE RELEVANTEN LINKS (max. 3-5):\n`;
            context.relevantLinks.forEach(link => {
                prompt += `- ${link.title}: ${link.url}\n`;
            });
            prompt += `\nNutze IMMER mindestens 1 Link in deiner Antwort!`;
        }
        
        // KRITISCH: Verifizierte Fakten bei hoheitlichen Themen
        if (context.verifiedFacts) {
            prompt += `\n\n🚨 VERIFIZIERTE FAKTEN (MÜSSEN GENAU SO GENUTZT WERDEN!):\n`;
            if (context.verifiedFacts.leitwegId) {
                prompt += `Leitweg-ID: ${context.verifiedFacts.leitwegId}\n`;
                prompt += `Vorgang: ${context.verifiedFacts.process}\n`;
                prompt += `Wo: ${context.verifiedFacts.location}\n`;
                prompt += `Kontakt: ${context.verifiedFacts.contact}\n`;
                prompt += `Zuständig: ${context.verifiedFacts.responsible}\n`;
                prompt += `\nWICHTIG: Nutze diese Fakten IMMER wenn danach gefragt wird! NIEMALS "kann ich nicht" sagen!`;
            }
        }

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
    
    /**
     * Prüft Token-Ökonomie (Ziel: 80-220 Tokens)
     * 
     * @param {number} outputTokens - Anzahl Output-Tokens
     * @param {string} query - Query zur Kontext-Anzeige
     * @returns {object} - Metrics
     */
    trackTokenEconomy(outputTokens, query) {
        const target = { min: 20, max: 80 }; // Kurze, gezielte Antworten (30-50 Wörter)
        
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

