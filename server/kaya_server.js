require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const KAYACharacterHandler = require('./kaya_character_handler_v2');
const KAYAAgentHandler = require('./kaya_agent_manager_v2');
const errorLogger = require('./utils/error_logger');
const audioService = require('./services/audio_service');
const rateLimiter = require('./services/rate_limiter');
const costTracker = require('./services/cost_tracker');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(compression({
  level: 6, // Kompressions-Level (1-9, 6 = gute Balance)
  threshold: 1024, // Nur Dateien >1KB komprimieren
  filter: (req, res) => {
    // Komprimiere alle Responses außer SSE-Streams
    if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Multer für Audio-Upload
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// KAYA-Handler initialisieren
const kayaHandler = new KAYACharacterHandler();

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'KAYA-Bot',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Chat-Endpoint
app.post('/chat', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log(`KAYA empfängt: ${message}`);
        
        // Generiere KAYA-Antwort
        const response = await kayaHandler.generateResponse(message, message);
        
        console.log(`KAYA antwortet: ${response.response}`);
        
        // Performance loggen
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/chat', responseTime, true);
        errorLogger.logRequest(req, res, responseTime);
        
        // Metadata entfernen (wird nicht an Frontend gesendet)
        const cleanResponse = {
            response: response.response,
            agent: response.agent,
            cached: response.cached
        };
        
        res.json(cleanResponse);
        
    } catch (error) {
        errorLogger.logError(error, { endpoint: '/chat', body: req.body });
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/chat', responseTime, false, error);
        
        console.error('Chat-Fehler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Streaming Chat-Endpoint (Server-Sent Events)
app.get('/chat/stream', async (req, res) => {
    const startTime = Date.now();
    
    // SSE-Headers setzen
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering
    
    try {
        const query = req.query.q || '';
        
        if (!query) {
            res.write('data: {"error": "Query parameter required"}\n\n');
            return res.end();
        }
        
        console.log(`🌊 SSE Request für Query: ${query.substring(0, 50)}`);
        
        // Kontext erstellen (vereinfacht für Streaming)
        const context = {
            conversationHistory: [],
            persona: { persona: 'general' },
            emotionalState: { state: 'neutral' },
            urgency: { level: 'normal' },
            language: 'german',
            userData: {},
            isFirstMessage: true
        };
        
        // OpenAI Stream abrufen
        const stream = await kayaHandler.getLLMService().generateResponseStream(query, context);
        
        let fullText = '';
        let buffer = '';
        
        // Stream verarbeiten
        stream.on('data', (chunk) => {
            try {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Letzte unvollständige Zeile behalten
                
                for (const line of lines) {
                    if (line.trim() === '' || line === 'data: [DONE]') {
                        continue;
                    }
                    
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            
                            if (data.choices && data.choices[0].delta.content) {
                                const content = data.choices[0].delta.content;
                                fullText += content;
                                
                                // An Client senden
                                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                            }
                            
                            if (data.choices && data.choices[0].finish_reason) {
                                // Streaming beendet
                                res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
                            }
                        } catch (parseError) {
                            // Ignoriere JSON-Parse-Fehler
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Stream-Verarbeitungsfehler:', error);
            }
        });
        
        stream.on('end', () => {
            const responseTime = Date.now() - startTime;
            console.log(`✅ Streaming abgeschlossen in ${responseTime}ms`);
            errorLogger.logPerformance('/chat/stream', responseTime, true);
            res.end();
        });
        
        stream.on('error', (error) => {
            console.error('❌ Stream-Fehler:', error);
            errorLogger.logError(error, { endpoint: '/chat/stream' });
            
            const responseTime = Date.now() - startTime;
            errorLogger.logPerformance('/chat/stream', responseTime, false, error);
            
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        });
        
        // Client-Verbindung getrennt → Stream schließen
        req.on('close', () => {
            stream.destroy();
            res.end();
        });
        
    } catch (error) {
        console.error('❌ SSE-Endpoint Fehler:', error);
        errorLogger.logError(error, { endpoint: '/chat/stream' });
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/chat/stream', responseTime, false, error);
        
        res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
        res.end();
    }
});

// Agent-Routing-Endpoint
app.post('/route', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Bestimme zuständigen Agent
        const agent = kayaHandler.agentHandler.routeToAgent(message);
        
        res.json({
            agent: agent,
            message: message,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Routing-Fehler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Agent-Daten-Endpoint
app.get('/agent/:agentName', (req, res) => {
    try {
        const { agentName } = req.params;
        const data = kayaHandler.agentHandler.getAgentData(agentName);
        
        res.json({
            agent: agentName,
            data: data,
            count: data.length
        });
        
    } catch (error) {
        console.error('Agent-Daten-Fehler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Audio-Chat-Endpoint
app.post('/api/audio-chat', upload.single('audio'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: 'Audio-Datei erforderlich' });
        }
        
        const audioBuffer = req.file.buffer;
        console.log(`🎤 Audio-Chat Request empfangen (${audioBuffer.length} Bytes)`);
        
        // 1. Speech-to-Text (Whisper)
        const { text, success } = await audioService.speechToText(audioBuffer);
        
        if (!success) {
            throw new Error('STT fehlgeschlagen');
        }
        
        console.log(`✅ Transkription: "${text}"`);
        
        // 2. KAYA Response generieren
        const response = await kayaHandler.generateResponse(text, text);
        
        console.log(`✅ KAYA Antwort: "${response.response.substring(0, 50)}..."`);
        
        // 3. Text-to-Speech (ElevenLabs)
        let audioUrl = null;
        try {
            const ttsResult = await audioService.textToSpeech(response.response);
            audioUrl = ttsResult.audioUrl;
            console.log('✅ TTS erfolgreich');
        } catch (ttsError) {
            console.error('⚠️ TTS fehlgeschlagen (Fallback):', ttsError.message);
            // Fallback: Kein Audio, nur Text
        }
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/api/audio-chat', responseTime, true);
        
        res.json({
            transcription: text,
            response: response.response,
            audioUrl: audioUrl,
            metadata: {
                latency: responseTime,
                hasAudio: !!audioUrl
            }
        });
        
    } catch (error) {
        console.error('❌ Audio-Chat Fehler:', error);
        errorLogger.logError(error, { endpoint: '/api/audio-chat' });
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/api/audio-chat', responseTime, false, error);
        
        res.status(500).json({ 
            error: 'Audio-Chat fehlgeschlagen',
            details: error.message 
        });
    }
});

// KAYA-Info-Endpoint
app.get('/kaya/info', (req, res) => {
    res.json({
        name: 'KAYA',
        pronunciation: 'Kaja',
        role: 'Kommunaler KI-Assistent für Landkreis Oldenburg',
        greeting: 'Moin! Ich bin KAYA',
        features: [
            'Norddeutsch-freundlich',
            'Agenten-System',
            'Voice + Chat',
            'DSGVO-konform',
            'Barrierefrei'
        ],
        agents: [
            'buergerdienste',
            'ratsinfo', 
            'stellenportal',
            'kontakte',
            'jobcenter',
            'schule',
            'jugend',
            'soziales'
        ]
    });
});

// Audio Endpoints
// STT: Audio → Text
app.post('/api/stt', rateLimiter.getSTTLimiter(), upload.single('audio'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file is required' });
        }
        
        // Budget prüfen
        const budgetStatus = costTracker.checkBudget();
        if (budgetStatus.blocked) {
            return res.status(429).json({ error: 'Budget exceeded', message: budgetStatus.message });
        }
        
        console.log(`🎤 STT Request: ${req.file.size} bytes`);
        
        // Whisper STT aufrufen
        const result = await audioService.speechToText(req.file.buffer);
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/api/stt', responseTime, true);
        
        res.json({
            success: true,
            text: result.text,
            language: result.language,
            latency: result.latency
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        errorLogger.logError(error, { endpoint: '/api/stt' });
        errorLogger.logPerformance('/api/stt', responseTime, false, error);
        
        console.error('STT Fehler:', error);
        res.status(500).json({ error: 'STT failed', message: error.message });
    }
});

// TTS: Text → Audio
app.post('/api/tts', rateLimiter.getTTSLimiter(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { text, voiceId } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        // Budget prüfen
        const budgetStatus = costTracker.checkBudget();
        if (budgetStatus.blocked) {
            return res.status(429).json({ error: 'Budget exceeded', message: budgetStatus.message });
        }
        
        console.log(`🔊 TTS Request: "${text.substring(0, 50)}..."`);
        
        // ElevenLabs TTS aufrufen
        const result = await audioService.textToSpeech(text, voiceId);
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/api/tts', responseTime, true);
        
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(result.audio);
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        errorLogger.logError(error, { endpoint: '/api/tts', body: req.body });
        errorLogger.logPerformance('/api/tts', responseTime, false, error);
        
        console.error('TTS Fehler:', error);
        res.status(500).json({ error: 'TTS failed', message: error.message });
    }
});

// Audio Chat: Kompletter Flow (Audio → KAYA → Audio)
app.post('/api/audio-chat', rateLimiter.getChatLimiter(), upload.single('audio'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file is required' });
        }
        
        // Budget prüfen
        const budgetStatus = costTracker.checkBudget();
        if (budgetStatus.blocked) {
            return res.status(429).json({ error: 'Budget exceeded', message: budgetStatus.message });
        }
        
        console.log(`🎙️ Audio Chat Request: ${req.file.size} bytes`);
        
        // 1. STT: Audio → Text
        const { text } = await audioService.speechToText(req.file.buffer);
        
        // 2. KAYA Response generieren
        const kayaResponse = await kayaHandler.generateResponse(text, text);
        
        // 3. TTS: Text → Audio
        const { audio, audioUrl } = await audioService.textToSpeech(kayaResponse.response);
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/api/audio-chat', responseTime, true);
        
        res.json({
            success: true,
            transcription: text,
            response: kayaResponse.response,
            audioUrl: audioUrl,
            latency: {
                total: Date.now() - startTime,
                stt: Date.now() - startTime, // wird von audioService gesetzt
                tts: Date.now() - startTime
            }
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        errorLogger.logError(error, { endpoint: '/api/audio-chat' });
        errorLogger.logPerformance('/api/audio-chat', responseTime, false, error);
        
        console.error('Audio Chat Fehler:', error);
        res.status(500).json({ error: 'Audio chat failed', message: error.message });
    }
});

// Admin Dashboard: Kosten & Stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const stats = costTracker.getStats();
        const audioMetrics = audioService.getMetrics();
        
        res.json({
            costs: stats,
            audio: audioMetrics,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Admin Stats Fehler:', error);
        res.status(500).json({ error: 'Failed to retrieve stats' });
    }
});

// Frontend bereitstellen
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// HTTP Server erstellen
const server = http.createServer(app);

// WebSocket Server - OPTIMIERT
const wss = new WebSocket.Server({ 
    server, 
    path: '/ws',
    perMessageDeflate: true, // Kompression aktivieren
    clientTracking: true, // Client-Tracking für Monitoring
    maxPayload: 100 * 1024, // 100KB max
    keepalive: true,
    keepaliveInterval: 30000 // 30 Sekunden
});

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId') || 'default';
    
    console.log(`🔌 WebSocket Client verbunden (Session: ${sessionId})`);
    
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'message' && message.data.message) {
                // KAYA-Antwort generieren
                const response = await kayaHandler.generateResponse(
                    message.data.message, 
                    message.data.message,
                    message.sessionId || sessionId
                );
                
                // Response an Client senden
                ws.send(JSON.stringify({
                    type: 'response',
                    data: response,
                    timestamp: new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('❌ WebSocket Fehler:', error);
            ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Fehler beim Verarbeiten der Nachricht' },
                timestamp: new Date().toISOString()
            }));
        }
    });
    
    ws.on('close', () => {
        console.log(`🔌 WebSocket Client getrennt (Session: ${sessionId})`);
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket Error:', error);
    });
    
    // Begrüßung senden
    ws.send(JSON.stringify({
        type: 'connected',
        data: { sessionId, message: 'Moin! KAYA ist bereit.' },
        timestamp: new Date().toISOString()
    }));
});

// Server starten
server.listen(PORT, () => {
    console.log(`🚀 KAYA-Bot läuft auf Port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/health`);
    console.log(`💬 Chat: http://localhost:${PORT}/chat`);
    console.log(`🎯 Routing: http://localhost:${PORT}/route`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    console.log();
    console.log('Moin! KAYA ist bereit für Bürgeranliegen! 🤖');
});

module.exports = app;
