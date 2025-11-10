# Crawler 100% Abdeckung Strategie

**Datum:** 29.10.2025  
**Aktueller Stand:** ~40-50% Coverage (geschätzt)  
**Ziel:** Nahe 100% Abdeckung der oldenburg-kreis.de Website

---

## Aktuelle Situation

### Gecrawlte URLs
- **17 Agenten** konfiguriert mit manuell definierten URLs
- **~44 URLs** direkt in Agent-Konfiguration
- **Coverage:** Vermutlich <50% der gesamten Website

### Probleme
1. **Manuelle URL-Liste:** Nur definierte URLs werden gecrawlt
2. **Keine Rekursion:** Unterseiten werden nicht automatisch entdeckt
3. **Keine Sitemap-Integration:** Automatische URL-Entdeckung fehlt
4. **Fehlende Kategorien:** bildung, gesundheit, verkehr, katastrophenschutz ohne Agent
5. **Content-Qualität:** Nur 7.3% der Einträge haben Content (Ziel: >80%)

---

## Strategie für 100% Abdeckung

### Phase 1: Automatische URL-Entdeckung (Kurzfristig)

#### 1.1 Sitemap-Integration
**Implementierung:**
- Neue Methode `crawlSitemap()` in `CrawlerEngine.js`
- Automatisches Parsen von `sitemap.xml`, `sitemap_index.xml`, `sitemap.html`
- Extraktion aller `<loc>` URLs aus Sitemap
- URL-Normalisierung (remove query params, fragments)

**Vorteile:**
- Erkennt alle öffentlichen Seiten automatisch
- Keine manuelle Pflege nötig
- Bleibt aktuell bei Website-Updates

**Code-Beispiel:**
```javascript
async crawlSitemap(baseUrl) {
    const sitemapUrls = [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap_index.xml`,
        `${baseUrl}/sitemap.html`
    ];
    
    for (const sitemapUrl of sitemapUrls) {
        try {
            const response = await fetch(sitemapUrl);
            if (response.ok) {
                const text = await response.text();
                const urlRegex = /<loc>(.*?)<\/loc>/g;
                const urls = [];
                let match;
                while ((match = urlRegex.exec(text)) !== null) {
                    urls.push(this.normalizeUrl(match[1].trim()));
                }
                return urls;
            }
        } catch (error) {
            // Weiter zur nächsten Sitemap
        }
    }
    return [];
}
```

#### 1.2 Rekursives Link-Following
**Implementierung:**
- Neue Methode `crawlRecursive(url, maxDepth=3)` in `WebCrawler.js`
- Follow interne Links (Domain: `oldenburg-kreis.de`)
- Depth-Limit verhindert Endlosschleifen
- URL-Deduplizierung (Set-basiert)

**Parameter:**
- `maxDepth: 3` (Start-URL = Depth 0, 3 Ebenen weiter)
- `allowedDomains: ['oldenburg-kreis.de', 'ratsinfomanagement.net']`
- `blockedPatterns: ['#', 'mailto:', 'tel:', '.pdf', '/download/']`

**Code-Beispiel:**
```javascript
async crawlRecursive(startUrl, maxDepth = 3, visited = new Set(), currentDepth = 0) {
    if (currentDepth >= maxDepth || visited.has(startUrl)) {
        return [];
    }
    
    visited.add(startUrl);
    const data = await this.crawl(startUrl);
    const links = data.filter(e => e.type === 'link');
    
    const allData = [...data];
    
    // Rekursiv weitere URLs crawlen
    for (const link of links.slice(0, 10)) { // Limit: 10 Links pro Seite
        if (this.isInternalLink(link.url) && !visited.has(link.url)) {
            const subData = await this.crawlRecursive(
                link.url, 
                maxDepth, 
                visited, 
                currentDepth + 1
            );
            allData.push(...subData);
        }
    }
    
    return allData;
}

isInternalLink(url) {
    try {
        const u = new URL(url);
        return u.hostname.includes('oldenburg-kreis.de') || 
               u.hostname.includes('ratsinfomanagement.net');
    } catch {
        return false;
    }
}
```

#### 1.3 Navigation-Analyse
**Implementierung:**
- Puppeteer: Lade Hauptnavigation (`<nav>`, `.menu`, `.navigation`)
- Extrahiere alle Top-Level-Kategorien
- Rekursiv: Erweitere zu Unterseiten (Depth 1-2)
- Fallback, wenn Sitemap nicht verfügbar

---

### Phase 2: Agent-Zuordnung & URL-Mapping (Mittelfristig)

#### 2.1 Automatische Agent-Zuordnung
**Regel-basierte Zuordnung:**
```javascript
const urlAgentMapping = {
    '/planen-und-bauen/': 'buergerdienste',
    '/wirtschaft/': 'wirtschaft',
    '/wirtschaft/jobcenter/': 'jobcenter',
    '/landkreis-und-verwaltung/kreisverwaltung/rechnungspruefung/': 'rechnung_ebilling',
    '/landkreis-und-verwaltung/kreistag/': 'politik_landkreis',
    '/aktuelles/': 'aktionen_veranstaltungen',
    '/gesundheit/': 'gesundheit', // Neuer Agent
    '/bildung/': 'bildung', // Neuer Agent
    '/verkehr/': 'verkehr', // Neuer Agent
    // ...
};

function mapUrlToAgent(url) {
    for (const [pattern, agent] of Object.entries(urlAgentMapping)) {
        if (url.includes(pattern)) {
            return agent;
        }
    }
    return 'general'; // Fallback
}
```

#### 2.2 Fehlende Agenten implementieren
**Priorität:**
1. **bildung** - Bildung, Schulen, Kitas
2. **gesundheit** - Gesundheitsamt, Impfungen, Gesundheitsvorsorge
3. **verkehr** - ÖPNV, Straßenbau, Verkehrsplanung
4. **kultur** - Kultur, Veranstaltungen, Museen
5. **umwelt** - Umweltschutz, Klima, Nachhaltigkeit
6. **katastrophenschutz** - Notfall, Brandschutz, Zivilschutz
7. **pflege** - Pflegestützpunkt, Betreuung
8. **asyl** - Flüchtlingshilfe, Integration

**URL-Quellen für neue Agenten:**
- Sitemap: Alle URLs mit `/bildung/`, `/gesundheit/`, etc.
- Navigation: Top-Level-Menü analysieren
- Manuell: Wichtige Landing-Pages hinzufügen

---

### Phase 3: Robots.txt & Best Practices (Mittelfristig)

#### 3.1 Robots.txt Respektierung
```javascript
async parseRobotsTxt(baseUrl) {
    try {
        const response = await fetch(`${baseUrl}/robots.txt`);
        const text = await response.text();
        const disallowed = [];
        
        text.split('\n').forEach(line => {
            if (line.startsWith('Disallow:')) {
                const path = line.substring(9).trim();
                disallowed.push(path);
            }
        });
        
        return disallowed;
    } catch {
        return [];
    }
}

function isAllowed(url, disallowedPaths) {
    return !disallowedPaths.some(path => url.includes(path));
}
```

#### 3.2 URL-Normalisierung & Deduplizierung
```javascript
normalizeUrl(url) {
    const u = new URL(url);
    // Entferne Query-Params, Fragments, trailing slashes
    return `${u.protocol}//${u.hostname}${u.pathname}`
        .replace(/\/$/, '')
        .toLowerCase();
}

// Deduplizierung während Crawling
const visitedUrls = new Set();

async crawl(url) {
    const normalized = this.normalizeUrl(url);
    if (visitedUrls.has(normalized)) {
        return []; // Bereits gecrawlt
    }
    visitedUrls.add(normalized);
    // ... weiter crawlen
}
```

#### 3.3 Canonical URLs
- Erkenne `<link rel="canonical">` in HTML
- Verwende Canonical-URL als Primär-URL
- Speichere Redirects, aber nutze Canonical

---

### Phase 4: Content-Qualität (Parallel zu Coverage)

#### 4.1 Content-Extraktion verbessern
**Aktuell:** 7.3% der Einträge haben Content  
**Ziel:** >80% der Einträge haben Content

**Verbesserungen:**
- ✅ Bereits implementiert: `extractContentSections()`, `extractSection()`, `extractFallbackContent()`
- 🔄 **Nächster Crawl:** Neue Methoden werden aktiv
- 📊 **Monitoring:** Nach jedem Crawl Content-Qualität prüfen

**Strukturierte Extraktion:**
1. Articles (höchste Priorität)
2. Sections mit Headings
3. Main-Container (`.content`, `#content`)
4. Heading-basierte Sektionen (h2, h3 + Text)
5. Fallback: Paragraphs aus Body

#### 4.2 Content-Filterung
- Mindestlänge: 50 Zeichen
- Entferne Navigation, Footer, Breadcrumbs
- Entferne Scripts, Styles, Kommentare
- Normalisiere Whitespace

---

## Implementierungs-Prioritäten

### 🔴 Sofort (Heute)
1. ✅ Content-Qualität-Script (fertig)
2. ⏳ Coverage-Analyse ausführen
3. ⏳ Neuen Crawl mit verbesserter Content-Extraktion starten
4. ⏳ Content-Qualität prüfen (Ziel: >80%)

### 🟡 Kurzfristig (Diese Woche)
1. **Sitemap-Integration** implementieren
2. **Rekursives Link-Following** (maxDepth=2) hinzufügen
3. **URL-Normalisierung** & Deduplizierung
4. **Coverage:** 50% → 70%

### 🟢 Mittelfristig (Nächste 2 Wochen)
1. **Automatische Agent-Zuordnung** basierend auf URL-Struktur
2. **Fehlende Agenten:** bildung, gesundheit, verkehr implementieren
3. **Robots.txt** Integration
4. **Coverage:** 70% → 90%

### 🔵 Langfristig (Nächster Monat)
1. **Inkrementelles Crawling:** Nur geänderte Seiten neu crawlen
2. **Change Detection:** Last-Modified, ETags prüfen
3. **Performance-Optimierung:** Parallel Crawling, Rate-Limiting
4. **Coverage:** 90% → 100%

---

## Konkrete Implementierungsschritte

### Schritt 1: Sitemap-Integration
**Datei:** `crawler-v2/src/core/CrawlerEngine.js`

```javascript
async discoverUrlsFromSitemap() {
    const sitemapUrls = await this.crawlSitemap(this.baseUrl);
    return sitemapUrls;
}

async getAgentUrlsForSitemap(agentName) {
    const config = this.getAgentConfig(agentName);
    const sitemapUrls = await this.discoverUrlsFromSitemap();
    
    // Filtere URLs basierend auf Agent-Pattern
    const agentUrls = sitemapUrls.filter(url => {
        const patterns = this.getAgentUrlPatterns(agentName);
        return patterns.some(pattern => url.includes(pattern));
    });
    
    return [...(config.webSources || []), ...agentUrls];
}
```

### Schritt 2: Rekursives Crawling
**Datei:** `crawler-v2/src/sources/WebCrawler.js`

```javascript
async crawlRecursive(url, maxDepth = 2, visited = new Set(), currentDepth = 0) {
    // Implementierung siehe oben
}
```

### Schritt 3: URL-Mapping
**Datei:** `crawler-v2/src/core/CrawlerEngine.js`

```javascript
getAgentUrlPatterns(agentName) {
    const patterns = {
        'buergerdienste': ['/planen-und-bauen/', '/bauen-im-landkreis/'],
        'wirtschaft': ['/wirtschaft/', '/unternehmen/'],
        'jobcenter': ['/jobcenter/', '/wirtschaft/jobcenter/'],
        // ...
    };
    return patterns[agentName] || [];
}
```

---

## Erfolgs-Metriken

### Coverage-Metriken
- **Vorher:** ~40-50% (geschätzt)
- **Ziel Phase 1:** 70%
- **Ziel Phase 2:** 90%
- **Ziel Phase 3:** 100%

### Content-Qualität
- **Vorher:** 7.3%
- **Ziel:** >80%

### Agent-Abdeckung
- **Aktuell:** 17 Agenten
- **Ziel:** 25 Agenten (alle wichtigen Bereiche)

---

## Risiken & Mitigation

### Risiko 1: Zu viele URLs → Performance-Problem
**Mitigation:**
- Rate-Limiting (max 5 Requests/Sekunde)
- Parallel Crawling (max 10 gleichzeitig)
- Timeout pro URL (30 Sekunden)

### Risiko 2: Endlosschleifen durch Redirects
**Mitigation:**
- Visited-URLs Set
- Max Depth Limit
- Redirect-Tracking (max 5 Redirects)

### Risiko 3: Blocking durch Server
**Mitigation:**
- User-Agent: Respektvoll setzen
- Robots.txt befolgen
- Delay zwischen Requests (200-500ms)

---

## Nächste Schritte

1. ✅ **Content-Qualität analysiert:** 7.3% (Ziel: >80%)
2. ⏳ **Coverage-Analyse:** Läuft gerade
3. 🔄 **Neuer Crawl:** Nach Coverage-Analyse starten
4. 📊 **Report:** Alle Ergebnisse dokumentieren
5. 🚀 **Implementierung:** Sitemap-Integration starten

---

**Status:** Strategie definiert, bereit für Implementierung  
**Verantwortlich:** Development Team  
**Review-Datum:** 05.11.2025



