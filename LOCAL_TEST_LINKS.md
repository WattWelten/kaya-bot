# Lokale Browser-Test Links

## 🚀 Frontend (React + Vite)

### Standard-Link (wenn Dev-Server läuft):
**http://localhost:5173**

### Server starten (falls nicht aktiv):
```bash
cd frontend
npm run dev
```

Dann öffnen: **http://localhost:5173**

---

## 📁 Statische Assets (Port 5174)

Falls nur die GLB-Datei getestet werden soll (ohne React):
**http://localhost:5174/avatar/Kayanew_mouth.glb**

---

## 🧪 Test-Checkliste

1. ✅ Browser öffnen: **http://localhost:5173**
2. ✅ Browser-Console öffnen (F12)
3. ✅ Nachsehen: `📦 Starte GLB-Loading (mit Shape Keys): /avatar/Kayanew_mouth.glb`
4. ✅ Avatar sollte laden mit **14 MorphTargets** (11 Original + 3 neue)
5. ✅ Audio-Chat starten → Mund sollte sich bewegen!

---

## 🔍 Debug-Info in Console prüfen:

Nach GLB-Loading sollte erscheinen:
```
✅ GLB erfolgreich geladen!
📦 Babylon Avatar geladen: 12 Meshes, Morph Targets: 14
🔍 Auto-Detection: 14 MorphTargets gefunden
📊 MorphTarget Mapping-Report:
   ✅ ou → mouthOpen  (NEU!)
   ✅ aa → mouthOpen  (NEU!)
   ...
```

---

## 🐛 Falls Probleme:

**"GLB nicht gefunden"**
- Prüfe: `frontend/public/avatar/Kayanew_mouth.glb` existiert
- Hard-Refresh: `Ctrl+Shift+R` oder `Ctrl+F5`

**"Keine Mund-Bewegung"**
- Console: Suche nach "MorphTarget Mapping-Report"
- Prüfe ob `mouthOpen`, `mouthO`, `lipsClosed` erkannt wurden
- Falls nicht: Shape Keys in Blender nochmal exportieren (mit "Shape Keys" aktiviert!)

