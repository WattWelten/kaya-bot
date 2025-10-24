# 🎮 KAYA Unity Avatar - Setup-Anleitung

## 📋 Voraussetzungen
- ✅ Unity 6 installiert
- ✅ GLB-Datei: `D:\Landkreis\unity\kaya.glb`
- ✅ WebGL Build Support aktiviert

## 🚀 Schritt-für-Schritt Setup

### 1. Unity-Projekt erstellen
1. **Unity Hub** öffnen
2. **"New Project"** → **"3D (URP)"** Template wählen
3. **Projektname**: `KayaAvatar`
4. **Speicherort**: `D:\Landkreis\unity-kaya\KayaAvatar`
5. **Erstellen**

### 2. WebGL Build Settings konfigurieren
1. **File** → **Build Settings**
2. **Platform**: **WebGL** auswählen
3. **Switch Platform** klicken
4. **Player Settings** öffnen:
   - **Company Name**: `Landkreis Oldenburg`
   - **Product Name**: `KAYA Avatar`
   - **WebGL Template**: `Minimal`
   - **Compression Format**: `Disabled` (für Railway)
   - **Memory Size**: `512 MB`

### 3. KAYA GLB-Modell importieren
1. GLB-Datei `kaya.glb` in **Assets**-Ordner kopieren
2. **Import Settings** anpassen:
   - **Scale Factor**: `1`
   - **Import Materials**: ✅
   - **Import Animations**: ✅
   - **Import Blendshapes**: ✅

### 4. Avatar-Scene erstellen
1. **Neue Scene** erstellen: `KayaAvatarScene`
2. **KAYA-Modell** in Scene ziehen
3. **KayaAvatarController.cs** Script an Modell anhängen
4. **Camera** positionieren (Frontal-Ansicht)

### 5. Avatar-Script konfigurieren
**KayaAvatarController** Component:
- **Avatar Animator**: Animator-Component des Modells
- **Avatar Renderer**: SkinnedMeshRenderer des Modells
- **Face Renderer**: Gesichts-MeshRenderer (für Lip-Sync)
- **Emotion Materials**: Array von Materialien für verschiedene Emotionen
- **Emotion Animations**: Array von Animation-Clips
- **Lip Sync Blend Shapes**: Blend-Shape-Indizes für Mund-Bewegungen

### 6. WebGL Build erstellen
1. **Build Settings** → **Add Open Scenes**
2. **Build** klicken
3. **Output Folder**: `D:\Landkreis\frontend\public\unity\kaya\`
4. **Build** starten

### 7. Build-Dateien prüfen
Nach dem Build sollten folgende Dateien vorhanden sein:
```
D:\Landkreis\frontend\public\unity\kaya\
├── Build/
│   ├── Build.data
│   ├── Build.framework.js
│   ├── Build.loader.js
│   └── Build.wasm
├── KayaUnityBridge.js
└── README.txt
```

## 🎯 Features implementieren

### Emotionen
- **Neutral**: Standard-Gesichtsausdruck
- **Happy**: Lächeln, freundliche Augen
- **Sad**: Trauriger Ausdruck
- **Angry**: Verärgerter Blick
- **Surprised**: Überraschte Augen
- **Confused**: Verwirrter Ausdruck
- **Listening**: Aufmerksame Haltung
- **Speaking**: Sprechende Animation

### Lip-Sync
- **Blend Shapes** für Mund-Bewegungen
- **Synchronisation** mit TTS-Audio
- **Intensität** basierend auf Lautstärke

### Gesten
- **Winken**: Begrüßung
- **Zeigen**: Auf etwas zeigen
- **Nicken**: Zustimmung
- **Kopfschütteln**: Ablehnung

## 🔧 Troubleshooting

### Build-Fehler
- **WebGL Module** in Unity installieren
- **Memory Size** erhöhen
- **Compression** deaktivieren

### Performance
- **LOD Groups** für verschiedene Distanzen
- **Occlusion Culling** aktivieren
- **Texture Compression** optimieren

### WebGL-Probleme
- **Browser-Kompatibilität** prüfen
- **MIME-Types** korrekt konfiguriert
- **CORS-Headers** gesetzt

## 📞 Support
Bei Problemen:
1. **Unity Console** prüfen
2. **Browser Console** checken
3. **Network Tab** analysieren
4. **Build-Logs** durchgehen

---
**Nächster Schritt**: Unity-Projekt erstellen und GLB importieren! 🚀

