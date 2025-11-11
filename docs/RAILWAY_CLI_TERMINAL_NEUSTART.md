# Railway CLI - Terminal neu starten

**Datum:** 2025-11-10

---

## 🔄 Terminal neu starten - Methoden

### Methode 1: Aktuelles Terminal schließen und neu öffnen

**PowerShell:**
1. Terminal-Fenster schließen (X oder `exit` eingeben)
2. PowerShell neu öffnen (Windows-Taste → "PowerShell" → Enter)

**CMD:**
1. CMD-Fenster schließen
2. CMD neu öffnen (Windows-Taste + R → `cmd` → Enter)

**VS Code Terminal:**
1. Terminal-Tab schließen (X klicken)
2. Neues Terminal öffnen (Strg + Shift + ` oder Terminal → New Terminal)

---

### Methode 2: Umgebungsvariablen neu laden (OHNE Terminal zu schließen)

**PowerShell:**
```powershell
# Umgebungsvariablen aus User-Profil neu laden
$env:RAILWAY_TOKEN = [System.Environment]::GetEnvironmentVariable("RAILWAY_TOKEN", "User")
```

**Dann testen:**
```powershell
railway whoami
```

---

### Methode 3: PowerShell-Session neu laden

**PowerShell:**
```powershell
# Aktuelle Session neu laden
. $PROFILE
```

Oder:
```powershell
# Umgebungsvariablen manuell setzen
$env:RAILWAY_TOKEN = "47ac28d3-5292-47c0-9630-b7c99a473621"
```

---

## ✅ Nach Terminal-Neustart testen

**1. Authentifizierung prüfen:**
```powershell
railway whoami
```

**Erwartete Ausgabe:**
- Erfolg: Zeigt Account-Informationen
- Fehler: "Unauthorized" oder "Project Token not found"

**2. Service auswählen:**
```powershell
railway service kaya-api
```

**3. Status prüfen:**
```powershell
railway status
```

**4. Variables abrufen:**
```powershell
railway variables
```

---

## 🚨 Falls immer noch "Unauthorized"

**Mögliche Ursachen:**

1. **Token nicht korrekt gesetzt:**
   ```powershell
   # Prüfen
   $env:RAILWAY_TOKEN
   [System.Environment]::GetEnvironmentVariable("RAILWAY_TOKEN", "User")
   ```

2. **Token-Typ falsch:**
   - Projekt-Token: `RAILWAY_TOKEN`
   - Account-Token: `RAILWAY_API_TOKEN` (möglicherweise benötigt)

3. **Token abgelaufen:**
   - Neuen Token im Railway Dashboard erstellen
   - Umgebungsvariable aktualisieren

**Lösung:**
```powershell
# Token manuell setzen (für aktuelle Session)
$env:RAILWAY_TOKEN = "47ac28d3-5292-47c0-9630-b7c99a473621"

# Oder Account-Token versuchen
$env:RAILWAY_API_TOKEN = "47ac28d3-5292-47c0-9630-b7c99a473621"
```

---

## 📝 Zusammenfassung

**Schnellste Methode:**
1. Terminal-Fenster schließen
2. Terminal neu öffnen
3. `railway whoami` testen

**Ohne Terminal zu schließen:**
```powershell
$env:RAILWAY_TOKEN = [System.Environment]::GetEnvironmentVariable("RAILWAY_TOKEN", "User")
railway whoami
```


