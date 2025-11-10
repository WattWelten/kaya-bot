# Railway Umgebungsvariablen - Windows Setup

**Datum:** 2025-11-10  
**Zweck:** Welche Umgebungsvariablen für Railway CLI in Windows gesetzt werden sollten

---

## 🔐 Railway CLI Umgebungsvariablen

### Option 1: Account-Token (Empfohlen für lokale Entwicklung)

**Umgebungsvariable:** `RAILWAY_API_TOKEN`

**Wert:** `e5f152f2-e0ff-437d-907e-5aa903527049` (Account-Token)

**Verwendung:**
- ✅ `railway whoami` - Funktioniert
- ✅ `railway init` - Funktioniert
- ✅ Alle projektübergreifenden Aktionen

**Setzen in Windows:**

**Via PowerShell (als Administrator):**
```powershell
[System.Environment]::SetEnvironmentVariable("RAILWAY_API_TOKEN", "e5f152f2-e0ff-437d-907e-5aa903527049", "User")
```

**Via GUI:**
1. Windows-Taste + R → `sysdm.cpl` → Enter
2. Tab "Erweitert" → "Umgebungsvariablen"
3. Unter "Benutzervariablen" → "Neu"
4. Name: `RAILWAY_API_TOKEN`
5. Wert: `e5f152f2-e0ff-437d-907e-5aa903527049`
6. OK → OK

---

### Option 2: Projekt-Token (Für CI/CD oder projekt-spezifische Aktionen)

**Umgebungsvariable:** `RAILWAY_TOKEN`

**Wert:** Projekt-Token (aus Railway Dashboard)

**Verwendung:**
- ✅ `railway up` - Deployments
- ✅ `railway logs` - Logs abrufen
- ✅ `railway redeploy` - Redeployments
- ❌ `railway whoami` - Funktioniert NICHT
- ❌ `railway init` - Funktioniert NICHT

**Setzen in Windows:**

**Via PowerShell (als Administrator):**
```powershell
[System.Environment]::SetEnvironmentVariable("RAILWAY_TOKEN", "PROJEKT_TOKEN_HIER", "User")
```

**Via GUI:**
1. Windows-Taste + R → `sysdm.cpl` → Enter
2. Tab "Erweitert" → "Umgebungsvariablen"
3. Unter "Benutzervariablen" → "Neu"
4. Name: `RAILWAY_TOKEN`
5. Wert: Projekt-Token aus Railway Dashboard
6. OK → OK

---

## ⚠️ WICHTIG: Token-Konflikte

**Laut Railway Dokumentation:**
> "You can only use one type of token at a time. If both are set, the `RAILWAY_TOKEN` variable will take precedence."

**Empfehlung:**
- **Für lokale Entwicklung:** Nur `RAILWAY_API_TOKEN` setzen
- **Für CI/CD:** Nur `RAILWAY_TOKEN` setzen
- **NICHT beide gleichzeitig setzen!**

---

## 🔧 Aktuelle Empfehlung

**Da du dich bereits mit `railway login` authentifiziert hast:**

1. **Keine Umgebungsvariablen nötig!**
   - Die Authentifizierung ist in `%USERPROFILE%\.railway\config.json` gespeichert
   - Railway CLI sollte automatisch funktionieren

2. **Falls Token-Authentifizierung benötigt wird (z.B. für CI/CD):**
   - Setze nur `RAILWAY_API_TOKEN` (Account-Token)
   - Oder nur `RAILWAY_TOKEN` (Projekt-Token)
   - **NICHT beide!**

---

## 📋 Prüfen welche Variablen gesetzt sind

**PowerShell:**
```powershell
# Benutzer-Umgebungsvariablen prüfen
[System.Environment]::GetEnvironmentVariable("RAILWAY_TOKEN", "User")
[System.Environment]::GetEnvironmentVariable("RAILWAY_API_TOKEN", "User")

# Alle Railway-Variablen anzeigen
Get-ChildItem Env: | Where-Object { $_.Name -like "*RAILWAY*" }
```

**CMD:**
```cmd
echo %RAILWAY_TOKEN%
echo %RAILWAY_API_TOKEN%
```

---

## 🚨 Bekanntes Problem

**Aktuell gibt es ein Bug in Railway CLI:**
- Token-Authentifizierung funktioniert nicht zuverlässig
- Siehe: [Railway Station Forum](https://station.railway.com/questions/cli-throwing-unauthorized-with-railway-24883ba1)

**Workaround:**
- `railway login` verwenden (interaktiv)
- Token wird in Konfigurationsdatei gespeichert
- Funktioniert zuverlässiger als Umgebungsvariablen

---

## ✅ Empfohlene Konfiguration

**Für lokale Entwicklung:**

1. **Keine Umgebungsvariablen setzen** (da `railway login` bereits funktioniert)
2. **Oder:** Nur `RAILWAY_API_TOKEN` setzen (Account-Token)

**Für CI/CD (GitHub Actions):**

1. **Nur `RAILWAY_TOKEN` setzen** (Projekt-Token)
2. **Oder:** Nur `RAILWAY_API_TOKEN` setzen (Account-Token)
3. **In GitHub Secrets speichern:**
   - `RAILWAY_TOKEN` oder `RAILWAY_API_TOKEN`
   - `RAILWAY_PROJECT_ID`

---

## 📝 Zusammenfassung

**Was sollte gesetzt werden?**

**Option A: Nichts (Empfohlen)**
- `railway login` bereits ausgeführt
- Konfiguration in `%USERPROFILE%\.railway\config.json`
- Keine Umgebungsvariablen nötig

**Option B: Nur RAILWAY_API_TOKEN**
- Für Account-Token
- Funktioniert für alle Aktionen
- Setzen nur wenn Token-Authentifizierung benötigt wird

**Option C: Nur RAILWAY_TOKEN**
- Für Projekt-Token
- Funktioniert nur für projekt-spezifische Aktionen
- Setzen nur für CI/CD oder projekt-spezifische Scripts

**WICHTIG:** Nie beide gleichzeitig setzen!

