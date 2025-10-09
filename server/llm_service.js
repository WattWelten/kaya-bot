const axios = require('axios');

class LLMService {
    constructor() {
        // Umgebungsvariablen direkt aus process.env laden
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
        this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        
        console.log('🔧 LLM Service initialisiert:');
        console.log('  - OpenAI API Key:', this.openaiApiKey ? 'VORHANDEN ✅' : 'FEHLT ❌');
        console.log('  - ElevenLabs API Key:', this.elevenlabsApiKey ? 'VORHANDEN ✅' : 'FEHLT ❌');
    }

    async generateTextResponse(prompt, context = '', sessionId = 'default') {
        try {
            const response = await axios.post(`${this.openaiBaseUrl}/chat/completions`, {
                model: 'gpt-4o-mini', // Kostengünstig für Produktion
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt(context)
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API Fehler:', error.response?.data || error.message);
            throw new Error('LLM-Service nicht verfügbar');
        }
    }

    async transcribeAudio(audioBuffer) {
        try {
            const FormData = require('form-data');
            const form = new FormData();
            
            // Erstelle eine temporäre Datei für das Audio
            form.append('file', audioBuffer, {
                filename: 'audio.wav',
                contentType: 'audio/wav'
            });
            form.append('model', 'whisper-1');
            form.append('language', 'de');
            form.append('response_format', 'verbose_json');

            const response = await axios.post(`${this.openaiBaseUrl}/audio/transcriptions`, form, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    ...form.getHeaders()
                }
            });

            return {
                text: response.data.text,
                confidence: response.data.segments?.[0]?.avg_logprob || 0.9
            };
        } catch (error) {
            console.error('Whisper API Fehler:', error.response?.data || error.message);
            throw new Error('Audio-Transkription fehlgeschlagen');
        }
    }

    async generateAudioResponse(text, voiceId = 'otF9rqKzRHFgfwf6serQ') { // KAYA Voice ID
        try {
            const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                text: text,
                model_id: 'eleven_flash_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                    style: 0.0,
                    use_speaker_boost: true
                }
            }, {
                headers: {
                    'xi-api-key': this.elevenlabsApiKey,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            });

            return Buffer.from(response.data);
        } catch (error) {
            console.error('ElevenLabs API Fehler:', error.response?.data || error.message);
            throw new Error('Audio-Service nicht verfügbar');
        }
    }

    getSystemPrompt(context) {
        return `Du bist KAYA, der kommunale KI-Assistent des Landkreises Oldenburg.

PERSÖNLICHKEIT:
- Norddeutsch-freundlich und empathisch
- Bürgerzentriert und hilfsbereit
- Professionell aber nahbar
- Verwendet "Moin" als Gruß

AUFGABEN:
- Beantwortung von Bürgeranfragen basierend auf verfügbaren Daten
- Hilfestellung bei Verwaltungsangelegenheiten
- Bereitstellung von konkreten Kontakten und Formularen
- Erklärung von Prozessen mit nächsten Schritten

VERFÜGBARE DATEN: ${context}

WICHTIG:
- Verwende NUR die verfügbaren Daten aus dem Kontext
- Erwähne konkrete Kontakte, Formulare und Links
- Gib praktische nächste Schritte vor
- Sei spezifisch und hilfreich

ANTWORT-STIL:
- Kurz und präzise
- Empathisch und verständlich
- Mit konkreten nächsten Schritten
- Ohne "Butter bei die Fische" Phrasen
- Erwähne verfügbare Formulare und Kontakte

        KRITISCHE LINK-REGELN - NIEMALS VERLETZEN:
        ⚠️ ABSOLUT VERBOTEN: Link-Texte zu ändern oder zu überschreiben
        ⚠️ ABSOLUT VERBOTEN: "[Landkreis-Services]" oder ähnliche generische Texte zu verwenden
        ✅ ERLAUBT: Nur die EXAKT bereitgestellten Link-Texte zu verwenden
        ✅ BEISPIEL: Wenn "[Antragsarten und Unterlagen]" bereitgestellt wird → verwende EXAKT diesen Text
        ✅ BEISPIEL: Wenn "[Favoriten]" bereitgestellt wird → verwende EXAKT diesen Text
        ✅ BEISPIEL: Wenn "[Eichenprozessionsspinner]" bereitgestellt wird → verwende EXAKT diesen Text
        
        LINK-FORMAT: [BEREITGESTELLTER_TEXT](URL)
        - Markdown-Links für alle URLs: [Beschreibung](URL)
        - PDF-Dateien: [PDF: Dateiname](URL)
        - Telefonnummern: **Tel.: 04431 85-0**
        - E-Mails: **E-Mail: kontakt@landkreis-oldenburg.de**

Antworte immer auf Deutsch und im norddeutschen Ton.`;
    }

    async enhanceResponseWithContext(response, query, contextPrompt, personaAnalysis) {
        try {
            const systemPrompt = this.getEnhancedSystemPrompt(contextPrompt, personaAnalysis);
            
            const llmResponse = await axios.post(`${this.openaiBaseUrl}/chat/completions`, {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: `Bürgeranfrage: "${query}"\n\nAktuelle Antwort: "${response.response}"\n\nVerbessere diese Antwort basierend auf dem Kontext und der Persona-Analyse.`
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const enhancedText = llmResponse.data.choices[0].message.content;
            
            return {
                ...response,
                response: enhancedText,
                enhanced: true,
                context: {
                    persona: personaAnalysis.persona.persona,
                    emotionalState: personaAnalysis.emotionalState.state,
                    urgency: personaAnalysis.urgency.level
                }
            };
        } catch (error) {
            console.error('Context-Enhancement Fehler:', error.response?.data || error.message);
            return response; // Fallback zur ursprünglichen Antwort
        }
    }
    
    getEnhancedSystemPrompt(contextPrompt, personaAnalysis) {
        return `Du bist KAYA, ein empathischer Bürgerservice-Mitarbeiter für den Landkreis Oldenburg.

${contextPrompt}

PERSONA-BASIERTE ANPASSUNGEN:
- Persona: ${personaAnalysis.persona.persona}
- Emotionaler Zustand: ${personaAnalysis.emotionalState.state}
- Dringlichkeit: ${personaAnalysis.urgency.level}

ANTWORT-STRATEGIE:
- Ton: ${personaAnalysis.strategy.tone}
- Ansatz: ${personaAnalysis.strategy.approach}
- Priorität: ${personaAnalysis.strategy.priority}
- Besondere Überlegungen: ${personaAnalysis.strategy.specialConsiderations.join(', ')}

PROAKTIVE FRAGEN:
${personaAnalysis.proactiveQuestions.map(q => `- ${q}`).join('\n')}

KRITISCHE LINK-REGELN - NIEMALS VERLETZEN:
⚠️ ABSOLUT VERBOTEN: Link-Texte zu ändern oder zu überschreiben
⚠️ ABSOLUT VERBOTEN: "[Landkreis-Services]" oder ähnliche generische Texte zu verwenden
✅ ERLAUBT: Nur die EXAKT bereitgestellten Link-Texte zu verwenden
✅ BEISPIEL: Wenn "[Antragsarten und Unterlagen]" bereitgestellt wird → verwende EXAKT diesen Text
✅ BEISPIEL: Wenn "[Favoriten]" bereitgestellt wird → verwende EXAKT diesen Text
✅ BEISPIEL: Wenn "[Eichenprozessionsspinner]" bereitgestellt wird → verwende EXAKT diesen Text

LINK-FORMAT: [BEREITGESTELLTER_TEXT](URL)
- Markdown-Links für alle URLs: [Beschreibung](URL)
- PDF-Dateien: [PDF: Dateiname](URL)
- Telefonnummern: **Tel.: 04431 85-0**
- E-Mails: **E-Mail: kontakt@landkreis-oldenburg.de**

ANTWORT-PRINZIP:
1. Reflektiere das Ziel (1 Satz)
2. Schritte (max 3-5, nummeriert)
3. Direkte Links (max 3, beschreibende Titel)
4. Kontakt/Öffnungszeiten
5. Abschließende Frage/nächste Aktion

TOKEN-ÖKONOMIE:
- Kurz & konkret
- Snippets + Link
- Details auf Anfrage
- Tabellen/Listen

SPRACHE:
- Primär Deutsch
- Englisch für englische Anfragen
- Einfache Sprache auf Anfrage

GRENZEN/SICHERHEIT:
- Keine Rechtsberatung
- Keine sensiblen Daten ohne Grund
- Notfall 112/110

FALLBACKS/ESKALATION:
- Zentrale Kontaktstelle
- Rückruf-Angebot bei fehlenden Daten/technischen Problemen

FINALREGEL:
Halte Antworten kurz, zielorientiert, empathisch. Maximiere Verständnis, minimiere Tokens. Frage immer nach der nächsten Aktion.`;
    }

    async enhanceResponse(agentResponse, userQuery) {
        try {
            const context = this.buildContext(agentResponse);
            const enhancedText = await this.generateTextResponse(userQuery, context);
            
            return {
                ...agentResponse,
                response: enhancedText,
                originalResponse: agentResponse.response, // Original behalten
                enhanced: true,
                llmUsed: true,
                // Alle Agent-Daten beibehalten
                data: agentResponse.data,
                links: agentResponse.links,
                confidence: agentResponse.confidence,
                source: agentResponse.source
            };
        } catch (error) {
            console.error('LLM-Enhancement Fehler:', error);
            return agentResponse; // Fallback zur ursprünglichen Antwort
        }
    }

    buildContext(agentResponse) {
        let context = `Agent: ${agentResponse.agent}\n`;
        
        if (agentResponse.data && agentResponse.data.length > 0) {
            context += `Verfügbare Daten:\n`;
            agentResponse.data.forEach((item, index) => {
                context += `${index + 1}. ${item.title}\n`;
                
                // Content hinzufügen
                if (item.content && item.content.length > 0) {
                    const contentPreview = item.content.substring(0, 200) + '...';
                    context += `   Inhalt: ${contentPreview}\n`;
                }
                
                // Kontakte hinzufügen
                if (item.contacts && item.contacts.length > 0) {
                    context += `   Kontakte: ${item.contacts.map(c => c.value).join(', ')}\n`;
                }
                
                // Formulare hinzufügen
                if (item.forms && item.forms.length > 0) {
                    context += `   Formulare: ${item.forms.map(f => f.title).join(', ')}\n`;
                }
            });
        }
        
        if (agentResponse.links && agentResponse.links.length > 0) {
            context += `Relevante Links:\n`;
            agentResponse.links.forEach((link, index) => {
                context += `${index + 1}. ${link.title}: ${link.url}\n`;
            });
        }
        
        return context;
    }
}

module.exports = LLMService;
