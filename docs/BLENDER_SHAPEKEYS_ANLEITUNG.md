# Blender Shape Keys - Anleitung für KAYA Avatar

## 📋 Datei
**`blender_add_mouth_shapekeys.py`** - Blender-Python-Skript

## 🎯 Was macht das Skript?
Erstellt automatisch **3 Shape Keys** für Lippenbewegung:
- `mouthOpen`: Kiefer öffnet sich (für Sprechen/Audio)
- `mouthO`: Lippen formen "O" (rund)
- `lipsClosed`: Lippen schließen sich

## 🚀 Verwendung

### 1. GLB importieren
- Blender öffnen
- **Datei > Importieren > glTF 2.0 (.glb/.gltf)**
- Navigiere zu: `D:\Landkreis\frontend\public\avatar\Kayanew-draco.glb` (oder `Kayanew.glb`)
- **WICHTIG**: "Punkte zusammenführen" (Merge Vertices) **DEAKTIVIERT** lassen
- Auf **"glTF 2.0 importieren"** klicken

### 2. Skript ausführen
- In Blender: **Skripten**-Tab öffnen (oben im Fenster)
- **Datei > Öffnen**: Wähle `blender_add_mouth_shapekeys.py`
- **Skript ausführen** klicken (oder **Alt+P**)
- In der **Konsole** (unten) siehst du:
  - Welches Mesh gefunden wurde
  - Wie viele Mund-Vertices bearbeitet wurden
  - Ob Shape Keys erstellt wurden

### 3. GLB exportieren

#### ✅ OPTION 1: Auto-Export (EMPFOHLEN!)
Das Skript exportiert **automatisch** mit Shape Keys aktiviert!

- Das Skript ist bereits konfiguriert mit `AUTO_EXPORT_PATH`
- Nach Script-Ausführung → Datei automatisch exportiert ✓
- Keine manuellen Einstellungen nötig!

#### OPTION 2: Manueller Export

**Für Blender 4.5+ (neue UI, auf Deutsch):**
1. **Datei > Exportieren > glTF 2.0 (.glb/.gltf)**
2. Im Export-Dialog im **rechten Panel**:
   - Suche nach einer dieser Optionen:
     - **"Morphen"** oder
     - **"Formschlüssel einbeziehen"** oder
     - **"Include Shape Keys"** (kann auch englisch bleiben) oder
     - **"Morph-Ziele"**
   - Aktiviere diese Option ✓
   - (Oft in der Gruppe "Gitter" / "Mesh" oder direkt sichtbar im Hauptbereich)
3. Speichern als: `Kayanew_mouth.glb`

**Für Blender 4.0 und älter (auf Deutsch):**
1. **Datei > Exportieren > glTF 2.0 (.glb/.gltf)**
2. Scrolle nach unten zu **"Geometrie"**-Sektion
3. Aktiviere **"Formschlüssel"** oder **"Shape Keys"** ✓

**💡 Falls du die Option nicht findest:**
- Nutze **Auto-Export (Option 1)** - funktioniert immer!
- Oder suche im Export-Dialog mit Strg+F nach "morph", "formschlüssel", "shape"

### 4. Testen
- Alte GLB-Datei ersetzen (falls überschrieben)
- Browser neu laden → Avatar sollte mit Audio sprechen!

## 🔧 Feineinstellung (optional)

Falls die Mundbewegung nicht optimal ist, öffne das Skript und passe an:

```python
# In blender_add_mouth_shapekeys.py:
OPEN_DELTA_LOCAL = Vector((0.0, -0.02, -0.01))  # Öffnung: (X, Y, Z)
PUCKER_SCALE = 0.85                              # 0.7 = stark, 0.9 = sanft
HEIGHT_RATIO = 0.45                              # Mundhöhe: 0.40-0.55
RADIUS_FACTOR = 0.12                             # Mundradius: 0.08-0.16
```

**Tipps:**
- Mund öffnet sich nach "falscher" Richtung? → Y/Z in `OPEN_DELTA_LOCAL` tauschen oder Vorzeichen ändern
- Zu viele/zu wenige Vertices? → `RADIUS_FACTOR` anpassen (kleiner = weniger, größer = mehr)
- Mund zu hoch/tief? → `HEIGHT_RATIO` anpassen

## 📝 Was du damit machen darfst

✅ **Erlaubt:**
- Skript verwenden für KAYA-Projekt
- Für eigene Projekte anpassen
- Weiterschenken/teilen
- In anderen Projekten nutzen

❌ **Nicht nötig** (aber erlaubt):
- Lizenzangabe/Kredite (optional)

**Keine Einschränkungen** - ist Teil des KAYA-Projekts.

## 🐛 Troubleshooting

**"Keine Mund-Vertices gefunden"**
- Passe `HEIGHT_RATIO` (0.40-0.55) oder `RADIUS_FACTOR` (0.08-0.16) an
- Prüfe in Blender: Wähle Mesh → Bearbeitungsmodus → Schaue, wo der Mund ist

**Mundbewegung zu stark/schwach**
- Passe `OPEN_DELTA_LOCAL` an (größere Werte = stärkere Bewegung)
- Teste in Blender: Shape Key auf 1.0 setzen → prüfen

**Shape Keys werden nicht exportiert**
- **Auto-Export verwenden** (Skript macht das automatisch!) ✓
- Oder manuell: "Morphen" / "Formschlüssel einbeziehen" muss aktiviert sein

**Blender 4.5+ auf Deutsch: Finde die Option nicht**
- Die UI hat sich geändert - nutze **Auto-Export** (funktioniert in allen Versionen!)
- Oder: Im Export-Dialog mit Strg+F nach "morph", "formschlüssel" suchen
- Alternative Begriffe: "Morph-Ziele", "Shape Keys", "Formschlüssel"

**Blender zeigt Optionen auf Englisch:**
- Manche Optionen bleiben auf Englisch, auch wenn Blender auf Deutsch eingestellt ist
- Suche nach: "Morphs", "Include Shape Keys", "Morph Targets"

## ✅ Ergebnis

Nach Export sollte das GLB enthalten:
- Original-MorphTargets: `eyeLookDownLeft`, `eyesClosed`, etc. (11 Stück)
- **NEUE** MorphTargets: `mouthOpen`, `mouthO`, `lipsClosed` (3 Stück)
- **Total: 14 MorphTargets**

Avatar wird dann automatisch sprechen, wenn Audio abgespielt wird! 🎉
