# KAYA Chat-Analyse & Verbesserungsplan

## 🔍 Was im Screenshot sichtbar ist

### ✅ Funktioniert gut:
- **Kontext wird erinnert**: Henning wird durchgehend genannt
- **Relevante Information**: Links und Dokumente werden geliefert
- **Personalisiert**: Name wird aktiv verwendet

### ❌ Hauptprobleme:

#### 1. **Links nicht klickbar** (KRITISCH!)
- Links werden als `[Text](URL)` angezeigt statt als klickbare Buttons
- Fehlende visuelle Hervorhebung
- Kein Icon, keine Hover-Effekte
- Bürger sehen Links, können sie aber nicht anklicken

#### 2. **Fehlende CTA-Buttons**
- Keine Schnell-Aktionen nach Antworten
- Keine Chips wie "Formular starten", "Termin wählen"
- Antworten enden mit Fragen, aber ohne konkrete Aktion

#### 3. **Zu wenig Struktur**
- Keine nummerierten Schritte
- Keine Bulletpoints
- Keine klare visuelle Hierarchie

#### 4. **Keine Quellenangaben**
- Fußzeile mit Quelle fehlt komplett
- Keine Aktualitäts-Hinweise

#### 5. **Character-Deviation**
- Sprachstil passt nicht zur neuen Spezifikation
- Kein Humor, keine norddeutschen Wendungen (optional)
- Fehlende Empathie-Struktur (E-Z-O)
- Keine Style-Knobs implementiert

## 🎯 Was MUSS passieren:

### URGENT (Priorität 1):
1. **Markdown-Links in klickbare Buttons umwandeln**
2. **CTA-Buttons nach jeder Antwort**
3. **Strukturierte Schritte mit Nummerierung**
4. **Quellen-Fußzeilen hinzufügen**

### WICHTIG (Priorität 2):
5. **Character-System überarbeiten (neue Spezifikation)**
6. **Style-Knobs implementieren (Humor, Formality, Pace)**
7. **Token-Ökonomie durchsetzen (80-220 Tokens)**
8. **Mini-Kompetenzen für häufige Anliegen**

## 🛠 Konkrete Lösungen:

### Lösung 1: Link-Rendering im Frontend FIXEN
**Problem**: `renderMessageContent()` konvertiert Markdown NICHT korrekt zu HTML
**Lösung**: Regex-Timing prüfen, dann testen

### Lösung 2: Chips für CTAs
**Problem**: Keine visuellen Action-Buttons
**Lösung**: Quick-Actions am Ende der KAYA-Nachrichten als Chips rendern

### Lösung 3: Character-System aktualisieren
**Problem**: Alter Character-Code vs. neue Spezifikation
**Lösung**: 
- `server/llm_service.js` mit neuem System-Prompt
- Token-Limits durchsetzen
- Style-Knobs als Parameter

### Lösung 4: Struktur in Antworten
**Problem**: Unstrukturierte Textwände
**Lösung**: LLM-Prompt mit expliziten Struktur-Anweisungen

## 📋 Nächste Schritte:

1. ✅ **Design ist fertig** - UI/UX sieht gut aus (wenn deployed)
2. 🔧 **Links sofort fixen** - Kritisch für Funktionalität
3. 🎯 **Character anpassen** - Neue Spezifikation implementieren
4. 🚀 **Deploy & Testen** - Dann Feedback holen

**Geschätzte Zeit**: 2-3 Stunden für alle Fixes

