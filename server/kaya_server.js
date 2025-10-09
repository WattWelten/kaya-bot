const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// API Keys setzen VOR dem Import
process.env.OPENAI_API_KEY = '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';
process.env.ELEVENLABS_API_KEY = 'sk_d6715146b252ecd47c10277d1889e94dc14122081087f7c4';
process.env.USE_LLM = 'true';

console.log('🔧 Umgebungsvariablen gesetzt:');
console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'VORHANDEN ✅' : 'FEHLT ❌');
console.log('  - ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? 'VORHANDEN ✅' : 'FEHLT ❌');
console.log('  - USE_LLM:', process.env.USE_LLM);

const KAYACharacterHandler = require('./kaya_character_handler');
// KAYAAgentHandler wird lazy geladen - nicht beim Start importieren
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

// Chat-Endpoint mit Session-Support
app.post('/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log(`KAYA empfängt: ${message}`);
        
        // Generiere KAYA-Antwort mit Session-ID
        const response = await kayaHandler.generateResponse(message, message, sessionId);
        
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
