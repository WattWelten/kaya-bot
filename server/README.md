# KAYA Backend - Landkreis Oldenburg

## 🚀 Schnellstart

```bash
# Dependencies installieren
npm install

# Server starten
npm start

# Server läuft auf http://localhost:3001
```

## 📁 Dateien

### Hauptkomponenten
- `kaya_character_handler_v2.js` - KAYA Hauptlogik
- `context_memory.js` - Session-Management
- `kaya_agent_manager_v2.js` - Agent-Management
- `kaya_session_manager_v2.js` - Session-Handling
- `kaya_websocket_service_v2.js` - WebSocket-Service
- `kaya_audio_service_v2.js` - Audio-Verarbeitung
- `kaya_avatar_service_v2.js` - Avatar-Steuerung
- `kaya_performance_optimizer_v2.js` - Performance-Optimierung
- `kaya_test_suite_v2.js` - Test-Suite

## 🔧 Konfiguration

### Environment Variables
```bash
NODE_ENV=production
PORT=3001
```

### Dependencies
- `express` - Web-Framework
- `ws` - WebSocket-Support
- `fs-extra` - File-System-Operations

## 🧪 Testing

```bash
# KAYA Response testen
node -e "
const kaya = require('./kaya_character_handler_v2');
kaya.generateResponse('Moin, ich brauche Hilfe bei der KFZ-Zulassung', 'user', 'test-session')
  .then(response => console.log('Response:', response.response.substring(0, 200)));
"
```

## 🌐 API-Endpunkte

### WebSocket
- **URL**: `ws://localhost:3001/ws`
- **Session**: `?sessionId=session_123`

### HTTP
- **Health Check**: `GET /health`
- **Status**: `GET /status`

## 📊 Performance

- **Response-Zeit**: < 200ms
- **Session-Cache**: Aktiviert
- **Memory-Optimierung**: Implementiert

## 🔒 Sicherheit

- CORS konfiguriert
- Session-Isolation
- Input-Validierung

---

**KAYA Backend v2.0.0** - Landkreis Oldenburg 2025
