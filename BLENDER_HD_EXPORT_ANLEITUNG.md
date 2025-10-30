# Blender HD Export Anleitung für KAYA Avatar

## Übersicht

Diese Anleitung beschreibt den Production-Workflow für den HD-optimierten Avatar-Export mit Material-Optimierung und Draco-Kompression.

## Voraussetzungen

- Blender 4.0+ (getestet mit Blender 4.5)
- GLB-Modell mit Shape Keys (für Lipsync)
- `scripts/enhance_glb.py` im Repository

## Production-Workflow: Ein-Durchlauf-Export

### Schritt 1: Blender Script ausführen

**Im Terminal (von Repository-Root aus):**

```bash
# Windows
blender --background --python scripts/enhance_glb.py -- --in frontend/public/avatar/Kayanew.glb --out frontend/public/avatar/Kayanew_mouth-draco.glb --keep-draco

# Linux/Mac
blender --background --python scripts/enhance_glb.py -- --in frontend/public/avatar/Kayanew.glb --out frontend/public/avatar/Kayanew_mouth-draco.glb --keep-draco
```

**Ergebnis:**
- ✅ Materialien optimiert (Skin-SSS, Hair-Anisotropy, Eye-Clearcoat, etc.)
- ✅ Draco-Kompression aktiviert (Level 5)
- ✅ Shape Keys exportiert (`export_morph=True`)
- ✅ HD-optimiertes GLB: `Kayanew_mouth-draco.glb`

**Erwartete Größe:** ~3-5MB (statt 13MB, ~70% Reduktion)

### Schritt 2: GLB-Datei prüfen

**Dateigröße prüfen:**
```bash
# Windows PowerShell
(Get-Item frontend/public/avatar/Kayanew_mouth-draco.glb).Length / 1MB

# Linux/Mac
ls -lh frontend/public/avatar/Kayanew_mouth-draco.glb
```

**Erwartet:** ~3-5MB

**Shape Keys prüfen (optional):**
- In Blender: GLB importieren → Mesh auswählen → Properties → Shape Keys
- Sollte zeigen: Alle Shape Keys (inkl. `mouthOpen`, `mouthO`, `lipsClosed`)

### Schritt 3: GLB-Datei committen

```bash
git add frontend/public/avatar/Kayanew_mouth-draco.glb
git commit -m "feat: HD-optimiertes Avatar-GLB mit Draco-Kompression"
git push
```

## Manueller Export (falls Script fehlschlägt)

### In Blender:

1. **GLB importieren:**
   - Datei > Importieren > glTF 2.0 (.glb/.gltf)
   - Wähle: `frontend/public/avatar/Kayanew.glb`

2. **Materialien optimieren (optional):**
   - Skin-Materialien: Metallic=0, Roughness=0.42, Subsurface=0.2
   - Hair-Materialien: Anisotropic=0.8, Roughness=0.33
   - Eye-Materialien: Clearcoat=1.0, IOR=1.376

3. **Exportieren mit Draco:**
   - Datei > Exportieren > glTF 2.0 (.glb/.gltf)
   - **WICHTIG**: Aktiviere folgende Optionen:
     - ✅ **"Morphen"** oder **"Include Shape Keys"** (für Lipsync)
     - ✅ **"Draco Mesh Compression"** (für Größenreduktion)
     - ✅ **"Export Morph Normals"** (für bessere Qualität)
   - Dateiname: `Kayanew_mouth-draco.glb`
   - Speichern nach: `frontend/public/avatar/`

## Script-Parameter

### `--in` / `--out`
- Eingabe- und Ausgabepfad der GLB-Datei
- **Beispiel:** `--in input.glb --out output-draco.glb`

### `--keep-draco`
- Aktiviert Draco-Kompression (Level 5)
- **Ohne Flag:** Keine Kompression

### `--micro` (optional)
- Pfad zu Micro-Normal-Map für Skin
- **Beispiel:** `--micro textures/skin_micro.png`
- Wird automatisch mit Skin-Materialien verknüpft

## Material-Optimierungen (Automatisch)

Das Script optimiert folgende Materialien basierend auf Namens-Heuristik:

### Skin (skin, face, head, neck)
- Metallic: 0.0
- Roughness: 0.42
- Specular: 0.6
- Subsurface: 0.2 (für realistische Haut-Darstellung)

### Hair
- Anisotropic: 0.8 (für Haar-Strähnen)
- Roughness: 0.33
- Alpha Blend: Aktiviert

### Eyes (eye, iris, cornea)
- Clearcoat: 1.0 (für Glanz)
- Clearcoat Roughness: 0.0
- IOR: 1.376 (Augen-Refraktionsindex)
- Specular: 0.9

### Teeth (tooth, teeth, gum, mouth)
- Metallic: 0.0
- Roughness: 0.22
- Specular: 0.95

### Cloth (cloth, fabric, sweater, hoodie)
- Sheen: 0.35 (für Stoff-Glanz)
- Roughness: 0.55

## Troubleshooting

### Script läuft nicht (Blender-Fehler)
**Lösung:** Prüfe ob Blender im PATH ist:
```bash
blender --version
```

Falls nicht: Vollständigen Pfad verwenden:
```bash
"C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" --background --python scripts/enhance_glb.py -- ...
```

### Draco-Kompression funktioniert nicht
**Ursache:** Babylon.js Draco-Decoder fehlt oder falscher Pfad
**Lösung:** Prüfe ob Dateien unter `/babylon/draco/` existieren:
- `draco_decoder_gltf.wasm`
- `draco_decoder_gltf.js`
- `draco_wasm_wrapper.js`

Falls nicht: Frontend lädt automatisch unkomprimierte Version (Fallback).

### Shape Keys fehlen nach Export
**Ursache:** `export_morph=True` nicht aktiviert
**Lösung:** In Blender manuell exportieren mit "Morphen" aktiviert (siehe "Manueller Export")

### Datei ist immer noch groß (>10MB)
**Ursache:** Draco-Kompression nicht aktiviert oder Level zu niedrig
**Lösung:** Script mit `--keep-draco` ausführen oder manuell mit Level 5 exportieren

## Frontend-Integration

Das Frontend lädt automatisch in folgender Reihenfolge:

1. **`Kayanew_mouth-draco.glb`** (HD-optimiert, Draco-komprimiert) ← **PRIORITÄT**
2. **`Kayanew_mouth.glb`** (unkomprimiert, mit Shape Keys)
3. **`Kayanew.glb`** (alte Version, Fallback)

**Material-Upgrade:** Materialien werden automatisch für HD-Rendering optimiert via `upgradeKayaMaterials()`.

## Erfolgskriterien

- ✅ GLB-Datei: ~3-5MB (statt 13MB)
- ✅ Shape Keys vorhanden (75+ Morph Targets)
- ✅ Draco-Kompression aktiviert
- ✅ Materialien für HD-Rendering optimiert
- ✅ Avatar lädt in 10-15s auf Production (statt Timeout)

## Nächste Schritte

Nach erfolgreichem Export:
1. GLB-Datei committen und pushen
2. Production-Deployment testen
3. Avatar-Rendering prüfen (Skin-SSS, Hair-Anisotropy, Eye-Clearcoat)

---

**Hinweis:** Das Script ist kompatibel mit Blender 4.0+ und funktioniert sowohl in der GUI als auch im Background-Mode.


