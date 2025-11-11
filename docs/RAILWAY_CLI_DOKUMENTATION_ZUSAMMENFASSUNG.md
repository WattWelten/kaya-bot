# Railway CLI Dokumentation - Wichtige Informationen

**Quelle:** [Railway CLI Dokumentation](https://docs.railway.com/guides/cli)  
**Datum:** 2025-11-10

---

## 🔐 Authentifizierung - Wichtige Details

### Token-Typen

**1. Projekt-Token (`RAILWAY_TOKEN`):**
- Für projekt-spezifische Aktionen
- **Kann:** Deployments, Logs, Redeploy
- **Kann NICHT:** `railway whoami`, `railway init`, `railway link` zu anderem Workspace

**2. Account/Team-Token (`RAILWAY_API_TOKEN`):**
- Für kontoübergreifende Aktionen
- **Kann:** `railway whoami`, `railway init`
- **Kann NICHT (Team-Token):** `railway whoami`, `railway link` zu anderem Workspace

**WICHTIG:** 
> "You can only use one type of token at a time. If both are set, the `RAILWAY_TOKEN` variable will take precedence."

### Login-Prozess

Nach `railway login`:
1. Browser öffnet sich automatisch
2. Authentifizierung im Browser abschließen
3. Token wird in `%USERPROFILE%\.railway\config.json` gespeichert
4. CLI ist authentifiziert

---

## 🔗 Projekt verlinken

**Wichtig:** Nach dem Login muss das Projekt verlinkt werden!

### Projekt verlinken:
```bash
railway link
```

**Oder direkt mit Projekt-ID:**
```bash
railway link -p 266dd89d-9821-4f28-8ae5-66761eed2058
```

### Service verlinken:
```bash
railway service
```

**Oder direkt mit Service-ID:**
```bash
railway service kaya-api
```

---

## 📋 Häufig verwendete Befehle

### Projekt-Management
```bash
# Projekt verlinken
railway link

# Service verlinken
railway service

# Neues Projekt erstellen
railway init

# Environment wechseln
railway environment
```

### Deployments
```bash
# Deployen (mit Build-Logs)
railway up

# Deployen (ohne zu warten)
railway up --detach
```

### Logs
```bash
# Build-Logs
railway logs --build

# Deployment-Logs
railway logs --deployment <ID>

# Live-Logs
railway logs --tail 200
```

### Status & Informationen
```bash
# User-Informationen
railway whoami

# Projekt-Status
railway status

# Environment Variables
railway variables
```

---

## 🚨 Unser aktuelles Problem

**Symptom:**
- `railway login` wurde erfolgreich ausgeführt
- Browser-Authentifizierung abgeschlossen
- Aber: CLI erkennt Authentifizierung nicht in PowerShell-Session

**Mögliche Ursachen:**
1. Projekt nicht verlinkt (`railway link` fehlt)
2. Service nicht verlinkt (`railway service` fehlt)
3. PowerShell-Session hat Konfiguration nicht neu geladen

**Lösung:**
1. Projekt verlinken: `railway link -p 266dd89d-9821-4f28-8ae5-66761eed2058`
2. Service verlinken: `railway service kaya-api`
3. Oder: Terminal neu starten

---

## ✅ Empfohlene Reihenfolge

**Nach `railway login`:**

1. **Projekt verlinken:**
   ```bash
   railway link -p 266dd89d-9821-4f28-8ae5-66761eed2058
   ```

2. **Service verlinken:**
   ```bash
   railway service kaya-api
   ```

3. **Testen:**
   ```bash
   railway status
   railway deployment list
   railway logs --build --lines 500
   ```

---

## 📝 Wichtige Hinweise

**Token-Konflikte:**
- Wenn beide `RAILWAY_TOKEN` und `RAILWAY_API_TOKEN` gesetzt sind, wird `RAILWAY_TOKEN` verwendet
- Für Account-Aktionen: Nur `RAILWAY_API_TOKEN` setzen
- Für Projekt-Aktionen: Nur `RAILWAY_TOKEN` setzen

**Browserless Login:**
```bash
railway login --browserless
```
Generiert einen Pairing-Code für Umgebungen ohne Browser (z.B. SSH).

---

## 🔗 Referenzen

- [Railway CLI Dokumentation](https://docs.railway.com/guides/cli)
- [Railway CLI API Reference](https://docs.railway.com/reference/cli)


