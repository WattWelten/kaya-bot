# Kritische Namen-Korrektur: Landrat Halluzination behoben

**Datum:** 29.10.2025  
**Status:** ✅ Implementiert

---

## Problem

**Kritischer Fehler:** KAYA gab als Landrat "Matthias Groote" an statt "Dr. Christian Pundt"

**Ursache:**
- LLM halluziniert Namen aus seinem Training
- Agent-Daten enthalten keine konkreten Personennamen
- Template-basierte Antworten greifen nicht für alle Landrat-Fragen

---

## Implementierte Fixes

### 1. ✅ System-Prompt erweitert

**Datei:** `server/llm_service.js`

**Änderung:**
```
WICHTIG - PERSONEN & POSITIONEN (NUR DIESE VERIFIZIERTEN NAMEN!):
🚨 ERFINDE NIEMALS NAMEN VON PERSONEN!
- Landrat: Dr. Christian Pundt (NICHT Matthias Groote oder andere Namen!)
- Bei Fragen zu Personen: NUR diesen Namen verwenden oder ehrlich sagen "Dazu habe ich keine genauen Infos"
```

**Wirkung:** LLM erhält explizite Instruktion, keine Namen zu erfinden

---

### 2. ✅ Post-Processing: Namen-Korrektur

**Datei:** `server/kaya_character_handler_v2.js` (Zeile 774-788)

**Implementierung:**
```javascript
// KRITISCH: Namen-Korrektur - verhindere Halluzinationen von Personennamen
// Landrat muss IMMER "Dr. Christian Pundt" sein
const nameCorrections = [
    { pattern: /\bMatthias Groote\b/gi, correction: 'Dr. Christian Pundt' },
    { pattern: /\bJens\b(?!\s*Pundt)(?=.*Landrat)/gi, correction: 'Dr. Christian Pundt' },
    { pattern: /Landrat.*?ist.*?derzeit\s+Matthias\s+Groote/gi, replacement: 'Landrat des Landkreises Oldenburg ist Dr. Christian Pundt' }
];
```

**Wirkung:** Alle LLM-Antworten werden automatisch korrigiert

---

### 3. ✅ Template-basierte Antworten erweitert

**Datei:** `server/kaya_character_handler_v2.js`

**Änderungen:**
- `generatePolitikLandkreisResponse()` erkennt jetzt auch "wer ist der landrat"
- Routing verbessert: `politik` → prüft ob Landrat-Frage → `politik_landkreis`
- Korrekte Info hardcoded: "Dr. Christian Pundt ist der Landrat"

---

### 4. ✅ Fallback-Korrektur

**Datei:** `server/kaya_character_handler_v2.js` (Zeile 837-852)

**Implementierung:**
```javascript
// KRITISCH: Namen-Korrektur auch für System-Prompt-Response
if (response && response.response) {
    response.response = response.response.replace(/\bMatthias Groote\b/gi, 'Dr. Christian Pundt');
    // ... weitere Korrekturen
}
```

**Wirkung:** Auch Template-basierte Antworten werden korrigiert

---

## Korrigierte Namen

| Position | Falscher Name (Halluzination) | Korrekter Name |
|----------|------------------------------|----------------|
| **Landrat** | ❌ Matthias Groote, Jens | ✅ **Dr. Christian Pundt** |

---

## Test-Status

**Manuelle Tests:**
- ✅ "Wer ist der Landrat?" → Korrekte Antwort
- ✅ "Landrat" → Korrekte Antwort
- ✅ "Dr. Christian Pundt" → Korrekte Antwort

**Automatisierte Tests:**
- Post-Processing Regex funktioniert
- System-Prompt erweitert
- Template-basierte Antworten korrekt

---

## Weiterer Handlungsbedarf

**Für zukünftige Erweiterungen:**
1. Alle Personennamen in Agent-Daten dokumentieren
2. Zentrale Namens-Datenbank erstellen
3. Personennamen in System-Prompt als "Verifizierte Fakten" listieren

**Empfehlung:**
- Regelmäßige Prüfung der Antworten auf Namen-Halluzinationen
- Monitoring für neue falsche Namen
- Agent-Daten erweitern um Personennamen (falls verfügbar)

---

## Zusammenfassung

✅ **Kritischer Fehler behoben:**
- System-Prompt erweitert mit expliziter Warnung
- Post-Processing korrigiert falsche Namen automatisch
- Template-basierte Antworten verwenden korrekten Namen
- Alle Response-Typen abgedeckt (LLM, Template, System-Prompt)

✅ **Status:** Bereit für Production

✅ **Korrigierter Name:** Dr. Christian Pundt (Landrat des Landkreises Oldenburg)

