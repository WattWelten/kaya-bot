# Vergleich: Funktionierender Commit vs. Aktueller Stand

## Funktionierender Commit: 7ce7c57df6ed2394c6d29a13d2efca303e97cfdd (5. November 2025)

### Frontend Konfiguration (funktionierend)

**Datei:** `frontend/railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx --yes serve@14.2.1 dist -s -n -l $PORT",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Wichtig:**
- ✅ Verwendet **NIXPACKS** Builder (nicht Dockerfile)
- ✅ Build Command: `npm install && npm run build`
- ✅ Start Command: `npx --yes serve@14.2.1 dist -s -n -l $PORT`
- ✅ Keine Dockerfiles vorhanden

### Server/API Konfiguration (funktionierend)

**Datei:** `server/package.json`
```json
{
  "name": "wattweiser-bot-backend",
  "version": "2.0.0",
  "main": "kaya_server.js",
  "scripts": {
    "start": "node kaya_server.js"
  }
}
```

**Wichtig:**
- ✅ Keine `railway.json` für Server gefunden
- ✅ Wahrscheinlich auch NIXPACKS verwendet
- ✅ Start Command: `node kaya_server.js`

### Root .railwayignore (funktionierend)

```
crawler-v2/
frontend/
unity-kaya/
data/
memory/
ki_backend/
web/
test_clean.py
*.md
.gitignore
```

### Frontend .railwayignore (funktionierend)

```
Dockerfile
.dockerignore
```

**Wichtig:** Dockerfile wurde explizit ignoriert!

---

## Aktueller Stand

### Frontend Konfiguration (aktuell)

**Datei:** `kaya-frontend/railway.toml`
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile"
watchPatterns = []

[deploy]
startCommand = ""
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**Dockerfile:** Multi-stage Build mit Healthcheck

### API Konfiguration (aktuell)

**Datei:** `kaya-api/railway.toml`
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile"
watchPatterns = []

[deploy]
startCommand = ""
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**Dockerfile:** Production Build mit Healthcheck

---

## Hauptunterschiede

1. **Builder:**
   - Funktionierend: **NIXPACKS**
   - Aktuell: **DOCKERFILE**

2. **Konfigurationsformat:**
   - Funktionierend: `railway.json` (JSON)
   - Aktuell: `railway.toml` (TOML)

3. **Healthchecks:**
   - Funktionierend: In `railway.json` definiert
   - Aktuell: Im Dockerfile definiert (könnte Probleme verursachen)

4. **Start Command:**
   - Funktionierend: Explizit in `railway.json` definiert
   - Aktuell: Leer (`startCommand = ""`), verlässt sich auf Dockerfile CMD

---

## Empfohlene Lösung

### Option 1: Zurück zu NIXPACKS (wie funktionierend)

**Vorteile:**
- ✅ Hat bereits funktioniert
- ✅ Einfacher (keine Dockerfiles nötig)
- ✅ Railway erkennt automatisch Node.js-Projekte

**Nachteile:**
- ❌ Weniger Kontrolle über Build-Prozess
- ❌ Kann nicht so optimiert werden wie Dockerfiles

### Option 2: Dockerfiles korrigieren (bevorzugt)

**Probleme identifiziert:**
1. Healthchecks im Dockerfile könnten Probleme verursachen
2. `startCommand` ist leer - sollte explizit sein
3. Railway könnte Probleme mit Multi-stage Builds haben

**Lösung:**
1. Healthchecks aus Dockerfiles entfernen (bereits versucht)
2. `startCommand` in `railway.toml` explizit setzen
3. Vereinfachte Dockerfiles verwenden (keine Multi-stage für Frontend)

---

## Nächste Schritte

1. ✅ Healthchecks aus Dockerfiles entfernen (bereits erledigt)
2. ⏳ `startCommand` in `railway.toml` explizit setzen
3. ⏳ Frontend Dockerfile vereinfachen (kein Multi-stage)
4. ⏳ Testen und verifizieren

