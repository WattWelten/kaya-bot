# KAYA API-Dokumentation

**Version:** 1.0  
**Stand:** 29.10.2025  
**Base URL:** `https://api.kaya.wattweiser.com` (Production) / `http://localhost:3001` (Development)

---

## Übersicht

KAYA bietet REST-APIs und WebSocket-Support für Chat-Interaktionen, Session-Verwaltung und Audio-Verarbeitung.

---

## Authentifizierung

**Aktuell:** Keine Authentifizierung erforderlich (öffentliche API)

**Empfehlung für Production:**
- API-Key-Authentifizierung
- Rate Limiting pro IP/User
- Session-basierte Authentifizierung

---

## Endpoints

### 1. Chat-Endpoints

#### POST /api/chat

**Zweck:** Text-Chat mit KAYA

**Request Body:**
```json
{
  "message": "Welche Unterlagen brauche ich für KFZ-Ummeldung?",
  "sessionId": "session-123" // Optional: Auto-generiert falls nicht vorhanden
}
```

**Response (200 OK):**
```json
{
  "response": "Für die KFZ-Ummeldung brauchen Sie:\n1. Zulassungsbescheinigung Teil I & II\n2. Personalausweis\n3. eVB-Nummer\n\nTermin buchen oder online starten?",
  "metadata": {
    "latency": 234 // ms
  }
}
```

**Error Response (400):**
```json
{
  "error": "Nachricht erforderlich"
}
```

**Error Response (500):**
```json
{
  "error": "Chat fehlgeschlagen",
  "details": "Error message"
}
```

**Rate Limiting:**
- Standard: Kein Limit (empfohlen: 20/min)

---

### 2. Session-Management (DSGVO)

#### GET /api/session/:sessionId

**Zweck:** Auskunft über Session-Daten (DSGVO Art. 15)

**Path Parameter:**
- `sessionId`: Session-ID (z.B. `session-123`)

**Response (200 OK):**
```json
{
  "sessionId": "session-123",
  "createdAt": "2025-10-01T10:00:00Z",
  "lastActivity": "2025-10-29T15:30:00Z",
  "ageDays": 28,
  "remainingDays": 2,
  "willBeDeleted": false,
  "messageCount": 15,
  "hasUserData": true
}
```

**Error Response (404):**
```json
{
  "error": "Session nicht gefunden",
  "sessionId": "session-123"
}
```

#### DELETE /api/session/:sessionId

**Zweck:** Löschung von Session-Daten (DSGVO Art. 17 - Recht auf Löschung)

**Path Parameter:**
- `sessionId`: Session-ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ihre Daten wurden vollständig gelöscht (DSGVO-konform)",
  "sessionId": "session-123",
  "deleted": true
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Session nicht gefunden",
  "sessionId": "session-123"
}
```

**Error Response (500):**
```json
{
  "error": "Fehler beim Löschen der Session",
  "details": "Error message"
}
```

---

### 3. Audio-Endpoints

#### POST /api/stt

**Zweck:** Speech-to-Text (Audio → Text)

**Content-Type:** `multipart/form-data`

**Request:**
- `audio`: Audio-File (max. 10MB, Formate: WAV, MP3, M4A)

**Response (200 OK):**
```json
{
  "text": "Welche Unterlagen brauche ich für KFZ-Ummeldung?",
  "confidence": 0.95,
  "language": "de"
}
```

**Error Response (400):**
```json
{
  "error": "Audio file is required"
}
```

**Error Response (429):**
```json
{
  "error": "Budget exceeded",
  "message": "Daily budget limit reached"
}
```

**Rate Limiting:**
- 10 Requests/Minute

#### POST /api/tts

**Zweck:** Text-to-Speech (Text → Audio)

**Request Body:**
```json
{
  "text": "KAYA Antwort hier...",
  "voiceId": "default" // Optional
}
```

**Response (200 OK):**
```json
{
  "audioUrl": "https://.../audio.mp3",
  "duration": 3.5
}
```

**Rate Limiting:**
- 20 Requests/Minute

---

### 4. Info-Endpoints

#### GET /health

**Zweck:** Health-Check für Monitoring

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "KAYA-Bot",
  "version": "1.0.0",
  "timestamp": "2025-10-29T15:30:00Z"
}
```

#### GET /kaya/info

**Zweck:** KAYA-Metadaten und Features

**Response (200 OK):**
```json
{
  "name": "KAYA",
  "pronunciation": "Kaja",
  "role": "Kommunaler KI-Assistent für Landkreis Oldenburg",
  "greeting": "Moin! Ich bin KAYA",
  "features": [
    "Norddeutsch-freundlich",
    "Agenten-System",
    "Voice + Chat",
    "DSGVO-konform",
    "Barrierefrei"
  ],
  "agents": [
    "buergerdienste",
    "ratsinfo",
    "stellenportal",
    "kontakte",
    "jobcenter",
    "schule",
    "jugend",
    "soziales"
  ]
}
```

---

## WebSocket API

### Verbindung

**URL:** `ws://localhost:3001/ws?sessionId=session-123`

**Query Parameter:**
- `sessionId`: Session-ID (optional, wird generiert falls nicht vorhanden)

### Nachrichten-Format

**Client → Server:**
```json
{
  "type": "message",
  "content": "User-Nachricht",
  "timestamp": "2025-10-29T15:30:00Z"
}
```

**Server → Client:**
```json
{
  "type": "message",
  "content": "KAYA-Antwort",
  "timestamp": "2025-10-29T15:30:01Z",
  "emotion": "happy", // Optional
  "emotionConfidence": 0.85 // Optional
}
```

### Ereignis-Typen

- `message` - Chat-Nachrichten
- `emotion` - Avatar-Emotionen (für Babylon.js)
- `audio` - Audio-Streaming
- `error` - Fehlermeldungen
- `typing` - Typing-Indicator

---

## Error Handling

### Status Codes

- `200 OK` - Erfolgreich
- `400 Bad Request` - Ungültige Request-Daten
- `404 Not Found` - Ressource nicht gefunden
- `429 Too Many Requests` - Rate Limit überschritten
- `500 Internal Server Error` - Server-Fehler

### Error-Format

```json
{
  "error": "Error message",
  "details": "Detailed error description (optional)"
}
```

---

## Rate Limiting

### Limits

- **Chat-API**: Kein Limit (empfohlen: 20/min)
- **STT-API**: 10 Requests/Minute
- **TTS-API**: 20 Requests/Minute

### Headers

Nach Rate-Limit-Überschreitung:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1632931200
```

---

## Beispiele

### JavaScript (Fetch)

```javascript
// Chat-Request
const response = await fetch('https://api.kaya.wattweiser.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Welche Unterlagen brauche ich?',
    sessionId: 'session-123'
  })
});

const data = await response.json();
console.log(data.response);
```

### cURL

```bash
# Chat-Request
curl -X POST https://api.kaya.wattweiser.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Welche Unterlagen brauche ich?",
    "sessionId": "session-123"
  }'

# Session-Status
curl https://api.kaya.wattweiser.com/api/session/session-123

# Session löschen
curl -X DELETE https://api.kaya.wattweiser.com/api/session/session-123
```

### WebSocket (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:3001/ws?sessionId=session-123');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'message',
    content: 'User-Nachricht',
    timestamp: new Date().toISOString()
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('KAYA:', data.content);
};
```

---

## Best Practices

### Session-Management

- Verwende persistente Session-IDs (z.B. localStorage)
- Session-ID wird bei erster Nachricht generiert
- Session-Expiration: 30 Tage (automatisch)

### Error Handling

- Implementiere Retry-Logic für 500-Fehler
- Zeige Benutzer-freundliche Fehlermeldungen
- Logge Fehler für Debugging

### Performance

- Caching von häufigen Anfragen (lokal)
- Batch-Requests vermeiden (Rate Limiting)
- WebSocket für Live-Interaktionen nutzen

---

## Changelog

### Version 1.0 (29.10.2025)
- Initial API-Dokumentation
- DSGVO-Endpoints (GET/DELETE /api/session/:id)
- Chat-API
- Audio-APIs (STT/TTS)
- WebSocket-Support

---

**Letzte Aktualisierung:** 29.10.2025  
**Kontakt:** kaya@landkreis-oldenburg.de

