# Railway Monorepo Setup - Vollständige Anleitung

## Übersicht

Diese Anleitung beschreibt die korrekte Konfiguration von Railway für ein Monorepo mit mehreren Services in Unterverzeichnissen (`kaya-api`, `kaya-frontend`).

## Repository-Struktur

```
.
├── railway.toml              # Projekt-Level (nur Dokumentation)
├── .railwayignore           # Verhindert Railpack Auto-Detection
├── kaya-api/
│   ├── Dockerfile
│   ├── railway.toml         # Service-spezifische Konfiguration
│   ├── .railwayignore       # Verhindert Railpack Auto-Detection
│   └── .dockerignore
└── kaya-frontend/
    ├── Dockerfile
    ├── railway.toml         # Service-spezifische Konfiguration
    ├── .railwayignore       # Verhindert Railpack Auto-Detection
    └── .dockerignore
```

## Konfigurationsdateien

### 1. Root railway.toml

**Zweck:** Nur Projekt-Level-Dokumentation, keine Builder-Konfiguration

**Inhalt:**
```toml
# Railway Project Configuration
# Services werden über ihre eigenen railway.toml Dateien konfiguriert
# Jeder Service (kaya-api, kaya-frontend) hat seine eigene railway.toml im Service-Verzeichnis
```

**Wichtig:** Keine `[build]` Section im Root! Diese würde Service-Konfigurationen überschreiben.

### 2. Service railway.toml (kaya-api/railway.toml)

**Zweck:** Service-spezifische Build- und Deploy-Konfiguration

**Inhalt:**
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

### 3. Service railway.toml (kaya-frontend/railway.toml)

**Zweck:** Service-spezifische Build- und Deploy-Konfiguration

**Inhalt:**
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

### 4. .railwayignore Dateien

**Zweck:** Verhindert, dass Railway Railpack/Nixpacks automatisch erkennt

**Root .railwayignore:**
```
railpack-plan.json
.railpack/
nixpacks.toml
```

**Service .railwayignore (kaya-api/.railwayignore und kaya-frontend/.railwayignore):**
```
# Ignore Railpack detection
railpack-plan.json
.railpack/
nixpacks.toml
```

## Railway Dashboard Konfiguration

**WICHTIG:** Dashboard-Einstellungen haben **Priorität** über `railway.toml`!

### Für kaya-api Service:

1. **Railway Dashboard öffnen:**
   - Gehe zu: https://railway.app
   - Projekt "Landkreis Oldenburg" → Service `kaya-api`

2. **Settings → Source:**
   - **Root Directory:** `kaya-api` (ohne führenden Slash!)
   - **Source Repo:** `WattWelten/kaya-bot`

3. **Settings → Build:**
   - **Builder:** `Dockerfile` (NICHT "Auto-detect"!)
   - **Dockerfile Path:** `Dockerfile`

4. **Speichere die Änderungen**

### Für kaya-frontend Service:

1. **Service `kaya-frontend` öffnen**

2. **Settings → Source:**
   - **Root Directory:** `kaya-frontend` (ohne führenden Slash!)
   - **Source Repo:** `WattWelten/kaya-bot`

3. **Settings → Build:**
   - **Builder:** `Dockerfile` (NICHT "Auto-detect"!)
   - **Dockerfile Path:** `Dockerfile`

4. **Speichere die Änderungen**

## Priorität der Konfiguration

1. **Railway Dashboard Einstellungen** (höchste Priorität)
   - Überschreiben `railway.toml` wenn gesetzt
   - Müssen manuell im Dashboard geändert werden

2. **Service railway.toml** (im Service-Verzeichnis)
   - Werden verwendet wenn Dashboard-Einstellungen nicht gesetzt sind
   - Service-spezifische Konfiguration

3. **Root railway.toml**
   - Nur für Projekt-Level-Dokumentation
   - Sollte KEINE Builder-Konfiguration enthalten

## Häufige Probleme und Lösungen

### Problem 1: Railway verwendet Railpack/Nixpacks statt Dockerfile

**Symptom:**
- Build-Logs zeigen "Using Nixpacks" oder "Using Railpack"
- Keine Docker-Build-Logs

**Ursache:**
- Dashboard Builder ist auf "Auto-detect" gesetzt
- Oder `.railwayignore` fehlt

**Lösung:**
1. Railway Dashboard → Service → Settings → Build
2. Builder explizit auf "Dockerfile" setzen (nicht "Auto-detect")
3. Prüfe ob `.railwayignore` im Service-Verzeichnis existiert

### Problem 2: Dockerfile wird nicht gefunden

**Symptom:**
- Fehler: "dockerfile invalid: failed to parse dockerfile: file with no instructions"

**Ursache:**
- Root Directory ist falsch gesetzt (z.B. `/` statt `kaya-api`)
- Oder Dockerfile Path ist falsch

**Lösung:**
1. Railway Dashboard → Service → Settings → Source
2. Root Directory auf `kaya-api` bzw. `kaya-frontend` setzen (ohne `/`)
3. Settings → Build → Dockerfile Path auf `Dockerfile` setzen

### Problem 3: Build wird geplant, startet aber nicht

**Symptom:**
- Logs zeigen "scheduling build" aber keine Docker-Build-Logs danach

**Ursache:**
- Dashboard Builder ist auf "Auto-detect" (überschreibt railway.toml)
- Oder Root Directory ist falsch

**Lösung:**
1. Railway Dashboard → Service → Settings → Build
2. Builder explizit auf "Dockerfile" setzen
3. Prüfe Root Directory (sollte `kaya-api` bzw. `kaya-frontend` sein)
4. Force Rebuild im Dashboard

### Problem 4: railway.toml wird ignoriert

**Symptom:**
- Änderungen in `railway.toml` werden nicht übernommen

**Ursache:**
- Dashboard-Einstellungen überschreiben `railway.toml`

**Lösung:**
- Dashboard-Einstellungen müssen manuell angepasst werden
- Oder Dashboard-Einstellungen löschen, damit `railway.toml` verwendet wird

## Checkliste für korrekte Konfiguration

### Code-Seite (Git Repository):

- [x] Root `railway.toml` existiert (ohne `[build]` Section)
- [x] Root `.railwayignore` existiert
- [x] `kaya-api/railway.toml` existiert mit `builder = "DOCKERFILE"`
- [x] `kaya-api/.railwayignore` existiert
- [x] `kaya-api/Dockerfile` existiert
- [x] `kaya-frontend/railway.toml` existiert mit `builder = "DOCKERFILE"`
- [x] `kaya-frontend/.railwayignore` existiert
- [x] `kaya-frontend/Dockerfile` existiert

### Dashboard-Seite (Railway):

- [ ] kaya-api: Root Directory = `kaya-api` (ohne `/`)
- [ ] kaya-api: Builder = `Dockerfile` (nicht "Auto-detect")
- [ ] kaya-api: Dockerfile Path = `Dockerfile`
- [ ] kaya-frontend: Root Directory = `kaya-frontend` (ohne `/`)
- [ ] kaya-frontend: Builder = `Dockerfile` (nicht "Auto-detect")
- [ ] kaya-frontend: Dockerfile Path = `Dockerfile`

## Deployment-Prozess

1. **Code-Änderungen:**
   - Änderungen in `kaya-api/` oder `kaya-frontend/` werden committed
   - Push zu GitHub `main` Branch

2. **Automatisches Deployment:**
   - GitHub Actions Workflows deployen automatisch zu Railway
   - Oder Railway erkennt Änderungen und startet Build

3. **Build-Prozess:**
   - Railway lädt Repository-Snapshot
   - Wechselt in Root Directory (`kaya-api` oder `kaya-frontend`)
   - Liest `railway.toml` im Service-Verzeichnis
   - Verwendet Dockerfile für Build
   - Deployed Service

## Troubleshooting

### Build-Logs prüfen

**Wichtig:** Prüfe Build-Logs im Railway Dashboard, nicht CLI-Logs!

1. Railway Dashboard → Service → Deployments
2. Neuestes Deployment öffnen
3. **Build-Logs** Tab (nicht Runtime-Logs!)
4. Prüfe auf Fehler

### Lokaler Docker-Build-Test

```bash
# Für kaya-api
cd kaya-api
docker build -t kaya-api-test .

# Für kaya-frontend
cd kaya-frontend
docker build -t kaya-frontend-test .
```

Falls lokaler Build erfolgreich ist, liegt das Problem bei Railway-Konfiguration, nicht beim Dockerfile.

### Force Rebuild

1. Railway Dashboard → Service → Deployments
2. Neuestes Deployment öffnen
3. "Redeploy" oder "Force Rebuild" klicken

## Zusammenfassung

**Wichtigste Punkte:**

1. **Dashboard-Einstellungen haben Priorität** über `railway.toml`
2. **Root Directory** muss im Dashboard gesetzt sein (`kaya-api` bzw. `kaya-frontend`)
3. **Builder** muss im Dashboard auf "Dockerfile" gesetzt sein (nicht "Auto-detect")
4. **Service railway.toml** Dateien müssen `builder = "DOCKERFILE"` enthalten
5. **.railwayignore** Dateien verhindern Railpack Auto-Detection

**Nach korrekter Konfiguration:**
- Railway verwendet Dockerfile für Builds
- Build-Logs erscheinen korrekt
- Services werden erfolgreich deployed


