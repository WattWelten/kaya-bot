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
const KAYAWebSocketService = require('./kaya_websocket_service_v2');

const app = express();
const PORT = process.env.PORT || 3001;

// WebSocketService wird später nach HTTP-Server-Erstellung initialisiert
let websocketService = null;

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
// Static files are now served by kaya-frontend service
// app.use(express.static(path.join(__dirname, '../kaya-frontend')));

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
        
        // Bestimme zuständigen Agent (v2, lazy init)
        // Verwende CharacterHandler v2 Keyword-Routing (robust, ohne zusätzliche Analysen)
        const routing = kayaHandler.routeToSystemPromptAgent('general', message, {});
        const agent = routing.agent;
        
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
app.get('/agent/:agentName', async (req, res) => {
    try {
        const { agentName } = req.params;
        const agentHandler = kayaHandler.getAgentHandler();
        const data = await agentHandler.getAgentData(agentName);
        const items = Array.isArray(data) ? data : [];
        
        res.json({
            agent: agentName,
            data: items,
            count: items.length
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
        
        // 2. Session-ID aus Request
        const sessionId = req.body.sessionId || req.session?.id || 'default';
        
        // 3. KAYA Response generieren
        const response = await kayaHandler.generateResponse(text, text, sessionId);
        
        console.log(`✅ KAYA Antwort: "${response.response.substring(0, 50)}..."`);
        
        // 4. Text-to-Speech (ElevenLabs)
        let audioUrl = null;
        let visemeTimeline = null;
        try {
            const ttsResult = await audioService.textToSpeech(response.response);
            audioUrl = ttsResult.audioUrl;
            visemeTimeline = ttsResult.visemeTimeline;
            console.log('✅ TTS erfolgreich');
        } catch (ttsError) {
            console.error('⚠️ TTS fehlgeschlagen (Fallback):', ttsError.message);
            // Fallback: Kein Audio, nur Text
        }
        
        // 5. WebSocket Events senden (Emotion + VisemeTimeline)
        try {
            if (response.emotion && response.emotionConfidence) {
                websocketService.sendToSession(sessionId, {
                    type: 'emotion',
                    data: {
                        emotion: response.emotion,
                        confidence: response.emotionConfidence,
                        timestamp: new Date().toISOString()
                    }
                });
                console.log(`😊 Emotion gesendet: ${response.emotion} (${response.emotionConfidence}%)`);
            }
            
            if (visemeTimeline && visemeTimeline.length > 0) {
                websocketService.sendToSession(sessionId, {
                    type: 'visemeTimeline',
                    data: {
                        timeline: visemeTimeline,
                        timestamp: new Date().toISOString()
                    }
                });
                console.log(`🎭 Viseme-Timeline gesendet: ${visemeTimeline.length} Segmente`);
            }
        } catch (wsError) {
            console.warn('⚠️ WebSocket Event fehlgeschlagen:', wsError.message);
            // Nicht kritisch - Fallback zu HTTP-only
        }
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/api/audio-chat', responseTime, true);
        
        res.json({
            transcription: text,
            response: response.response,
            audioUrl: audioUrl,
            emotion: response.emotion,
            emotionConfidence: response.emotionConfidence,
            visemeTimeline: visemeTimeline,
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

// Text-Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { message, sessionId } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Nachricht erforderlich' });
        }
        
        console.log(`💬 Text-Chat Request: "${message}"`);
        
        // KAYA Response generieren
        const response = await kayaHandler.generateResponse(message, message, sessionId || 'default');
        
        console.log(`✅ KAYA Antwort: "${response.response.substring(0, 50)}..."`);
        
        // WebSocket Events senden (Emotion)
        try {
            if (response.emotion && response.emotionConfidence) {
                websocketService.sendToSession(sessionId, {
                    type: 'emotion',
                    data: {
                        emotion: response.emotion,
                        confidence: response.emotionConfidence,
                        timestamp: new Date().toISOString()
                    }
                });
                console.log(`😊 Emotion gesendet: ${response.emotion} (${response.emotionConfidence}%)`);
            }
        } catch (wsError) {
            console.warn('⚠️ WebSocket Event fehlgeschlagen:', wsError.message);
        }
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/api/chat', responseTime, true);
        
        res.json({
            response: response.response,
            metadata: {
                latency: responseTime
            }
        });
        
    } catch (error) {
        console.error('❌ Text-Chat Fehler:', error);
        errorLogger.logError(error, { endpoint: '/api/chat' });
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/api/chat', responseTime, false, error);
        
        res.status(500).json({ 
            error: 'Chat fehlgeschlagen',
            details: error.message 
        });
    }
});

// KAYA-Info-Endpoint
app.get('/kaya/info', (req, res) => {
    res.json({
        name: 'KAYA',
        pronunciation: 'Kaja',
        role: `Kommunaler KI-Assistent für ${getKommuneConfig().getKommuneName()}`,
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

// DSGVO: Session-Löschung (Recht auf Löschung)
app.delete('/api/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({ 
                error: 'Session-ID erforderlich',
                message: 'Bitte geben Sie eine gültige Session-ID an'
            });
        }
        
        // Verwende ContextMemory für Session-Löschung
        const ContextMemory = require('./context_memory');
        const contextMemory = kayaHandler.contextMemory; // Zugriff über Handler
        
        const result = contextMemory.deleteSession(sessionId);
        
        if (result.success) {
            console.log(`✅ DSGVO-Löschung erfolgreich: Session ${sessionId}`);
            res.json({
                success: true,
                message: 'Ihre Daten wurden vollständig gelöscht (DSGVO-konform)',
                sessionId: sessionId,
                deleted: true
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message || 'Session nicht gefunden',
                sessionId: sessionId
            });
        }
        
    } catch (error) {
        console.error('❌ Fehler bei Session-Löschung:', error);
        errorLogger.logError(error, { endpoint: '/api/session/:sessionId' });
        
        res.status(500).json({ 
            error: 'Fehler beim Löschen der Session',
            details: error.message 
        });
    }
});

// DSGVO: Session-Status abfragen
app.get('/api/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session-ID erforderlich' });
        }
        
        const ContextMemory = require('./context_memory');
        const contextMemory = kayaHandler.contextMemory;
        
        const session = contextMemory.getSession(sessionId);
        
        if (session && session.id) {
            // Berechne Alter der Session
            const createdAt = new Date(session.createdAt);
            const now = new Date();
            const ageDays = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000));
            const maxAgeDays = 30; // DSGVO: 30 Tage
            const remainingDays = maxAgeDays - ageDays;
            
            res.json({
                sessionId: session.id,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                ageDays: ageDays,
                remainingDays: remainingDays > 0 ? remainingDays : 0,
                willBeDeleted: remainingDays <= 0,
                messageCount: session.messages ? session.messages.length : 0,
                hasUserData: !!(session.context && session.context.userData && Object.keys(session.context.userData).length > 0)
            });
        } else {
            res.status(404).json({
                error: 'Session nicht gefunden',
                sessionId: sessionId
            });
        }
        
    } catch (error) {
        console.error('❌ Fehler bei Session-Status:', error);
        errorLogger.logError(error, { endpoint: '/api/session/:sessionId (GET)' });
        
        res.status(500).json({ 
            error: 'Fehler beim Abrufen der Session-Informationen',
            details: error.message 
        });
    }
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

// Prometheus Metrics Endpoint (für Monitoring)
app.get('/metrics', (req, res) => {
    try {
        // Einfache Metrics im Prometheus-Format
        const metrics = [];
        
        // Request Count (vereinfacht - sollte aus Monitoring Service kommen)
        metrics.push(`# HELP http_requests_total Total number of HTTP requests`);
        metrics.push(`# TYPE http_requests_total counter`);
        metrics.push(`http_requests_total 0`);
        
        // Error Count
        metrics.push(`# HELP http_errors_total Total number of HTTP errors`);
        metrics.push(`# TYPE http_errors_total counter`);
        metrics.push(`http_errors_total 0`);
        
        // Active Connections
        if (websocketService) {
            const wsMetrics = websocketService.getMetrics();
            metrics.push(`# HELP websocket_connections_active Active WebSocket connections`);
            metrics.push(`# TYPE websocket_connections_active gauge`);
            metrics.push(`websocket_connections_active ${wsMetrics.activeConnections || 0}`);
            
            metrics.push(`# HELP websocket_messages_total Total WebSocket messages`);
            metrics.push(`# TYPE websocket_messages_total counter`);
            metrics.push(`websocket_messages_total ${wsMetrics.totalMessages || 0}`);
        }
        
        // Memory Usage
        const memUsage = process.memoryUsage();
        metrics.push(`# HELP process_memory_heap_used_bytes Heap memory used in bytes`);
        metrics.push(`# TYPE process_memory_heap_used_bytes gauge`);
        metrics.push(`process_memory_heap_used_bytes ${memUsage.heapUsed}`);
        
        metrics.push(`# HELP process_memory_heap_total_bytes Total heap memory in bytes`);
        metrics.push(`# TYPE process_memory_heap_total_bytes gauge`);
        metrics.push(`process_memory_heap_total_bytes ${memUsage.heapTotal}`);
        
        metrics.push(`# HELP process_memory_rss_bytes Resident set size in bytes`);
        metrics.push(`# TYPE process_memory_rss_bytes gauge`);
        metrics.push(`process_memory_rss_bytes ${memUsage.rss}`);
        
        // CPU Usage (vereinfacht)
        const cpuUsage = process.cpuUsage();
        metrics.push(`# HELP process_cpu_user_seconds_total Total user CPU time in seconds`);
        metrics.push(`# TYPE process_cpu_user_seconds_total counter`);
        metrics.push(`process_cpu_user_seconds_total ${(cpuUsage.user / 1000000).toFixed(6)}`);
        
        res.setHeader('Content-Type', 'text/plain');
        res.send(metrics.join('\n') + '\n');
        
    } catch (error) {
        console.error('Metrics Endpoint Fehler:', error);
        res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
});

// Frontend bereitstellen
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// HTTP Server erstellen
const server = http.createServer(app);

// WebSocketService initialisieren (Ersetzt den alten WebSocket-Server)
websocketService = new KAYAWebSocketService(server);
console.log('✅ WebSocketService initialisiert');

// Server starten
server.listen(PORT, () => {
    console.log(`🚀 KAYA-Bot läuft auf Port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/health`);
    console.log(`💬 Chat: http://localhost:${PORT}/api/chat`);
    console.log(`🎤 Audio-Chat: http://localhost:${PORT}/api/audio-chat`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    console.log();
    console.log('Moin! KAYA ist bereit für Bürgeranliegen! 🤖');
});

module.exports = app;
