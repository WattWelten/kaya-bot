# Railway Deploy-Problem - Debugging

## Status

**Build erfolgreich, aber Production zeigt alten Build.**

### Build-Logs Ausschnitt
```
✓ built in 13.13s
=== Successfully Built! ===
[1/1] Healthcheck succeeded!
```

### Production-Test Ergebnis
```
❌ ALTER HASH: index-f609b524.js
❌ Unity-Code VORHANDEN
❌ Three.js NICHT gefunden
```

## Mögliche Ursachen

### 1. CDN/Browser-Caching
**Problem:** Railway nutzt Cloudflare/CDN das Assets cached.

**Test:**
```
Browser: https://app.kaya.wattweiser.com
F12 → Network → Disable Cache
Hard Reload: Ctrl + Shift + R
```

### 2. Build-Logs zeigen alten Hash
**Problem:** Trotz `NO_CACHE=1` wurde alter Build deployed.

**Lösung:** Build-Logs prüfen:
```
Railway Dashboard
→ Deployments
→ Build Logs
→ Nach "dist/assets/index-" suchen
```

**Erwartung:**
```
dist/assets/index-ABC123.js  ← NEUER HASH!
```

**Falls immer noch:**
```
dist/assets/index-f609b524.js  ← ALTER HASH!
```
→ Build-Cache-Problem, löse Variable `NO_CACHE` und setze sie wieder.

### 3. Service nicht Frontend
**Problem:** Falscher Service deployed (Backend statt Frontend).

**Prüfung:**
```
Railway Dashboard
→ Services Liste
→ Welche Services existieren?
→ Welcher zeigt: "app.kaya.wattweiser.com"?
```

### 4. Railway Build-Option ist falsch
**Problem:** Frontend wird als Static Site deployed, nicht als Vite-Build.

**Prüfung:** Settings → Build Command

**Erwartung:**
```
npm run build
```

**Falls falsch:** Dinge korrigieren

## Nächste Debugging-Schritte

### Schritt 1: Build-Logs nach Hash durchsuchen
**Frage:** Was steht in den Build-Logs?

Schaue in Railway unter:
```
Deployments → Build Logs
```

Suche nach: `dist/assets/index-`

**Was siehst du?**
- Neuer Hash (z.B. `index-a1b2c3d4.js`) → CDN-Cache Problem
- Alter Hash (`index-f609b524.js`) → Build-Problem

### Schritt 2: Deployment-URL prüfen
**Frage:** Welcher Service liefert Production?

Railway Dashboard → Services

**Prüfung:**
- Welche Services gibt es?
- Welcher zeigt `app.kaya.wattweiser.com`?
- Ist es der Frontend-Service?

### Schritt 3: Variables prüfen
**Frage:** Ist `NO_CACHE=1` korrekt gesetzt?

Railway Dashboard → Frontend Service → Variables

**Erwartung:**
```
NO_CACHE: 1
```

### Schritt 4: Network-Tab (Browser)
**Frage:** Was lädt der Browser?

```
https://app.kaya.wattweiser.com
F12 → Network → JS-Filter
```

**Prüfen:**
- Welcher Hash wird geladen?
- Status: 200 (Cache Hit) oder 200 (Fresh)?

## Lösungsansätze

### Lösung A: Hard-Clear Browser & Railway
```powershell
# Browser komplett clearen
# Chrome: Settings → Clear Data → All Time → All Data

# Railway: Neuer Deploy
Railway Dashboard → Deploy → Manual Redeploy
```

### Lösung B: Service neu erstellen
Falls nichts funktioniert:

1. **Settings → Delete Service**
2. **New Service → GitHub → `main` Branch**
3. **Root Directory: `frontend`**
4. **Variables setzen:**
   ```
   NO_CACHE=1
   VITE_API_URL=https://kaya.wattweiser.com
   VITE_WS_URL=wss://kaya.wattweiser.com
   ```
5. **Deploy abwarten**

---

**BITTE GIB MIR DIE BUILD-LOG AUSGABE:**
- Was steht bei `dist/assets/index-*`?
- Neuer oder alter Hash?

