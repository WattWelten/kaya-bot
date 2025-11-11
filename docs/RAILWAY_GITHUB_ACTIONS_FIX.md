# Railway GitHub Actions Fix - REST API Lösung

**Datum:** 2025-11-11  
**Problem:** Railway CLI Token-Authentifizierung funktioniert nicht in GitHub Actions  
**Lösung:** Railway REST API direkt verwenden

---

## 🔍 Problem

**Fehler in GitHub Actions:**
```
Unauthorized. Please login with `railway login`
```

**Ursache:**
- Railway CLI v4.11.0 hat ein bekanntes Bug mit Token-Authentifizierung
- `RAILWAY_TOKEN` wird nicht korrekt erkannt
- Siehe: [Railway Station Forum](https://station.railway.com/questions/cli-throwing-unauthorized-with-railway-24883ba1)

---

## ✅ Lösung: Railway REST API verwenden

Statt Railway CLI zu verwenden, nutzen wir die Railway REST API direkt via `curl`.

**Vorteile:**
- ✅ Funktioniert zuverlässig mit Token
- ✅ Keine CLI-Abhängigkeit
- ✅ Einfacher zu debuggen

---

## 🔧 Implementierung

### Railway REST API Endpoints

**Deployment auslösen:**
```bash
POST https://api.railway.app/v1/deployments
Authorization: Bearer $RAILWAY_TOKEN
Content-Type: application/json

{
  "projectId": "$RAILWAY_PROJECT_ID",
  "serviceId": "$SERVICE_ID"
}
```

**Oder einfacher: Git-basiertes Deployment:**
- Railway erkennt automatisch Git-Pushes
- Wir müssen nur sicherstellen, dass Railway mit GitHub verbunden ist

---

## 📝 Alternative: Railway CLI mit expliziter Token-Setzung

Falls REST API nicht funktioniert, können wir versuchen, den Token explizit zu setzen:

```yaml
- name: Deploy to Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    # Token explizit in Railway Config setzen
    mkdir -p ~/.railway
    echo "{\"token\":\"$RAILWAY_TOKEN\"}" > ~/.railway/config.json
    railway link -p $RAILWAY_PROJECT_ID -s kaya-api
    railway up --detach
```

---

## 🚀 Empfohlene Lösung: Git-basiertes Deployment

**Am einfachsten:** Railway mit GitHub verbinden und automatische Deployments aktivieren.

1. Railway Dashboard → Projekt → Settings → GitHub
2. GitHub Repository verbinden
3. Automatische Deployments aktivieren
4. GitHub Actions Workflows können dann entfernt werden

---

**Status:** Lösung wird implementiert

