# Railway Vollständige Analyse - kaya-api & kaya-frontend

**Datum:** 2025-11-10  
**Projekt ID:** `266dd89d-9821-4f28-8ae5-66761eed2058`  
**Projekt Name:** Landkreis Oldenburg

---

## 📊 Service-IDs

- **kaya-api:** `8b33f312-2ffe-474d-8448-5bf8c9094bf0`
- **kaya-frontend:** `c841264c-7bd6-489a-8bc1-65d8dc19337e`

---

## ✅ Environment Variables

### kaya-api

Alle Variablen sind korrekt gesetzt:

| Variable | Wert |
|----------|------|
| `CORS_ORIGIN` | `https://app.kaya.wattweiser.com` |
| `ELEVENLABS_API_KEY` | ✅ Gesetzt |
| `ELEVENLABS_MODEL_ID` | `eleven_multilingual_v2` |
| `ELEVENLABS_SIMILARITY` | `0.85` |
| `ELEVENLABS_SPEAKER_BOOST` | `true` |
| `ELEVENLABS_STABILITY` | `0.40` |
| `ELEVENLABS_STYLE` | `0.15` |
| `ELEVENLABS_VOICE_ID` | `iFJwt407E3aafIpJFfcu` |
| `NODE_ENV` | `production` |
| `OPENAI_API_KEY` | ✅ Gesetzt |
| `PORT` | `3001` |
| `USE_LLM` | `true` |

### kaya-frontend

Alle Variablen sind korrekt gesetzt:

| Variable | Wert |
|----------|------|
| `VITE_API_URL` | `wss://api.kaya.wattweiser.com` |
| `VITE_BUILD_ID` | `20251027-fresh` |

---

## ❌ Deployment-Status

### kaya-api - Neueste Deployments (alle FAILED)

| Deployment ID | Status | Datum |
|---------------|--------|-------|
| `cfae5219-8808-425e-856e-9ffad62ff523` | FAILED | 2025-11-10 11:45:52 |
| `fba06a70-9f99-435c-9f5f-cbb42f56ec63` | FAILED | 2025-11-10 11:42:09 |
| `a904ce9e-83e5-4c9a-91ce-3a6be1e11a31` | FAILED | 2025-11-10 11:41:41 |
| `032f2d18-c344-403a-8ffa-f0b0db4830b5` | FAILED | 2025-11-10 11:29:46 |
| `df4ac47a-9d3d-40d1-afd4-e86436bf1b74` | FAILED | 2025-11-10 10:58:40 |

### kaya-frontend - Neueste Deployments (alle FAILED)

| Deployment ID | Status | Datum |
|---------------|--------|-------|
| `d4bf2a70-b7e2-4822-86cc-a1271840574b` | FAILED | 2025-11-10 11:45:52 |
| `d4d67ffd-08f9-4022-88a1-12a5cd2db29e` | FAILED | 2025-11-10 11:42:09 |
| `a30fa437-c5be-4304-a71e-a99aea168417` | FAILED | 2025-11-10 11:41:41 |
| `8dcfeca5-9fd8-43c5-a714-e810269c3ec2` | FAILED | 2025-11-10 11:29:46 |
| `a59e06c4-e18a-4059-a27f-bcab96a824ec` | FAILED | 2025-11-10 11:28:31 |

---

## 🔍 Build-Log-Analyse

### Problem: Build startet nicht nach Snapshot-Unpacking

**Beobachtung für beide Services:**

1. ✅ Snapshot wird empfangen (252 MB)
2. ✅ Snapshot wird analysiert
3. ✅ Snapshot wird hochgeladen
4. ✅ Snapshot wird abgerufen
5. ✅ Snapshot wird entpackt (1.5 GB)
6. ⏳ Build wird geplant ("scheduling build on Metal builder")
7. ❌ **KEINE Docker-Build-Logs** - Build startet nicht!

**Beispiel-Log (kaya-api):**
```
scheduling build on Metal builder "builder-kajdzc"
[snapshot] unpacking archive, complete 1.5 GB [took 7.656467263s]
```

**Nach dem Entpacken:** Nichts. Keine Docker-Build-Logs, kein Fehler, einfach Stille.

---

## 📁 Lokale Konfiguration

### kaya-api/railway.toml

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = ""
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### kaya-frontend/railway.toml

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
watchPatterns = []

[deploy]
startCommand = ""
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### Dockerfiles

**kaya-api/Dockerfile:** ✅ Existiert und ist korrekt  
**kaya-frontend/Dockerfile:** ✅ Existiert und ist korrekt

---

## 🚨 Identifiziertes Problem

### Root Cause: Railway findet Dockerfile nicht oder Builder ist falsch konfiguriert

**Mögliche Ursachen:**

1. **Root Directory im Dashboard falsch gesetzt**
   - Muss `kaya-api` oder `kaya-frontend` sein (ohne führenden Slash)
   - NICHT `/kaya-api` oder `/kaya-frontend`

2. **Builder im Dashboard auf "Auto-detect" statt "Dockerfile"**
   - Railway könnte versuchen, Railpack/Nixpacks zu verwenden
   - `railway.toml` wird möglicherweise ignoriert

3. **Dockerfile Path im Dashboard falsch**
   - Muss `Dockerfile` sein (relativ zum Root Directory)
   - NICHT `./Dockerfile` oder `/Dockerfile`

4. **Railway Builder-Problem**
   - Der Builder plant den Build, startet ihn aber nicht
   - Möglicherweise ein Railway-internes Problem

---

## ✅ Lösungsschritte

### 1. Railway Dashboard prüfen und korrigieren

**Für kaya-api:**

1. Öffne Railway Dashboard → Projekt "Landkreis Oldenburg"
2. Wähle Service `kaya-api`
3. Gehe zu **Settings** → **Source**
4. Prüfe **Root Directory**: Muss `kaya-api` sein (ohne Slash!)
5. Gehe zu **Settings** → **Build & Deploy**
6. Prüfe **Builder**: Muss `Dockerfile` sein (nicht "Auto-detect" oder "Nixpacks")
7. Prüfe **Dockerfile Path**: Muss `Dockerfile` sein
8. Speichere alle Änderungen

**Für kaya-frontend:**

1. Wähle Service `kaya-frontend`
2. Wiederhole die gleichen Schritte mit Root Directory `kaya-frontend`

### 2. Manuelles Redeploy

Nach der Korrektur:
1. Klicke auf **Deployments** Tab
2. Klicke auf **Redeploy** oder **Deploy Latest**
3. Beobachte die Build-Logs

### 3. Alternative: Railway CLI verwenden

Falls Dashboard-Konfiguration nicht hilft:

```bash
# kaya-api
railway service kaya-api
railway up --detach

# kaya-frontend
railway service kaya-frontend
railway up --detach
```

### 4. Debug: Build-Logs im Dashboard prüfen

1. Öffne das neueste Deployment
2. Gehe zu **Build Logs** Tab
3. Prüfe, ob dort mehr Informationen stehen als in der CLI

---

## 📝 Nächste Schritte

**SOFORT:**

1. ✅ Prüfe Root Directory im Dashboard (muss `kaya-api` / `kaya-frontend` sein)
2. ✅ Prüfe Builder im Dashboard (muss `Dockerfile` sein)
3. ✅ Prüfe Dockerfile Path im Dashboard (muss `Dockerfile` sein)
4. ✅ Redeploy beide Services
5. ✅ Beobachte Build-Logs

**Falls Problem weiterhin besteht:**

1. Erstelle Screenshots der Dashboard-Settings
2. Prüfe Build-Logs im Dashboard (nicht nur CLI)
3. Kontaktiere Railway Support mit Deployment-IDs

---

## 🔧 Railway API Zugriff

**Token:** `47ac28d3-5292-47c0-9630-b7c99a473621`  
**Projekt ID:** `266dd89d-9821-4f28-8ae5-66761eed2058`

**Hinweis:** Die Railway GraphQL API gibt aktuell Fehler zurück. Möglicherweise ist ein Account-Token statt Projekt-Token erforderlich.

**Verfügbare Railway CLI Befehle:**

```bash
# Variables
railway variables

# Deployments
railway deployment list

# Logs
railway logs --build --lines 500
railway logs --deployment <ID> --lines 500

# Status
railway status
```

---

## 📊 Zusammenfassung

| Aspekt | Status | Bemerkung |
|--------|--------|-----------|
| Environment Variables | ✅ | Alle korrekt gesetzt |
| railway.toml | ✅ | Beide Services korrekt konfiguriert |
| Dockerfiles | ✅ | Beide existieren und sind korrekt |
| Root Directory | ❓ | Muss im Dashboard geprüft werden |
| Builder | ❓ | Muss im Dashboard auf "Dockerfile" gesetzt sein |
| Build-Logs | ❌ | Build startet nicht nach Snapshot-Unpacking |

**Hauptproblem:** Railway plant den Build, startet ihn aber nicht. Dies deutet auf ein Dashboard-Konfigurationsproblem hin (Root Directory oder Builder).

