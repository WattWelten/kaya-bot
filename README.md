# KAYA - Kommunaler KI-Assistent für Landkreis Oldenburg

![KAYA Logo](https://img.shields.io/badge/KAYA-KI%20Assistent-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🤖 Über KAYA

KAYA ist der kommunale KI-Assistent des Landkreises Oldenburg, der Bürgerinnen und Bürgern bei Verwaltungsangelegenheiten hilft.

### ✨ Features

- **🎤 Voice & Chat:** Spracherkennung und Text-Chat
- **🧠 KI-gestützt:** OpenAI GPT-4o-mini Integration
- **🎯 Agenten-System:** Spezialisierte Bereiche (Bürgerdienste, Ratsinfo, etc.)
- **🔒 DSGVO-konform:** Datenschutz-konforme Verarbeitung
- **♿ Barrierefrei:** Inklusive Benutzeroberfläche
- **🌐 Norddeutsch:** Freundlicher, regionaler Ton

### 🏛️ Verfügbare Agenten

- **Bürgerdienste:** Formulare, Anträge, Dienstleistungen
- **Ratsinfo:** Kreistagssitzungen, Beschlüsse, Vorlagen
- **Stellenportal:** Stellenausschreibungen, Bewerbungen
- **Kontakte:** Ansprechpartner, Öffnungszeiten
- **Jugend:** Jugendamt, Familie, Kinderbetreuung
- **Soziales:** Sozialhilfe, Gesundheit, Beratung

## 🚀 Deployment auf Railway

### Voraussetzungen

- Node.js 18+
- Railway Account
- OpenAI API Key
- ElevenLabs API Key

### Environment Variables

```bash
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=otF9rqKzRHFgfwf6serQ
USE_LLM=true
NODE_ENV=production
PORT=3002
CORS_ORIGIN=https://kaya.wattweiser.com
```

### Lokale Entwicklung

```bash
# Dependencies installieren
cd server
npm install

# Server starten
npm start

# Frontend: http://localhost:3002
# API: http://localhost:3002/health
# Chat: http://localhost:3002/chat
```

### Railway Deployment

1. **Repository forken/klonen**
2. **Railway Account erstellen:** https://railway.app
3. **New Project** → **Deploy from GitHub repo**
4. **Environment Variables setzen**
5. **Custom Domain:** kaya.wattweiser.com

## 📁 Projektstruktur

```
Landkreis/
├── server/                 # Node.js Backend
│   ├── kaya_server.js     # Hauptserver
│   ├── kaya_character_handler.js
│   ├── kaya_agent_handler.js
│   ├── llm_service.js     # OpenAI Integration
│   └── voice_service.js   # WebSocket Voice
├── frontend/              # React Frontend
│   └── index.html
├── ki_backend/            # Crawler-Daten
│   └── 2025-10-08/       # Tägliche Exports
├── crawler/               # Python Web Crawler
└── railway.json          # Railway Konfiguration
```

## 🔧 API Endpoints

- `GET /health` - Health Check
- `POST /chat` - Chat-Interface
- `POST /route` - Agent-Routing
- `GET /agent/:name` - Agent-Daten
- `GET /kaya/info` - KAYA-Informationen
- `WS /voice` - Voice-WebSocket

## 📊 Monitoring

- **Health Check:** `/health`
- **Railway Dashboard:** Automatisches Monitoring
- **Logs:** Echtzeit-Logs im Railway Dashboard

## 🛡️ Sicherheit

- CORS-Konfiguration
- Input-Validation
- Rate-Limiting
- DSGVO-konforme Datenverarbeitung

## 📞 Support

Bei Fragen oder Problemen:
- **GitHub Issues:** Repository Issues
- **Railway Support:** Railway Dashboard
- **Landkreis Oldenburg:** Offizielle Kontakte

## 📄 Lizenz

MIT License - Siehe LICENSE Datei für Details.

---

**Entwickelt für den Landkreis Oldenburg** 🏛️



