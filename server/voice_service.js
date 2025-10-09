const WebSocket = require('ws');
const LLMService = require('./llm_service');

class VoiceService {
    constructor(server) {
        this.llmService = new LLMService();
        this.wss = new WebSocket.Server({ 
            server,
            path: '/voice'
        });
        
        this.setupWebSocketHandlers();
    }

    setupWebSocketHandlers() {
        this.wss.on('connection', (ws) => {
            console.log('🎤 Voice-Verbindung hergestellt');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleVoiceMessage(ws, message);
                } catch (error) {
                    console.error('Voice-Message Fehler:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Nachricht konnte nicht verarbeitet werden'
                    }));
                }
            });

            ws.on('close', () => {
                console.log('🎤 Voice-Verbindung geschlossen');
            });

            ws.on('error', (error) => {
                console.error('Voice-WebSocket Fehler:', error);
            });
        });
    }

    async handleVoiceMessage(ws, message) {
        switch (message.type) {
            case 'audio':
                await this.processAudioInput(ws, message.data);
                break;
            case 'text':
                await this.processTextInput(ws, message.text);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unbekannter Nachrichtentyp'
                }));
        }
    }

    async processAudioInput(ws, audioData) {
        try {
            console.log('🎤 Audio-zu-Text Konvertierung...');
            
            // Konvertiere Base64 zu Buffer
            const audioBuffer = Buffer.from(audioData, 'base64');
            
            // Verwende OpenAI Whisper für Audio-zu-Text
            const transcription = await this.llmService.transcribeAudio(audioBuffer);
            
            console.log(`🎤 Transkribiert: "${transcription.text}"`);
            
            ws.send(JSON.stringify({
                type: 'transcription',
                text: transcription.text,
                confidence: transcription.confidence || 0.9
            }));

            // Verarbeite die transkribierte Nachricht
            await this.processTextInput(ws, transcription.text);
            
        } catch (error) {
            console.error('Audio-Verarbeitung Fehler:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Audio konnte nicht verarbeitet werden'
            }));
        }
    }

    async processTextInput(ws, text) {
        try {
            // Generiere Text-Antwort mit LLM
            const textResponse = await this.llmService.generateTextResponse(text);
            
            ws.send(JSON.stringify({
                type: 'response',
                text: textResponse,
                timestamp: new Date().toISOString()
            }));

            // Generiere Audio-Antwort
            try {
                const audioBuffer = await this.llmService.generateAudioResponse(textResponse);
                
                ws.send(JSON.stringify({
                    type: 'audio',
                    data: audioBuffer.toString('base64'),
                    format: 'mp3',
                    timestamp: new Date().toISOString()
                }));
            } catch (audioError) {
                console.error('Audio-Generierung Fehler:', audioError);
                // Text-Antwort wurde bereits gesendet
            }
            
        } catch (error) {
            console.error('Text-Verarbeitung Fehler:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Antwort konnte nicht generiert werden'
            }));
        }
    }
}

module.exports = VoiceService;
