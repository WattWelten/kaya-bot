# Railway CLI Authentifizierung - Dauerhafte Einrichtung

**Datum:** 2025-11-10  
**Zweck:** Railway CLI dauerhaft authentifizieren, damit Logs und Status immer abrufbar sind

---

## 🔍 Problem

**Aktueller Status:**
```
Project Token not found
Unauthorized. Please login with `railway login`
```

Die Railway CLI ist nicht authentifiziert, daher können keine Logs, Deployments oder Status-Informationen abgerufen werden.

---

## ✅ Lösung: Dauerhafte Authentifizierung

### Option 1: Railway Token als Windows-Umgebungsvariable (Empfohlen)

**Vorteile:**
- Funktioniert dauerhaft für alle Terminal-Sessions
- Keine interaktive Eingabe nötig
- Funktioniert auch in PowerShell und CMD

**Schritte:**

1. **Windows-Umgebungsvariable setzen:**

   **Via PowerShell (als Administrator):**
   ```powershell
   [System.Environment]::SetEnvironmentVariable("RAILWAY_TOKEN", "47ac28d3-5292-47c0-9630-b7c99a473621", "User")
   ```

   **Via GUI:**
   1. Windows-Taste + R → `sysdm.cpl` → Enter
   2. Tab "Erweitert" → "Umgebungsvariablen"
   3. "Neu" unter "Benutzervariablen"
   4. Name: `RAILWAY_TOKEN`
   5. Wert: `47ac28d3-5292-47c0-9630-b7c99a473621`
   6. OK → OK

2. **Terminal neu starten** (oder PowerShell-Session neu laden)

3. **Testen:**
   ```powershell
   railway whoami
   railway service kaya-api
   railway variables
   ```

---

### Option 2: Railway Login (Interaktiv)

**Vorteile:**
- Offizielle Methode
- Token wird automatisch gespeichert

**Schritte:**

1. **Railway Login ausführen:**
   ```powershell
   railway login
   ```

2. **Browser öffnet sich automatisch:**
   - Railway-Account auswählen
   - Zugriff erlauben

3. **Token wird automatisch gespeichert:**
   - In `%USERPROFILE%\.railway\config.json`

4. **Testen:**
   ```powershell
   railway whoami
   ```

**Nachteil:** Erfordert interaktive Eingabe, funktioniert nicht in nicht-interaktiven Umgebungen.

---

### Option 3: Railway Token in Projekt-Konfiguration

**Für lokale Entwicklung:**

1. **Erstelle `.railway-token` Datei im Projekt-Root:**
   ```
   47ac28d3-5292-47c0-9630-b7c99a473621
   ```

2. **Füge zu `.gitignore` hinzu:**
   ```
   .railway-token
   ```

3. **Lade Token in PowerShell:**
   ```powershell
   $env:RAILWAY_TOKEN = Get-Content .railway-token
   ```

**Nachteil:** Muss bei jeder neuen Session gesetzt werden.

---

## 🔧 Empfohlene Lösung: Windows-Umgebungsvariable

**Warum:**
- ✅ Funktioniert dauerhaft
- ✅ Keine manuelle Eingabe nötig
- ✅ Funktioniert in allen Terminals
- ✅ Funktioniert auch in CI/CD (falls lokal getestet)

**Einrichtung:**

```powershell
# Als Administrator ausführen
[System.Environment]::SetEnvironmentVariable("RAILWAY_TOKEN", "47ac28d3-5292-47c0-9630-b7c99a473621", "User")
```

**Nach Einrichtung:**
- Terminal neu starten
- `railway whoami` testen
- `railway service kaya-api` testen

---

## 📋 Verfügbare Railway CLI Befehle (nach Authentifizierung)

### Service-Management
```powershell
railway service kaya-api
railway service kaya-frontend
railway status
```

### Environment Variables
```powershell
railway variables
railway variables set KEY=value
railway variables unset KEY
```

### Deployments
```powershell
railway deployment list --limit 10
railway deployment logs <DEPLOYMENT_ID>
railway deployment redeploy <DEPLOYMENT_ID>
```

### Logs
```powershell
railway logs --tail 200
railway logs --build --lines 500
railway logs --deployment <DEPLOYMENT_ID> --lines 500
```

### Projekt-Linking
```powershell
railway link -p 266dd89d-9821-4f28-8ae5-66761eed2058
railway link -p 266dd89d-9821-4f28-8ae5-66761eed2058 -s kaya-api
```

---

## 🔐 Token-Typen

**Wichtig:** Der verwendete Token ist ein **Projekt-Token** (`47ac28d3-5292-47c0-9630-b7c99a473621`).

**Token-Typen:**
- **Account-Token:** Zugriff auf alle Projekte und Teams
- **Team-Token:** Zugriff auf alle Ressourcen eines Teams
- **Projekt-Token:** Zugriff auf ein spezifisches Projekt (aktuell verwendet)

**Für umfassenden Zugriff:** Account-Token erstellen:
1. Railway Dashboard → Account Settings → Tokens
2. "New Token" → "Account Token"
3. Token kopieren und als Umgebungsvariable setzen

---

## ✅ Nach Einrichtung

**Test-Befehle:**
```powershell
# Authentifizierung prüfen
railway whoami

# Service auswählen
railway service kaya-api

# Variables abrufen
railway variables

# Deployments auflisten
railway deployment list --limit 5

# Build-Logs abrufen
railway logs --build --lines 500

# Status prüfen
railway status
```

---

## 🚨 Troubleshooting

### Problem: "Project Token not found"

**Lösung:**
1. Prüfe ob `RAILWAY_TOKEN` gesetzt ist:
   ```powershell
   $env:RAILWAY_TOKEN
   ```

2. Falls leer: Umgebungsvariable setzen (siehe Option 1)

3. Terminal neu starten

### Problem: "Unauthorized. Please login with `railway login`"

**Lösung:**
1. Prüfe ob Token korrekt ist
2. Versuche `railway login` (interaktiv)
3. Oder setze `RAILWAY_TOKEN` Umgebungsvariable

### Problem: Token funktioniert nicht

**Lösung:**
1. Prüfe ob Token noch gültig ist
2. Erstelle neuen Token im Railway Dashboard
3. Setze neuen Token als Umgebungsvariable

---

## 📝 Zusammenfassung

**Empfohlene Einrichtung:**
1. ✅ Windows-Umgebungsvariable `RAILWAY_TOKEN` setzen
2. ✅ Terminal neu starten
3. ✅ `railway whoami` testen
4. ✅ `railway service kaya-api` testen

**Nach Einrichtung:**
- Railway CLI ist dauerhaft authentifiziert
- Alle Befehle funktionieren ohne weitere Eingabe
- Logs, Deployments und Status können immer abgerufen werden


