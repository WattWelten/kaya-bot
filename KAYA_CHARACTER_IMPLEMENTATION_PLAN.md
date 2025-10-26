# KAYA Character Implementation - Umsetzungsplan

## Analyse Ergebnis

### ✅ Was bereits vorhanden:
- LLM Service existiert (`server/llm_service.js`)
- OpenAI Integration funktioniert
- User-Daten-Extraction funktioniert
- Conversation History wird übergeben
- Persona-Detection existiert

### ❌ Was FEHLT für neue Spezifikation:

1. **System-Prompt komplett überarbeiten** (gewünschte neue Struktur)
2. **Post-Processing für Quellen-Fußzeilen**
3. **Token-Limit-Tracking verschärfen**
4. **CTA-Chips als separater Output** (Frontend muss diese rendern)
5. **Style-Knobs als Parameter** (noch nicht implementiert)

## Komplexität-Bewertung

**Zeitbedarf**: 2-3 Stunden

1. **System-Prompt umbauen**: 45 Min
2. **Post-Processing hinzufügen**: 30 Min  
3. **Frontend für CTA-Chips**: 45 Min
4. **Token-Tracking**: 15 Min
5. **Testing**: 30 Min

## Empfehlung

**Besser: ALTERNATIVE Herangehensweise**

Statt komplett neu zu schreiben:

1. **System-Prompt ERWEITERN** statt ersetzen (30 Min)
   - E-Z-O-Struktur hinzufügen
   - Token-Limits hinzufügen
   - Quellen-Fußzeilen-Instruktionen

2. **Frontend-Fix für Links** (bereits implementiert ✅)

3. **Post-Processing für Quellen** (15 Min)
   - Einfacher als kompletter System-Prompt

**Total: 45-60 Minuten statt 2-3 Stunden**

## Umsetzung: Schnelle Verbesserung statt Voll-Umbau

**Erstelle jetzt:**
1. Erweiterte System-Prompt-Version (kompatibel mit bestehendem Code)
2. Post-Processing für Quellen-Fußzeilen
3. Token-Tracking Logging

**DANACH:**
- Testen im Browser
- Feedback holen
- Dann ggf. weiter verfeinern

