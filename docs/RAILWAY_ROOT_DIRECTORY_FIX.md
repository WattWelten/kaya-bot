# Railway Root Directory Fix - Detaillierte Anleitung

## 🔍 Problem identifiziert

Basierend auf den Screenshots aus dem Railway Dashboard:

### Aktuelle Konfiguration (FALSCH)

#### kaya-api:
- **Source Repo**: `WattWelten/kaya-bot` ✅
- **Root Directory**: `/` (Projekt-Root) ❌
- **Builder**: `Dockerfile` ✅
- **Dockerfile Path**: `Dockerfile` ✅

**Problem:** Railway sucht nach `Dockerfile` im Projekt-Root, aber das Dockerfile liegt in `kaya-api/Dockerfile`

#### kaya-frontend:
- **Source Repo**: `WattWelten/kaya-bot` ✅
- **Root Directory**: `/` (Projekt-Root) ❌
- **Builder**: `Dockerfile` ✅
- **Dockerfile Path**: `Dockerfile` ✅

**Problem:** Railway sucht nach `Dockerfile` im Projekt-Root, aber das Dockerfile liegt in `kaya-frontend/Dockerfile`

---

## ✅ Lösung

### Schritt-für-Schritt Anleitung

#### Für kaya-api:

1. **Railway Dashboard öffnen:**
   - Gehe zu: https://railway.app
   - Projekt "Landkreis Oldenburg" → Service `kaya-api`

2. **Settings Tab öffnen:**
   - Klicke auf "Settings" in der Navigation

3. **Source Section finden:**
   - Scrolle zu "Source" (nicht "Build"!)
   - Du siehst "Source Repo" mit `WattWelten/kaya-bot`

4. **Root Directory ändern:**
   - Finde das Feld "Root Directory"
   - Aktueller Wert: `/` (zeigt Projekt-Root)
   - **Ändere zu:** `kaya-api`
   - Klicke auf "Save" oder die Änderung wird automatisch gespeichert

5. **Verifizierung:**
   - Nach der Änderung sollte Railway automatisch einen neuen Build starten
   - Prüfe die Deployments, ob der Build erfolgreich ist

#### Für kaya-frontend:

1. **Service wechseln:**
   - Gehe zu Service `kaya-frontend`

2. **Wiederhole Schritte 2-5:**
   - Settings → Source
   - Root Directory von `/` auf `kaya-frontend` ändern
   - Speichern

---

## 📋 Was bleibt unverändert

Diese Einstellungen sind bereits korrekt und müssen **NICHT** geändert werden:

- ✅ **Builder**: `Dockerfile` (automatisch erkannt)
- ✅ **Dockerfile Path**: `Dockerfile`
- ✅ **Source Repo**: `WattWelten/kaya-bot`

---

## 🎯 Erwartetes Ergebnis

Nach der Änderung:

1. **Railway sucht Dockerfile an korrektem Ort:**
   - `kaya-api/Dockerfile` für kaya-api Service
   - `kaya-frontend/Dockerfile` für kaya-frontend Service

2. **Build sollte erfolgreich sein:**
   - Kein Fehler mehr: "dockerfile invalid: failed to parse dockerfile"
   - Dockerfile wird gefunden und korrekt geparst

3. **Automatisches Deployment:**
   - Railway startet automatisch einen neuen Build
   - Services werden deployed

---

## 🔧 Troubleshooting

### Wenn Root Directory nicht sichtbar ist:

1. Prüfe, ob du im richtigen Tab bist: **Settings** (nicht Build & Deploy)
2. Scrolle nach unten in der Source Section
3. Suche nach "Add Root Directory" Link, falls das Feld noch nicht existiert

### Wenn Build weiterhin fehlschlägt:

1. **Prüfe Root Directory Wert:**
   - Muss exakt `kaya-api` oder `kaya-frontend` sein
   - Keine führenden/schließenden Slashes
   - Keine Leerzeichen

2. **Prüfe Dockerfile Existenz:**
   ```bash
   # Im Repository sollte existieren:
   kaya-api/Dockerfile
   kaya-frontend/Dockerfile
   ```

3. **Force Rebuild:**
   - Railway Dashboard → Service → Deployments
   - Klicke auf "Redeploy"

---

## 📝 Zusammenfassung

**Das einzige Problem:** Root Directory ist auf `/` statt auf `kaya-api`/`kaya-frontend` gesetzt.

**Die Lösung:** Root Directory in den Settings → Source für beide Services ändern.

**Alles andere ist bereits korrekt konfiguriert!**

