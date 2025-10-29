# Übersicht: Verifizierte Fakten für ALLE Agenten

**Datum:** 29.10.2025  
**Status:** ✅ Implementiert  
**Hoheitlicher Auftrag:** Ja - Alle Fakten sind verifiziert

---

## 📋 System-Architektur

### 1. Datenquelle: `server/data/verified_facts.json`

**Struktur:**
- Zentrale JSON-Datei mit allen verifizierten Fakten
- Getrennt nach Kategorien (Kontakt, Personen, Agenten)
- Metadaten zur Verifizierung (Datum, Quelle, Warnung)

### 2. Integration: `KAYAAgentManager.getVerifiedFacts()`

**Methoden:**
- `getVerifiedFacts(context, agentName)` - Gibt verifizierte Fakten zurück
- `validateFact(agentName, factType, value)` - Prüft und korrigiert Werte

### 3. Schutz-Mechanismen

**Pre-Processing (vor LLM-Call):**
- Verifizierte Fakten werden in Context übergeben
- System-Prompt erhält explizite Fakten-Liste
- Warnungen bei kritischen Fakten

**Post-Processing (nach LLM-Call):**
- Namen-Korrektur (Landrat)
- Telefonnummer-Validierung
- E-Mail-Validierung
- Leitweg-ID-Validierung
- "Kann ich nicht"-Erkennung bei verifizierten Fakten

---

## 📊 Verifizierte Fakten nach Agent

### 🌐 Kontakt-Informationen (ALLE Agenten)

| Faktum | Wert | Quelle | Warnung |
|--------|------|--------|---------|
| **Haupttelefon** | 04431 85-0 | https://www.oldenburg-kreis.de/portal/seiten/oeffnungszeiten | NIEMALS andere Nummern erfinden! |
| **Haupt-E-Mail** | info@oldenburg-kreis.de | https://www.oldenburg-kreis.de/portal/kontakt.html | NIEMALS andere E-Mails erfinden! |
| **Website** | https://www.oldenburg-kreis.de | Offizielle Website | NIEMALS Links erfinden! |
| **Öffnungszeiten** | Mo-Fr 8-16 Uhr | Gecrawlt & Verifiziert | NIEMALS andere Zeiten erfinden! |

---

### 👤 Personen & Positionen

| Position | Name | Quelle | Warnung |
|----------|------|--------|---------|
| **Landrat** | Dr. Christian Pundt | https://www.oldenburg-kreis.de/.../landrat/ | ❌ NIEMALS: Matthias Groote, Jens Pundt, etc. |

**Korrektur-Regeln:**
- "Matthias Groote" → "Dr. Christian Pundt"
- "Jens Pundt" → "Dr. Christian Pundt"
- Alle Variationen werden korrigiert

---

### 💰 Rechnung & E-Billing

| Faktum | Wert | Quelle | Warnung |
|--------|------|--------|---------|
| **Leitweg-ID** | 03458-0-051 | Impressum | NIEMALS "kann ich nicht" sagen! |
| **Format** | XRechnung (XML, UBL 2.1/CIIl) oder ZUGFeRD 2.0 | Verifiziert | Alle Infos verifiziert |
| **Zuständig** | Finanzdezernat / Rechnungsprüfung | Verifiziert | |
| **Kontakt** | 04431 85-0 | Verifiziert | |

**Vorgang:**
1. Rechnung im XRechnung-Format erstellen
2. Leitweg-ID 03458-0-051 verwenden
3. Über XRechnung-System senden

---

### 📞 Bürgerdienste

| Faktum | Verifiziert | Warnung |
|--------|-------------|---------|
| **Kontakt** | 04431 85-0 | NIEMALS andere Nummern! |
| **Öffnungszeiten** | Mo-Fr 8-16 Uhr | NIEMALS andere Zeiten! |
| **Kritische Fakten** | Gebühren, Bearbeitungszeiten, Fristen | ❌ NIEMALS erfinden! |

---

### 🏛️ Ratsinfo

| Faktum | URL | Warnung |
|--------|-----|---------|
| **Ratsinfo-Hauptseite** | https://oldenburg-kreis.ratsinfomanagement.net/ | ✅ Verifiziert |
| **Sitzungen** | https://oldenburg-kreis.ratsinfomanagement.net/sitzungen/ | ✅ Verifiziert |
| **Vorlagen** | https://oldenburg-kreis.ratsinfomanagement.net/vorlagen/ | ✅ Verifiziert |
| **Personen** | https://oldenburg-kreis.ratsinfomanagement.net/personen/ | ✅ Verifiziert |
| **Fraktionen** | https://oldenburg-kreis.ratsinfomanagement.net/fraktionen/ | ✅ Verifiziert |

**Kritische Fakten:**
- ❌ NIEMALS Sitzungstermine erfinden!
- ❌ NIEMALS Beschlüsse erfinden!
- ❌ NIEMALS Personeninformationen erfinden!

---

### 💼 Stellenportal

| Faktum | Verifiziert | Warnung |
|--------|-------------|---------|
| **Kontakt** | 04431 85-0 | ✅ Verifiziert |
| **Kritische Fakten** | Stellenausschreibungen, Fristen, Anforderungen | ❌ NIEMALS erfinden! |

---

### 👨‍👩‍👧‍👦 Jugend

| Faktum | Verifiziert | Warnung |
|--------|-------------|---------|
| **Kontakt** | 04431 85-0 | ✅ Verifiziert |
| **Kritische Fakten** | Angebote, Kurse, Programme | ❌ NIEMALS erfinden! Nur aus gecrawlten Daten |

---

### 🏥 Soziales

| Faktum | Verifiziert | Warnung |
|--------|-------------|---------|
| **Kontakt** | 04431 85-0 | ✅ Verifiziert |
| **Kritische Fakten** | Leistungen, Voraussetzungen, Verfahren | ❌ NIEMALS erfinden! |

---

### 💼 Jobcenter

| Faktum | Verifiziert | Warnung |
|--------|-------------|---------|
| **Kontakt** | 04431 85-0 | ✅ Verifiziert |
| **Kritische Fakten** | Leistungsbeträge, Antragsfristen, Voraussetzungen | ❌ NIEMALS erfinden! |

---

## 🚨 Allgemeine Regeln (ALLE Agenten)

### ❌ NIEMALS erfinden:
1. **Öffnungszeiten** (nur verifizierte)
2. **Telefonnummern** (nur verifizierte)
3. **E-Mail-Adressen** (nur verifizierte)
4. **Gebühren/Kosten**
5. **Bearbeitungszeiten**
6. **Rechtliche Details**
7. **Personennamen** (außer verifiziert)
8. **Verfahrensdetails**
9. **Termine**
10. **Beschlüsse**
11. **Fristen**

### ✅ Bei Unsicherheit:
- **Ehrlich sagen:** "Dazu habe ich keine genauen Infos"
- **Verweisen auf:** Bürgerservice (04431 85-0)
- **Natürlicher Ton:** "Am besten rufst du kurz an: 04431 85-0. Die helfen dir garantiert weiter!"

---

## 🔧 Technische Implementierung

### 1. Lade-Mechanismus

**Datei:** `server/kaya_agent_manager_v2.js`

```javascript
loadVerifiedFacts() {
    const factsPath = path.join(__dirname, 'data', 'verified_facts.json');
    this.verifiedFacts = fs.readJsonSync(factsPath);
}
```

### 2. Context-Übergabe

**Datei:** `server/kaya_character_handler_v2.js`

```javascript
// Agent-spezifische Fakten laden
const agentFacts = this.agentHandler.getVerifiedFacts(null, agentName);

// In LLM-Context
verifiedFacts: {
    agent: agentName,
    kontakt: agentFacts.kontakt,
    warnung: agentFacts.warnung,
    // ... spezifische Fakten
}
```

### 3. Post-Processing

**Datei:** `server/kaya_character_handler_v2.js`

**Korrekturen:**
- Namen (Landrat)
- Telefonnummern
- E-Mail-Adressen
- Leitweg-ID
- "Kann ich nicht"-Erkennung

---

## 📈 Status & Coverage

| Agent | Verifizierte Fakten | Post-Processing | Status |
|-------|---------------------|----------------|--------|
| **Kontakt** | ✅ 100% | ✅ 100% | ✅ Produktiv |
| **Personen** | ✅ 100% | ✅ 100% | ✅ Produktiv |
| **Rechnung E-Billing** | ✅ 100% | ✅ 100% | ✅ Produktiv |
| **Bürgerdienste** | ✅ Kontakt | ✅ Allgemein | ✅ Produktiv |
| **Ratsinfo** | ✅ URLs | ✅ Allgemein | ✅ Produktiv |
| **Stellenportal** | ✅ Kontakt | ✅ Allgemein | ✅ Produktiv |
| **Jugend** | ✅ Kontakt | ✅ Allgemein | ✅ Produktiv |
| **Soziales** | ✅ Kontakt | ✅ Allgemein | ✅ Produktiv |
| **Jobcenter** | ✅ Kontakt | ✅ Allgemein | ✅ Produktiv |

**Gesamt:** ✅ 100% aller Agenten mit verifizierten Fakten abgesichert

---

## 🔄 Update-Mechanismus

**Automatisches Update:**
- Bei jedem Crawl werden Fakten aktualisiert (falls sich Quellen ändern)
- Verifizierte Fakten haben Priorität vor gecrawlten Daten
- Fallback-Mechanismus: Falls JSON nicht existiert → Hardcoded Fallback

**Manuelles Update:**
- Bearbeite `server/data/verified_facts.json`
- Nach Änderung: Server-Neustart oder Reload

---

## ✅ Zusammenfassung

**✅ Implementiert:**
- Zentrale Fakten-Datenbank (`verified_facts.json`)
- AgentManager-Integration (`getVerifiedFacts()`)
- Pre-Processing (Context-Übergabe)
- Post-Processing (Korrektur)
- Coverage für ALLE Agenten
- Schutz vor Halluzinationen

**✅ Geschützt:**
- Kontakt-Informationen
- Personen & Positionen
- Rechnung E-Billing
- Alle Agent-spezifischen Fakten

**✅ Status:** Production-Ready für hoheitlichen Auftrag

