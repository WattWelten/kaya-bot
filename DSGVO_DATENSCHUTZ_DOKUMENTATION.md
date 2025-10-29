# DSGVO-Datenschutz-Dokumentation - KAYA System

**Stand:** 29.10.2025  
**Version:** 1.0  
**Status:** DSGVO-konform implementiert

---

## Übersicht

KAYA ist ein kommunaler KI-Assistent, der DSGVO-konform entwickelt wurde. Diese Dokumentation beschreibt, welche Daten gespeichert werden, wie sie verarbeitet werden und welche Rechte Nutzer*innen haben.

---

## 1. Gespeicherte Daten

### Session-Daten

**Was wird gespeichert:**
- **Session-ID**: Eindeutige Identifikation der Konversation
- **Nachrichten**: Gesendete und erhaltene Nachrichten während der Konversation
- **Zeitstempel**: Erstellungsdatum und letzte Aktivität
- **Kontext**: Erkannte Persona, Intent, extrahierte User-Daten (z.B. Name)

**Speicherort:**
- Dateisystem: `server/memory/[session-id].json`
- Speicherdauer: **30 Tage** (automatische Löschung)

**Rechtliche Grundlage:**
- Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse: Betrieb des Chatbots)
- Automatische Löschung nach 30 Tagen (Art. 5 Abs. 1 lit. e DSGVO)

### User-Daten

**Was wird gespeichert:**
- **Name**: Nur wenn explizit angegeben (z.B. "Ich bin Anna")
- **Keine weiteren personenbezogenen Daten**

**Speicherung:**
- Wird in Session-Kontext gespeichert
- Wird zusammen mit Session nach 30 Tagen gelöscht
- **Nicht** an Dritte weitergegeben

### Chat-Verlauf

**Was wird gespeichert:**
- Nachrichten-Inhalt (User + KAYA-Antworten)
- Zeitstempel
- Metadaten (Agent, Emotion, etc.)

**Zweck:**
- Kontext-Verständnis für bessere Antworten
- Qualitätssicherung
- Fehleranalyse

### Audio-Daten (falls verwendet)

**Was wird gespeichert:**
- **NICHT persistent gespeichert**
- Audio wird nur temporär für STT (Speech-to-Text) verarbeitet
- Nach Verarbeitung sofort gelöscht

---

## 2. Datenverarbeitung

### OpenAI API (LLM)

**Welche Daten werden übertragen:**
- Chat-Nachrichten (User-Input)
- Kontext-Informationen (Agent-Daten, Persona)
- **KEINE Session-IDs oder Namen** (werden nicht an OpenAI übertragen)

**Zweck:**
- Generierung intelligenter, kontextbewusster Antworten

**Rechtliche Grundlage:**
- Art. 28 DSGVO (Auftragsverarbeitung)
- OpenAI ist DSGVO-konformer Dienstleister
- Daten werden nicht für Training verwendet

**Weitergehende Informationen:**
- OpenAI Data Processing Addendum aktiviert
- Daten werden in EU/US verarbeitet (je nach OpenAI-Region)

### Audio-Verarbeitung (ElevenLabs/OpenAI Whisper)

**Welche Daten werden übertragen:**
- Audio-Dateien für STT/TTS
- **KEINE Session-IDs oder Namen**

**Speicherung:**
- Audio-Dateien werden **nicht** persistent gespeichert
- Nach Verarbeitung sofort gelöscht

---

## 3. Automatische Datenlöschung

### Session-Expiration

**Implementierung:**
- Automatische Löschung nach **30 Tagen** Inaktivität
- Läuft täglich um **3:00 Uhr** (Nachtzeit, minimale Störung)
- Implementiert in: `server/context_memory.js`

**Was wird gelöscht:**
- Session-Datei (`server/memory/[session-id].json`)
- In-Memory Session-Daten
- Alle zugehörigen User-Daten

**Logging:**
- Cleanup wird geloggt (Anzahl gelöschter Sessions)
- Keine Details über gelöschte Inhalte

---

## 4. Nutzerrechte (DSGVO)

### Recht auf Auskunft (Art. 15 DSGVO)

**Was Sie erfahren können:**
- Welche Daten über Sie gespeichert sind
- Zweck der Verarbeitung
- Speicherdauer

**API-Endpoint:**
```
GET /api/session/:sessionId
```

**Antwort:**
```json
{
  "sessionId": "session-123",
  "createdAt": "2025-10-01T10:00:00Z",
  "lastActivity": "2025-10-29T15:30:00Z",
  "ageDays": 28,
  "remainingDays": 2,
  "willBeDeleted": false,
  "messageCount": 15,
  "hasUserData": true
}
```

### Recht auf Löschung (Art. 17 DSGVO)

**Was wird gelöscht:**
- Session-Daten
- Alle zugehörigen User-Daten
- Nachrichten-Verlauf

**API-Endpoint:**
```
DELETE /api/session/:sessionId
```

**Antwort:**
```json
{
  "success": true,
  "message": "Ihre Daten wurden vollständig gelöscht (DSGVO-konform)",
  "sessionId": "session-123",
  "deleted": true
}
```

### Recht auf Berichtigung (Art. 16 DSGVO)

**Hinweis:**
- Da nur minimale Daten gespeichert werden, ist eine Berichtigung in der Regel nicht erforderlich
- Falls notwendig: Session löschen und neu starten

### Recht auf Datenübertragbarkeit (Art. 20 DSGVO)

**Was kann exportiert werden:**
- Session-Daten können über API-Endpoint abgerufen werden
- Format: JSON

### Widerspruchsrecht (Art. 21 DSGVO)

**Möglichkeit:**
- Session löschen über DELETE-Endpoint
- Keine weitere Datenspeicherung ohne Session

---

## 5. Technische Sicherheitsmaßnahmen

### Daten-Schutz

**Verschlüsselung:**
- HTTPS/TLS für alle Kommunikation
- Keine Verschlüsselung für Session-Dateien auf Festplatte (lokales System)
- **Empfehlung für Production:** Verschlüsselung auf Festplattenebene (LUKS, etc.)

**Zugriffsschutz:**
- Session-Dateien sind nur für Server-Prozess zugänglich
- Keine öffentliche Zugriffsmöglichkeit

### API-Sicherheit

**Rate Limiting:**
- Implementiert in `server/services/rate_limiter.js`
- Schutz vor Missbrauch
- Limits: 20 Requests/Minute für LLM

**Fehlerbehandlung:**
- Keine sensiblen Daten in Fehlermeldungen
- Logs enthalten keine personenbezogenen Daten

---

## 6. Dritte Dienstleister

### OpenAI

**Dienst:**
- LLM-API (GPT-4o-mini)
- Whisper STT

**Datenübertragung:**
- Chat-Nachrichten (anonymisiert)
- KEINE Session-IDs
- KEINE Namen

**Rechtliche Grundlage:**
- Art. 28 DSGVO (Auftragsverarbeitung)
- OpenAI Data Processing Addendum

### ElevenLabs (optional)

**Dienst:**
- Text-to-Speech (TTS)

**Datenübertragung:**
- Text-Inhalte (anonymisiert)
- KEINE Session-IDs
- KEINE Namen

---

## 7. Lokale vs. Production

### Lokale Entwicklung

**Daten-Speicherung:**
- `server/memory/*.json` auf lokalem Dateisystem
- Zugriff nur für Entwickler

**Sicherheit:**
- Keine Verschlüsselung (entwicklungsbedingt)
- Keine öffentliche Zugriffsmöglichkeit

### Production (Railway/Hosting)

**Daten-Speicherung:**
- Ephemerale Speicherung (Session-Daten)
- Automatische Löschung nach 30 Tagen
- Keine dauerhafte Persistierung

**Empfehlungen:**
- Verschlüsselung auf Festplattenebene
- Backup-Strategie (falls erforderlich)
- Monitoring der Session-Cleanup-Logs

---

## 8. Compliance-Checkliste

### Implementiert

- ✅ Automatische Session-Löschung (30 Tage)
- ✅ API für Datenauskunft (GET /api/session/:id)
- ✅ API für Datenlöschung (DELETE /api/session/:id)
- ✅ Minimale Datenspeicherung (nur Session-Daten, keine weiteren PII)
- ✅ Transparente Datenschutz-Dokumentation
- ✅ Keine Weitergabe an Dritte (außer OpenAI/ElevenLabs als Auftragsverarbeiter)
- ✅ HTTPS/TLS für alle Kommunikation

### Empfohlen (für Production)

- ⚠️ Verschlüsselung auf Festplattenebene für Session-Dateien
- ⚠️ Datenschutzerklärung auf Website
- ⚠️ Cookie-Hinweis (falls Cookies verwendet werden)
- ⚠️ Opt-In für Session-Speicherung (optional)
- ⚠️ Logging-Audit (keine personenbezogenen Daten in Logs)

---

## 9. Kontakt

### Datenschutz-Anfragen

**E-Mail:** datenschutz@oldenburg-kreis.de  
**Telefon:** 04431 85-0  
**Website:** https://www.oldenburg-kreis.de/datenschutz

### Technische Fragen

**E-Mail:** kaya@oldenburg-kreis.de  
**GitHub Issues:** https://github.com/WattWelten/kaya-bot/issues

---

## 10. Änderungen

**Version 1.0 (29.10.2025):**
- Initiale Dokumentation
- Automatische Session-Löschung implementiert
- API-Endpoints für Auskunft/Löschung implementiert

---

## Zusammenfassung

**KAYA ist DSGVO-konform implementiert:**
- Minimale Datenspeicherung (nur Session-Daten)
- Automatische Löschung nach 30 Tagen
- API für Nutzerrechte (Auskunft, Löschung)
- Transparente Dokumentation
- Sichere Datenübertragung (HTTPS/TLS)

**Keine Sorge:** Ihre Daten werden sicher und verantwortungsvoll behandelt!

---

**Letzte Aktualisierung:** 29.10.2025  
**Nächste Review:** Bei Änderungen der Datenverarbeitung

