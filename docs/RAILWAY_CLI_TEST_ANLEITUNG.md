# Railway CLI Test - Anleitung

**Datum:** 2025-11-10  
**Problem:** Railway CLI funktioniert nicht in PowerShell, obwohl Login in CMD erfolgreich war

---

## 🔍 Problem

**Symptom:**
- `railway login` wurde erfolgreich in **Eingabeaufforderung (CMD)** ausgeführt
- Browser-Authentifizierung abgeschlossen
- Aber: Railway CLI erkennt Authentifizierung nicht in **PowerShell**

**Ursache:**
- Konfiguration wurde möglicherweise nur in der CMD-Session gespeichert
- PowerShell-Session hat Konfiguration nicht neu geladen

---

## ✅ Lösung: Befehle in CMD ausführen

**Da `railway login` in CMD ausgeführt wurde, sollten die Befehle auch in CMD ausgeführt werden:**

### Schritt 1: CMD öffnen

Windows-Taste + R → `cmd` → Enter

### Schritt 2: Zum Projekt-Verzeichnis wechseln

```cmd
cd D:\Landkreis
```

### Schritt 3: Projekt verlinken

```cmd
railway link -p 266dd89d-9821-4f28-8ae5-66761eed2058
```

### Schritt 4: Service verlinken und Logs abrufen

**Für kaya-api:**
```cmd
railway service kaya-api
railway deployment list --limit 5
railway logs --build --lines 500
```

**Für kaya-frontend:**
```cmd
railway service kaya-frontend
railway deployment list --limit 5
railway logs --build --lines 500
```

### Schritt 5: Logs kopieren

Kopiere die Build-Logs und teile sie mit mir, dann kann ich die Fehler analysieren.

---

## 🔄 Alternative: PowerShell neu starten

**Falls CMD nicht funktioniert:**

1. **PowerShell komplett schließen**
2. **Neue PowerShell öffnen** (Windows-Taste → "PowerShell" → Enter)
3. **Zum Projekt-Verzeichnis wechseln:**
   ```powershell
   cd D:\Landkreis
   ```
4. **Testen:**
   ```powershell
   railway whoami
   railway link -p 266dd89d-9821-4f28-8ae5-66761eed2058
   ```

---

## 📋 Vollständige Befehlsliste für CMD

**Kopiere diese Befehle in CMD:**

```cmd
cd D:\Landkreis
railway link -p 266dd89d-9821-4f28-8ae5-66761eed2058
railway service kaya-api
railway deployment list --limit 5
railway logs --build --lines 500 > kaya-api-build-logs.txt
railway service kaya-frontend
railway deployment list --limit 5
railway logs --build --lines 500 > kaya-frontend-build-logs.txt
```

**Dann:**
- Öffne `kaya-api-build-logs.txt` und `kaya-frontend-build-logs.txt`
- Kopiere die Fehlermeldungen und teile sie mit mir

---

## 🚨 Falls weiterhin "Unauthorized"

**Mögliche Ursachen:**
1. Konfigurationsdatei wurde nicht korrekt gespeichert
2. Token ist abgelaufen
3. Railway CLI Bug (bekanntes Problem)

**Lösung:**
1. Erneut `railway login` in CMD ausführen
2. Oder: Logs direkt aus Railway Dashboard kopieren

---

## 📝 Nächste Schritte

**Bitte führe die Befehle in CMD aus und teile die Build-Logs mit mir.**

Die Build-Logs zeigen die genauen Fehlermeldungen, die ich dann analysieren und beheben kann.

