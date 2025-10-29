"""
MINIMALER EXPORT - Direkt exportieren ohne Schnickschnack
"""
import bpy
import os
import sys

EXPORT_PATH = r"D:\Landkreis\frontend\public\avatar\Kayanew_mouth.glb"

# Force Output
sys.stdout.flush()
print("\n" + "="*60)
print("🚀 MINIMALER EXPORT-TEST")
print("="*60)
sys.stdout.flush()

# 1. Finde Head_Mesh
meshes = [o for o in bpy.context.view_layer.objects if o.type == 'MESH' and o.visible_get()]
head_mesh = None

for m in meshes:
    if "head" in m.name.lower() and m.data.shape_keys:
        keys = [kb.name for kb in m.data.shape_keys.key_blocks]
        if "mouthOpen" in keys:
            head_mesh = m
            break

if not head_mesh:
    # Fallback: Erstes Mesh mit Shape Keys
    for m in meshes:
        if m.data.shape_keys:
            head_mesh = m
            break

if not head_mesh:
    print("❌ FEHLER: Kein Mesh mit Shape Keys gefunden!")
    sys.exit(1)

print(f"\n✅ Mesh gefunden: {head_mesh.name}")
print(f"   Shape Keys: {len(head_mesh.data.shape_keys.key_blocks)}")

# 2. Prüfe Verzeichnis
export_dir = os.path.dirname(EXPORT_PATH)
if not os.path.exists(export_dir):
    print(f"❌ Verzeichnis existiert nicht: {export_dir}")
    sys.exit(1)

print(f"✅ Verzeichnis OK: {export_dir}")
sys.stdout.flush()

# 3. EXPORT
print(f"\n📦 Starte Export nach: {EXPORT_PATH}")
sys.stdout.flush()

try:
    # Für Blender 4.5+ könnte der Parameter anders heißen
    # Versuche beide Varianten
    export_params = {
        'filepath': EXPORT_PATH,
        'export_format': 'GLB',
        'use_selection': False,
        'export_apply': True,
        'export_skins': True,
        'export_animations': False
    }
    
    # Blender 4.5+ verwendet möglicherweise 'export_morph' oder 'export_morph_tangent'
    # Versuche zuerst 'export_morph'
    export_params['export_morph'] = True
    
    # Alle Meshes aktivieren (wichtig für Shape Keys)
    bpy.ops.export_scene.gltf(**export_params)
    
    # Prüfe Ergebnis
    if os.path.exists(EXPORT_PATH):
        size_mb = os.path.getsize(EXPORT_PATH) / (1024*1024)
        print(f"✅ EXPORT ERFOLGREICH!")
        print(f"   Datei: {EXPORT_PATH}")
        print(f"   Größe: {size_mb:.2f} MB")
        print(f"\n⚠️  WICHTIG: Prüfe in Browser-Console ob Morph Targets geladen wurden!")
        print(f"   Erwartet: {total_keys}+ Morph Targets")
        print(f"   Wenn nur 11: Shape Keys wurden nicht exportiert!")
        print(f"\n💡 LÖSUNG: In Blender manuell exportieren:")
        print(f"   1. Datei > Exportieren > glTF 2.0")
        print(f"   2. Aktiviere 'Morphen' / 'Include Shape Keys'")
        print(f"   3. Exportiere nach: {EXPORT_PATH}")
    else:
        print(f"❌ Datei wurde NICHT erstellt!")
        
except Exception as e:
    print(f"❌ EXPORT-FEHLER: {e}")
    import traceback
    traceback.print_exc()

sys.stdout.flush()
print("\n" + "="*60)

