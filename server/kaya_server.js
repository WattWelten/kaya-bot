require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const KAYACharacterHandler = require('./kaya_character_handler_v2');
const KAYAAgentHandler = require('./kaya_agent_manager_v2');
const errorLogger = require('./utils/error_logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

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
        
        res.json(response);
        
    } catch (error) {
        errorLogger.logError(error, { endpoint: '/chat', body: req.body });
        
        const responseTime = Date.now() - startTime;
        errorLogger.logPerformance('/chat', responseTime, false, error);
        
        console.error('Chat-Fehler:', error);
        res.status(500).json({ error: 'Internal server error' });
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

// Frontend bereitstellen
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// HTTP Server erstellen
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ server, path: '/ws' });

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
