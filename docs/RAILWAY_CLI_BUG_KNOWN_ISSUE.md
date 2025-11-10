# Railway CLI - Bekanntes Problem mit Token-Authentifizierung

**Datum:** 2025-11-10  
**Status:** 🔴 Bekanntes Bug in Railway CLI  
**Quelle:** [Railway Station Forum](https://station.railway.com/questions/cli-throwing-unauthorized-with-railway-24883ba1)

---

## 🔍 Problem

**Symptom:**
```
Unauthorized. Please login with `railway login`
```

**Trotz:**
- ✅ `RAILWAY_TOKEN` Umgebungsvariable gesetzt
- ✅ `RAILWAY_API_TOKEN` Umgebungsvariable gesetzt
- ✅ Token korrekt und gültig

**Betroffen:**
- ❌ GitHub Actions / CI/CD
- ❌ Lokale Umgebungen
- ❌ Alle Railway CLI Versionen (aktuell)

---

## 📋 Railway's Antwort

**Von Railway Engineering Team:**
> "We are pushing out a fix for this shortly."

**Status:** Fix wird veröffentlicht, aber noch kein ETA verfügbar.

**Thread:** [CLI throwing "Unauthorized" with RAILWAY_TOKEN](https://station.railway.com/questions/cli-throwing-unauthorized-with-railway-24883ba1)

---

## ✅ Workarounds

### Workaround 1: Railway Login (Interaktiv) - Funktioniert!

**Für lokale Entwicklung:**

```powershell
railway login
```

**Vorteile:**
- ✅ Funktioniert garantiert
- ✅ Token wird in Konfigurationsdatei gespeichert
- ✅ Dauerhaft authentifiziert

**Nachteil:**
- ❌ Erfordert interaktive Eingabe
- ❌ Funktioniert nicht in CI/CD

---

### Workaround 2: Warten auf Railway Fix

**Railway arbeitet an einem Fix:**
- Fix wird "shortly" (kurz) veröffentlicht
- Kein genaues Datum verfügbar

**Empfehlung:** Railway Station Forum im Auge behalten für Updates.

---

### Workaround 3: Railway API direkt verwenden

**Für CI/CD (GitHub Actions):**

Statt Railway CLI zu verwenden, Railway REST API direkt nutzen:

```yaml
- name: Deploy via Railway API
  run: |
    curl -X POST \
      -H "Authorization: Bearer ${{ secrets.RAILWAY_TOKEN }}" \
      -H "Content-Type: application/json" \
      https://api.railway.app/v1/deployments \
      -d '{"serviceId": "...", "projectId": "..."}'
```

**Nachteil:** Komplexer, erfordert API-Dokumentation.

---

## 🔧 Aktuelle Lösung für lokale Entwicklung

**Da Token-Authentifizierung nicht funktioniert:**

1. **Railway Login verwenden:**
   ```powershell
   railway login
   ```

2. **Browser öffnet sich automatisch:**
   - Railway-Account auswählen
   - Zugriff erlauben

3. **Token wird in Konfigurationsdatei gespeichert:**
   - `%USERPROFILE%\.railway\config.json`
   - Funktioniert dauerhaft

4. **Testen:**
   ```powershell
   railway whoami
   railway service kaya-api
   railway logs --build --lines 500
   ```

---

## 📊 Status-Update

**Aktuell:**
- 🔴 Token-Authentifizierung funktioniert nicht
- ✅ Interaktiver Login funktioniert
- ⏳ Railway arbeitet an Fix

**Nächste Schritte:**
1. Railway Login für lokale Entwicklung verwenden
2. Auf Railway Fix warten
3. Nach Fix: Token-Authentifizierung wieder testen

---

## 🔗 Referenzen

- [Railway Station Forum - CLI Unauthorized Issue](https://station.railway.com/questions/cli-throwing-unauthorized-with-railway-24883ba1)
- Railway CLI Dokumentation: https://docs.railway.com/guides/cli

