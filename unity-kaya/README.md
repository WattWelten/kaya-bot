# KAYA Unity Avatar Projekt

## Projekt-Setup

### 1. Unity-Projekt erstellen
1. Unity Hub öffnen
2. "New Project" → "3D (URP)" Template wählen
3. Projektname: `KayaAvatar`
4. Speicherort: `D:\Landkreis\unity-kaya\KayaAvatar`

### 2. WebGL Build Settings
- File → Build Settings
- Platform: WebGL
- Switch Platform
- Player Settings:
  - Company Name: `Landkreis Oldenburg`
  - Product Name: `KAYA Avatar`
  - WebGL Template: `Minimal`
  - Compression Format: `Disabled` (für Railway)

### 3. KAYA GLB Import
1. GLB-Datei: `D:\Landkreis\unity\kaya.glb`
2. In Assets-Ordner kopieren
3. Import Settings anpassen

### 4. Avatar-Script erstellen
- Script für WebGL-Kommunikation
- Emotionen und Gesten
- Lip-Sync für TTS

### 5. Build erstellen
- Build Output: `D:\Landkreis\frontend\public\unity\kaya\`

## Features
- ✅ 3D Avatar (GLB)
- ✅ WebGL-Kommunikation
- ✅ Emotionen
- ✅ Lip-Sync
- ✅ Gesten
