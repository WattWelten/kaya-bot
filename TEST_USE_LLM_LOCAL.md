# USE_LLM Test - Lokaler Server

**Problem:** Lokaler Server hat keinen OPENAI_API_KEY (geheim)

**Lösung:** USE_LLM in Railway aktivieren (Production)

---

## RAILWAY ENVIRONMENT VARIABLES

**Zum Aktivieren von LLM:**

1. Öffne Railway Dashboard
2. Backend Service → Settings → Variables
3. Füge hinzu oder prüfe:
   ```
   USE_LLM=true
   ```
4. Redeploy Backend Service

---

## TEST-PROCESS

### Schritt 1: USE_LLM in Railway aktivieren ⏳

**User macht:**
- Railway Dashboard öffnen
- Backend Service wählen
- Settings → Variables
- `USE_LLM=true` setzen
- Redeploy

---

### Schritt 2: Production API testen

**Nach Redeploy:**

```bash
# Test 1: Health-Check
curl https://api.kaya.wattweiser.com/health

# Test 2: Chat mit LLM-Response
curl -X POST https://api.kaya.wattweiser.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Ich brauche einen Führerschein"}'
```

**Erwartetes Ergebnis:**
```json
{
  "response": "Verstanden, Sie möchten einen Führerschein machen.\n\nSchritte:\n1. Fahrschule wählen\n2. Sehtest und Erste-Hilfe-Kurs\n3. Theorieprüfung\n4. Praktische Prüfung\n\n[Informationen zur Führerscheinstelle](https://www.oldenburg-kreis.de/)\n\n---\n*Quelle: KFZ-Zulassung • Stand: 10/2025*"
}
```

**Prüfungen:**
- ✅ Markdown-Links vorhanden?
- ✅ Quellen-Fußzeile vorhanden?
- ✅ Response-Länge 200-500 Zeichen (ca. 80-220 Tokens)?
- ✅ E-Z-O-Struktur sichtbar?

---

### Schritt 3: Frontend visuell prüfen

**Browser öffnen:** https://app.kaya.wattweiser.com

**Manuelle Tests:**
- [ ] Nachricht eingeben und senden
- [ ] Response erscheint mit Markdown-Links?
- [ ] Links sind klickbar?
- [ ] Links haben Hover-Effekt?
- [ ] Quellen-Fußzeile am Ende sichtbar?

---

## IF USE_LLM WIRKT

**Erwartung:**
- Response enthält Markdown-Links
- Response enthält Quellen-Fußzeile
- Response-Länge 80-220 Tokens (ca. 200-500 Zeichen)
- E-Z-O-Struktur sichtbar

**Status:** ✅ PRODUKTIONSREIF

---

## IF USE_LLM WIRKT NICHT

**Mögliche Ursachen:**
- Environment Variable nicht gesetzt
- OPENAI_API_KEY fehlt
- LLM-Service Circuit Breaker offen

**Debugging:**
```bash
# Prüfe Environment Variables
curl https://api.kaya.wattweiser.com/health

# Prüfe Logs in Railway Dashboard
railway logs --service backend
```

---

**Nächster Schritt:** User aktiviert USE_LLM in Railway, dann erneut testen


