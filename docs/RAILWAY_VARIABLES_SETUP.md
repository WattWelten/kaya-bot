# Railway Environment Variables Setup

## kaya-api Service

Folgende Variablen müssen im Railway Dashboard für den Service `kaya-api` gesetzt werden:

### Erforderliche Variablen:

1. **`CORS_ORIGIN`** - CORS-Origin für Frontend (z.B. `https://app.kaya.wattweiser.com`)
2. **`ELEVENLABS_API_KEY`** - ElevenLabs API Key (aus altem Deployment kopieren)
3. **`ELEVENLABS_MODEL_ID`** - ElevenLabs Model ID (Standard: `eleven_multilingual_v2`)
4. **`ELEVENLABS_SIMILARITY`** - Similarity Boost (Standard: `0.85`)
5. **`ELEVENLABS_SPEAKER_BOOST`** - Speaker Boost (Standard: `true`)
6. **`ELEVENLABS_STABILITY`** - Stability (Standard: `0.40`)
7. **`ELEVENLABS_STYLE`** - Style (Standard: `0.15`)
8. **`ELEVENLABS_VOICE_ID`** - Voice ID (z.B. `iFJwt407E3aafIpJFfcu`)
9. **`NODE_ENV`** - Environment (Standard: `production`)
10. **`OPENAI_API_KEY`** - OpenAI API Key (aus altem Deployment kopieren)
11. **`PORT`** - Port (Standard: `3001`, wird von Railway automatisch gesetzt)
12. **`USE_LLM`** - LLM verwenden (Standard: `true`)

## kaya-frontend Service

Folgende Variablen müssen im Railway Dashboard für den Service `kaya-frontend` gesetzt werden:

### Erforderliche Variablen:

1. **`VITE_API_URL`** - API URL für WebSocket (z.B. `wss://api.kaya.wattweiser.com`)
2. **`VITE_BUILD_ID`** - Build ID (z.B. `20251027-fresh` oder aktuelles Datum)

### Optional:

- **`VITE_WS_URL`** - WebSocket URL (falls abweichend von VITE_API_URL)
- **`VITE_KOMMUNE_NAME`** - Name der Kommune (Standard: `Landkreis Oldenburg`)
- **`VITE_KOMMUNE_SHORT_NAME`** - Kurzname (Standard: `KAYA`)

## Setup-Anleitung

### Via Railway Dashboard:

1. Öffne https://railway.app
2. Wähle Projekt "Landkreis Oldenburg"
3. Wähle Service `kaya-api` oder `kaya-frontend`
4. Gehe zu **Variables** Tab
5. Klicke auf **New Variable**
6. Füge alle Variablen hinzu
7. Speichere die Änderungen

### Via Railway CLI:

```bash
# kaya-api Service
railway service kaya-api
railway variables --set "CORS_ORIGIN=https://app.kaya.wattweiser.com"
railway variables --set "ELEVENLABS_API_KEY=dein-api-key"
railway variables --set "ELEVENLABS_MODEL_ID=eleven_multilingual_v2"
railway variables --set "ELEVENLABS_SIMILARITY=0.85"
railway variables --set "ELEVENLABS_SPEAKER_BOOST=true"
railway variables --set "ELEVENLABS_STABILITY=0.40"
railway variables --set "ELEVENLABS_STYLE=0.15"
railway variables --set "ELEVENLABS_VOICE_ID=iFJwt407E3aafIpJFfcu"
railway variables --set "NODE_ENV=production"
railway variables --set "OPENAI_API_KEY=dein-openai-key"
railway variables --set "USE_LLM=true"

# kaya-frontend Service
railway service kaya-frontend
railway variables --set "VITE_API_URL=wss://api.kaya.wattweiser.com"
railway variables --set "VITE_BUILD_ID=20251027-fresh"
```

## Wichtig

- **API-Keys** müssen aus dem alten Railway Deployment kopiert werden
- **CORS_ORIGIN** muss die Frontend-URL sein (z.B. `https://app.kaya.wattweiser.com`)
- **VITE_API_URL** muss die Backend-URL sein (z.B. `wss://api.kaya.wattweiser.com`)

## Prüfen der Variablen

```bash
# Aktuelle Variablen anzeigen
railway service kaya-api
railway variables

railway service kaya-frontend
railway variables
```




