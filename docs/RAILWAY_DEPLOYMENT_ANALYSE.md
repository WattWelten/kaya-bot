# Railway Deployment Analyse & Lösungen

## 🔍 Identifizierte Probleme

### Problem 1: Dockerfile wird nicht gefunden
**Fehler:**
```
dockerfile invalid: failed to parse dockerfile: file with no instructions
```

**Ursache:**
- Railway findet das Dockerfile nicht, weil das **Root Directory** im Railway Dashboard nicht korrekt gesetzt ist
- Railway sucht im Root-Verzeichnis des Projekts, nicht in den Service-Unterverzeichnissen

**Lösung:**
1. Railway Dashboard öffnen: https://railway.app
2. Projekt "Landkreis Oldenburg" → Service `kaya-api`
3. **Settings** → **Build & Deploy**
4. Setze:
   - **Root Directory**: `kaya-api`
   - **Builder**: `Dockerfile` (nicht Railpack/Nixpacks!)
   - **Dockerfile Path**: `Dockerfile`
5. Wiederhole für `kaya-frontend`:
   - **Root Directory**: `kaya-frontend`
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile`

---

### Problem 2: GitHub Actions Workflows fehlen
**Fehler:**
```
HTTP 404: workflow deploy-kaya-api.yml not found
HTTP 404: workflow deploy-kaya-frontend.yml not found
```

**Ursache:**
- Workflows existieren lokal, wurden aber noch nicht zu GitHub gepusht
- GitHub kann die Workflows nicht finden, daher keine automatischen Deployments

**Lösung:**
- Workflows wurden bereits zu Git hinzugefügt
- Nächster Schritt: Committen und Pushen

---

### Problem 3: Railway-Konfiguration
**Status:**
- ✅ `railway.toml` Dateien existieren in beiden Service-Verzeichnissen
- ✅ `builder = "DOCKERFILE"` ist gesetzt
- ⚠️ Railway Dashboard muss Root Directory manuell setzen (siehe Problem 1)

---

## ✅ Aktuelle Konfiguration

### kaya-api
- **Dockerfile**: ✅ Existiert und ist korrekt
- **railway.toml**: ✅ Konfiguriert mit `builder = "DOCKERFILE"`
- **Environment Variables**: ✅ Alle gesetzt (inkl. API Keys)
- **Root Directory**: ❌ Muss im Dashboard gesetzt werden

### kaya-frontend
- **Dockerfile**: ✅ Existiert und ist korrekt (Multi-Stage Build)
- **railway.toml**: ✅ Konfiguriert mit `builder = "DOCKERFILE"`
- **Environment Variables**: ✅ Alle gesetzt
- **Root Directory**: ❌ Muss im Dashboard gesetzt werden

---

## 🚀 Lösungsschritte

### Schritt 1: Railway Dashboard konfigurieren (MANUELL)

**Für kaya-api:**
1. Öffne: https://railway.app/project/266dd89d-9821-4f28-8ae5-66761eed2058/service/8b33f312-2ffe-474d-8448-5bf8c9094bf0
2. Gehe zu **Settings** → **Build & Deploy**
3. Setze:
   ```
   Root Directory: kaya-api
   Builder: Dockerfile
   Dockerfile Path: Dockerfile
   ```
4. Speichere

**Für kaya-frontend:**
1. Öffne: https://railway.app/project/266dd89d-9821-4f28-8ae5-66761eed2058/service/c841264c-7bd6-489a-8bc1-65d8dc19337e
2. Gehe zu **Settings** → **Build & Deploy**
3. Setze:
   ```
   Root Directory: kaya-frontend
   Builder: Dockerfile
   Dockerfile Path: Dockerfile
   ```
4. Speichere

### Schritt 2: GitHub Actions Workflows pushen

Die Workflows müssen committed und gepusht werden:
```bash
git commit -m "feat: Add GitHub Actions workflows for Railway deployment"
git push origin main
```

### Schritt 3: Deployment testen

Nach dem Push sollten:
1. GitHub Actions automatisch ausgelöst werden
2. Railway die Services neu bauen (mit korrektem Root Directory)
3. Beide Services erfolgreich deployed werden

---

## 📋 Checkliste

- [ ] Railway Dashboard: Root Directory für `kaya-api` gesetzt
- [ ] Railway Dashboard: Root Directory für `kaya-frontend` gesetzt
- [ ] Railway Dashboard: Builder auf "Dockerfile" gesetzt (beide Services)
- [ ] GitHub Actions Workflows gepusht
- [ ] Railway Builds erfolgreich
- [ ] Services laufen und sind erreichbar

---

## 🔧 Troubleshooting

### Wenn Build weiterhin fehlschlägt:

1. **Prüfe Railway Logs:**
   ```bash
   railway service kaya-api
   railway logs --tail 100
   ```

2. **Prüfe, ob Dockerfile im Root Directory ist:**
   - Railway sollte das Dockerfile in `kaya-api/Dockerfile` finden
   - Wenn Root Directory nicht gesetzt ist, sucht Railway im Projekt-Root

3. **Force Rebuild:**
   - Im Railway Dashboard → Service → Deployments
   - Klicke auf "Redeploy"

4. **Prüfe GitHub Actions:**
   ```bash
   gh run list --limit 10
   gh run view <run-id>
   ```

---

## 📝 Notizen

- Die Dockerfiles sind korrekt und sollten funktionieren
- Das Hauptproblem ist die Railway Dashboard-Konfiguration
- Nach dem Setzen des Root Directory sollten die Builds erfolgreich sein

