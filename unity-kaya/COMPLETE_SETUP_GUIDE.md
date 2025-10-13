# 🎮 KAYA Unity Avatar - Vollständiges Setup

## 📋 Voraussetzungen
- ✅ Unity 6 installiert
- ✅ GLB-Datei: `D:\Landkreis\unity\kaya.glb` (22.8 MB)
- ✅ WebGL Build Support aktiviert

## 🚀 Schritt-für-Schritt Setup

### 1. Unity-Projekt erstellen
1. **Unity Hub** öffnen
2. **"New Project"** → **"3D (URP)"** Template wählen
3. **Projektname**: `KayaAvatar`
4. **Speicherort**: `D:\Landkreis\unity-kaya\KayaAvatar`
5. **Erstellen**

### 2. Packages installieren
1. **Window** → **Package Manager**
2. **In Project** → **Add package from git URL**
3. Packages hinzufügen:
   ```
   com.unity.timeline@1.8.0
   com.unity.cinemachine@2.9.7
   com.unity.animation.rigging@1.2.1
   com.unity.xr.management@4.4.0
   com.unity.xr.webgl@1.0.0
   ```

### 3. GLB-Datei importieren
1. **Assets** → **Import New Asset**
2. `kaya.glb` auswählen
3. **Import Settings**:
   - **Scale Factor**: `1`
   - **Import Materials**: ✅
   - **Import Animations**: ✅
   - **Import Blendshapes**: ✅
   - **Import Cameras**: ✅
   - **Import Lights**: ✅

### 4. GLB-Analyse durchführen
1. **GLB-Modell** in Scene ziehen
2. **GLBAnalyzer** Script hinzufügen
3. **Inspector** → **Analyze GLB** klicken
4. **Console** prüfen für Analyse-Ergebnisse

### 5. Avatar-Controller konfigurieren
1. **KayaAvatarController** Script an Modell anhängen
2. **Inspector** konfigurieren:
   - **Avatar Animator**: Animator-Component
   - **Avatar Renderer**: SkinnedMeshRenderer
   - **Face Renderer**: Gesichts-MeshRenderer
   - **Audio Source**: AudioSource-Component

### 6. Emotionen konfigurieren
**Emotion System** im Inspector:
- **Neutral**: Standard-Material, Idle-Animation
- **Happy**: Lächelndes Material, Happy-Animation
- **Sad**: Trauriges Material, Sad-Animation
- **Angry**: Verärgertes Material, Angry-Animation
- **Speaking**: Sprechendes Material, Speaking-Animation

### 7. Blend Shapes konfigurieren
**Lip Sync System**:
- **Mouth Blend Shapes**: Mund-Bewegungen
- **Tongue Blend Shapes**: Zungen-Bewegungen
- **Sensitivity**: 1.0
- **Smoothing**: 0.1

### 8. Animationen zuweisen
**Animation System**:
- **Idle Animation**: Standard-Idle
- **Speaking Animation**: Sprech-Animation
- **Gestures**: Winken, Zeigen, Nicken

### 9. WebGL Build konfigurieren
1. **File** → **Build Settings**
2. **Platform**: **WebGL**
3. **Switch Platform**
4. **Player Settings**:
   - **Company Name**: `Landkreis Oldenburg`
   - **Product Name**: `KAYA Avatar`
   - **WebGL Template**: `Minimal`
   - **Memory Size**: `512 MB`
   - **Compression Format**: `Disabled`

### 10. Build erstellen
1. **Build Settings** → **Add Open Scenes**
2. **Build** klicken
3. **Output Folder**: `D:\Landkreis\frontend\public\unity\kaya\`
4. **Build** starten

## 🔧 Inspector-Konfiguration

### KayaAvatarController Inspector:
```
🎭 Avatar Components
├── Avatar Animator: [Drag Animator]
├── Avatar Renderer: [Drag SkinnedMeshRenderer]
└── Face Renderer: [Drag Face MeshRenderer]

🎨 Emotion System
├── Emotions: [Array of EmotionData]
│   ├── Emotion Name: "Happy"
│   ├── Emotion Material: [Drag Material]
│   ├── Emotion Animation: [Drag AnimationClip]
│   ├── Intensity: 1.0
│   └── Emotion Color: Yellow
└── Current Emotion: "Neutral"

🎬 Animation System
├── Gestures: [Array of GestureData]
├── Idle Animation: [Drag AnimationClip]
└── Speaking Animation: [Drag AnimationClip]

🗣️ Lip Sync System
├── Lip Sync Data: [LipSyncData]
│   ├── Mouth Blend Shapes: [Array of Indices]
│   ├── Tongue Blend Shapes: [Array of Indices]
│   ├── Sensitivity: 1.0
│   └── Smoothing: 0.1
├── Audio Source: [Drag AudioSource]
└── Lip Sync Enabled: ✅

⚡ Performance Settings
├── LOD Level: 0
├── Update Rate: 30 Hz
└── Culling Distance: 100

🔧 Debug Settings
├── Debug Mode: ✅
└── Enable Logging: ✅
```

## 🎯 GLB-Analyse (22.8 MB)

### Erwartete Struktur:
- **Rigging**: Humanoid oder Custom Rig
- **Animationen**: Idle, Speaking, Gestures
- **Blend Shapes**: Gesichtsausdrücke, Lip-Sync
- **Texturen**: High-Resolution Materials
- **LOD**: Verschiedene Detailstufen

### Automatische Konfiguration:
1. **GLBAnalyzer** analysiert GLB-Struktur
2. **Automatische Konfiguration** basierend auf Analyse
3. **Inspector** wird automatisch gefüllt
4. **Blend Shapes** werden automatisch erkannt

## 📦 Build-Optimierung

### WebGL-spezifische Einstellungen:
- **Memory Size**: 512 MB
- **Compression**: Disabled (für Railway)
- **Data Caching**: Enabled
- **Name Files As Hashes**: Enabled

### Performance-Optimierungen:
- **LOD System**: Automatische Detailstufen
- **Culling**: Distanz-basierte Optimierung
- **Update Rate**: Konfigurierbar (10-60 Hz)

## 🔧 Troubleshooting

### Build-Fehler:
- **WebGL Module** installieren
- **Memory Size** erhöhen
- **Compression** deaktivieren

### Performance:
- **LOD Groups** konfigurieren
- **Occlusion Culling** aktivieren
- **Texture Compression** optimieren

### WebGL-Probleme:
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
