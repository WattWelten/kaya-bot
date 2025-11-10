# Railway Force Rebuild - NO_CACHE Method

## Problem
Production lädt immer noch `index-f609b524.js` (Unity) trotz mehrerer Code-Pushes.

## Lösung: NO_CACHE Environment Variable

### Schritt 1: Railway Dashboard
1. https://railway.app/ → Login
2. Projekt: **kaya-bot**
3. Service: **Frontend** (app.kaya.wattweiser.com)

### Schritt 2: NO_CACHE Variable setzen
1. **Variables** Tab
2. **New Variable**:
   - Key: `NO_CACHE`
   - Value: `1`
3. **Add** klicken

### Schritt 3: Auto-Deploy abwarten
Railway triggert automatisch einen Build (3-4 Minuten).

**Deployments Tab → Build Logs:**
```
🔨 NO_CACHE=1 detected, building without cache
✓ Building Vite app...
dist/assets/index-NEUER_HASH.js  <-- MUSS NEU SEIN!
dist/assets/three-vendor-XYZ.js
```

### Schritt 4: Nach Build - Variable entfernen
1. **Variables** Tab
2. `NO_CACHE` → **Remove**

### Schritt 5: Production testen (Inkognito)
```
https://app.kaya.wattweiser.com
F12 → Network → JS-Filter
```

**Erfolgskriterien:**
- ✅ Neuer Hash (nicht `f609b524`)
- ✅ Keine Unity-Fehler in Console
- ✅ Three.js Canvas rendert
- ✅ WebSocket verbindet

## Troubleshooting

### Alter Hash bleibt bestehen
**Nuclear Option:** Service löschen und neu erstellen
1. Settings → Delete Service
2. New Service → GitHub → `main` Branch
3. Variables neu setzen

### GLB-Asset fehlt (404)
```bash
ls frontend/public/avatar/kaya.glb
```

Falls nicht vorhanden:
```bash
cp D:\Landkreis\avatar\kaya.glb frontend/public/avatar/kaya.glb
git add frontend/public/avatar/kaya.glb
git commit -m "fix: Add GLB asset"
git push
```

## Zeitaufwand
- Variable setzen: 30 Sekunden
- Build (ohne Cache): 3-4 Minuten
- Verifikation: 1 Minute
- **Gesamt: ~5 Minuten**

