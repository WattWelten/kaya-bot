# kaya-api Build-Problem Analyse

## 🔍 Log-Analyse

### Was funktioniert:
```
✅ [snapshot] receiving snapshot, complete 252 MB
✅ [snapshot] analyzing snapshot, complete 252 MB
✅ [snapshot] uploading snapshot, complete 252 MB
✅ [snapshot] fetching snapshot, complete 252 MB
✅ [snapshot] unpacking archive, complete 1.5 GB
✅ scheduling build on Metal builder "builder-kajdzc"
```

### Was fehlt:
```
❌ KEINE Docker-Build-Logs nach dem Entpacken
❌ KEINE "Step 1/7 : FROM node:18-alpine"
❌ KEINE "Step 2/7 : WORKDIR /app"
❌ KEINE npm ci Logs
❌ KEINE Build-Erfolg oder -Fehler-Meldung
```

**Problem:** Der Build wird geplant ("scheduling build"), aber startet nicht oder crasht sofort.

---

## 🚨 Mögliche Ursachen

### Ursache 1: Dockerfile wird nicht gefunden

**Symptom:** Railway findet das Dockerfile nicht im Root Directory

**Prüfung:**
- Root Directory ist auf `/kaya-api` gesetzt ✅
- Dockerfile existiert in `kaya-api/Dockerfile` ✅
- Aber: Railway sucht möglicherweise im falschen Pfad

**Lösung:**
1. Prüfe Railway Dashboard → Settings → Source → Root Directory
2. Stelle sicher, dass es exakt `/kaya-api` ist (ohne führenden Slash könnte es auch `kaya-api` sein)
3. Prüfe Settings → Build → Dockerfile Path (sollte `Dockerfile` sein)

### Ursache 2: railway.toml Konflikt

**Aktuelle railway.toml:**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
```

**Problem:** Möglicherweise Konflikt zwischen:
- Dashboard-Einstellungen (Root Directory: `/kaya-api`)
- railway.toml (dockerfilePath: `Dockerfile`)

**Lösung:** Prüfe ob Railway die `railway.toml` korrekt interpretiert

### Ursache 3: Build hängt oder crasht sofort

**Symptom:** Build startet, aber crasht sofort ohne Logs

**Mögliche Ursachen:**
- Dockerfile-Syntax-Fehler
- Build-Kontext zu groß
- Railway Builder-Problem

**Lösung:**
1. Prüfe Dockerfile auf Syntax-Fehler
2. Prüfe ob `.dockerignore` zu viele Dateien ausschließt
3. Versuche lokalen Docker-Build

### Ursache 4: Railway Builder-Problem

**Symptom:** "scheduling build on Metal builder" aber Build startet nicht

**Mögliche Ursachen:**
- Builder-Queue voll
- Builder-Problem auf Railway-Seite
- Timeout beim Build-Start

**Lösung:**
1. Warte einige Minuten
2. Versuche manuelles Redeploy
3. Prüfe Railway Status-Seite

---

## 🔧 Debugging-Schritte

### Schritt 1: Lokaler Docker-Build-Test

```bash
cd kaya-api
docker build -t kaya-api-test .
```

**Erwartetes Ergebnis:**
- Build sollte erfolgreich sein
- Falls Fehler → Problem identifiziert

**Falls lokaler Build erfolgreich:**
- Problem liegt bei Railway-Konfiguration
- Nicht beim Dockerfile selbst

### Schritt 2: Prüfe Railway Dashboard Build-Logs

1. Railway Dashboard öffnen
2. Service `kaya-api` → **Deployments**
3. Neuestes Deployment öffnen
4. **Build-Logs** Tab öffnen (nicht Runtime-Logs!)
5. Prüfe auf:
   - Dockerfile-Fehler
   - Build-Start-Fehler
   - Timeout-Fehler

### Schritt 3: Prüfe Root Directory Einstellung

1. Railway Dashboard → Service `kaya-api`
2. Settings → **Source**
3. Prüfe "Root Directory":
   - Sollte sein: `kaya-api` (ohne führenden Slash)
   - ODER: `/kaya-api` (mit führendem Slash)
   - **WICHTIG:** Muss exakt mit dem Verzeichnisnamen übereinstimmen

### Schritt 4: Prüfe Dockerfile Path

1. Railway Dashboard → Service `kaya-api`
2. Settings → **Build**
3. Prüfe "Dockerfile Path":
   - Sollte sein: `Dockerfile`
   - Relativ zum Root Directory

### Schritt 5: Versuche .dockerignore zu erstellen

Falls viele Dateien im Build-Kontext sind, erstelle `.dockerignore`:

```dockerignore
node_modules
.git
.env
*.log
memory/
logs/
cloudflared.exe
```

---

## 🎯 Empfohlene Lösung

### Option 1: Root Directory ohne führenden Slash

**Ändere im Railway Dashboard:**
- Root Directory: von `/kaya-api` auf `kaya-api` (ohne führenden Slash)

### Option 2: Dockerfile Path explizit setzen

**Im Railway Dashboard:**
- Settings → Build → Dockerfile Path
- Setze auf: `./Dockerfile` oder `Dockerfile`

### Option 3: railway.toml anpassen

**Versuche in `railway.toml`:**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile"
```

### Option 4: Force Rebuild

1. Railway Dashboard → Service `kaya-api`
2. Deployments → Neuestes Deployment
3. Klicke auf "Redeploy" oder "Force Rebuild"

---

## 📋 Checkliste

- [ ] Lokaler Docker-Build erfolgreich getestet
- [ ] Railway Dashboard Build-Logs geprüft (nicht Runtime-Logs!)
- [ ] Root Directory exakt geprüft (`kaya-api` vs `/kaya-api`)
- [ ] Dockerfile Path geprüft
- [ ] railway.toml Konfiguration geprüft
- [ ] Force Rebuild versucht
- [ ] Railway Status-Seite geprüft (für bekannte Probleme)

---

## 🔍 Nächste Schritte

1. **WICHTIG:** Prüfe Railway Dashboard → Deployments → Build-Logs (nicht Runtime-Logs!)
2. Teste lokalen Docker-Build
3. Prüfe Root Directory Einstellung (mit/ohne führenden Slash)
4. Versuche Force Rebuild

**Die Build-Logs im Dashboard zeigen normalerweise den genauen Fehler, der in den CLI-Logs nicht erscheint!**


