"""
EINFACHES TEST-SKRIPT - Sollte sofort Output zeigen
"""
import bpy
import os

print("\n" + "="*60)
print("🧪 TEST: Skript läuft!")
print("="*60)

# Test 1: Blender-Objekte
print("\n1️⃣ Scene-Objekte:")
meshes = [o for o in bpy.context.view_layer.objects if o.type == 'MESH']
print(f"   Meshes: {len(meshes)}")
for m in meshes:
    print(f"   - {m.name}")

# Test 2: Verzeichnis
export_path = r"D:\Landkreis\frontend\public\avatar\Kayanew_mouth.glb"
export_dir = os.path.dirname(export_path)
print(f"\n2️⃣ Export-Verzeichnis:")
print(f"   Pfad: {export_dir}")
print(f"   Existiert: {os.path.exists(export_dir)}")

# Test 3: Shape Keys prüfen
print(f"\n3️⃣ Shape Keys (falls vorhanden):")
for obj in meshes:
    if obj.data.shape_keys:
        print(f"   {obj.name}: {len(obj.data.shape_keys.key_blocks)} Shape Keys")
        for kb in obj.data.shape_keys.key_blocks:
            print(f"      - {kb.name}")
    else:
        print(f"   {obj.name}: KEINE Shape Keys")

print("\n" + "="*60)
print("✅ TEST abgeschlossen - wenn du das siehst, funktioniert Output!")
print("="*60)

