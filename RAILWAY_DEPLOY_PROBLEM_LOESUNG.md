# Railway Deploy-Problem - Finale Lösung

## Problem bestätigt (27.10.2024)

**Production-Test Ergebnis:**
```
❌ ALTER HASH: index-f609b524.js (Unity)
❌ Unity-Code NOCH VORHANDEN
❌ Three.js Code NICHT gefunden
```

**Root Cause:** Railway nutzt Build-Cache und hat nicht neu gebaut.

---

## Lösung: NO_CACHE Environment Variable

### Warum funktioniert das?

Railway erkennt `NO_CACHE=1` und **ignoriert den gesamten Build-Cache**:
- Node Modules werden neu installiert
- Vite Build wird komplett neu ausgeführt
- Neue Content-Hashes werden generiert

### Schritt-für-Schritt-Anleitung

#### 1. Railway Dashboard öffnen
```
https://railway.app/
→ Login mit GitHub
→ Projekt: kaya-bot
→ Service: Frontend (app.kaya.wattweiser.com)
```

#### 2. NO_CACHE Variable setzen
```
Variables Tab
→ New Variable
   Key: NO_CACHE
   Value: 1
→ Add
```

Railway triggert **automatisch** einen neuen Deploy.

#### 3. Build-Logs überwachen (KRITISCH!)
```
Deployments Tab
→ Aktueller Build (Building...)
→ Build Logs
```

**Erwartete Log-Ausgabe:**
```bash
🔨 NO_CACHE=1 detected
📦 npm install (komplett neu, nicht cached)
⚡ vite build
✓ 150 modules transformed
dist/index.html                       3.24 kB
dist/assets/index-ABC123XYZ.js      285.43 kB  # <-- NEUER HASH!
dist/assets/react-vendor-DEF456.js  142.18 kB
dist/assets/three-vendor-GHI789.js   98.76 kB  # <-- Three.js!
✓ built in 45s
```

**BAD (alter Cache):**
```bash
dist/assets/index-f609b524.js  # <-- ALTER HASH!
```

Falls alter Hash erscheint → Variable falsch gesetzt oder Railway Bug.

#### 4. Build abwarten
- Dauer: **3-5 Minuten** (ohne Cache länger als normal)
- Status: Waiting... → Building... → **Success** ✅

#### 5. Variable entfernen (WICHTIG!)
```
Variables Tab
→ NO_CACHE → Remove
```

**Warum?** `NO_CACHE=1` macht jeden Build langsam. Nach erfolgreichem Deploy wieder entfernen.

#### 6. Production testen

**PowerShell-Script ausführen:**
```powershell
cd D:\Landkreis
.\test-production-url.ps1
```

**Erwartete Ausgabe:**
```
✅ HTTP Status: 200
✅ Alter Hash NICHT gefunden
✅ Unity-Code entfernt
✅ Three.js Code gefunden
```

**Manueller Browser-Test (Inkognito):**
```
https://app.kaya.wattweiser.com
F12 → Network Tab → JS-Filter
```

**Erfolgskriterien:**
- ✅ Neuer Hash: `index-ABC123XYZ.js` (nicht `f609b524`)
- ✅ Three.js Bundles: `three-vendor-*.js`
- ✅ Console: Keine Unity-Fehler
- ✅ Avatar: Three.js Canvas rendert

---

## Troubleshooting

### Problem 1: Railway baut nicht automatisch
**Symptom:** Keine neue Deployment nach Variable-Änderung.

**Lösung:**
```
Deployments Tab
→ ... (3 Punkte)
→ Redeploy
```

### Problem 2: Alter Hash bleibt trotz NO_CACHE
**Symptom:** Build-Logs zeigen `index-f609b524.js`.

**Root Cause:** Railway Bug oder falsche Service-Selection.

**Nuclear Option:**
1. Service komplett löschen:
   ```
   Settings → Delete Service
   ```
2. Neuen Service erstellen:
   ```
   New Service
   → GitHub Repository
   → Branch: main
   → Root Directory: frontend
   ```
3. Environment Variables setzen:
   ```
   VITE_API_URL=https://kaya.wattweiser.com
   VITE_WS_URL=wss://kaya.wattweiser.com
   VITE_BUILD_ID=20251027-fresh
   ```

### Problem 3: GLB-Asset nicht gefunden (404)
**Symptom:** Browser Console: `404 /avatar/kaya.glb`

**Lösung:**
```bash
cd D:\Landkreis
ls frontend/public/avatar/kaya.glb
```

Falls nicht vorhanden:
```bash
cp D:\Landkreis\avatar\kaya.glb frontend/public/avatar/kaya.glb
git add frontend/public/avatar/kaya.glb
git commit -m "fix: Add GLB asset to public folder"
git push origin main
```

---

## Zeitplan

| Schritt | Dauer |
|---------|-------|
| Variable setzen | 30 Sek |
| Build (ohne Cache) | 3-5 Min |
| Deploy | 30 Sek |
| Variable entfernen | 30 Sek |
| Verifikation | 1 Min |
| **GESAMT** | **~6 Min** |

---

## Nächste Schritte nach Erfolg

1. ✅ Production-Test erfolgreich
2. Git-Tag setzen:
   ```bash
   git tag v2.0.1-threejs
   git push --tags
   ```
3. Mobile-Test durchführen
4. Performance-Check (Lighthouse)
5. Avatar-Animationen testen
6. Dokumentation finalisieren

---

## Beweis des Problems (Test-Output)

```
========================================
KAYA Production Test
========================================

Test 1: Erreichbarkeit...
  HTTP Status: 200
  Content-Length: 3242 bytes

  ❌ ALTER HASH GEFUNDEN!
  ❌ Railway hat NICHT neu gebaut!
  ❌ Unity-Code NOCH VORHANDEN!
  ❌ Three.js Code NICHT gefunden!

Lösung: NO_CACHE=1 Variable setzen
========================================
```

**Datum:** 27.10.2024
**Status:** Problem identifiziert, Lösung bereit

