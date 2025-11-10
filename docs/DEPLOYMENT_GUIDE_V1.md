# KAYA Deployment Guide v1.0

**Version:** v1.0.0  
**Datum:** 26. Oktober 2025

---

## Railway-Konfiguration

### Services-Übersicht

**1. Frontend Service (app.kaya.wattweiser.com)**
- **Root Directory:** `frontend/`
- **Builder:** Nixpacks
- **Start Command:** `npx serve dist -s -l $PORT`
- **Health-Check Path:** `/`

**2. Backend Service (api.kaya.wattweiser.com)**
- **Root Directory:** `server/`
- **Builder:** Nixpacks (Auto-Detection)
- **Start Command:** `node kaya_server.js`
- **Health-Check Path:** `/health`

---

## Environment Variables

### Backend (Railway Dashboard)

**Erforderlich:**
```bash
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=...
```

**Optional:**
```bash
USE_LLM=true
DAILY_BUDGET=10
MONTHLY_BUDGET=300
PORT=3001
```

**CORS-Origins:**
```bash
CORS_ORIGINS=https://app.kaya.wattweiser.com
```

### Frontend
- Keine Environment Variables nötig
- API-URL wird automatisch erkannt

---

## Build-Process

### Frontend

**Dateien:**
- `frontend/nixpacks.toml` (Build-Konfiguration)
- `frontend/package.json` (Dependencies)

**Build-Phasen:**
1. Setup: Node.js 18 installieren
2. Install: `npm install`
3. Build: `npm run build` (TypeScript + Vite)
4. Start: `npx serve dist -s -l $PORT`

**Output:**
- `frontend/dist/index.html` (SPA Entry-Point)
- `frontend/dist/assets/` (JS, CSS)

### Backend

**Dateien:**
- `server/package.json` (Dependencies)
- `server/kaya_server.js` (Entry-Point)

**Build-Phasen:**
1. Setup: Node.js 18 installieren
2. Install: `npm install`
3. Start: `node kaya_server.js`

---

## Health-Checks

### Frontend
```bash
curl https://app.kaya.wattweiser.com
# Expected: 200 OK, HTML mit React-App
```

### Backend
```bash
curl https://api.kaya.wattweiser.com/health
# Expected: {"status":"healthy","service":"KAYA-Bot","version":"1.0.0"}
```

---

## Custom Domains

### Konfiguration

**Railway Dashboard:**
1. Service → Settings → Networking
2. Add Custom Domain
3. `app.kaya.wattweiser.com` bzw. `api.kaya.wattweiser.com`
4. DNS-Records automatisch generiert

**DNS-Records:**
- Type: CNAME
- Name: app.kaya bzw. api.kaya
- Value: Railway-Provided-URL

---

## Troubleshooting

### Frontend zeigt weißen Bildschirm

**Problem:** Browser Console zeigt 404 für JS-Assets

**Lösung:**
```bash
# Railway Root Directory prüfen
# Muss sein: frontend/

# Falls falsch:
1. Railway Dashboard → Frontend Service → Settings
2. Root Directory: frontend
3. Redeploy
```

### Backend Health-Check Failed

**Problem:** Railway Health-Check schlägt fehl

**Lösung:**
```bash
# Port-Binding prüfen
# kaya_server.js muss PORT aus Environment nutzen

# Code prüfen:
const PORT = process.env.PORT || 3001;
```

### Audio-Chat funktioniert nicht

**Problem:** 401 Unauthorized bei ElevenLabs

**Lösung:**
```bash
# ElevenLabs API Key prüfen
# Railway Dashboard → Backend Service → Variables
# ELEVENLABS_API_KEY muss gesetzt sein
```

### OpenAI-Integration funktioniert nicht

**Problem:** Generic Template-Responses statt OpenAI

**Lösung:**
```bash
# OpenAI API Key prüfen
# USE_LLM muss true sein

# Railway Dashboard → Backend Service → Variables:
OPENAI_API_KEY=sk-proj-...
USE_LLM=true
```

---

## Monitoring

### Railway Metrics

**Dashboard:** https://railway.app
- Deployments
- Logs (Build, Deploy, HTTP)
- Metrics (CPU, Memory, Network)

### API Monitoring

**Endpoints:**
- `/health` - Service Health
- `/api/admin/stats` - Cost Tracking (Basic Auth erforderlich)

---

## Deployment-Workflow

### 1. Code-Änderungen
```bash
git add .
git commit -m "feat: New feature"
git push origin main
```

### 2. Railway baut automatisch
- Railway detect Git Push
- Build startet
- Deploy startet
- Health-Check

### 3. Verifizierung
```bash
# Health-Check
curl https://api.kaya.wattweiser.com/health

# Frontend
curl https://app.kaya.wattweiser.com

# Logs
# Railway Dashboard → Deployments → Latest → Logs
```

---

## Rollback

### Manueller Rollback

**Railway Dashboard:**
1. Service → Deployments
2. Älteres Deployment wählen
3. "Redeploy" klicken

### Git-basierter Rollback
```bash
git revert HEAD
git push origin main
```

---

## Support

**Bei Problemen:**
1. Railway Logs prüfen
2. Health-Checks testen
3. Environment Variables prüfen
4. Root Directory konfiguration prüfen

**Nützliche URLs:**
- Railway Dashboard: https://railway.app
- Backend Health: https://api.kaya.wattweiser.com/health
- Frontend: https://app.kaya.wattweiser.com

