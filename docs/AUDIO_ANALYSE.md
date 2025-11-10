# Audio-System Analyse

**Datum:** 27.10.2025  
**Status:** ⏳ PROBL

---

## Identifizierte Probleme

### 1. **Backend Audio-Chat-Endpoint fehlt**

**Problem:** Der Endpoint `/api/audio-chat` wird in `ChatPane.tsx` aufgerufen, existiert aber nicht im Server.

**Code-Referenz:**
```typescript
// frontend/src/components/ChatPane.tsx, Zeile 162
const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://api.kaya.wattweiser.com/api/audio-chat'
  : 'http://localhost:3001/api/audio-chat';
```

**Lösung:** Endpoint `/api/audio-chat` in `kaya_server.js` hinzufügen.

---

### 2. **ElevenLabs API Key möglicherweise nicht gesetzt**

**Problem:** Audio-Service benötigt `ELEVENLABS_API_KEY` Environment-Variable.

**Code-Referenz:**
```javascript
// server/services/audio_service.js, Zeile 181
if (!this.elevenlabsApiKey) {
    throw new Error('ELEVENLABS_API_KEY ist nicht gesetzt');
}
```

**Lösung:** `.env` prüfen und `ELEVENLABS_API_KEY` setzen.

---

### 3. **Frontend Audio-Service nutzt Web Speech API als Fallback**

**Problem:** Der Frontend-Service nutzt Web Speech API (Browser-TTS) statt ElevenLabs.

**Code-Referenz:**
```typescript
// frontend/src/services/AudioService.ts, Zeile 176
private async webSpeechTTS(text: string, language: string): Promise<string> {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}
```

**Konsequenz:** Unnatürliche Roboter-Stimme statt ElevenLabs TTS.

---

## Lösungen

### Lösung 1: Audio-Chat-Endpoint im Server hinzufügen ✅

**Datei:** `server/kaya_server.js`

```javascript
// Audio-Chat-Endpoint hinzufügen
app.post('/api/audio-chat', upload.single('audio'), async (req, res) => {
    try {
        const audioBuffer = req.file.buffer;
        
        // 1. Speech-to-Text
        const { text } = await audioService.speechToText(audioBuffer);
        
        // 2. KAYA Response generieren
        const response = await kayaHandler.generateResponse(text, text);
        
        // 3. Text-to-Speech
        const { audioUrl } = await audioService.textToSpeech(response.response);
        
        res.json({
            transcription: text,
            response: response.response,
            audioUrl: audioUrl
        });
    } catch (error) {
        console.error('❌ Audio-Chat Fehler:', error);
        res.status(500).json({ error: error.message });
    }
});
```

### Lösung 2: `.env` Prüfen und API Keys setzen ✅

```env
ELEVENLABS_API_KEY=sk-xxxxx
OPENAI_API_KEY=sk-xxxxx
```

### Lösung 3: Frontend Audio-Service an Backend binden ✅

**Datei:** `frontend/src/services/AudioService.ts`

```typescript
async textToSpeech(text: string, language: string = 'de-DE'): Promise<string> {
    // IMMER Backend-TTS verwenden (statt Web Speech API)
    return this.serverTTS(text, language);
}
```

---

## Nächste Schritte

1. ✅ Audio-Chat-Endpoint in `kaya_server.js` hinzufügen
2. ✅ `.env` prüfen (ELEVENLABS_API_KEY)
3. ✅ Frontend Audio-Service an Backend binden
4. ⏳ Tests durchführen
5. ⏳ Avatar-Integration vorbereiten

---

**Status:** Lösungen implementieren 🚀

