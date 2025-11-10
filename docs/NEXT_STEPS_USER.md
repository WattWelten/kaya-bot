# USE_LLM in Railway aktivieren - Anweisung für User

## Status
✅ Bug-Fix durchgeführt und getestet (keine userData-Fehler mehr)
✅ Git Push abgeschlossen (Commit: `8b6e3019`)
⏳ Railway Deployment läuft (ca. 4 Min)

---

## Phase 5: USE_LLM aktivieren

### Schritt 1: Railway Dashboard öffnen
https://railway.app → Projekt `kaya-bot` → Backend Service

### Schritt 2: Environment Variables setzen
1. Backend Service → **Settings**
2. **Variables** Tab
3. **Add Variable** klicken
4. Neue Variable hinzufügen:
   - **Key:** `USE_LLM`
   - **Value:** `true`
5. **Add Variable** klicken

### Schritt 3: Warten (4 Min)
Railway deployt automatisch neu.

---

## Phase 6: Production API testen (nach USE_LLM-Aktivierung)

Nach ca. 8 Min gesamt (4 Min für Bug-Fix Deployment + 4 Min für USE_LLM Redeploy):

### Test-Command:

```bash
# Test 1: Health-Check
curl https://api.kaya.wattweiser.com/health

# Test 2: Chat mit LLM-Response
curl -X POST https://api.kaya.wattweiser.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Ich bin Sarah und brauche einen Führerschein"}'
```

### Erwartetes Ergebnis:

```json
{
  "response": "Verstanden, Sarah. Sie möchten einen Führerschein machen.\n\nSchritte:\n1. Fahrschule wählen\n2. Sehtest und Erste-Hilfe-Kurs\n3. Theorieprüfung\n4. Praktische Prüfung\n\n[Führerscheinstelle](https://www.oldenburg-kreis.de/)\n\n---\n*Quelle: KFZ-Zulassung • Stand: 10/2025*",
  "agent": "kaya",
  "source": "openai"
}
```

### Prüfungen:
- ✅ Kein userData-Fehler mehr
- ✅ Markdown-Links vorhanden
- ✅ Quellen-Fußzeile vorhanden
- ✅ Response-Länge 200-500 Zeichen
- ✅ Name "Sarah" wird erkannt und verwendet

---

## Phase 7: Frontend Test (nach USE_LLM-Aktivierung)

Browser öffnen: https://app.kaya.wattweiser.com

### Manuelle Tests:
1. Nachricht eingeben: "Ich bin Michael und brauche Hilfe"
2. Response erscheint ohne Fehler
3. Markdown-Links sind klickbar
4. Quellen-Fußzeile sichtbar
5. Name "Michael" wird in Folge-Nachrichten verwendet

---

## Zeitplan

- **Jetzt:** Git Push abgeschlossen (Commit: `8b6e3019`)
- **+4 Min:** Railway Deployment abgeschlossen
- **User setzt USE_LLM=true**
- **+4 Min:** Railway Redeploy nach USE_LLM
- **Jetzt Testen:** API + Frontend

---

## Erfolgskriterien

### Backend:
- [x] Kein userData-TypeError mehr (getestet lokal)
- [ ] Production API erreichbar nach Deployment
- [ ] USE_LLM aktiviert in Railway

### LLM-Integration:
- [ ] Markdown-Links in Response vorhanden
- [ ] Quellen-Fußzeile vorhanden
- [ ] Response-Länge 80-220 Tokens (ca. 200-500 Zeichen)
- [ ] Name-Extraction funktioniert

### Frontend:
- [ ] Keine weißen Screens
- [ ] Chat-Interaction funktioniert
- [ ] Links klickbar


