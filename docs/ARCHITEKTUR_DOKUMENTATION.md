# KAYA System-Architektur - Vollständige Dokumentation

**Version:** 2.0  
**Stand:** 29.10.2025  
**Status:** Production-Ready

---

## Inhaltsverzeichnis

1. [System-Überblick](#system-überblick)
2. [Komponenten](#komponenten)
3. [Datenfluss](#datenfluss)
4. [Workflow](#workflow)
5. [Konfiguration](#konfiguration)
6. [API-Übersicht](#api-übersicht)
7. [Datenstrukturen](#datenstrukturen)
8. [Sicherheit & DSGVO](#sicherheit--dsgvo)

---

## System-Überblick

KAYA ist ein modular aufgebautes System für kommunale KI-Assistenten, bestehend aus:

- **Crawler-System**: Automatische Datensammlung von kommunalen Websites
- **Agent-System**: Spezialisierte Agenten für verschiedene Verwaltungsbereiche
- **Character-Handler**: KI-gestützte Response-Generierung mit OpenAI
- **Frontend**: React-basierte Chat-Oberfläche mit Babylon.js-Avatar
- **Backend-Server**: Express.js Server mit WebSocket-Support

### Architektur-Prinzipien

- **Modularität**: Jede Komponente ist einzeln austauschbar
- **Skalierbarkeit**: Konfigurationsbasiert für verschiedene Kommunen
- **DSGVO-Konformität**: Automatische Datenlöschung, Nutzerrechte-APIs
- **Robustheit**: Error Handling, Circuit Breaker, Fallback-Mechanismen

---

## Komponenten

### 1. Crawler-System (`crawler-v2/`)

**Zweck:** Automatische Datensammlung von kommunalen Websites

**Komponenten:**

#### 1.1 CrawlerEngine (`src/core/CrawlerEngine.js`)
- **Orchestriert** den gesamten Crawl-Prozess
- **Verwaltet** Agent-Liste und Crawl-Strategien
- **Koordiniert** WebCrawler, DataProcessor, BackupManager

**Hauptfunktionen:**
- `crawlAll()` - Crawlt alle konfigurierten Agenten
- `crawlAgent(agentName)` - Crawlt einen einzelnen Agent
- `getAgentConfig(agentName)` - Lädt Agent-Konfiguration

**Konfiguration:**
- Lädt aus `crawler-v2/config/kommunen/[kommune].json`
- Environment Variable: `KOMMUNE=oldenburg-kreis`

#### 1.2 WebCrawler (`src/sources/WebCrawler.js`)
- **Extrahiert** strukturierte Daten aus HTML
- **Nutzt** Puppeteer (Browser-Automation) + Cheerio (HTML-Parsing)
- **Erkennt** Content-Typen: Texte, Links, Formulare, Tabellen, PDFs

**Extrahierte Daten-Typen:**
- `section` - Hauptinhalte (Text, Überschriften)
- `link` - Links mit Kontext
- `form` - Formulare und Anträge
- `contact` - Kontaktinformationen
- `table` - Tabellen (Strukturdaten)
- `dl` - Definition Lists
- `blockquote` - Zitate/Hinweise

#### 1.3 DataProcessor (`src/processors/DataProcessor.js`)
- **Verarbeitet** rohe Crawler-Daten
- **Bereinigt** Content (HTML-Tags entfernen, Normalisierung)
- **Dedupliziert** Einträge
- **Validiert** Links (HTTP HEAD-Requests)

#### 1.4 BackupManager (`src/processors/BackupManager.js`)
- **Erstellt** Backups nach jedem Crawl
- **Komprimiert** Daten (ZIP)
- **Archiviert** alte Backups

**Workflow:**
```
CrawlerEngine.crawlAll()
  → WebCrawler.crawl(url) für jede URL
  → DataProcessor.processAll(results)
  → DataProcessor.validateLinks(data)
  → BackupManager.createBackup(timestamp)
```

### 2. Agent-System (`server/kaya_agent_manager_v2.js`)

**Zweck:** Verwaltung und Routing zu spezialisierten Agenten

**Agent-Typen:**
- `buergerdienste` - Bürgerdienste, Formulare
- `ratsinfo` - Kreistag, Sitzungen
- `stellenportal` - Stellenausschreibungen
- `kontakte` - Ansprechpartner
- `jugend` - Jugendamt
- `soziales` - Soziale Dienste
- ... (17 Agenten insgesamt)

**Funktionen:**
- `getAgentData(agentName)` - Lädt Agent-Daten aus gecrawlten Dateien
- `routeToAgent(query, persona)` - Routing-Logik (Keyword + Persona)
- `filterRelevantDataOptimized(query, agentData)` - Retrieval (Top-3, gekürzt)
- `getVerifiedFacts(context, agentName)` - Verifizierte Fakten (Landrat, Leitweg-ID, etc.)

**Automatisches Daten-Loading:**
- Beim Server-Start: Lädt alle Agent-Daten
- File-Watcher: Erkennt neue Crawler-Daten automatisch
- Polling-Fallback: Prüft alle 5 Minuten auf Updates

### 3. Character-Handler (`server/kaya_character_handler_v2.js`)

**Zweck:** Zentrale Logik für KAYA-Responses

**Workflow:**
```
User Query
  → detectBasicPersona(query)
  → routeToSystemPromptAgent(intention, query, context)
  → generateResponse(query, userId, sessionId)
    → Intention-Analyse
    → Agent-Routing
    → Retrieval (Relevante Daten aus Agenten)
    → LLM-Service (OpenAI) oder Template-Fallback
    → Post-Processing (Name-Korrektur, Output-Guard)
    → Response
```

**Post-Processing:**
- **OutputGuard**: Entfernt Floskeln, kürzt Antworten, rotiert Closers
- **Name-Korrektur**: Verhindert Halluzinationen (Landrat: Dr. Christian Pundt)
- **Fakten-Validierung**: Telefonnummern, E-Mails, Leitweg-ID

### 4. LLM-Service (`server/llm_service.js`)

**Zweck:** OpenAI-Integration für intelligente Antworten

**Features:**
- **Streaming-Support**: SSE für Live-Responses
- **Circuit Breaker**: Schützt vor API-Überlastung
- **Connection Pooling**: Performance-Optimierung
- **Token-Tracking**: Cost-Tracking, Budget-Überwachung

**Models:**
- **gpt-4o-mini**: Hauptmodell (kostenoptimiert)
- **Whisper**: Speech-to-Text (optional)

**System-Prompt:**
- Dynamisch basierend auf Context
- Verifizierte Fakten werden eingefügt
- Few-Shot Examples für bessere Qualität

### 5. Session-Management (`server/context_memory.js`)

**Zweck:** Verwaltung von Konversations-Kontext

**Gespeichert:**
- Nachrichten-Verlauf
- Erkannte Persona
- Extrahiertes User-Data (Name, etc.)
- Output-Guard State

**DSGVO-Features:**
- Automatische Löschung nach 30 Tagen
- Täglich um 3:00 Uhr (Auto-Cleanup)
- Lösch-API: `DELETE /api/session/:id`

---

## Datenfluss

### Crawler → Agent → Character

```
1. Crawler läuft (täglich 5:00 Uhr oder manuell)
   └─> Crawlt URLs aus Kommune-Config
   └─> Extrahiert strukturierte Daten
   └─> Validiert Links
   └─> Speichert in crawler-v2/data/processed/[agent]_data_YYYY-MM-DD.json

2. AgentManager (beim Server-Start)
   └─> Lädt neueste Agent-Dateien
   └─> Speichert in Memory-Map
   └─> File-Watcher aktiviert

3. User stellt Frage
   └─> CharacterHandler erkennt Intention
   └─> RouteToAgent wählt passenden Agent
   └─> Retrieval sucht relevante Daten
   └─> LLM generiert Response (mit Kontext)
   └─> Post-Processing bereinigt Antwort
   └─> Response an User
```

### Datenstruktur-Flow

```
HTML (Website)
  → WebCrawler.extractStructuredData()
  → Raw Data (JSON)
  → DataProcessor.processAll()
  → Processed Data (bereinigt, dedupliziert)
  → DataProcessor.validateLinks()
  → Validated Data (+ valid: true/false)
  → Speicherung (processed/)
  → AgentManager.loadAgentData()
  → In-Memory (Map)
  → CharacterHandler.filterRelevantDataOptimized()
  → Relevante Snippets (Top-3, gekürzt)
  → LLM Context
  → Response
```

---

## Workflow

### 1. Crawler-Workflow

**Täglicher Crawl (automatisch):**

```bash
# Scheduled (5:00 Uhr)
node crawler-v2/scripts/scheduled_crawler.js
  → CrawlerEngine.crawlAll()
  → Für jeden Agent:
    → WebCrawler.crawl(url) für alle URLs
    → DataProcessor.processAll()
    → validateLinks()
    → saveProcessedData()
    → BackupManager.createBackup()
```

**Manueller Crawl:**

```bash
cd crawler-v2
node scripts/crawl.js
```

### 2. Server-Workflow

**Server-Start:**

```
kaya_server.js
  → KAYACharacterHandler (initialisiert)
    → ContextMemory (initialisiert + Auto-Cleanup startet)
    → AgentManager (initialisiert)
      → loadAgentData() (lädt alle Agent-Daten)
      → startFileWatcher() (überwacht neue Daten)
  → Express Server (startet)
  → WebSocket Service (startet)
```

**Request-Workflow:**

```
POST /api/chat
  → rateLimiter.check()
  → kayaHandler.generateResponse(query, userId, sessionId)
    → Intention-Analyse
    → Persona-Erkennung
    → Agent-Routing
    → Retrieval (Agent-Daten)
    → LLM-Service.generateResponse() oder Template
    → Post-Processing (OutputGuard, Name-Korrektur)
    → Response
```

### 3. Session-Workflow

```
User sendet erste Nachricht
  → ContextMemory.getSession(sessionId)
    → Erstellt neue Session (falls nicht vorhanden)
    → Speichert in memory/[session-id].json
  → Nachricht wird zu Session hinzugefügt
  → Persona wird erkannt und gespeichert
  → Name wird extrahiert (falls vorhanden)
  
User sendet weitere Nachrichten
  → Context wird aus Session geladen
  → Conversation History wird an LLM übergeben
  → Output-Guard State wird verwendet (Anti-Floskel)
  
Nach 30 Tagen Inaktivität
  → Auto-Cleanup löscht Session (täglich 3:00 Uhr)
```

---

## Konfiguration

### 1. Kommune-Konfiguration

**Datei:** `crawler-v2/config/kommunen/[kommune].json`

**Environment Variable:** `KOMMUNE=oldenburg-kreis`

**Struktur:**
```json
{
  "kommune": {
    "name": "Landkreis Oldenburg",
    "domain": "oldenburg-kreis.de",
    "base_url": "https://www.oldenburg-kreis.de"
  },
  "agents": {
    "agent-name": {
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

### 2. Server-Konfiguration

**Datei:** `server/kaya_config.json`

**Wichtig:**
- System-Prompt (kommune-spezifisch anpassen)
- Agent-Mapping (falls Agent-Namen unterschiedlich)
- Character-Einstellungen

**Environment Variables:**
- `OPENAI_API_KEY` - OpenAI API Key
- `USE_LLM=true` - LLM aktivieren
- `KOMMUNE` - Aktuelle Kommune (optional)

### 3. Verified Facts

**Datei:** `server/data/verified_facts.json`

**Zweck:** Kritische, non-halluzinatory Fakten

**Beispiele:**
- Landrat-Name
- Leitweg-ID
- Kontakt-Informationen

**Integration:**
- Werden in System-Prompt eingefügt
- Post-Processing korrigiert Halluzinationen
- AgentManager.getVerifiedFacts()

---

## API-Übersicht

### HTTP-Endpoints

#### POST /api/chat
**Zweck:** Text-Chat mit KAYA

**Request:**
```json
{
  "message": "Welche Unterlagen brauche ich für KFZ-Ummeldung?",
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "response": "Für die KFZ-Ummeldung brauchen Sie...",
  "metadata": {
    "latency": 234
  }
}
```

#### DELETE /api/session/:sessionId
**Zweck:** DSGVO - Löschung von Session-Daten

**Response:**
```json
{
  "success": true,
  "message": "Ihre Daten wurden vollständig gelöscht (DSGVO-konform)",
  "sessionId": "session-123",
  "deleted": true
}
```

#### GET /api/session/:sessionId
**Zweck:** DSGVO - Auskunft über Session-Daten

**Response:**
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

#### GET /health
**Zweck:** Health-Check

**Response:**
```json
{
  "status": "healthy",
  "service": "KAYA-Bot",
  "version": "1.0.0",
  "timestamp": "2025-10-29T15:30:00Z"
}
```

#### POST /api/stt
**Zweck:** Speech-to-Text (Audio → Text)

**Request:** Multipart-Form mit Audio-File

**Response:**
```json
{
  "text": "Welche Unterlagen brauche ich...",
  "confidence": 0.95
}
```

#### POST /api/tts
**Zweck:** Text-to-Speech (Text → Audio)

**Request:**
```json
{
  "text": "KAYA Antwort..."
}
```

**Response:**
```json
{
  "audioUrl": "https://.../audio.mp3"
}
```

### WebSocket

**URL:** `ws://localhost:3001/ws?sessionId=session-123`

**Ereignisse:**
- `message` - Chat-Nachrichten
- `emotion` - Avatar-Emotionen
- `audio` - Audio-Streaming
- `error` - Fehlermeldungen

---

## Datenstrukturen

### Agent-Daten-Struktur

```json
[
  {
    "type": "section",
    "url": "https://...",
    "title": "Überschrift",
    "content": "Hauptinhalt...",
    "sectionType": "article",
    "plain_text": "Bereinigter Text",
    "metadata": {
      "lastModified": "2025-10-29",
      "author": "..."
    }
  },
  {
    "type": "link",
    "url": "https://...",
    "title": "Link-Titel",
    "content": "Link-Kontext...",
    "valid": true
  }
]
```

### Session-Struktur

```json
{
  "id": "session-123",
  "messages": [
    {
      "id": "msg-1",
      "sender": "user",
      "content": "User-Nachricht",
      "timestamp": "2025-10-29T15:30:00Z"
    }
  ],
  "context": {
    "persona": "senior",
    "userData": {
      "name": "Anna"
    },
    "outputGuardState": {
      "lastFooters": [],
      "lastClosers": []
    }
  },
  "createdAt": "2025-10-01T10:00:00Z",
  "lastActivity": "2025-10-29T15:30:00Z"
}
```

### Verified Facts-Struktur

```json
{
  "version": "2.0",
  "facts": {
    "personen_und_positionen": {
      "landrat": {
        "name": "Dr. Christian Pundt",
        "titel": "Landrat"
      }
    },
    "rechnung_ebilling": {
      "leitweg_id": {
        "wert": "03458-0-051"
      }
    }
  }
}
```

---

## Sicherheit & DSGVO

### Gespeicherte Daten

- **Session-Daten**: Konversationen, erkannte Persona, extrahiertes User-Data
- **Speicherdauer**: 30 Tage (automatische Löschung)
- **Speicherort**: `server/memory/[session-id].json`

### Datenlöschung

- **Automatisch**: Täglich um 3:00 Uhr (Sessions > 30 Tage)
- **Manuell**: `DELETE /api/session/:id`
- **Vollständig**: Session + Datei werden gelöscht

### Datenschutz-Rechte

- **Auskunft**: `GET /api/session/:id`
- **Löschung**: `DELETE /api/session/:id`
- **Transparenz**: `DSGVO_DATENSCHUTZ_DOKUMENTATION.md`

### API-Sicherheit

- **Rate Limiting**: 20 Requests/Minute (LLM)
- **HTTPS/TLS**: Alle Kommunikation verschlüsselt
- **Credentials**: Nur über Environment Variables

---

## Deployment

### Entwicklung

```bash
# Backend
cd server && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev

# Crawler
cd crawler-v2 && npm install && node scripts/crawl.js
```

### Production (Railway)

**Backend:**
- Root: `server/`
- Build: Automatisch (Nixpacks)
- Start: `node kaya_server.js`

**Frontend:**
- Root: `frontend/`
- Build: `npm run build`
- Start: `npx serve dist -s -l $PORT`

**Environment Variables:**
- `OPENAI_API_KEY` - Erforderlich
- `USE_LLM=true` - LLM aktivieren
- `KOMMUNE=oldenburg-kreis` - Kommune-Konfiguration

---

## Skalierbarkeit

### Für neue Kommunen

1. **Konfiguration erstellen:**
   - Kopiere `crawler-v2/config/kommunen/template.json`
   - Passe URLs und Agenten an

2. **Environment Variable setzen:**
   ```bash
   KOMMUNE=neue-kommune
   ```

3. **Verified Facts anpassen:**
   - `server/data/verified_facts.json`
   - Kontakt-Informationen, Personen, etc.

4. **System-Prompt anpassen:**
   - `server/kaya_config.json`
   - Kommune-Name, Begrüßung, etc.

### Modularität

**Austauschbare Komponenten:**
- Crawler-Config (kommunenspezifisch)
- Agent-Liste (konfigurierbar)
- System-Prompt (anpassbar)
- Verified Facts (kommunenspezifisch)

**Getrennte Bereiche:**
- `crawler-v2/` - Crawler-System (unabhängig)
- `server/` - Backend (unabhängig)
- `frontend/` - Frontend (unabhängig)

---

## Monitoring & Logging

### Logs

**Crawler:**
- `crawler-v2/logs/crawler.log`
- `crawler-v2/logs/error.log`

**Server:**
- Console-Logs (JSON-Format)
- Error-Logger: `server/utils/error_logger.js`

### Metriken

**Crawler:**
- Anzahl gecrawlter URLs
- Content-Qualität (%)
- Link-Validierung-Status

**Server:**
- Request-Latency
- Cache-Hit-Rate
- Token-Usage
- Session-Anzahl

---

## Nächste Schritte / Roadmap

### Phase 3: Dokumentation ✅ (in Arbeit)

- ✅ DSGVO-Dokumentation
- ✅ Architektur-Dokumentation (diese Datei)
- ⏳ API-Dokumentation (Swagger)
- ⏳ Setup-Guide für neue Kommunen (teilweise vorhanden)

### Phase 4: Optimierungen

- ⏳ Crawler-Parallelisierung
- ⏳ Session-Cleanup-Verbesserung
- ⏳ Error-Handling-Konsistenz

### Phase 5: Erweiterungen

- ⏳ Embedding-Service (Semantic Search)
- ⏳ Hybrid Retrieval
- ⏳ Semantic Caching

---

**Letzte Aktualisierung:** 29.10.2025  
**Nächste Review:** Bei größeren Änderungen

