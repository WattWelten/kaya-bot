# KAYA Setup Guide - Landkreis Oldenburg

Vollständige Anleitung zum Einrichten des KAYA-Projekts auf einem neuen PC.

## 🚀 Schnellstart

### 1. Repository klonen
```bash
git clone https://github.com/WattWelten/kaya-bot.git
cd kaya-bot
```

### 2. Backend einrichten
```bash
cd server
npm install
npm start
```

### 3. Frontend einrichten
```bash
cd frontend
npm install
npm run dev
```

### 4. Crawler einrichten
```bash
cd crawler-v2
npm install
npm run crawl
```

## 📁 Projektstruktur

```
kaya-bot/
├── server/                 # Backend (Node.js + Express)
│   ├── kaya_character_handler_v2.js
│   ├── kaya_agent_manager_v2.js
│   ├── kaya_session_manager_v2.js
│   ├── kaya_websocket_service_v2.js
│   ├── kaya_audio_service_v2.js
│   ├── kaya_avatar_service_v2.js
│   ├── kaya_performance_optimizer_v2.js
│   ├── kaya_test_suite_v2.js
│   ├── context_memory.js
│   └── package.json
├── frontend/               # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/     # React-Komponenten
│   │   ├── hooks/         # Custom Hooks
│   │   ├── services/      # Service-Klassen
│   │   ├── types/         # TypeScript-Typen
│   │   ├── styles/        # CSS-Styles
│   │   └── pages/         # Seiten-Komponenten
│   ├── public/unity/kaya/ # Unity WebGL Build
│   └── package.json
├── crawler-v2/             # Web-Crawler
│   ├── scripts/
│   ├── src/
│   └── package.json
└── README.md
```

## 🛠️ Systemanforderungen

### Backend
- Node.js 18+
- npm 9+
- Port 3001 frei

### Frontend
- Node.js 18+
- npm 9+
- Port 3000 frei

### Crawler
- Node.js 18+
- npm 9+
- Puppeteer (automatisch installiert)

## 🔧 Detaillierte Installation

### Backend (Server)
```bash
cd server

# Dependencies installieren
npm install

# Server starten
npm start

# Server läuft auf http://localhost:3001
```

**Wichtige Dateien:**
- `kaya_character_handler_v2.js` - Hauptlogik für KAYA
- `context_memory.js` - Session-Management
- `package.json` - Dependencies und Scripts

### Frontend (React)
```bash
cd frontend

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Frontend läuft auf http://localhost:3000
```

**Wichtige Dateien:**
- `src/pages/KayaPage.tsx` - Hauptkomponente
- `src/components/` - React-Komponenten
- `src/services/` - WebSocket, Unity, Audio Services
- `src/hooks/` - Custom React Hooks

### Crawler
```bash
cd crawler-v2

# Dependencies installieren
npm install

# Crawler ausführen
npm run crawl

# Oder spezifische Domains crawlen
node scripts/complete_crawler.js
```

## 🌐 Railway Deployment

### Backend auf Railway
1. Railway CLI installieren: `npm install -g @railway/cli`
2. Login: `railway login`
3. Neues Projekt: `railway new --name kaya-backend`
4. Repository verbinden: `railway connect`
5. Root Directory: `server`
6. Deploy: `railway up`

### Frontend auf Railway
1. Neues Projekt: `railway new --name kaya-frontend`
2. Repository verbinden: `railway connect`
3. Root Directory: `frontend`
4. Environment Variables:
   - `VITE_API_URL=https://kaya-backend.railway.app`
   - `VITE_WS_URL=wss://kaya-backend.railway.app`
5. Deploy: `railway up`

## 🎮 Unity Integration

### Unity WebGL Build
1. Unity-Projekt öffnen
2. Build Settings → WebGL
3. Build in `frontend/public/unity/kaya/Build/`
4. Erforderliche Dateien:
   - `Build.loader.js`
   - `Build.framework.js`
   - `Build.data`
   - `Build.wasm`

### Avatar-Features
- Emotionen: `setEmotion(emotion, intensity)`
- Sprechen: `setSpeaking(isSpeaking)`
- Gesten: `playGesture(gesture)`
- Animationen: `playAnimation(animation)`

## 🔌 API-Endpunkte

### WebSocket
- **URL**: `ws://localhost:3001/ws`
- **Session**: `?sessionId=session_123`

### HTTP API
- **Health Check**: `GET /health`
- **Status**: `GET /status`

## 🧪 Testing

### Backend testen
```bash
cd server
node -e "
const kaya = require('./kaya_character_handler_v2');
kaya.generateResponse('Moin, ich brauche Hilfe bei der KFZ-Zulassung', 'user', 'test-session')
  .then(response => console.log('Response:', response.response.substring(0, 200)));
"
```

### Frontend testen
```bash
cd frontend
npm run dev
# Browser öffnen: http://localhost:3000
```

## 🐛 Troubleshooting

### Häufige Probleme

#### Backend startet nicht
```bash
# Port prüfen
netstat -an | findstr :3001

# Node.js Version prüfen
node --version

# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
```

#### Frontend Build-Fehler
```bash
# TypeScript-Fehler prüfen
npm run type-check

# Linting-Fehler prüfen
npm run lint

# Cache leeren
rm -rf node_modules package-lock.json
npm install
```

#### Unity lädt nicht
- Browser-Konsole prüfen
- WebGL-Support prüfen
- CORS-Einstellungen prüfen
- Unity-Build-Dateien prüfen

### Logs prüfen
```bash
# Backend-Logs
cd server
npm start

# Frontend-Logs
cd frontend
npm run dev
```

## 📊 Performance

### Backend-Optimierung
- Session-Cache aktiviert
- Response-Cache aktiviert
- Performance-Metriken verfügbar

### Frontend-Optimierung
- Lazy Loading für Unity
- Code Splitting aktiviert
- Bundle-Optimierung aktiviert

## 🔒 Sicherheit

### Environment Variables
```bash
# Backend
NODE_ENV=production
PORT=3001

# Frontend
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

### CORS-Konfiguration
- Backend: CORS für Frontend-Domain
- Frontend: CSP-Header konfiguriert

## 📞 Support

### Kontakt
- **Email**: kaya@landkreis-oldenburg.de
- **Telefon**: 04431 85-0
- **Website**: https://www.oldenburg-kreis.de

### Dokumentation
- **Backend**: `server/README.md`
- **Frontend**: `frontend/README.md`
- **Crawler**: `crawler-v2/README.md`

## 🗺️ Roadmap

### Phase 1 ✅ (Abgeschlossen)
- Backend-Architektur
- KAYA Character Handler
- Session-Management
- WebSocket-Service

### Phase 2 ✅ (Abgeschlossen)
- Frontend-Architektur
- React-Komponenten
- Unity-Integration
- Audio-System

### Phase 3 🔄 (Nächste Schritte)
- Unity-Avatar-Integration
- Backend-Frontend-Verbindung
- Testing und Optimierung
- Production-Deployment

---

**KAYA v2.0.0** - Landkreis Oldenburg 2025
