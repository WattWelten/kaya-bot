"""
Debug-Skript: Prüft ob alles für Auto-Export funktioniert
"""
import bpy
import os

EXPORT_PATH = r"D:\Landkreis\frontend\public\avatar\Kayanew_mouth.glb"

print("\n" + "="*60)
print("🔍 DEBUG: Auto-Export Prüfung")
print("="*60)

# 1. Prüfe Verzeichnis
export_dir = os.path.dirname(EXPORT_PATH)
print(f"\n1️⃣ Verzeichnis-Prüfung:")
print(f"   Pfad: {export_dir}")
if os.path.exists(export_dir):
    print(f"   ✅ Verzeichnis existiert")
    # Prüfe Schreibrechte
    try:
        test_file = os.path.join(export_dir, "test_write.tmp")
        with open(test_file, 'w') as f:
            f.write("test")
        os.remove(test_file)
        print(f"   ✅ Schreibrechte OK")
    except Exception as e:
        print(f"   ❌ Schreibrechte FEHLER: {e}")
else:
    print(f"   ❌ Verzeichnis existiert NICHT!")
    print(f"   💡 Lösung: Erstelle das Verzeichnis manuell")

# 2. Prüfe aktives Objekt/Mesh
print(f"\n2️⃣ Scene-Prüfung:")
meshes = [o for o in bpy.context.view_layer.objects if o.type == 'MESH' and o.visible_get()]
print(f"   Meshes gefunden: {len(meshes)}")
for m in meshes:
    has_shape_keys = m.data.shape_keys is not None
    shape_key_count = len(m.data.shape_keys.key_blocks) if has_shape_keys else 0
    print(f"   - {m.name}: {len(m.data.vertices)} Verts, {shape_key_count} Shape Keys")

# 3. Prüfe ob Shape Keys vorhanden
print(f"\n3️⃣ Shape Keys-Prüfung:")
for obj in meshes:
    if obj.data.shape_keys:
        print(f"   Mesh '{obj.name}' hat Shape Keys:")
        for kb in obj.data.shape_keys.key_blocks:
            print(f"      - {kb.name}")

# 4. Prüfe aktuelle Datei
print(f"\n4️⃣ Aktuelle Export-Datei:")
if os.path.exists(EXPORT_PATH):
    size_mb = os.path.getsize(EXPORT_PATH) / (1024*1024)
    print(f"   ✅ Datei existiert: {EXPORT_PATH}")
    print(f"   Größe: {size_mb:.2f} MB")
else:
    print(f"   ⚠️  Datei existiert noch nicht: {EXPORT_PATH}")

print("\n" + "="*60)
print("✅ Debug-Prüfung abgeschlossen")
print("="*60)


