"""
Blender Script: Automatisches Hinzufügen von Lippen-Shape Keys für KAYA-Avatar

WAS DIESES SKRIPT MACHT:
- Findet automatisch das Haupt-Mesh (Head/Face) im importierten GLB
- Erstellt 3 Shape Keys für Lippenbewegung:
  * mouthOpen: Kiefer öffnet sich (für Sprechen)
  * mouthO: Lippen formen "O" (rund)
  * lipsClosed: Lippen schließen sich

WIE VERWENDEN:
1. Blender öffnen
2. GLB importieren (File > Import > glTF 2.0)
3. In Blender: Scripting-Tab öffnen
4. File > Open: Dieses Skript (blender_add_mouth_shapekeys.py) öffnen
5. "Run Script" klicken
6. GLB exportieren (File > Export > glTF 2.0) mit "Shape Keys" aktiviert

LICHENZ / NUTZUNG:
Dieses Skript ist Teil des KAYA-Projekts und darf frei verwendet werden.
Für Anpassungen: Siehe Konfiguration unten.
"""

import bpy
import bmesh
from mathutils import Vector

# ==================== KONFIGURATION (bei Bedarf anpassen) ====================
# Öffnungs-Stärke für "mouthOpen" (in Blender-Einheiten)
OPEN_DELTA_LOCAL = Vector((0.0, -0.02, -0.01))  # Y = nach unten, Z = nach hinten (ggf. anpassen)

# Pucker-Stärke für "mouthO" (0.7 = stark pucker, 0.9 = sanft)
PUCKER_SCALE = 0.85

# Schließ-Stärke für "lipsClosed"
CLOSE_DELTA_LOCAL = Vector((0.0, 0.00, 0.01))  # Z = nach vorne

# Mund-Region: Heuristik-Parameter (wenn keine Vertex-Gruppe "Mouth" gefunden wird)
RADIUS_FACTOR = 0.12      # Mundradius relativ zur Mesh-Diagonale (0.08-0.16)
DEPTH_OFFSET = 0.05       # Mund-Tiefe von vorderster Kante (0.03-0.08)
HEIGHT_RATIO = 0.45       # Mund-Höhe relativ zur Kopfhöhe (0.40-0.55)

# Auto-Export (optional): Wenn leer, musst du manuell exportieren
# TIPP: Aktiviere Auto-Export für automatischen Export mit Shape Keys!
AUTO_EXPORT_PATH = r"D:\Landkreis\frontend\public\avatar\Kayanew_mouth.glb"  # Automatischer Export aktiviert
# AUTO_EXPORT_PATH = ""  # Deaktivieren: Leer lassen und manuell in Blender exportieren
# ==============================================================================

def list_scene_info():
    """Zeigt Debug-Info über Meshes, Skeletons, Vertex-Gruppen"""
    print("\n=== SCENE INFO ===")
    meshes = [o for o in bpy.context.view_layer.objects if o.type == 'MESH' and o.visible_get()]
    print(f"Meshes ({len(meshes)}):", [o.name for o in meshes])
    
    skels = [o for o in bpy.context.view_layer.objects if o.type == 'ARMATURE' and o.visible_get()]
    if skels:
        print(f"Armatures ({len(skels)}):", [o.name for o in skels])
    
    for o in meshes:
        vgs = [vg.name for vg in o.vertex_groups]
        print(f"  - {o.name}: verts={len(o.data.vertices)}, groups={vgs if vgs else 'none'}")

def pick_head_mesh():
    """Findet automatisch das Haupt-Mesh (Head/Face bevorzugt)"""
    candidates = [o for o in bpy.context.view_layer.objects if o.type == 'MESH' and o.visible_get()]
    if not candidates:
        raise RuntimeError("❌ Kein sichtbares Mesh gefunden. Bitte GLB importieren.")
    
    # Priorität: Namen mit "head"/"face" oder größtes Mesh
    def score(o):
        n = o.name.lower()
        name_bonus = 1 if ("head" in n or "face" in n or "body" in n) else 0
        return (name_bonus, len(o.data.vertices))
    
    candidates.sort(key=score, reverse=True)
    head = candidates[0]
    print(f"\n✅ Gewähltes Head-Mesh: '{head.name}' ({len(head.data.vertices)} Vertices)")
    return head

def local_bbox(obj):
    """Berechnet lokale Bounding Box"""
    local_corners = [Vector(corner) for corner in obj.bound_box]
    xs = [c.x for c in local_corners]
    ys = [c.y for c in local_corners]
    zs = [c.z for c in local_corners]
    return (min(xs), max(xs)), (min(ys), max(ys)), (min(zs), max(zs))

def compute_mouth_region(obj):
    """Schätzt Mund-Region heuristisch aus BBox (wenn keine Vertex-Gruppe vorhanden)"""
    (xmin, xmax), (ymin, ymax), (zmin, zmax) = local_bbox(obj)
    
    # Mund-Mitte: zentral in X, ca. 45% der Höhe von unten, etwas zurückgesetzt von vorderster Kante
    cx = 0.5 * (xmin + xmax)
    cy = ymin + HEIGHT_RATIO * (ymax - ymin)
    cz = zmax - DEPTH_OFFSET * (zmax - zmin)
    
    center_local = Vector((cx, cy, cz))
    diag = Vector((xmax - xmin, ymax - ymin, zmax - zmin)).length
    radius = max(1e-6, RADIUS_FACTOR * diag)
    
    print(f"\n📐 Bounding Box:")
    print(f"   X: [{xmin:.3f}, {xmax:.3f}]")
    print(f"   Y: [{ymin:.3f}, {ymax:.3f}]")
    print(f"   Z: [{zmin:.3f}, {zmax:.3f}]")
    print(f"\n🎯 Mund-Region (heuristisch):")
    print(f"   Center (local): {center_local}")
    print(f"   Radius: {radius:.4f}")
    
    return center_local, radius

def ensure_basis(obj):
    """Stellt sicher, dass Basis-Shape-Key existiert"""
    if not obj.data.shape_keys:
        obj.shape_key_add(name="Basis", from_mix=False)
        print("\n✅ Basis-Shape-Key erstellt")
    elif "Basis" not in obj.data.shape_keys.key_blocks:
        obj.shape_key_add(name="Basis", from_mix=False)

def add_key(obj, name):
    """Fügt Shape Key hinzu (oder gibt existierenden zurück)"""
    keys = obj.data.shape_keys.key_blocks
    if name in keys:
        print(f"⚠️ Shape Key '{name}' existiert bereits - überschreibe")
        return keys[name]
    return obj.shape_key_add(name=name, from_mix=False)

def collect_mouth_vertices(obj, center_local, radius):
    """Sammelt Vertices in Mund-Region"""
    # Zuerst prüfen: Gibt es Vertex-Gruppe "Mouth"?
    vg = obj.vertex_groups.get("Mouth")
    if vg:
        print("\n✅ Vertex-Gruppe 'Mouth' gefunden - verwende diese!")
        ids = set()
        for v in obj.data.vertices:
            for g in v.groups:
                if g.group == vg.index and g.weight > 0.0:
                    ids.add(v.index)
        return ids
    
    # Fallback: Heuristik nach Radius
    print("\n⚠️ Keine Vertex-Gruppe 'Mouth' - verwende heuristische Region")
    ids = set()
    for v in obj.data.vertices:
        if (v.co - center_local).length <= radius:
            ids.add(v.index)
    return ids

def edit_shape_key(obj, key_name, edit_fn, vertex_mask):
    """Editiert Shape Key für alle Vertices in mask"""
    # Nur den zu editierenden Key aktivieren
    for kb in obj.data.shape_keys.key_blocks:
        kb.value = 0.0
    
    key = obj.data.shape_keys.key_blocks[key_name]
    key.value = 1.0
    
    # Direkt in key.data schreiben (efficient)
    count = 0
    for vid in vertex_mask:
        if vid < len(key.data):
            co_orig = key.data[vid].co.copy()
            key.data[vid].co = edit_fn(co_orig, vid)
            count += 1
    
    print(f"   ✏️ '{key_name}': {count} Vertices bearbeitet")
    return count

def main():
    """Hauptfunktion"""
    # FORCE OUTPUT - Manche Blender-Versionen zeigen Output nur wenn explizit geflusht
    import sys
    sys.stdout.flush()
    
    print("\n" + "="*60)
    print("🎭 KAYA Avatar: Shape Keys für Lippenbewegung")
    print("="*60)
    sys.stdout.flush()
    
    # Scene-Info
    list_scene_info()
    
    # Mesh finden
    obj = pick_head_mesh()
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    # Prüfe ob Shape Keys bereits existieren
    existing_keys = {}
    if obj.data.shape_keys:
        existing_keys = {kb.name: kb for kb in obj.data.shape_keys.key_blocks}
        print(f"\n📋 Gefundene Shape Keys im Mesh '{obj.name}': {len(existing_keys)}")
    
    # Basis-Key sicherstellen
    ensure_basis(obj)
    
    # Shape Keys erstellen (nur falls nicht vorhanden)
    print("\n📦 Prüfe/Erstelle Shape Keys...")
    required_keys = ["mouthOpen", "mouthO", "lipsClosed"]
    keys_to_create = [key for key in required_keys if key not in existing_keys]
    
    if keys_to_create:
        print(f"   ⚠️  Fehlende Shape Keys: {keys_to_create}")
        print(f"   → Erstelle fehlende Keys...")
        for key_name in keys_to_create:
            add_key(obj, key_name)
    else:
        print(f"   ✅ Alle benötigten Shape Keys bereits vorhanden!")
        print(f"   → mouthOpen: {'✅' if 'mouthOpen' in existing_keys else '❌'}")
        print(f"   → mouthO: {'✅' if 'mouthO' in existing_keys else '❌'}")
        print(f"   → lipsClosed: {'✅' if 'lipsClosed' in existing_keys else '❌'}")
    
    # Mund-Region bestimmen (nur falls Keys erstellt werden mussten)
    keys_to_create = [key for key in ["mouthOpen", "mouthO", "lipsClosed"] 
                      if obj.data.shape_keys and key not in obj.data.shape_keys.key_blocks]
    
    if keys_to_create:
        print("\n🔧 Bearbeite neue Shape Keys...")
        center_local, radius = compute_mouth_region(obj)
        mouth_ids = collect_mouth_vertices(obj, center_local, radius)
        
        if len(mouth_ids) == 0:
            print("\n❌ FEHLER: Keine Mund-Vertices gefunden!")
            print("   Tipp: Passe HEIGHT_RATIO oder RADIUS_FACTOR in der Konfiguration an")
            return
        
        print(f"\n✅ Mund-Vertices gefunden: {len(mouth_ids)}")
        
        # Edit-Funktionen definieren
        def open_fn(co, vid):
            """Öffnet Mund: Bewegung nach unten/hinten"""
            return co + OPEN_DELTA_LOCAL
        
        def close_fn(co, vid):
            """Schließt Lippen: Bewegung nach vorne"""
            return co + CLOSE_DELTA_LOCAL
        
        def pucker_fn(co, vid):
            """Puckert Lippen: Bewegung Richtung Center"""
            direction = center_local - co
            return co + direction * (1.0 - PUCKER_SCALE)
        
        # Nur neue Keys bearbeiten
        if "mouthOpen" in keys_to_create:
            edit_shape_key(obj, "mouthOpen", open_fn, mouth_ids)
        if "lipsClosed" in keys_to_create:
            edit_shape_key(obj, "lipsClosed", close_fn, mouth_ids)
        if "mouthO" in keys_to_create:
            edit_shape_key(obj, "mouthO", pucker_fn, mouth_ids)
    else:
        print("\n✅ Shape Keys bereits vorhanden - überspringe Bearbeitung")
    
    # Alle Keys auf 0 zurücksetzen (außer Basis)
    for kb in obj.data.shape_keys.key_blocks:
        if kb.name != "Basis":
            kb.value = 0.0
    
    print("\n" + "="*60)
    if keys_to_create:
        print("✅ FERTIG: Shape Keys erstellt!")
    else:
        print("✅ FERTIG: Shape Keys bereits vorhanden!")
    print("="*60)
    print("\n📋 Shape Keys in Mesh '" + obj.name + "':")
    
    # Zeige alle relevanten Keys
    all_keys = [kb.name for kb in obj.data.shape_keys.key_blocks]
    required_keys = ["mouthOpen", "mouthO", "lipsClosed"]
    
    for key in required_keys:
        if key in all_keys:
            print(f"   ✅ {key}")
        else:
            print(f"   ❌ {key} (FEHLT!)")
    
    print(f"\n   Total Shape Keys: {len(all_keys)}")
    
    print("\n📤 EXPORT:")
    print("   OPTION 1 - Auto-Export (empfohlen):")
    print("   → Das Skript exportiert automatisch mit Shape Keys aktiviert!")
    print("   → Datei wird gespeichert nach: AUTO_EXPORT_PATH")
    print("")
    print("   OPTION 2 - Manuell (falls AUTO_EXPORT_PATH leer):")
    print("   1. File > Export > glTF 2.0 (.glb)")
    print("   2. Blender 4.5+: Suche 'Morphs' oder 'Include Shape Keys' → aktivieren ✓")
    print("   2. Blender 4.0: In 'Geometry'-Sektion → 'Shape Keys' aktivieren ✓")
    print("   3. Speichern als: Kayanew_mouth.glb")
    
    # Optional: Auto-Export
    if AUTO_EXPORT_PATH:
        print(f"\n🚀 Auto-Export zu: {AUTO_EXPORT_PATH}")
        
        # Prüfe ob Verzeichnis existiert
        import os
        export_dir = os.path.dirname(AUTO_EXPORT_PATH)
        if not os.path.exists(export_dir):
            print(f"❌ FEHLER: Verzeichnis existiert nicht: {export_dir}")
            print(f"   Bitte erstelle das Verzeichnis oder passe AUTO_EXPORT_PATH an!")
            print(f"   Alternativ: Exportiere manuell (siehe Option 2)")
            return
        
        print(f"✅ Verzeichnis existiert: {export_dir}")
        
        # Prüfe ob Datei bereits existiert
        if os.path.exists(AUTO_EXPORT_PATH):
            file_size = os.path.getsize(AUTO_EXPORT_PATH) / (1024*1024)  # MB
            print(f"⚠️  Datei existiert bereits: {AUTO_EXPORT_PATH}")
            print(f"   Größe: {file_size:.2f} MB - wird überschrieben!")
        
        try:
            print(f"📦 Starte Export...")
            bpy.ops.export_scene.gltf(
                filepath=AUTO_EXPORT_PATH,
                export_format='GLB',
                use_selection=False,
                export_apply=True,
                export_morph=True,    # WICHTIG für Shape Keys!
                export_skins=True,
                export_animations=False
            )
            
            # Prüfe ob Datei wirklich erstellt wurde
            if os.path.exists(AUTO_EXPORT_PATH):
                file_size = os.path.getsize(AUTO_EXPORT_PATH) / (1024*1024)  # MB
                print(f"✅ Export erfolgreich!")
                print(f"   Datei: {AUTO_EXPORT_PATH}")
                print(f"   Größe: {file_size:.2f} MB")
                
                # Liste alle Shape Keys in der exportierten Datei (Prüfung)
                print(f"\n🔍 Exportierte Shape Keys:")
                for kb in obj.data.shape_keys.key_blocks:
                    print(f"   - {kb.name}")
            else:
                print(f"❌ FEHLER: Datei wurde nicht erstellt!")
                print(f"   Prüfe ob Blender Schreibrechte für: {export_dir} hat")
                
        except Exception as e:
            print(f"❌ Export-Fehler: {e}")
            import traceback
            traceback.print_exc()
            print(f"\n💡 HINWEIS: Wenn Auto-Export fehlschlägt:")
            print(f"   1. Exportiere manuell: Datei > Exportieren > glTF 2.0")
            print(f"   2. Aktiviere 'Morphen' / 'Include Shape Keys' im Export-Dialog")
            print(f"   3. Speichere nach: {AUTO_EXPORT_PATH}")

# Script ausführen
if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ FEHLER: {e}")
        import traceback
        traceback.print_exc()

