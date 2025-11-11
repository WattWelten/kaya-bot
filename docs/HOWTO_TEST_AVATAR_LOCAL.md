# 🧪 HowTo: Avatar lokal testen (für Quantumfrog)

## 📋 Übersicht

Diese Anleitung beschreibt, wie das Quantumfrog-Team die GLB-Korrekturen lokal testen kann, insbesondere:
- Avatar-Bewegungen testen
- Voice-Reaktionen testen
- Lip-Sync und Emotionen prüfen

---

## ✅ Voraussetzungen

1. **Node.js 18+** installiert
2. **Git Repository** geklont
3. **GLB-Dateien** vorhanden (von Quantumfrog korrigiert)

---

## 🚀 Schnellstart

### Minimal-Setup (nur Avatar-Bewegungen)

```bash
# In das Frontend-Verzeichnis wechseln
cd kaya-frontend

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

**Frontend läuft auf:** `http://localhost:5173`

### Vollständiges Setup (mit Voice-Testing)

```bash
# Terminal 1: Backend starten
cd kaya-api
npm install
npm start

# Terminal 2: Frontend starten
cd kaya-frontend
npm install
npm run dev
```

**Backend läuft auf:** `http://localhost:3001`  
**Frontend läuft auf:** `http://localhost:5173`

---

## 📁 GLB-Dateien Setup

Die korrigierten GLB-Dateien müssen im folgenden Verzeichnis liegen:

```
kaya-frontend/public/avatar/
├── Kayanew-draco.glb      (Priorität 1: Draco-komprimiert, HD)
├── Kayanew_mouth.glb      (Fallback 1: Unkomprimiert mit Shape Keys)
└── Kayanew.glb            (Fallback 2: Alte Version)
```

**Wichtig:** Die korrigierten GLB-Dateien von Quantumfrog müssen hier platziert werden.

**GLB-Loading-Priorität:**
1. `Kayanew-draco.glb` wird zuerst geladen
2. Falls Fehler → `Kayanew_mouth.glb`
3. Falls Fehler → `Kayanew.glb`

---

## 🎮 Avatar-Bewegungen testen

### Relevante Dateien

1. **`kaya-frontend/src/components/BabylonAvatar.tsx`**
   - Hauptkomponente für Avatar-Rendering
   - Lädt GLB-Modelle
   - Verwaltet Animationen

2. **`kaya-frontend/src/services/LipsyncEngine.ts`**
   - Lip-Sync-Engine
   - Steuert Viseme-Animationen (Mundbewegungen)

3. **`kaya-frontend/src/services/EmotionMapper.ts`**
   - Emotion-Mapping
   - Steuert Gesichtsausdrücke

### Test-Schritte

1. **Browser öffnen:** `http://localhost:5173`
2. **Browser-Konsole öffnen** (F12)
3. **Avatar lädt automatisch** beim Öffnen der Seite
4. **Console-Logs prüfen:**
   - `📦 Loading GLB` - GLB-Loading-Status
   - `🎭 Lipsync Engine` - Lipsync-Initialisierung
   - `✅ Avatar Ready` - Avatar bereit

### Avatar-Positionierung anpassen

In `kaya-frontend/src/components/BabylonAvatar.tsx`:

```typescript
const DIAL = {
  yawDeg: 0,           // Rotation (0 = frontal)
  fovDeg: 26,         // Field of View
  padding: 1.05,       // Zoom-Level
  eyeLine: 0.62,      // Augenlinie-Position
  betaMin: 65,        // Kamera-Neigung min
  betaMax: 82,        // Kamera-Neigung max
  xShift: 0           // Horizontal-Verschiebung
};
```

---

## 🎤 Voice-Reaktion testen

### Wie Voice-Input funktioniert

1. **Mikrofon-Button** im ChatPane klicken
2. **Audio wird an Backend gesendet** (`/api/audio-chat`)
3. **Backend sendet Antwort** mit:
   - Text-Response
   - TTS-Audio (falls aktiviert)
   - Viseme-Timeline (für Lip-Sync)

### Relevante Dateien für Voice

1. **`kaya-frontend/src/services/AudioManager.ts`**
   - Verwaltet Mikrofon-Aufnahme
   - Audio-Wiedergabe
   - Audio-Amplitude für Fallback-Lipsync

2. **`kaya-frontend/src/components/ChatPane.tsx`**
   - Voice-Input-UI
   - Sendet Audio an Backend

3. **`kaya-frontend/src/pages/KayaPage.tsx`**
   - Verbindet Voice-Input mit Avatar
   - `isSpeaking` State steuert Avatar-Animationen

### Voice-Testing ohne Backend (Fallback-Modus)

Falls Backend nicht läuft:
- Avatar reagiert auf Audio-Amplitude
- Mikrofon-Input wird direkt visualisiert
- Keine echte TTS-Antwort

### Voice-Testing mit Backend (vollständig)

1. **Backend starten** (siehe Schnellstart)
2. **Frontend starten** (siehe Schnellstart)
3. **Mikrofon-Button klicken**
4. **Sprechen**
5. **Avatar sollte:**
   - Auf Voice reagieren (`isSpeaking = true`)
   - Lip-Sync ausführen (falls Viseme-Timeline vorhanden)
   - Emotionen zeigen (falls im Response)

### Backend Environment Variables (optional)

Falls API-Keys benötigt werden:

```bash
# In kaya-api/.env oder als Environment Variables
OPENAI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

---

## 🔍 GLB-Analyse-Tool

Es gibt ein Debug-Tool für GLB-Analyse:

```
kaya-frontend/public/debug/inspect-glb.html
```

**Verwendung:**
1. Datei im Browser öffnen
2. GLB-Datei hochladen
3. Morph Targets, Bones, etc. analysieren

---

## 🛠️ Nützliche Commands

```bash
# Frontend mit Type-Checking
cd kaya-frontend
npm run type-check

# Frontend Build testen
cd kaya-frontend
npm run build

# Frontend Preview (nach Build)
cd kaya-frontend
npm run preview

# Backend testen
cd kaya-api
node kaya_server.js
```

---

## 🐛 Troubleshooting

### Avatar lädt nicht

**Mögliche Ursachen:**
- GLB-Dateien fehlen in `public/avatar/`
- Falsche Dateinamen
- CORS-Probleme (sollte mit Vite-Dev-Server kein Problem sein)

**Lösung:**
1. Browser-Konsole prüfen (F12)
2. GLB-Dateien in `public/avatar/` prüfen
3. Dateinamen prüfen (exakte Groß-/Kleinschreibung!)

### Voice reagiert nicht

**Mögliche Ursachen:**
- Backend läuft nicht
- Mikrofon-Berechtigung nicht erteilt
- WebSocket-Verbindung fehlgeschlagen

**Lösung:**
1. Backend-Status prüfen (`http://localhost:3001`)
2. Browser-Mikrofon-Berechtigung prüfen
3. Browser-Konsole auf Fehler prüfen
4. WebSocket-Verbindung prüfen

### Keine Lip-Sync-Animationen

**Mögliche Ursachen:**
- GLB enthält keine Morph Targets
- Viseme-Timeline wird nicht vom Backend gesendet
- LipsyncEngine findet Morph Targets nicht

**Lösung:**
1. GLB mit `inspect-glb.html` analysieren
2. Browser-Konsole prüfen (Morph Target Logs)
3. Backend-Response prüfen (Viseme-Timeline vorhanden?)

### CORS-Fehler

**Lösung:**
- Vite-Dev-Server sollte CORS automatisch handhaben
- Falls Probleme: `vite.config.ts` prüfen

---

## 📊 Erwartete Console-Logs

### Beim Avatar-Loading

```
📦 Starte GLB-Loading (Draco-HD): /avatar/Kayanew-draco.glb
📦 Loading GLB (Draco-HD): 50%
📦 Loading GLB (Draco-HD): 100%
✅ Materialien für HD-Rendering optimiert
📦 Babylon Avatar geladen: X Meshes, Morph Targets: Y
🎭 Lipsync Engine & Emotion Mapper initialisiert
✅ Avatar Ready-Flag gesetzt
```

### Bei Voice-Input

```
🎤 Starte Audio-Aufnahme
📡 Sende Audio an Backend
📨 WebSocket Message: audio_response
🎭 isSpeaking useEffect triggered
🎭 isSpeaking: true
✅ Timeline-Lipsync gestartet: X Segmente
```

---

## 📝 Checkliste für Quantumfrog

- [ ] Node.js 18+ installiert
- [ ] Repository geklont
- [ ] GLB-Dateien in `public/avatar/` platziert
- [ ] Frontend Dependencies installiert (`npm install`)
- [ ] Frontend läuft (`npm run dev`)
- [ ] Browser öffnet `http://localhost:5173`
- [ ] Avatar lädt (Console-Logs prüfen)
- [ ] Backend läuft (optional, für Voice-Testing)
- [ ] Mikrofon-Berechtigung erteilt
- [ ] Voice-Input funktioniert
- [ ] Avatar reagiert auf Voice
- [ ] Lip-Sync funktioniert (falls Viseme-Timeline vorhanden)

---

## 🔗 Weitere Ressourcen

- **Babylon.js Dokumentation:** https://doc.babylonjs.com/
- **GLTF/GLB Spezifikation:** https://www.khronos.org/gltf/
- **Vite Dokumentation:** https://vitejs.dev/

---

**Erstellt:** 2025-11-10  
**Version:** 1.0  
**Für:** Quantumfrog Team

