# Railway Setup Anleitung

## Services im Railway Dashboard konfigurieren

Nachdem die Services `kaya-api` und `kaya-frontend` erstellt wurden, müssen sie im Railway Dashboard konfiguriert werden:

### 1. Service: kaya-api

1. Öffne das Railway Dashboard für das Projekt "Landkreis Oldenburg"
2. Wähle den Service `kaya-api`
3. Gehe zu **Settings** → **Build & Deploy**
4. Setze folgende Werte:
   - **Root Directory**: `kaya-api`
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile`
5. Speichere die Änderungen

### 2. Service: kaya-frontend

1. Wähle den Service `kaya-frontend`
2. Gehe zu **Settings** → **Build & Deploy**
3. Setze folgende Werte:
   - **Root Directory**: `kaya-frontend`
   - **Builder**: `Dockerfile` (WICHTIG: Nicht Railpack/Nixpacks!)
   - **Dockerfile Path**: `Dockerfile`
4. Speichere die Änderungen

## Wichtig: Dockerfile statt Railpack verwenden

Railway erkennt automatisch Node.js-Projekte und versucht Railpack zu verwenden. Um das Dockerfile zu verwenden:

1. **Builder explizit auf "Dockerfile" setzen** (nicht "Nixpacks" oder "Railpack")
2. Die `railway.toml` Datei in jedem Service-Verzeichnis sollte `builder = "DOCKERFILE"` enthalten

## Environment Variables

Stelle sicher, dass die folgenden Environment Variables für jeden Service gesetzt sind:

### kaya-api
- `PORT` (wird automatisch von Railway gesetzt)
- `NODE_ENV=production`
- Weitere Backend-spezifische Variablen (siehe `kaya-api/.env.example`)

### kaya-frontend
- `PORT` (wird automatisch von Railway gesetzt)
- `NODE_ENV=production`
- Frontend-spezifische Variablen (siehe `kaya-frontend/.env.example`)

## Deployment

Nach der Konfiguration werden die Services automatisch über GitHub Actions deployed, wenn:
- Code auf `main` Branch gepusht wird
- Änderungen in den entsprechenden Service-Verzeichnissen gemacht werden

## Troubleshooting

### Problem: Railway verwendet Railpack statt Dockerfile

**Lösung:**
1. Im Railway Dashboard → Service Settings → Build & Deploy
2. Builder explizit auf "Dockerfile" setzen
3. Root Directory muss korrekt sein (`kaya-api` oder `kaya-frontend`)

### Problem: Build schlägt fehl wegen package-lock.json

**Lösung:**
```bash
cd kaya-frontend
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

### Problem: Service findet Dockerfile nicht

**Lösung:**
1. Prüfe, ob `Dockerfile` im Service-Verzeichnis existiert
2. Prüfe Root Directory im Railway Dashboard
3. Prüfe `railway.toml` im Service-Verzeichnis




