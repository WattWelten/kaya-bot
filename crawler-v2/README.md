# KAYA Crawler v2

**Intelligente Daten-Extraktion für Landkreis Oldenburg**

## 🎯 Ziel

Der KAYA Crawler v2 ist das Herzstück des KAYA-Systems. Er sammelt, verarbeitet und strukturiert alle relevanten Informationen für den Landkreis Oldenburg, um KAYA als perfekten digitalen Assistenten zu ermöglichen.

## 🏗️ Architektur

```
crawler-v2/
├── src/
│   ├── core/           # Haupt-Crawler-Engine
│   ├── sources/         # Verschiedene Datenquellen
│   ├── processors/      # Daten-Verarbeitung
│   ├── config/          # Konfiguration
│   └── utils/           # Hilfsfunktionen
├── data/
│   ├── raw/            # Rohe Daten
│   ├── processed/      # Verarbeitete Daten
│   ├── compressed/     # Komprimierte Daten
│   └── backup/         # Backup-Daten
├── scripts/            # Ausführbare Scripts
└── tests/             # Tests
```

## 🚀 Features

- **Multi-Source Crawling:** Web, Files, PDFs, APIs
- **Intelligente Verarbeitung:** Automatische Kategorisierung
- **Daten-Kompression:** Effiziente Speicherung
- **Backup-System:** Automatische Backups
- **Link-Validierung:** Überprüfung der Funktionalität
- **Logging:** Umfassendes Logging-System

## 📦 Installation

```bash
cd crawler-v2
npm install
```

## 🔧 Verwendung

### Vollständiger Crawl
```bash
npm run crawl
```

### Test-Crawl
```bash
npm run test
```

### Einzelne Agent testen
```bash
node scripts/test.js
```

## 📊 Agent-Daten

Der Crawler sammelt Daten für folgende Agenten:

- **buergerdienste:** Bürgerdienste, Formulare, Anträge
- **ratsinfo:** Kreistag, Verwaltung
- **stellenportal:** Stellenausschreibungen
- **kontakte:** Ansprechpartner, Kontakte
- **jugend:** Jugendamt, Familienhilfe
- **soziales:** Sozialleistungen, Gesundheit

## 🔄 Datenfluss

1. **Crawling:** Sammlung von Daten aus verschiedenen Quellen
2. **Verarbeitung:** Strukturierung und Bereinigung
3. **Kompression:** Effiziente Speicherung
4. **Backup:** Sicherung der Daten
5. **Integration:** Bereitstellung für KAYA

## 📈 Performance

- **Parallel Processing:** Mehrere Agenten gleichzeitig
- **Lazy Loading:** Nur benötigte Daten laden
- **Caching:** Zwischenspeicherung für bessere Performance
- **Compression:** Reduzierung der Speichergröße

## 🛠️ Konfiguration

Die Crawler-Konfiguration kann in `src/config/` angepasst werden:

- **Agent-URLs:** Welche Websites gecrawlt werden
- **File-Paths:** Lokale Dateien und PDFs
- **Processing-Rules:** Wie Daten verarbeitet werden

## 📝 Logging

Alle Aktivitäten werden in `logs/` protokolliert:

- **crawler.log:** Allgemeine Aktivitäten
- **error.log:** Fehler und Warnungen

## 🔒 Sicherheit

- **Rate Limiting:** Schutz vor Überlastung
- **User-Agent:** Identifikation als legitimer Bot
- **Timeout:** Schutz vor hängenden Requests
- **Error Handling:** Robuste Fehlerbehandlung

## 🧪 Testing

```bash
npm test
```

## 📞 Support

Bei Fragen oder Problemen wende dich an das KAYA-Team.

---

**KAYA Crawler v2 - Intelligente Daten-Extraktion für den Landkreis Oldenburg**

