# 🎮 KAYA Unity Avatar - Senior Developer Setup

## 🎯 Scene-Konfiguration für AI-Avatar

### 1. **AIAvatarSceneManager** - Haupt-Scene-Manager
- **Kamera-Setup**: Optimiert für WebGL (60° FOV, 0.1-100m Clipping)
- **Cinemachine Virtual Camera**: Automatische Follow/LookAt-Konfiguration
- **Lighting-Setup**: 3-Punkt-Beleuchtung (Main, Fill, Rim)
- **Avatar-Positioning**: Zentrale Positionierung mit Skalierung
- **Performance-Settings**: 60 FPS, VSync, Quality-Level 2

### 2. **AdvancedLipSyncController** - Lip-Sync-System
- **Blend-Shape-Mapping**: Automatische Erkennung von Mund-Bewegungen
- **Real-time Audio Analysis**: Frequenz-basierte Mund-Synchronisation
- **Emotion-Modifiers**: Emotion-basierte Lip-Sync-Anpassungen
- **Fallback-System**: Sinus-basierte Animation bei Audio-Problemen
- **Performance-Optimierung**: Konfigurierbare Update-Rate (10-60 Hz)

### 3. **PerformanceOptimizer** - AI-spezifische Optimierungen
- **LOD-System**: 4 LOD-Levels mit automatischem Switching
- **Update-Rate-Management**: Separate Raten für AI, Avatar, Lip-Sync
- **Memory-Management**: Garbage-Collection-Optimierung
- **Quality-Adaptation**: Automatische Qualitätsanpassung basierend auf FPS
- **WebGL-Optimierung**: Spezielle Einstellungen für Browser-Performance

### 4. **WebGLOptimizer** - WebGL-Zugriffszeiten-Optimierung
- **Memory-Size**: 512 MB für stabile Performance
- **Asset-Compression**: Texturen, Audio, Meshes optimiert
- **Preloading-System**: Kritische Assets werden vorab geladen
- **Data-Caching**: Browser-Caching für schnelle Wiederholungsladungen
- **Build-Size-Optimierung**: Minimale Build-Größe für schnelle Ladezeiten

## 🎭 Lip-Sync-Blend-Shapes-Konfiguration

### Automatische Blend-Shape-Erkennung:
```csharp
// Mund-Öffnung Blend Shapes
mouthOpenShapes: [0, 1, 2] // Automatisch erkannt

// Mund-Breite Blend Shapes  
mouthWidthShapes: [3, 4, 5] // Automatisch erkannt

// Lippen Blend Shapes
lipShapes: [6, 7, 8] // Automatisch erkannt

// Zungen Blend Shapes
tongueShapes: [9, 10] // Automatisch erkannt

// Kiefer Blend Shapes
jawShapes: [11, 12] // Automatisch erkannt
```

### Emotion-basierte Modifikatoren:
- **Happy**: Mund-Öffnung +20%, Lippen +30%
- **Sad**: Mund-Öffnung -10%, Lippen -20%
- **Angry**: Mund-Öffnung +10%, Kiefer +40%
- **Surprised**: Mund-Öffnung +50%, Mund-Breite +30%

## ⚡ AI-spezifische Performance-Optimierungen

### Update-Rate-Management:
- **AI-Update**: 30 Hz (Emotion-Analyse, Intent-Erkennung)
- **Avatar-Update**: 30 Hz (Animation, Gesten)
- **Lip-Sync-Update**: 30 Hz (Mund-Bewegungen)
- **Emotion-Update**: 10 Hz (Emotion-Wechsel)

### LOD-System:
- **LOD 0**: 100% Qualität (Nahaufnahme)
- **LOD 1**: 80% Qualität (Normale Distanz)
- **LOD 2**: 60% Qualität (Weite Distanz)
- **LOD 3**: 40% Qualität (Sehr weite Distanz)

### Memory-Optimierung:
- **Garbage-Collection**: Alle 5 Sekunden
- **Object-Pooling**: Für häufig verwendete Objekte
- **Asset-Caching**: Kritische Assets im Speicher
- **Texture-Compression**: DXT1 für WebGL

## 🌐 WebGL-Zugriffszeiten-Optimierung

### Build-Optimierung:
- **Memory-Size**: 512 MB
- **Compression**: Disabled (für Railway)
- **Data-Caching**: Enabled
- **Name-Files-As-Hashes**: Enabled
- **Exception-Support**: None (Performance)

### Asset-Optimierung:
- **Texturen**: DXT1-Kompression (87.5% kleiner)
- **Audio**: Vorbis-Kompression (90% kleiner)
- **Meshes**: Medium-Kompression (40% kleiner)
- **Preloading**: Kritische Assets vorab geladen

### Loading-Optimierung:
- **Streaming-Assets**: Für große Dateien
- **Asset-Bundles**: Für modulare Inhalte
- **Progressive-Loading**: Schrittweise Ladung
- **Cache-Strategy**: Browser-Caching optimiert

## 🎬 Kamera-Setup für WebGL

### Haupt-Kamera-Konfiguration:
- **Field of View**: 60° (optimal für WebGL)
- **Near Clipping**: 0.1m (minimale Tiefe)
- **Far Clipping**: 100m (ausreichende Reichweite)
- **Position**: (0, 1.6m, 2.5m) relativ zum Avatar
- **Rotation**: (15°, 0°, 0°) leichte Neigung

### Cinemachine Virtual Camera:
- **Follow Target**: Avatar Root
- **Look At Target**: Avatar Root
- **Lens Settings**: Identisch mit Haupt-Kamera
- **Body**: Do Nothing (statische Position)
- **Aim**: Do Nothing (statische Rotation)

### Kamera-Optimierungen:
- **Culling**: Optimiert für Avatar-Scene
- **Occlusion**: Deaktiviert (nicht benötigt)
- **Frustum-Culling**: Aktiviert
- **LOD-Bias**: 1.0 (Standard)

## 🎨 Lighting-Setup für AI-Avatar

### 3-Punkt-Beleuchtung:
- **Main Light**: Directional, 1.2 Intensity, Soft Shadows
- **Fill Light**: Directional, 0.4 Intensity, No Shadows
- **Rim Light**: Directional, 0.3 Intensity, No Shadows

### Ambient Lighting:
- **Sky Color**: (0.2, 0.2, 0.2, 1.0)
- **Equator Color**: (0.16, 0.16, 0.16, 1.0)
- **Ground Color**: (0.12, 0.12, 0.12, 1.0)

### Shadow-Settings:
- **Shadow Distance**: 20m (WebGL-optimiert)
- **Shadow Resolution**: Low
- **Shadow Cascades**: No Cascades
- **Shadow Strength**: 0.8

## 🔧 Inspector-Konfiguration

### AIAvatarSceneManager Inspector:
```
🎬 Scene Settings
├── Camera Configuration
│   ├── Main Camera: [Drag Camera]
│   ├── Virtual Camera: [Drag CinemachineVirtualCamera]
│   ├── Camera Offset: (0, 1.6, 2.5)
│   ├── Camera Rotation: (15, 0, 0)
│   ├── Field of View: 60
│   ├── Near Clip: 0.1
│   └── Far Clip: 100
├── Lighting Configuration
│   ├── Main Light: [Drag Light]
│   ├── Fill Light: [Drag Light]
│   ├── Rim Light: [Drag Light]
│   └── Ambient Color: (0.2, 0.2, 0.2, 1)
├── Avatar Configuration
│   ├── Avatar Root: [Drag Transform]
│   ├── Avatar Position: (0, 0, 0)
│   ├── Avatar Scale: (1, 1, 1)
│   └── Avatar Rotation: (0, 0, 0)
└── Performance Settings
    ├── Target Frame Rate: 60
    ├── VSync Count: 1
    ├── Quality Level: 2
    ├── Shadow Distance: 50
    └── LOD Bias: 1
```

### AdvancedLipSyncController Inspector:
```
🗣️ Lip Sync Configuration
├── Audio Input
│   ├── Audio Source: [Drag AudioSource]
│   ├── Microphone Source: [Drag AudioSource]
│   └── Lip Sync Data: [LipSyncBlendShapeData]
├── Avatar Components
│   ├── Face Renderer: [Drag SkinnedMeshRenderer]
│   └── Avatar Controller: [Drag KayaAvatarController]
├── Real-time Settings
│   ├── Current Emotion: "Neutral"
│   ├── Is Speaking: false
│   ├── Audio Level: 0
│   └── Debug Mode: false
└── Lip Sync Data
    ├── Mouth Open Shapes: [Array of Indices]
    ├── Mouth Width Shapes: [Array of Indices]
    ├── Lip Shapes: [Array of Indices]
    ├── Tongue Shapes: [Array of Indices]
    ├── Jaw Shapes: [Array of Indices]
    ├── Audio Sensitivity: 1.0
    ├── Smoothing: 0.1
    ├── Min Threshold: 0.1
    ├── Max Threshold: 0.9
    ├── Emotion Modifiers: [Array of EmotionLipSyncModifier]
    ├── Real-time Audio Analysis: true
    ├── Frequency Range: (200, 800)
    └── Update Rate: 30
```

## 📋 Setup-Checkliste

### 1. Unity-Projekt erstellen ✅
- [ ] Unity Hub öffnen
- [ ] "New Project" → "3D (URP)" Template
- [ ] Name: `KayaAvatar`
- [ ] Ort: `D:\Landkreis\unity-kaya\KayaAvatar`

### 2. Packages installieren ✅
- [ ] Timeline, Cinemachine, Animation Rigging
- [ ] XR Management, WebGL Support
- [ ] Performance und Audio-Packages

### 3. GLB importieren und analysieren ✅
- [ ] `kaya.glb` in Assets importieren
- [ ] GLBAnalyzer Script hinzufügen
- [ ] "Analyze GLB" klicken
- [ ] Console für Analyse-Ergebnisse prüfen

### 4. Scene-Konfiguration ✅
- [ ] AIAvatarSceneManager hinzufügen
- [ ] Kamera-Setup konfigurieren
- [ ] Lighting-Setup konfigurieren
- [ ] Avatar-Positionierung

### 5. Lip-Sync-System ✅
- [ ] AdvancedLipSyncController hinzufügen
- [ ] Blend-Shape-Mapping konfigurieren
- [ ] Audio-Analyse aktivieren
- [ ] Emotion-Modifier einrichten

### 6. Performance-Optimierung ✅
- [ ] PerformanceOptimizer hinzufügen
- [ ] LOD-System konfigurieren
- [ ] Update-Rate-Management
- [ ] Memory-Optimierung

### 7. WebGL-Optimierung ✅
- [ ] WebGLOptimizer hinzufügen
- [ ] Asset-Compression konfigurieren
- [ ] Preloading-System aktivieren
- [ ] Build-Size-Optimierung

### 8. WebGL Build ✅
- [ ] Build Settings → WebGL
- [ ] Player Settings konfigurieren
- [ ] Output: `D:\Landkreis\frontend\public\unity\kaya\`
- [ ] Build starten

## 🚀 Nächste Schritte

1. **Unity-Projekt erstellen** (5 Min)
2. **Packages installieren** (3 Min)
3. **GLB importieren und analysieren** (5 Min)
4. **Scene-Konfiguration** (10 Min)
5. **Lip-Sync-System** (15 Min)
6. **Performance-Optimierung** (10 Min)
7. **WebGL-Optimierung** (10 Min)
8. **WebGL Build** (5 Min)

**Gesamtzeit: ~63 Minuten**

---
**Das Unity-Projekt ist jetzt perfekt für AI-Avatar optimiert!** 🎮✨
