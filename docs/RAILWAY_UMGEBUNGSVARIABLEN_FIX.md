# Railway Umgebungsvariablen - Fix

**Datum:** 2025-11-10  
**Problem:** Beide `RAILWAY_TOKEN` und `RAILWAY_API_TOKEN` sind gesetzt

---

## 🔍 Aktuelles Problem

**Beide Umgebungsvariablen sind gesetzt:**
- ✅ `RAILWAY_API_TOKEN` = `e5f152f2-e0ff-437d-907e-5aa903527049` (Account-Token)
- ✅ `RAILWAY_TOKEN` = `e5f152f2-e0ff-437d-907e-5aa903527049` (gleicher Wert)

**Laut Railway Dokumentation:**
> "You can only use one type of token at a time. If both are set, the `RAILWAY_TOKEN` variable will take precedence."

**Problem:**
- `RAILWAY_TOKEN` hat Vorrang
- Aber der Wert ist ein Account-Token, nicht ein Projekt-Token
- Das kann zu Konflikten führen

---

## ✅ Lösung

### Option 1: Nur RAILWAY_API_TOKEN behalten (Empfohlen)

**Da es ein Account-Token ist und für alle Aktionen funktioniert:**

**Via PowerShell (als Administrator):**
```powershell
# RAILWAY_TOKEN entfernen
[System.Environment]::SetEnvironmentVariable("RAILWAY_TOKEN", $null, "User")
```

**Via GUI:**
1. Windows-Taste + R → `sysdm.cpl` → Enter
2. Tab "Erweitert" → "Umgebungsvariablen"
3. Unter "Benutzervariablen" → `RAILWAY_TOKEN` auswählen
4. "Löschen" klicken
5. OK → OK

**Dann:**
- Terminal neu starten
- Railway CLI sollte funktionieren

---

### Option 2: Beide entfernen (Empfohlen wenn `railway login` funktioniert)

**Da `railway login` bereits erfolgreich war:**
- Authentifizierung ist in `%USERPROFILE%\.railway\config.json` gespeichert
- Keine Umgebungsvariablen nötig

**Via PowerShell (als Administrator):**
```powershell
# Beide entfernen
[System.Environment]::SetEnvironmentVariable("RAILWAY_TOKEN", $null, "User")
[System.Environment]::SetEnvironmentVariable("RAILWAY_API_TOKEN", $null, "User")
```

**Via GUI:**
1. Windows-Taste + R → `sysdm.cpl` → Enter
2. Tab "Erweitert" → "Umgebungsvariablen"
3. Unter "Benutzervariablen":
   - `RAILWAY_TOKEN` auswählen → "Löschen"
   - `RAILWAY_API_TOKEN` auswählen → "Löschen"
4. OK → OK

**Dann:**
- Terminal neu starten
- Railway CLI sollte mit gespeicherter Authentifizierung funktionieren

---

## 📋 Empfehlung

**Da `railway login` bereits funktioniert:**

1. **Beide Umgebungsvariablen entfernen**
2. **Terminal neu starten**
3. **Railway CLI sollte funktionieren** (nutzt gespeicherte Authentifizierung)

**Warum:**
- `railway login` speichert Token in Konfigurationsdatei
- Umgebungsvariablen können Konflikte verursachen
- Gespeicherte Authentifizierung ist zuverlässiger

---

## ✅ Nach dem Fix

**Testen:**
```powershell
railway whoami
railway link -p 266dd89d-9821-4f28-8ae5-66761eed2058
railway service kaya-api
railway deployment list --limit 5
railway logs --build --lines 500
```

---

## 🔗 Referenzen

- [Railway CLI Dokumentation](https://docs.railway.com/guides/cli)
- [Railway Token-Konflikte](https://docs.railway.com/guides/cli#tokens)

