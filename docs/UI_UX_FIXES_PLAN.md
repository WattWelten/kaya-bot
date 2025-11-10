# UI/UX Fixes Plan

**Stand:** 27.10.2025

---

## Probleme identifiziert (aus User-Feedback):

1. ❌ **Metadaten werden angezeigt** - "Emotion: friendly Dringlichkeit: normal"
2. ❌ **User-Nachrichten sind nicht eingerückt** (rechts)
3. ❌ **Keine Typing-Animation** - Antworten erscheinen sofort
4. ❌ **Avatar rechts überlappt Text** - Design muss angepasst werden
5. ❌ **Audio funktioniert nicht perfekt** - Analyse nötig

---

## Lösungen:

### 1. Metadaten entfernen ✅
- **Datei:** `server/kaya_server.js`
- **Fix:** Metadata wird nicht mehr an Frontend gesendet
- **Status:** ✅ ERLEDIGT

### 2. User-Nachrichten eingerückt (rechts)
- **Datei:** `frontend/src/components/ChatPane.tsx`
- **Fix:** `ml-24` hinzugefügt für User-Nachrichten
- **Status:** ✅ ERLEDIGT

### 3. Typing-Animation implementieren
- **Datei:** `frontend/src/components/ChatPane.tsx`
- **Implementierung:** Chunk-by-Chunk-Streaming mit Typing-Effekt
- **Status:** ⏳ IN ARBEIT

### 4. Avatar rechts Text-Overlap fixen
- **Datei:** `frontend/src/pages/KayaPage.tsx`
- **Fix:** Layout anpassen - Avatar rechts positionieren
- **Status:** ⏳ PENDING

### 5. Audio-System analysieren
- **Datei:** `server/kaya_audio_service_v2.js`
- **Status:** ⏳ PENDING

---

## Nächste Schritte:

1. Typing-Animation implementieren
2. Avatar-Overlap fixen
3. Audio-System analysieren
4. Tests durchführen

