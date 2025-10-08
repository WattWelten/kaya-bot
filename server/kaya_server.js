const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const KAYACharacterHandler = require('./kaya_character_handler');
const KAYAAgentHandler = require('./kaya_agent_handler');
const VoiceService = require('./voice_service');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// KAYA-Handler initialisieren
const kayaHandler = new KAYACharacterHandler();

// Voice-Service initialisieren
const voiceService = new VoiceService(server);

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
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log(`KAYA empfängt: ${message}`);
        
        // Generiere KAYA-Antwort
        const response = await kayaHandler.generateResponse(message, message);
        
        console.log(`KAYA antwortet: ${response.response}`);
        
        res.json(response);
        
    } catch (error) {
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

// Server starten
server.listen(PORT, () => {
    console.log(`🚀 KAYA-Bot läuft auf Port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/health`);
    console.log(`💬 Chat: http://localhost:${PORT}/chat`);
    console.log(`🎯 Routing: http://localhost:${PORT}/route`);
    console.log(`🎤 Voice: ws://localhost:${PORT}/voice`);
    console.log(`🤖 LLM: ${process.env.USE_LLM === 'true' ? 'Aktiviert' : 'Deaktiviert'}`);
    console.log();
    console.log('Moin! KAYA ist bereit für Bürgeranliegen! 🤖');
});

module.exports = app;
