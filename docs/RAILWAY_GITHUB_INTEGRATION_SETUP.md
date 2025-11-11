# Railway GitHub Integration Setup

**Datum:** 2025-11-11  
**Zweck:** Automatische Deployments via Railway GitHub Integration (empfohlene Lösung)

---

## ✅ Empfohlene Lösung: Railway GitHub Integration

**Warum:**
- ✅ Keine Token-Probleme mehr
- ✅ Automatische Deployments bei Git Push
- ✅ Keine GitHub Actions Workflows nötig
- ✅ Funktioniert zuverlässig

---

## 🔧 Setup im Railway Dashboard

### Schritt 1: Railway Dashboard öffnen
1. Öffne https://railway.app
2. Wähle Projekt "Landkreis Oldenburg"
3. Gehe zu **Settings** → **GitHub**

### Schritt 2: GitHub Repository verbinden
1. Klicke auf **"Connect GitHub"**
2. Wähle Repository: `WattWelten/kaya-bot`
3. Erlaube Railway-Zugriff

### Schritt 3: Automatische Deployments aktivieren
1. Für jeden Service (kaya-api, kaya-frontend):
   - Gehe zu Service → **Settings** → **Source**
   - Aktiviere **"Auto Deploy"**
   - Wähle Branch: `main`
   - Wähle Root Directory: `kaya-api` bzw. `kaya-frontend`

### Schritt 4: GitHub Actions Workflows deaktivieren (optional)
- Die `.github/workflows/deploy-*.yml` Dateien können entfernt werden
- Railway übernimmt jetzt automatisch die Deployments

---

## 📋 Nach Setup

**Automatische Deployments:**
- Jeder Push zu `main` Branch löst automatisch Deployment aus
- Railway erkennt Änderungen in `kaya-api/` und `kaya-frontend/`
- Build-Logs sind im Railway Dashboard verfügbar

**Vorteile:**
- ✅ Keine Token-Konfiguration nötig
- ✅ Keine GitHub Actions Workflows nötig
- ✅ Automatische Deployments
- ✅ Build-Logs direkt im Railway Dashboard

---

## 🔄 Alternative: GitHub Actions mit Projekt-Token

Falls Railway GitHub Integration nicht verwendet werden soll:

**GitHub Secrets aktualisieren:**
1. Railway Dashboard → Projekt → Settings → Tokens
2. Erstelle neuen **Projekt-Token** (nicht Account-Token!)
3. GitHub → Repository → Settings → Secrets → Actions
4. Aktualisiere `RAILWAY_TOKEN` mit dem Projekt-Token

**Wichtig:** Projekt-Token funktioniert nur für `railway up`, nicht für `railway whoami`!

