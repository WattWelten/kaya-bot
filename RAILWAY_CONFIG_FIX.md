# Railway Frontend Config Fix

## Problem

**Symptom:** Weißer Bildschirm - Browser zeigt leere Seite  
**Railway serviert:** `frontend/index.html` (Development-Version)  
**Sollte servieren:** `frontend/dist/index.html` (Production-Build)

## Ursache

Railway muss konfiguriert werden:
1. **Root Directory** muss `frontend/` sein
2. **Build** muss im `frontend/` Verzeichnis ausgeführt werden
3. **Serve** muss `dist/` Verzeichnis servieren

## Lösung: Railway Dashboard Settings

### Bitte prüfen Sie im Railway Dashboard:

**1. Frontend Service → Settings:**
- Root Directory: `frontend` (MUSS gesetzt sein!)
- Build Command: `npm install && npm run build`
- Start Command: `npx serve dist -s -l $PORT`

**2. Falls Root Directory NICHT `frontend/` ist:**

1. Öffnen Sie: https://railway.app
2. KAYA Frontend Service öffnen
3. Settings → Source → Root Directory
4. Eintragen: `frontend`
5. Settings speichern
6. Service redeployen

**3. Build-Logs prüfen:**

- Öffnen Sie Deployments-Tab
- Klicken Sie auf neuestes Deployment
- Prüfen Sie Build-Logs:
  - Erscheint: "Running npm install && npm run build"?
  - Erscheint: "Running npx serve dist"?
  - Gibt es Fehler?

---

## Alternative: Nixpacks.toml erstellen

Falls die Railway-Konfiguration weiterhin Probleme macht, erstellen wir eine `nixpacks.toml`:

**Datei:** `frontend/nixpacks.toml`

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve dist -s -l $PORT"
```

---

## Aktueller Status

**dist/ Verzeichnis:** ✅ Committed (Commit 2de1488b)  
**Railway serviert:** ❌ Falsches Verzeichnis  
**Root Directory:** ❌ Vermutlich nicht gesetzt

**Erforderliche Aktion:**
- Railway Dashboard öffnen
- Frontend Service Root Directory auf `frontend` setzen
- Service redeployen

---

## Nächste Schritte

**BITTE:**
1. Railway Dashboard öffnen: https://railway.app
2. KAYA Frontend Service öffnen
3. Settings → Source → Root Directory prüfen
4. Falls NICHT `frontend`: Setzen Sie es auf `frontend`
5. Service redeployen
6. Testen: https://app.kaya.wattweiser.com

**Oder:**
- Senden Sie mir einen Screenshot der Railway Settings
- Ich erstelle dann eine `nixpacks.toml` als Fallback

