# Railway Token Problem - Authentifizierung funktioniert nicht

**Datum:** 2025-11-10  
**Problem:** Railway CLI erkennt Token nicht, obwohl Umgebungsvariable gesetzt ist

---

## 🔍 Aktuelles Problem

**Token gesetzt:**
- Umgebungsvariable: `RAILWAY_TOKEN = e5f152f2-e0ff-437d-907e-5aa903527049`
- Token-Typ: Account-Token (neu erstellt)

**Fehler:**
```
Unauthorized. Please login with `railway login`
Project Token not found
```

---

## 🔧 Mögliche Lösungen

### Lösung 1: Railway Login (Interaktiv) - Empfohlen

**Warum:** Railway CLI speichert Token automatisch in Konfigurationsdatei

**Schritte:**
1. Terminal öffnen
2. Ausführen:
   ```powershell
   railway login
   ```
3. Browser öffnet sich automatisch
4. Railway-Account auswählen und Zugriff erlauben
5. Token wird automatisch in `%USERPROFILE%\.railway\config.json` gespeichert

**Vorteil:** Funktioniert garantiert, Token wird dauerhaft gespeichert

---

### Lösung 2: Token in Railway-Konfigurationsdatei speichern

**Manuell:**

1. Railway-Konfigurationsverzeichnis erstellen (falls nicht vorhanden):
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.railway"
   ```

2. Konfigurationsdatei erstellen/aktualisieren:
   ```powershell
   $config = @{
       token = "e5f152f2-e0ff-437d-907e-5aa903527049"
   } | ConvertTo-Json
   
   $config | Out-File -FilePath "$env:USERPROFILE\.railway\config.json" -Encoding UTF8
   ```

3. Testen:
   ```powershell
   railway whoami
   ```

---

### Lösung 3: Umgebungsvariable richtig setzen

**Problem:** Railway CLI liest möglicherweise `RAILWAY_API_TOKEN` statt `RAILWAY_TOKEN`

**Lösung:** Beide setzen:
```powershell
$env:RAILWAY_TOKEN = "e5f152f2-e0ff-437d-907e-5aa903527049"
$env:RAILWAY_API_TOKEN = "e5f152f2-e0ff-437d-907e-5aa903527049"
```

**Dauerhaft (Windows-Umgebungsvariablen):**
1. Beide Variablen setzen:
   - `RAILWAY_TOKEN`
   - `RAILWAY_API_TOKEN`
2. Beide mit demselben Wert: `e5f152f2-e0ff-437d-907e-5aa903527049`

---

### Lösung 4: Railway CLI Version prüfen

**Mögliches Problem:** Alte Railway CLI Version unterstützt Token-Authentifizierung nicht richtig

**Lösung:**
```powershell
# Aktuelle Version prüfen
railway --version

# Railway CLI aktualisieren
npm install -g @railway/cli@latest
# Oder
railway upgrade
```

---

## ✅ Empfohlene Lösung: Railway Login

**Warum:**
- ✅ Funktioniert garantiert
- ✅ Token wird automatisch gespeichert
- ✅ Keine manuelle Konfiguration nötig
- ✅ Funktioniert mit allen Railway CLI Versionen

**Schritte:**
1. Terminal öffnen
2. `railway login` ausführen
3. Browser öffnet sich → Account auswählen
4. Fertig!

**Nach Login:**
```powershell
railway whoami
railway service kaya-api
railway variables
railway logs --build --lines 500
```

---

## 🔍 Debugging

**Prüfe Token:**
```powershell
# Umgebungsvariable prüfen
$env:RAILWAY_TOKEN
$env:RAILWAY_API_TOKEN

# System-Umgebungsvariable prüfen
[System.Environment]::GetEnvironmentVariable("RAILWAY_TOKEN", "User")
```

**Prüfe Railway-Konfiguration:**
```powershell
# Konfigurationsdatei prüfen
Test-Path "$env:USERPROFILE\.railway\config.json"
Get-Content "$env:USERPROFILE\.railway\config.json"
```

**Prüfe Railway CLI Version:**
```powershell
railway --version
```

---

## 📝 Nächste Schritte

1. **Versuche `railway login`** (interaktiv) - Das ist die zuverlässigste Methode
2. Falls das nicht funktioniert: Prüfe Railway CLI Version und aktualisiere falls nötig
3. Falls weiterhin Probleme: Token in Konfigurationsdatei manuell speichern

---

## 🚨 Wichtig

**Account-Token vs. Projekt-Token:**
- **Account-Token:** Für kontoübergreifende Aktionen (empfohlen)
- **Projekt-Token:** Für projekt-spezifische Aktionen

Der verwendete Token (`e5f152f2-e0ff-437d-907e-5aa903527049`) ist ein Account-Token, was korrekt ist.

