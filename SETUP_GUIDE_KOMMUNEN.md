# Setup-Guide für neue Kommunen

**Version:** 1.0  
**Datum:** 29.10.2025

---

## Übersicht

Dieser Guide erklärt, wie KAYA für eine neue Kommune konfiguriert wird. Das System ist modular aufgebaut und kann für verschiedene Kommunen angepasst werden.

---

## Schnellstart

### 1. Konfigurationsdatei erstellen

1. **Kopiere Template:**
   ```bash
   cp crawler-v2/config/kommunen/template.json crawler-v2/config/kommunen/deine-kommune.json
   ```

2. **Passe Konfiguration an:**
   - `kommune.name`: Name der Kommune
   - `kommune.domain`: Hauptdomain (z.B. `example.de`)
   - `kommune.base_url`: Basis-URL der Website
   - `kommune.ratsinfo_domain`: Optional: Ratsinfo-Domain falls vorhanden

### 2. Agent-Konfiguration

Für jeden Agent die relevanten URLs hinzufügen:

```json
{
  "buergerdienste": {
    "name": "Bürgerdienste",
    "webSources": [
      "https://www.deine-kommune.de/buergerdienste/",
      "https://www.deine-kommune.de/formulare/"
    ]
  }
}
```

### 3. Environment Variable setzen

```bash
# In .env oder System-Environment
KOMMUNE=deine-kommune
```

### 4. Crawler ausführen

```bash
cd crawler-v2
node scripts/crawl.js
```

---

## Detaillierte Anleitung

### Schritt 1: Kommune-Konfiguration

**Datei:** `crawler-v2/config/kommunen/[kommune-name].json`

**Struktur:**
```json
{
  "kommune": {
    "name": "Name der Kommune",
    "domain": "example.de",
    "base_url": "https://www.example.de",
    "ratsinfo_domain": "example.ratsinfomanagement.net"
  },
  "agents": {
    "agent-name": {
      "name": "Agent-Name",
      "description": "Beschreibung",
      "webSources": ["url1", "url2"],
      "fileSources": [],
      "pdfSources": []
    }
  },
  "crawler_settings": {
    "timeout": 30000,
    "retryAttempts": 3
  }
}
```

### Schritt 2: Agent-Konfiguration

**Welche Agenten braucht Ihre Kommune?**

**Standard-Agenten (empfohlen):**
- `buergerdienste` - Bürgerdienste, Formulare, Anträge
- `ratsinfo` - Kreistag, Sitzungen, Beschlüsse
- `stellenportal` - Stellenausschreibungen
- `kontakte` - Ansprechpartner, Öffnungszeiten
- `jugend` - Jugendamt, Jugendhilfe
- `soziales` - Soziale Dienste, Sozialleistungen

**Optional:**
- `jobcenter` - Jobcenter, Bürgergeld
- `wirtschaft` - Wirtschaftsförderung
- `ordnungsamt` - Ordnungswidrigkeiten
- `senioren` - Seniorenberatung
- `inklusion` - Inklusion, Teilhabe
- `digitalisierung` - E-Government, Digitalisierung
- `gleichstellung` - Gleichstellung, Gewaltschutz

**Für jeden Agent:**
1. Relevante URLs identifizieren
2. In `webSources` Array hinzufügen
3. Beschreibung anpassen

### Schritt 3: Backend-Konfiguration

**Datei:** `server/kaya_config.json`

**Anpassen:**
- System-Prompt: Kommune-Name anpassen
- Agent-Mapping: Falls Agent-Namen unterschiedlich sind
- Character: Name, Begrüßung, etc.

**Beispiel:**
```json
{
  "kaya_character": {
    "name": "KAYA",
    "role": "Kommunaler KI-Assistent für [Ihre Kommune]",
    "greeting": "Moin! Ich bin KAYA"
  }
}
```

### Schritt 4: Verified Facts

**Datei:** `server/data/verified_facts.json`

**Anpassen:**
- Kontakt-Informationen (Telefon, E-Mail)
- Personen & Positionen (z.B. Landrat-Bürgermeister)
- Leitweg-ID (falls vorhanden)
- Kommune-spezifische Fakten

### Schritt 5: Crawler-Einstellungen

**Anpassbar in Konfiguration:**
- `timeout`: Request-Timeout (Standard: 30000ms)
- `retryAttempts`: Wiederholungsversuche (Standard: 3)
- `maxConcurrent`: Parallele Requests (Standard: 5)
- `delayBetweenRequests`: Pause zwischen Requests (Standard: 500ms)

**Für große Websites:**
- Höhere `timeout`-Werte
- Mehr `retryAttempts`
- Höhere `delayBetweenRequests` (Rücksicht auf Server)

---

## Best Practices

### 1. URL-Auswahl

**Empfehlungen:**
- Starte mit Hauptkategorien (z.B. `/buergerdienste/`)
- Füge Unterkategorien hinzu nach Bedarf
- Teste URLs vor dem Crawl (auf Erreichbarkeit)

**Vermeiden:**
- Zu viele URLs (langsamer Crawl)
- URLs zu tief verschachtelt (schlechte Content-Qualität)
- URLs mit dynamischem Content (z.B. Suchfunktionen)

### 2. Agent-Struktur

**Empfehlungen:**
- Maximal 10-15 Agenten (übersichtlich)
- Klare Abgrenzung zwischen Agenten
- Konsistente Namensgebung (Kebab-Case)

### 3. Crawler-Performance

**Optimierung:**
- Paralleles Crawling aktivieren (falls möglich)
- Retry-Logik für instabile URLs
- Rate Limiting respektieren

---

## Testing

### 1. Konfiguration testen

```bash
cd crawler-v2
node -e "const loader = require('./src/core/KommuneConfigLoader'); const l = new loader(); console.log(l.load());"
```

### 2. Einzelnen Agent testen

```bash
cd crawler-v2
node scripts/crawl.js --agent buergerdienste
```

### 3. Vollständiger Crawl

```bash
cd crawler-v2
node scripts/crawl.js
```

---

## Troubleshooting

### Problem: Konfiguration wird nicht geladen

**Lösung:**
- Prüfe: `KOMMUNE` Environment Variable gesetzt?
- Prüfe: Datei existiert in `crawler-v2/config/kommunen/`?
- Prüfe: JSON-Syntax korrekt?

### Problem: Agent hat keine Daten

**Lösung:**
- Prüfe URLs: Sind sie erreichbar?
- Prüfe Crawler-Logs: `crawler-v2/logs/crawler.log`
- Teste URL manuell im Browser

### Problem: Crawler zu langsam

**Lösung:**
- Erhöhe `maxConcurrent` (Vorsicht: Server-Last!)
- Reduziere `delayBetweenRequests`
- Prüfe `timeout`-Werte (zu hoch = langsam)

---

## Beispiel-Konfigurationen

### Kleine Kommune (< 50k Einwohner)

```json
{
  "kommune": {
    "name": "Kleinstadt Beispiel",
    "domain": "beispiel.de",
    "base_url": "https://www.beispiel.de"
  },
  "agents": {
    "buergerdienste": {
      "webSources": ["https://www.beispiel.de/buergerdienste/"]
    },
    "ratsinfo": {
      "webSources": ["https://www.beispiel.de/rathaus/"]
    },
    "kontakte": {
      "webSources": ["https://www.beispiel.de/kontakt/"]
    }
  }
}
```

### Große Kommune (> 100k Einwohner)

Siehe: `crawler-v2/config/kommunen/oldenburg-kreis.json` (Referenz)

---

## Nächste Schritte

Nach erfolgreicher Konfiguration:

1. **Crawler ausführen** und Daten sammeln
2. **Content-Qualität prüfen**: `node crawler-v2/scripts/test_content_quality.js`
3. **Backend starten** und testen
4. **Frontend anpassen** (falls nötig: Kommune-Name, etc.)

---

## Support

**Fragen oder Probleme?**
- GitHub Issues: https://github.com/WattWelten/kaya-bot/issues
- E-Mail: kaya@landkreis-oldenburg.de

---

**Viel Erfolg bei der Einrichtung!** 🚀

