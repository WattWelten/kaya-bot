# kaya-api - Tiefenanalyse des Build-Problems

## 🔍 Detaillierte Log-Analyse

### Zeitliche Abfolge:
```
09:38:45 - scheduling build on Metal builder "builder-kajdzc"
09:39:31 - [snapshot] receiving snapshot, complete 252 MB
09:39:35 - [snapshot] analyzing snapshot, complete 252 MB
09:39:43 - [snapshot] uploading snapshot, complete 252 MB
09:39:55 - [snapshot] fetching snapshot, complete 252 MB
09:39:57 - scheduling build on Metal builder "builder-kajdzc" (ZWEITES MAL!)
09:40:03 - [snapshot] unpacking archive, complete 1.5 GB
```

**Kritische Beobachtung:**
- Build wird **ZWEIMAL** geplant (09:38:45 und 09:39:57)
- Nach dem Entpacken: **KEINE Docker-Build-Logs**
- Build startet nicht oder crasht sofort

---

## 🚨 Mögliche Ursachen (Tiefenanalyse)

### Ursache 1: Railway fällt auf Railpack/Nixpacks zurück

**Problem:** Railway erkennt Node.js-Projekt und ignoriert `railway.toml`

**Indizien:**
- `package.json` existiert im Root Directory
- Railway könnte automatisch Railpack/Nixpacks verwenden
- `builder = "DOCKERFILE"` wird möglicherweise ignoriert

**Lösung:**
1. Prüfe Railway Dashboard → Settings → Build → Builder
2. Stelle sicher, dass es explizit "Dockerfile" ist (nicht "Auto-detect" oder "Nixpacks")
3. Falls auf "Nixpacks" oder "Railpack": Ändere zu "Dockerfile"

### Ursache 2: Root Directory Format-Problem

**Problem:** Root Directory `/kaya-api` könnte falsch interpretiert werden

**Mögliche Interpretationen:**
- `/kaya-api` = absoluter Pfad (falsch)
- `kaya-api` = relativ zum Repo-Root (richtig)

**Lösung:**
1. Railway Dashboard → Settings → Source → Root Directory
2. Ändere von `/kaya-api` auf `kaya-api` (ohne führenden Slash)
3. Speichere und warte auf neuen Build

### Ursache 3: railway.toml wird nicht gefunden oder ignoriert

**Aktuelle Konfiguration:**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile"
```

**Problem:** Railway könnte die `railway.toml` nicht im Root Directory finden

**Lösung:**
1. Prüfe ob `railway.toml` wirklich in `kaya-api/` ist
2. Versuche `dockerfilePath = "Dockerfile"` (ohne `./`)
3. Oder entferne `dockerfilePath` komplett (Railway sollte es automatisch finden)

### Ursache 4: Dockerfile wird nicht gefunden

**Problem:** Trotz Root Directory findet Railway das Dockerfile nicht

**Mögliche Pfad-Probleme:**
- Root Directory: `kaya-api`
- Railway sucht: `kaya-api/Dockerfile` ✅ (sollte funktionieren)
- Aber: Vielleicht sucht Railway im falschen Kontext

**Lösung:**
1. Prüfe Railway Dashboard → Settings → Build → Dockerfile Path
2. Sollte sein: `Dockerfile` (relativ zum Root Directory)
3. Falls leer: Setze auf `Dockerfile`

### Ursache 5: Build-Kontext zu groß oder fehlerhaft

**Problem:** Build-Kontext enthält zu viele Dateien oder fehlerhafte Dateien

**Indizien:**
- Snapshot ist 252 MB (groß)
- Entpackt zu 1.5 GB (sehr groß!)
- `.dockerignore` wurde erstellt, aber vielleicht zu spät

**Lösung:**
1. Prüfe ob `.dockerignore` wirklich im Repository ist
2. Prüfe ob große Dateien ausgeschlossen werden
3. Versuche Build-Kontext zu reduzieren

### Ursache 6: Railway Builder-Problem

**Problem:** Railway Builder crasht oder hängt beim Start

**Indizien:**
- Build wird geplant, aber startet nicht
- Keine Fehler-Logs
- Build "verschwindet" einfach

**Lösung:**
1. Warte einige Minuten (Build könnte noch laufen)
2. Prüfe Railway Status-Seite (für bekannte Probleme)
3. Versuche Force Rebuild
4. Kontaktiere Railway Support

---

## 🔧 Detaillierte Lösungsvorschläge

### Lösung 1: Root Directory Format korrigieren

**Im Railway Dashboard:**
1. Service `kaya-api` → Settings → Source
2. Root Directory: Ändere von `/kaya-api` auf `kaya-api` (ohne Slash)
3. Speichere

**Warum:** Railway interpretiert `/kaya-api` möglicherweise als absoluten Pfad

### Lösung 2: Builder explizit setzen

**Im Railway Dashboard:**
1. Service `kaya-api` → Settings → Build
2. Builder: Explizit auf "Dockerfile" setzen
3. NICHT "Auto-detect" oder "Nixpacks"
4. Speichere

**Warum:** Verhindert, dass Railway auf Railpack/Nixpacks zurückfällt

### Lösung 3: railway.toml vereinfachen

**Ändere `kaya-api/railway.toml`:**
```toml
[build]
builder = "DOCKERFILE"
# dockerfilePath entfernen - Railway findet es automatisch
```

**Oder:**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"  # Ohne ./
```

### Lösung 4: Dockerfile Path explizit setzen

**Im Railway Dashboard:**
1. Service `kaya-api` → Settings → Build
2. Dockerfile Path: Setze auf `Dockerfile`
3. Speichere

**Warum:** Explizite Angabe verhindert Fehler bei der Suche

### Lösung 5: Build-Kontext reduzieren

**Prüfe `.dockerignore`:**
- Stelle sicher, dass große Verzeichnisse ausgeschlossen sind
- `memory/`, `node_modules/`, `logs/` sollten ausgeschlossen sein

**Falls `.dockerignore` nicht wirkt:**
- Prüfe ob es wirklich committed ist
- Prüfe ob es im Root Directory ist (nicht im Projekt-Root)

---

## 📋 Schritt-für-Schritt Debugging

### Schritt 1: Railway Dashboard prüfen (KRITISCH)

1. **Service `kaya-api` → Settings → Source:**
   - Root Directory: Sollte `kaya-api` sein (ohne `/`)
   - Falls `/kaya-api`: Ändere zu `kaya-api`

2. **Service `kaya-api` → Settings → Build:**
   - Builder: Sollte "Dockerfile" sein (nicht "Auto-detect" oder "Nixpacks")
   - Dockerfile Path: Sollte `Dockerfile` sein

3. **Service `kaya-api` → Deployments:**
   - Neuestes Deployment öffnen
   - **Build-Logs** Tab (nicht Runtime-Logs!)
   - Prüfe auf Fehler

### Schritt 2: railway.toml anpassen

**Option A: Vereinfachen**
```toml
[build]
builder = "DOCKERFILE"
```

**Option B: Expliziter Pfad**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
```

### Schritt 3: Force Rebuild

1. Railway Dashboard → Service `kaya-api`
2. Deployments → Neuestes Deployment
3. "Redeploy" oder "Force Rebuild" klicken

### Schritt 4: Prüfe Build-Logs im Dashboard

**WICHTIG:** Die Build-Logs im Dashboard zeigen normalerweise den genauen Fehler!

1. Railway Dashboard → Service `kaya-api`
2. Deployments → Neuestes Deployment
3. **Build-Logs** Tab öffnen
4. Prüfe auf:
   - "dockerfile invalid"
   - "Dockerfile not found"
   - "Builder error"
   - Andere Fehler

---

## 🎯 Wahrscheinlichste Ursache

Basierend auf der Analyse:

**Wahrscheinlichste Ursache:** Railway fällt auf Railpack/Nixpacks zurück oder Root Directory Format ist falsch

**Empfohlene Lösung:**
1. Root Directory von `/kaya-api` auf `kaya-api` ändern (ohne Slash)
2. Builder explizit auf "Dockerfile" setzen (nicht Auto-detect)
3. Force Rebuild

---

## 📝 Checkliste

- [ ] Root Directory Format geprüft (`kaya-api` ohne `/`)
- [ ] Builder explizit auf "Dockerfile" gesetzt
- [ ] Dockerfile Path explizit gesetzt (`Dockerfile`)
- [ ] railway.toml vereinfacht oder angepasst
- [ ] Build-Logs im Dashboard geprüft (nicht CLI-Logs!)
- [ ] Force Rebuild versucht
- [ ] Railway Status-Seite geprüft

---

## 🔍 Nächste Schritte

1. **WICHTIG:** Prüfe Railway Dashboard Build-Logs (nicht CLI-Logs!)
2. Root Directory Format korrigieren (`kaya-api` ohne `/`)
3. Builder explizit setzen
4. Force Rebuild

**Die Build-Logs im Dashboard zeigen normalerweise den genauen Fehler, der in den CLI-Logs nicht erscheint!**

