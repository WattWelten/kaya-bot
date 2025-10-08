const axios = require('axios');

class LLMService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
        this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    }

    async generateTextResponse(prompt, context = '') {
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

    async generateAudioResponse(text, voiceId = 'otF9rqKzRHFgfwf6serQ') {
        try {
            const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                text: text,
                model_id: 'eleven_multilingual_v2',
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

Antworte immer auf Deutsch und im norddeutschen Ton.`;
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
