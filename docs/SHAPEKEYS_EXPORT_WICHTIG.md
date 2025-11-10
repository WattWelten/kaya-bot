# ⚠️ WICHTIG: Shape Keys wurden NICHT exportiert!

## Problem
Die GLB-Datei `Kayanew_mouth.glb` enthält **nur 11 Morph Targets** statt **14**.

Das bedeutet: Die Shape Keys wurden in Blender **erstellt**, aber beim **Export nicht mit exportiert**!

## Lösung: In Blender nochmal exportieren

### Schritt 1: Blender öffnen
- GLB importieren (falls nicht bereits geladen)
- Skript ausführen (falls Shape Keys noch nicht erstellt)

### Schritt 2: Export mit Shape Keys aktivieren

**Option A: Auto-Export (EINFACHSTER WEG - empfohlen!)**
Das Skript macht das automatisch! Einfach `blender_add_mouth_shapekeys.py` ausführen und fertig.
Die Datei wird automatisch exportiert nach: `D:\Landkreis\frontend\public\avatar\Kayanew_mouth.glb`

**Option B: Manueller Export**

1. **File > Export > glTF 2.0 (.glb)**

2. **Für Blender 4.5+ (neue UI, auf Deutsch):**
   - Im rechten Panel des Export-Dialogs suchen nach:
     - **"Morphen"** oder
     - **"Formschlüssel einbeziehen"** oder
     - **"Morph-Ziele"** oder
     - **"Include Shape Keys"** (kann auch englisch bleiben)
   - **WICHTIG**: Diese Option aktivieren ✓
   - (Oft in der "Gitter"-Gruppe / "Mesh"-Gruppe oder direkt sichtbar)

3. **Für Blender 4.0 (alte UI, auf Deutsch):**
   - Scrolle nach unten zu **"Geometrie"**-Sektion
   - Aktiviere **"Formschlüssel"** oder **"Shape Keys"** ✓

4. Dateiname: `Kayanew_mouth.glb`
5. Speichern nach: `D:\Landkreis\frontend\public\avatar\Kayanew_mouth.glb`

**💡 TIPP:** Falls du die Option nicht findest:
- Suche nach "morph", "formschlüssel", "shape", "key" im Export-Dialog (Strg+F)
- Auf Deutsch: "Morphen", "Formschlüssel", "Morph-Ziele"
- Oder nutze einfach Auto-Export (Option A) - das funktioniert immer!
- **Hinweis**: Manche Optionen bleiben auf Englisch, auch wenn Blender auf Deutsch ist

### Schritt 3: Prüfen (Optional)

Nach Export, öffne die Datei nochmal in Blender:
- Mesh auswählen → **Shape Keys**-Tab
- Sollte zeigen: `Basis`, `mouthOpen`, `mouthO`, `lipsClosed`

---

## Alternative: Auto-Export im Skript

Das Skript unterstützt auch automatischen Export. Am Ende der `blender_add_mouth_shapekeys.py` Datei:

```python
# Zeile 14-15 ändern:
AUTO_EXPORT_PATH = r"D:\Landkreis\frontend\public\avatar\Kayanew_mouth.glb"
```

Dann exportiert das Skript automatisch mit `export_morph=True` ✓

---

## Nach Export: Browser-Test

1. Browser: **Hard Refresh** (`Ctrl+Shift+R`)
2. Console prüfen: 
   - Sollte zeigen: `📦 Babylon Avatar geladen: ... Morph Targets: 14`
   - Sollte zeigen: `🔍 Auto-Detection: 14 MorphTargets gefunden`
   - Sollte zeigen in Mapping: `mouthOpen`, `mouthO`, `lipsClosed`

Fertig! ✅

