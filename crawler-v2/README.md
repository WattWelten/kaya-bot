# KAYA Crawler - Landkreis Oldenburg

## 🚀 Schnellstart

```bash
# Dependencies installieren
npm install

# Crawler ausführen
npm run crawl

# Oder spezifische Domains crawlen
node scripts/complete_crawler.js
```

## 📁 Dateien

### Scripts
- `complete_crawler.js` - Vollständiger Crawler für oldenburg-kreis.de
- `dual_crawler.js` - Crawler für beide Domains
- `analyze_website.js` - Website-Analyse
- `verify_websites.js` - Verifikation der gecrawlten Daten

### Core
- `src/core/CrawlerEngine.js` - Haupt-Crawler-Engine
- `src/sources/WebCrawler.js` - Web-Crawler
- `src/processors/DataProcessor.js` - Datenverarbeitung
- `src/processors/DataCompressor.js` - Datenkompression
- `src/processors/BackupManager.js` - Backup-Management

## 🔧 Konfiguration

### Domains
- `https://www.oldenburg-kreis.de/`
- `https://oldenburg-kreis.ratsinfomanagement.net/`

### Output
- `data/raw/` - Rohe Daten
- `data/processed/` - Verarbeitete Daten
- `data/compressed/` - Komprimierte Daten
- `data/backup/` - Backup-Daten

## 📊 Status

### Coverage
- **oldenburg-kreis.de**: 99.34% (300/302 URLs)
- **ratsinfomanagement.net**: 100% (28/28 URLs)

### Performance
- **Crawl-Zeit**: ~5 Minuten
- **Datenmenge**: ~50MB
- **Komprimierung**: ~80% Reduktion

## 🧪 Testing

```bash
# Crawler testen
node scripts/test.js

# Verifikation
node scripts/verify_websites.js
```

## 🔒 Sicherheit

- Rate-Limiting implementiert
- User-Agent-Rotation
- Error-Handling

---

**KAYA Crawler v2.0.0** - Landkreis Oldenburg 2025