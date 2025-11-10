# KAYA - Digitaler Assistent Landkreis Oldenburg

## 🎯 Projektübersicht

KAYA ist der digitale Assistent des Landkreises Oldenburg, der Bürgern bei Verwaltungsangelegenheiten hilft.

### Features
- **KI-gestützte Gespräche** mit natürlicher Sprache
- **Babylon.js-Avatar** mit Emotionen und Gesten
- **Mehrsprachigkeit** (Deutsch, Englisch, Türkisch, Arabisch, etc.)
- **Accessibility-First** (WCAG 2.1 AA/AAA)
- **Real-time Chat** über WebSocket
- **Audio-System** für Sprachinteraktion

## 🏗️ Architektur

### Backend (Node.js)
- **KAYA Character Handler** - Hauptlogik und Response-Generation
- **Session Manager** - Konversations-Management
- **WebSocket Service** - Real-time Kommunikation
- **Audio Service** - STT/TTS Integration
- **Agent Manager** - Spezialisierte Agenten
- **Performance Optimizer** - Caching und Optimierung

### Frontend (React + TypeScript)
- **React-Komponenten** - Modulare UI
- **Babylon.js 3D** - Avatar-Integration
- **WebSocket Client** - Backend-Kommunikation
- **Audio System** - Mikrofon und Lautsprecher
- **Accessibility** - Screen Reader, Keyboard Navigation

### Crawler (Node.js + Puppeteer)
- **Web-Crawler** - Automatische Datensammlung
- **Data Processor** - Inhaltsverarbeitung
- **Backup Manager** - Datensicherung

## 🚀 Schnellstart

```bash
# Repository klonen
git clone https://github.com/WattWelten/kaya-bot.git
cd kaya-bot

# Backend starten
cd kaya-api && npm install && npm start

# Frontend starten (neues Terminal)
cd kaya-frontend && npm install && npm run dev

# Crawler ausführen (optional)
cd kaya-crawler && npm install && npm run crawl
```

## 📊 Status

### Phase 1 ✅ Backend-Architektur
- KAYA Character Handler v2.0
- Session-Management
- WebSocket-Service
- Audio-Service
- Performance-Optimierung

### Phase 2 ✅ Frontend-Architektur
- React + TypeScript Setup
- Babylon.js 3D Integration
- WebSocket-Client
- Audio-System
- Accessibility-Features

### Phase 3 ✅ Integration & Deployment
- Backend-Frontend-Verbindung
- Babylon.js-Avatar-Integration
- Railway-Deployment
- Testing & Optimierung

### System-Status (Stand: 29.10.2025)
- **Production-Ready: 97%** ✅
- **Persona-Abdeckung: 100%** (37 Personas geroutet)
- **Crawler-Content-Qualität: 100%** (776 Einträge)
- **Link-Validierung: Automatisch integriert** ✅
- **17 Agenten aktiv** mit aktuellen Daten

📄 **Detaillierte System-Analyse:** [SYSTEM_ANALYSE_REPORT_UPDATE_2025-10-29.md](SYSTEM_ANALYSE_REPORT_UPDATE_2025-10-29.md)

## 🛠️ Technologie-Stack

### Backend
- **Node.js 18+**
- **Express.js**
- **WebSocket (ws)**
- **fs-extra**
- **Performance-Optimierung**

### Frontend
- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Lucide React**

### Crawler
- **Puppeteer**
- **fs-extra**
- **Data Compression**

## 🌐 Deployment

### Railway (Empfohlen)
- **Projekt**: "Landkreis Oldenburg" (ID: `266dd89d-9821-4f28-8ae5-66761eed2058`)
- **Backend Service**: `kaya-api` (Dockerfile: `kaya-api/Dockerfile`)
- **Frontend Service**: `kaya-frontend` (Dockerfile: `kaya-frontend/Dockerfile`)
- **GitHub Actions**: Automatisches Deployment bei Push auf `main`
- **Secrets**: `RAILWAY_TOKEN` und `RAILWAY_PROJECT_ID` in GitHub konfiguriert

### Docker
- **Backend**: `docker build -t kaya-api ./kaya-api`
- **Frontend**: `docker build -t kaya-frontend ./kaya-frontend`

## 🔧 Konfiguration

### Environment Variables
```bash
# Backend
NODE_ENV=production
PORT=3001

# Frontend
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

### Babylon.js-Integration
- 3D-Avatar-Modelle in `kaya-frontend/public/avatar/`
- Erforderliche Dateien: `*.glb` (GLTF Binary Format)
- Babylon.js lädt Modelle automatisch via `@babylonjs/loaders`
- GLB-Modelle von avaturn.me (Kayanew.glb, Kayanew-draco.glb, Kayanew_mouth.glb)

## 📈 Performance

### Backend
- **Response-Zeit**: < 200ms
- **Session-Cache**: Aktiviert
- **Memory-Optimierung**: Implementiert

### Frontend
- **Lighthouse Score**: 95+
- **Bundle Size**: < 500KB
- **First Paint**: < 1.5s

## ♿ Accessibility

### WCAG 2.1 AA/AAA
- **Keyboard Navigation** vollständig
- **Screen Reader** optimiert
- **High Contrast** Mode
- **Font Size** Anpassung
- **Simple Language** Toggle
- **Reduced Motion** Support

## 🌍 Mehrsprachigkeit

### Unterstützte Sprachen
- Deutsch (Standard)
- English
- Türkçe
- العربية
- Polski
- Русский
- Plattdeutsch

## 🧪 Testing

### Backend
```bash
cd kaya-api
node -e "const kaya = require('./kaya_character_handler_v2'); kaya.generateResponse('Test', 'user', 'session').then(r => console.log(r));"
```

### Frontend
```bash
cd kaya-frontend
npm run dev
# Browser: http://localhost:5173
```

## 📞 Support

- **Email**: kaya@landkreis-oldenburg.de
- **Telefon**: 04431 85-0
- **Website**: https://www.oldenburg-kreis.de

## 📁 Projektstruktur

```
kaya-bot/
├── kaya-api/              # Backend Service (Node.js + Express)
│   ├── Dockerfile
│   ├── kaya_server.js
│   └── package.json
├── kaya-frontend/         # Frontend Service (React + TypeScript)
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── kaya-crawler/          # Crawler Service (Node.js + Puppeteer)
│   ├── src/
│   └── package.json
├── docs/                  # Dokumentation
├── .github/workflows/     # GitHub Actions
│   ├── deploy-kaya-api.yml
│   └── deploy-kaya-frontend.yml
├── railway.toml           # Railway-Konfiguration
└── README.md
```

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

---

**KAYA v2.0.0** - Landkreis Oldenburg 2025