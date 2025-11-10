# 🎮 Avatar-Projekt: Aufgabenstellung für Quantumfrog

## 👋 Willkommen Quantumfrog!

Ihr wurdet als Gaming-Experten hinzugezogen, um den KAYA-Avatar zum Laufen zu bringen. Dieser Dokument beschreibt alle relevanten Informationen, damit ihr direkt loslegen könnt.

---

## 📋 Projektübersicht

**Projekt:** KAYA (Landkreis Oldenburg) - Virtueller Assistent mit 3D-Avatar  
**Technologie:** React + TypeScript + Babylon.js  
**Avatar-Quelle:** avaturn.me  
**Hauptprobleme:**
1. Avatar wird nicht richtig positioniert und ausgerichtet
2. LipSync, Mimik und Gestik funktionieren nicht

---

## 🎯 Aufgaben

### Hauptaufgabe 1: Avatar-Positionierung und -Ausrichtung

**Problem:**
- Avatar erscheint im Profil statt frontal
- Kamera-Positionierung ist falsch (zu viel Luft, falscher Winkel)
- Pivot-Normalisierung funktioniert nicht wie erwartet
- Yaw-Winkel wird nicht korrekt umgesetzt

**Ziel:**
- Avatar frontal anzeigen (kein Profil)
- Nah-Framing (Kopf + Schultern, wenig Luft)
- Korrekte Kamera-Positionierung
- Stabile Kamera-Interaktion (kein "von unten")

### Hauptaufgabe 2: GLB-Analyse und LipSync/Mimik/Gestik

**Problem:**
- LipSync funktioniert nicht (Morph Targets werden nicht gefunden)
- Mimik funktioniert nicht (Emotion-Targets werden nicht gefunden)
- Gestik ist nicht implementiert

**Ziel:**
- GLB-Struktur analysieren (welche Morph Targets existieren?)
- Mapping-System fixen (Viseme-Namen-Mismatch)
- Emotion-Targets finden (Auto-Detection)
- Gestik implementieren (falls Bones vorhanden)

---

## 📦 Avatar-Modell: avaturn.me

### Wichtige Informationen

**Quelle:** Die GLB-Dateien stammen von **avaturn.me**

**Verfügbare GLB-Dateien:**
1. `Kayanew-draco.glb` - Draco-komprimiert, HD-Version (priorisiert)
2. `Kayanew_mouth.glb` - Unkomprimiert mit Shape Keys für Lipsync
3. `Kayanew.glb` - Fallback ohne Shape Keys

**Speicherort:**
```
frontend/public/avatar/
├── Kayanew-draco.glb
├── Kayanew_mouth.glb
└── Kayanew.glb
```

**Hinweis:** Die Modelle wurden von avaturn.me exportiert und können dort modifiziert werden, falls nötig.

---

## 🏗️ Technischer Stack

- **Frontend:** React 18.2.0 + TypeScript + Vite
- **3D-Engine:** Babylon.js 8.0.0 (`@babylonjs/core`, `@babylonjs/loaders`)
- **Avatar-Modelle:** GLB/glTF mit Morph Targets (Shape Keys)
- **Rendering:** HD-Preset mit DOF, Bloom, SSAO

---

## 📁 Projekt-Struktur

```
D:\Landkreis\
├── frontend\
│   ├── src\
│   │   ├── components\
│   │   │   └── BabylonAvatar.tsx      ← HAUPTFOKUS (Avatar-Rendering)
│   │   ├── services\
│   │   │   ├── LipsyncEngine.ts       ← Lipsync-Engine
│   │   │   ├── EmotionMapper.ts      ← Emotion-Mapper
│   │   │   └── KayaVisualPreset.ts   ← HD-Rendering-Preset
│   │   ├── pages\
│   │   │   └── KayaPage.tsx          ← Layout-Container
│   │   └── styles\
│   │       └── globals.css            ← CSS-Layout
│   └── public\
│       ├── avatar\
│       │   ├── Kayanew-draco.glb     ← Draco-komprimiert (HD)
│       │   ├── Kayanew_mouth.glb      ← Unkomprimiert (Shape Keys)
│       │   └── Kayanew.glb            ← Fallback
│       └── debug\
│           └── inspect-glb.html        ← GLB-Analyse-Tool
└── server\                             (Node.js Backend)
```

---

## 🔧 Hauptkomponente: BabylonAvatar.tsx

### Wichtige Parameter (DIAL-Objekt)

```typescript
const DIAL = {
  yawDeg: 0,           // frontal (sollte Avatar frontal zeigen)
  fovDeg: 26,          // engeres Portrait-FOV
  padding: 1.05,       // näher heran
  eyeLine: 0.62,       // Augenlinie bei 62%
  betaMin: 65,         // weniger Neigung nach oben/unten
  betaMax: 82,
  xShift: 0            // mittig
};
```

### Wichtige Funktionen

1. **`normalizePivotAndForward()`** (Zeilen 32-60)
   - Setzt Pivot auf Brustbein (58% der Höhe)
   - Normalisiert Vorwärtsachse (Avatar soll nach `-Z` blicken)
   - Dreht 180° um Y, wenn Avatar nach `+Z` blickt

2. **`framePortrait()`** (Zeilen 63-112)
   - Portrait-Framing (9:16)
   - Augenlinie bei ~62%
   - Kamera-Positionierung basierend auf FOV, Padding, Yaw
   - Setzt Alpha-Limits (±12° um `baseAlpha`)

3. **`limitInteraction()`** (Zeilen 115-128)
   - Deaktiviert Panning, Wheel-Zoom
   - Setzt Beta-Limits (65°-82°)
   - Setzt Alpha-Limits (±25°)

### Avatar-Loading (Fallback-Kette)

```typescript
// 1. Versuche Draco-komprimierte HD-Version
/avatar/Kayanew-draco.glb

// 2. Fallback: Unkomprimierte GLB mit Shape Keys
/avatar/Kayanew_mouth.glb

// 3. Fallback: Alte Version ohne Shape Keys
/avatar/Kayanew.glb
```

---

## 🎭 LipSync-System

### LipsyncEngine

**Datei:** `frontend/src/services/LipsyncEngine.ts`

**Funktionalität:**
- Auto-Detection von Morph Targets
- Pattern-Matching für Viseme-Namen
- Zeitbasierte Viseme-Steuerung
- Smooth Interpolation zwischen Visemes

**Problem:** Viseme-Namen-Mismatch
- GLB hat: `viseme_sil`, `viseme_PP`, `viseme_FF`, etc.
- Code sucht nach: `aa`, `ih`, `ou`, `ee`, `M`, `B`, `P`, etc.

**Erwartete Visemes (aus ANALYSE_SHAPEKEYS.md):**
- `viseme_sil` - Stille
- `viseme_PP` - P/B/M
- `viseme_FF` - F/V
- `viseme_TH` - Th
- `viseme_DD` - D/T
- `viseme_kk` - K/G
- `viseme_CH` - Ch/J
- `viseme_SS` - S/Z
- `viseme_nn` - N
- `viseme_RR` - R
- `viseme_aa` - A
- `viseme_E` - E
- `viseme_I` - I
- `viseme_O` - O
- `viseme_U` - U

### EmotionMapper

**Datei:** `frontend/src/services/EmotionMapper.ts`

**Funktionalität:**
- Mappt Emotionen auf Morph Target Kombinationen
- Glow-Effekt für Emotionen
- Smooth Transitions

**Problem:** Hardcodierte Morph Target-Namen
- Sucht nach: `mouthSmile_L`, `mouthSmile_R`, `browInnerUp`, etc.
- GLB hat möglicherweise andere Namen (z.B. `mouthSmileLeft`, `mouthSmileRight`)

**Erwartete Emotion-Targets:**
- `mouthSmile_L` / `mouthSmile_R` - asymmetrisches Lächeln
- `mouthFrown_L` / `mouthFrown_R` - traurige Mundwinkel
- `browInnerUp` - Brauen hoch
- `browDown_L` / `browDown_R` - Brauen runter
- `mouthOpen` - Mund öffnen
- `mouthFunnel` - Lippen spitz

---

## 🔍 GLB-Analyse

### Analyse-Tool

**Datei:** `frontend/public/debug/inspect-glb.html`

**Verwendung:**
1. Öffne in Browser: `file:///D:/Landkreis/frontend/public/debug/inspect-glb.html`
2. Browser-Console öffnen (F12)
3. Tool lädt automatisch GLB und listet alle Morph Targets

**Funktionalität:**
- Listet alle Meshes
- Listet alle Skeletons und Bones
- Listet alle Morph Targets mit Namen
- Zeigt TransformNodes
- Console-Logs für alle gefundenen Targets

### Was analysiert werden muss:

1. **Morph Targets:**
   - Welche Meshes haben Morph Targets?
   - Liste aller Morph Target-Namen
   - Welche Visemes sind vorhanden?
   - Welche Emotion-Targets sind vorhanden?

2. **Bones (für Gestik):**
   - Welche Bones existieren für Arm/Hand-Gestik?
   - Welche Bones für Kopf-Nicken/-Schütteln?
   - Welche Bones für Körper-Bewegung?

3. **Struktur:**
   - Welches Mesh ist das Haupt-Mesh (meist `Head_Mesh`)?
   - Wie viele Morph Targets hat das Haupt-Mesh?
   - Sind alle Shape Keys exportiert?

---

## 🐛 Bekannte Probleme

### Problem 1: Avatar-Positionierung

**Symptom:**
- Avatar erscheint im Profil statt frontal
- Kamera-Positionierung ist falsch
- Yaw-Winkel wird nicht korrekt umgesetzt

**Mögliche Ursachen:**
- Pivot-Normalisierung funktioniert nicht
- Kamera-Framing wird zu früh/zu spät aufgerufen
- Race Conditions zwischen Preset-Initialisierung und Framing

### Problem 2: Viseme-Namen-Mismatch

**Symptom:**
- LipSync funktioniert nicht
- Viele Visemes bleiben ungemappt

**Ursache:**
- GLB hat `viseme_PP`, Code sucht nach `M`, `B`, `P`
- Pattern-Matching findet `viseme_*`-Namen nicht

**Lösung:**
- Patterns erweitern: `/viseme_PP/i` → `M`, `B`, `P` Visemes
- Oder: Viseme-Mapping-Tabelle erstellen

### Problem 3: Emotion-Targets nicht gefunden

**Symptom:**
- Mimik funktioniert nicht
- Emotion-Targets werden nicht gefunden

**Ursache:**
- EmotionMapper sucht `mouthSmile_L`, GLB hat möglicherweise `mouthSmileLeft`
- Hardcodierte Namen statt Auto-Detection

**Lösung:**
- Auto-Detection für Emotion-Targets
- Fallback-Namen-Liste
- Pattern-Matching wie im LipsyncEngine

### Problem 4: Draco-Kompression

**Symptom:**
- Morph Targets werden nicht geladen
- GLB-Loading schlägt fehl

**Ursache:**
- Draco-komprimierte GLB könnte Morph Targets beeinträchtigen

**Lösung:**
- Unkomprimierte Version testen (`Kayanew_mouth.glb`)
- Draco-Decoder prüfen
- Fallback auf unkomprimierte Version

---

## 🛠️ Empfohlene Vorgehensweise

### Schritt 1: GLB analysieren

1. **Analyse-Tool nutzen:**
   - `inspect-glb.html` im Browser öffnen
   - Console-Logs analysieren
   - Mapping-Report erstellen

2. **Dokumentieren:**
   - Welche Meshes haben Morph Targets?
   - Liste aller Morph Target-Namen
   - Welche Bones existieren?
   - Welche Visemes sind vorhanden?

### Schritt 2: Avatar-Positionierung fixen

1. **Pivot-Normalisierung überarbeiten:**
   - Pivot auf Brustbein setzen
   - Vorwärtsachse zuverlässig erkennen
   - Avatar nach `-Z` blicken lassen

2. **Kamera-Framing optimieren:**
   - Avatar frontal anzeigen (kein Profil)
   - Nah-Framing (Kopf + Schultern)
   - FOV und Padding korrekt anwenden
   - Yaw-Winkel korrekt umsetzen

3. **Kamera-Interaktion fixen:**
   - Alpha-Limits korrekt setzen
   - Beta-Limits einhalten (kein "von unten")
   - Wheel-Zoom deaktivieren
   - Panning deaktivieren

### Schritt 3: LipSync/Mimik fixen

1. **Mapping-System verbessern:**
   - Patterns für `viseme_*`-Namen hinzufügen
   - Auto-Detection für Emotion-Targets
   - Fallback-Namen unterstützen

2. **Testing:**
   - LipSync mit verschiedenen Visemes testen
   - Emotionen mit verschiedenen Targets testen
   - Console-Logs prüfen

3. **Dokumentation:**
   - Mapping-Tabelle erstellen
   - Bekannte Probleme dokumentieren
   - Lösungsansätze dokumentieren

### Schritt 4: Gestik implementieren (optional)

1. **Bones analysieren:**
   - Welche Bones existieren für Arm/Hand-Gestik?
   - Welche Bones für Kopf-Nicken/-Schütteln?
   - Welche Bones für Körper-Bewegung?

2. **Animation-System:**
   - Bone-Animation für Gesten
   - Integration mit Lipsync/Emotion
   - Timing-Synchronisation

---

## 📊 Debug-Informationen

### Console-Logs

Nach GLB-Load sollte erscheinen:
```
✅ GLB erfolgreich geladen!
📦 Babylon Avatar geladen: 12 Meshes, Morph Targets: 15
🔍 Auto-Detection: 15 MorphTargets gefunden
📋 MorphTarget-Namen: viseme_sil, viseme_PP, viseme_FF, mouthOpen, ...
📊 MorphTarget Mapping-Report:
  ✅ aa → viseme_aa
  ✅ M → viseme_PP
  ⚠️ 10 Visemes ohne Mapping: ih, ou, ee, ...
```

### Debug-Overlay

**Aktivierung:** `Strg+D` (nur in Development)

**Zeigt:**
- Aktuelles Viseme
- Gemapptes Morph Target
- Influence (0-100%)
- Audio-Amplitude
- Timeline-Länge
- `isSpeaking` Status
- Lipsync-Status

---

## 📝 Wichtige Dateien

### Für die Arbeit relevant:

1. **`frontend/src/components/BabylonAvatar.tsx`**
   - Hauptkomponente für Avatar-Rendering
   - Enthält Kamera-Setup, Pivot-Normalisierung, Framing

2. **`frontend/src/services/LipsyncEngine.ts`**
   - Lipsync-Engine mit Auto-Detection
   - Pattern-Matching für Visemes

3. **`frontend/src/services/EmotionMapper.ts`**
   - Emotion-Mapper mit hardcodierten Namen
   - Braucht Auto-Detection

4. **`frontend/src/services/KayaVisualPreset.ts`**
   - HD-Rendering-Preset
   - Kamera-Initialisierung

5. **`frontend/public/debug/inspect-glb.html`**
   - GLB-Analyse-Tool
   - Wichtig für die Analyse

### Dokumentation:

- `ANALYSE_SHAPEKEYS.md` - Dokumentation der Shape Keys
- `SHAPEKEYS_EXPORT_WICHTIG.md` - Export-Probleme
- `BLENDER_SHAPEKEYS_ANLEITUNG.md` - Blender-Anleitung

---

## 🎯 Erwartetes Ergebnis

### Avatar-Positionierung:

- ✅ Avatar frontal (kein Profil)
- ✅ Nah-Framing (Kopf + Schultern, wenig Luft)
- ✅ Korrekte Kamera-Positionierung
- ✅ Stabile Kamera-Interaktion (kein "von unten")

### LipSync/Mimik:

- ✅ Alle Visemes werden gefunden und gemappt
- ✅ LipSync funktioniert während des Sprechens
- ✅ Emotionen werden korrekt angezeigt
- ✅ Smooth Transitions zwischen Visemes

### Gestik (optional):

- ✅ Kopf-Nicken/-Schütteln
- ✅ Arm/Hand-Gesten
- ✅ Körper-Bewegung

---

## 🌐 Live-Environment

**Production-URL:** https://app.kaya.wattweiser.com/

**Hinweis:** Der Avatar ist dort live deployed und kann direkt getestet werden. Alle Änderungen werden über Git gepusht und automatisch via Railway deployed.

**Deployment-Prozess:**
1. Code-Änderungen committen
2. Git push zu GitHub
3. Railway deploied automatisch (Continuous Deployment)
4. Avatar ist live auf https://app.kaya.wattweiser.com/ verfügbar

**Repository:** https://github.com/WattWelten/kaya-bot

---

## 🚀 Quick Start

### 1. Repository klonen (falls noch nicht geschehen)

```bash
git clone https://github.com/WattWelten/kaya-bot.git
cd kaya-bot
```

### 2. Frontend starten

```bash
cd frontend
npm install
npm run dev
```

### 3. GLB analysieren

```bash
# Öffne in Browser:
file:///D:/Landkreis/frontend/public/debug/inspect-glb.html
```

### 4. Avatar testen (lokal)

```bash
# Öffne in Browser:
http://localhost:5173
```

### 5. Avatar testen (Production)

```bash
# Öffne in Browser:
https://app.kaya.wattweiser.com/
```

**Hinweis:** Für Testing können beide Umgebungen genutzt werden. Production ist über Railway deployed und aktualisiert sich automatisch bei Git-Push.

---

## 📦 Deployment

### Git & Railway

**Repository:** https://github.com/WattWelten/kaya-bot  
**Deployment:** Railway (Continuous Deployment)  
**Production-URL:** https://app.kaya.wattweiser.com/

**Deployment-Prozess:**
1. Code-Änderungen in `frontend/` vornehmen
2. Git commit & push
3. Railway deployed automatisch
4. Avatar ist live auf https://app.kaya.wattweiser.com/ verfügbar

**Wichtig:** 
- Alle Änderungen werden automatisch deployed
- Avatar ist auf Production-URL live sichtbar
- Railway deploied bei jedem Push zu `main` Branch

---

## 📞 Kontakt & Support

Bei Fragen zur Integration oder anderen Systemteilen (LipsyncEngine, EmotionMapper, etc.) bitte melden.

**Live-Test:** https://app.kaya.wattweiser.com/

---

## 📚 Zusätzliche Ressourcen

### Babylon.js Dokumentation:
- https://doc.babylonjs.com/

### glTF/GLB Spezifikation:
- https://www.khronos.org/gltf/

### avaturn.me:
- https://avaturn.me/
- Modelle können dort modifiziert/exportiert werden

---

**Viel Erfolg bei der Implementierung! 🎮**

Die wichtigsten Punkte:
1. ✅ GLB-Struktur analysieren (welche Morph Targets existieren?)
2. ✅ Avatar-Positionierung fixen (frontal, nah, korrekt)
3. ✅ Mapping-System fixen (Viseme-Namen-Mismatch)
4. ✅ Emotion-Targets finden (Auto-Detection)
5. ✅ Gestik implementieren (falls Bones vorhanden)

