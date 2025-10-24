# KAYA Production Environment Setup

## 🚀 Environment Variables für Railway Production

Dieses Dokument beschreibt die notwendigen Environment Variables für das KAYA-System auf Railway.

---

## 📋 Backend Service (.env)

Erstelle eine `.env` Datei im `server/` Verzeichnis:

```env
# ✅ ESSENTIELL - OpenAI API Key
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# ✅ Node Environment
NODE_ENV=production

# ✅ LLM aktivieren
USE_LLM=true

# ✅ Server Port (Railway setzt automatisch PORT)
# PORT=3001

# ✅ OpenAI Model
OPENAI_MODEL=gpt-4o

# ✅ CORS Origins
CORS_ORIGINS=https://kaya.wattweiser.com,http://localhost:5173

# ✅ Mock-Services (für ersten Test ohne PostgreSQL/Redis)
MOCK_DATABASE=true
MOCK_REDIS=true

# ✅ Feature Flags
FEATURE_OPENAI=true
FEATURE_WEBSOCKET=true
FEATURE_MONITORING=true
FEATURE_CIRCUIT_BREAKER=true
FEATURE_RETRY_LOGIC=true
FEATURE_CACHE=true
FEATURE_DATABASE=false
FEATURE_REDIS=false

# ✅ Circuit Breaker
CIRCUIT_BREAKER_TIMEOUT=10000
CIRCUIT_BREAKER_ERROR_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=30000

# ✅ Retry Logic
MAX_RETRIES=3
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=30000

# ✅ Logging
LOG_LEVEL=info
DEBUG=true
```

---

## 🎨 Frontend Service (.env)

Erstelle eine `.env` Datei im `frontend/` Verzeichnis:

```env
# ✅ Backend API URL
VITE_API_URL=https://kaya.wattweiser.com

# ✅ WebSocket URL
VITE_WS_URL=wss://kaya.wattweiser.com
```

---

## 🔧 Railway Environment Variables

### **Backend Service Variables:**

In Railway → Backend Service → **Variables** folgende setzen:

```env
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
NODE_ENV=production
USE_LLM=true
OPENAI_MODEL=gpt-4o
CORS_ORIGINS=https://kaya.wattweiser.com,http://localhost:5173
MOCK_DATABASE=true
MOCK_REDIS=true
FEATURE_OPENAI=true
FEATURE_WEBSOCKET=true
FEATURE_MONITORING=true
FEATURE_CIRCUIT_BREAKER=true
FEATURE_RETRY_LOGIC=true
FEATURE_CACHE=true
FEATURE_DATABASE=false
FEATURE_REDIS=false
CIRCUIT_BREAKER_TIMEOUT=10000
CIRCUIT_BREAKER_ERROR_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
MAX_RETRIES=3
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=30000
LOG_LEVEL=info
DEBUG=true
```

### **Frontend Service Variables:**

In Railway → Frontend Service → **Variables** folgende setzen:

```env
VITE_API_URL=https://kaya.wattweiser.com
VITE_WS_URL=wss://kaya.wattweiser.com
```

---

## 🚨 Wichtige Hinweise

### **1. OpenAI API Key**

- **NIEMALS** den API Key in Git committen!
- Nur in Railway Environment Variables setzen
- Lokale `.env` Dateien zu `.gitignore` hinzufügen

### **2. Domain-Konfiguration**

- Backend: `kaya.wattweiser.com` (oder `api.kaya.wattweiser.com`)
- Frontend: `kaya.wattweiser.com` (oder `app.kaya.wattweiser.com`)
- WebSocket: `wss://kaya.wattweiser.com/ws`

### **3. CORS-Konfiguration**

Stelle sicher, dass `CORS_ORIGINS` alle erlaubten Domains enthält:

```env
CORS_ORIGINS=https://kaya.wattweiser.com,http://localhost:5173,https://app.kaya.wattweiser.com
```

### **4. Mock-Services**

Für den ersten Test ohne PostgreSQL/Redis:

```env
MOCK_DATABASE=true
MOCK_REDIS=true
FEATURE_DATABASE=false
FEATURE_REDIS=false
```

Später für Production:

```env
MOCK_DATABASE=false
MOCK_REDIS=false
FEATURE_DATABASE=true
FEATURE_REDIS=true
```

---

## 🔍 Environment Check

### **Backend Health Check:**

```bash
curl https://kaya.wattweiser.com/health
```

**Erwartung:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "services": {
    "openai": "active",
    "websocket": "active",
    "database": "mock",
    "redis": "mock"
  }
}
```

### **Frontend Check:**

```bash
curl https://kaya.wattweiser.com/
```

**Erwartung:** HTML-Seite mit KAYA Frontend

### **WebSocket Check:**

```bash
curl https://kaya.wattweiser.com/ws/status
```

**Erwartung:**
```json
{
  "status": "active",
  "stats": {
    "connections": 0,
    "messages": 0
  }
}
```

---

## 🐛 Troubleshooting

### **Problem: OpenAI API Key nicht gesetzt**

**Symptom:** Backend-Log zeigt `OpenAI Integration: DEAKTIVIERT`

**Lösung:**
1. Railway → Backend Service → **Variables**
2. `OPENAI_API_KEY` hinzufügen: `sk-proj-...`
3. Service neu deployen: **Deploy** → **Redeploy**

### **Problem: CORS-Fehler**

**Symptom:** Browser-Console zeigt `Access to XMLHttpRequest has been blocked by CORS policy`

**Lösung:**
1. `CORS_ORIGINS` in Railway Environment Variables prüfen
2. Alle erlaubten Domains hinzufügen
3. Service neu deployen

### **Problem: WebSocket-Verbindung fehlgeschlagen**

**Symptom:** Frontend-Console zeigt `❌ WebSocket Fehler`

**Lösung:**
1. `VITE_WS_URL` in Frontend Environment Variables prüfen
2. WebSocket-URL sollte sein: `wss://kaya.wattweiser.com/ws`
3. Backend WebSocket-Server aktiviert?

---

## ✅ Checkliste

- [ ] OpenAI API Key in Railway Backend Service gesetzt
- [ ] Alle Backend Environment Variables konfiguriert
- [ ] Frontend Environment Variables konfiguriert
- [ ] CORS-Origins korrekt gesetzt
- [ ] Domain-Konfiguration abgeschlossen
- [ ] Health-Checks erfolgreich
- [ ] WebSocket-Verbindung funktioniert
- [ ] Lokale `.env` Dateien zu `.gitignore` hinzugefügt

---

## 📚 Weitere Dokumentation

- **Railway Deployment:** `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Test-Szenarien:** `TEST_SCENARIOS.md`
- **Production-Ready:** `PRODUCTION_READY_DOCUMENTATION.md`