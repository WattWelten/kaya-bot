"""
HD Avatar Enhancement Script für KAYA
Optimiert Materialien, aktiviert Draco-Kompression, exportiert in einem Schritt
"""
import bpy
import sys
import argparse
import re
import os

def parse_args():
    """Parse command line arguments"""
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    
    p = argparse.ArgumentParser(description="Enhance GLB for HD production")
    p.add_argument("--in", dest="inp", required=True, help="Input GLB path")
    p.add_argument("--out", dest="outp", required=True, help="Output GLB path")
    p.add_argument("--micro", dest="micro", default=None, help="Skin micro normal map path (optional)")
    p.add_argument("--keep-draco", action="store_true", help="Enable Draco mesh compression")
    return p.parse_args(argv)

def clean_scene():
    """Reset scene to factory settings"""
    bpy.ops.wm.read_factory_settings(use_empty=True)

def import_glb(path):
    """Import GLB file"""
    if not os.path.exists(path):
        print(f"❌ FEHLER: Datei nicht gefunden: {path}")
        sys.exit(1)
    print(f"📦 Importiere GLB: {path}")
    bpy.ops.import_scene.gltf(filepath=path)
    print(f"✅ GLB importiert")

def find_principled(mat):
    """Find Principled BSDF node in material"""
    if not mat or not mat.node_tree:
        return None
    for n in mat.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            return n
    return None

def ensure_image_node(mat, image_path):
    """Load image and create texture node"""
    nt = mat.node_tree
    img_node = nt.nodes.new("ShaderNodeTexImage")
    img_node.image = bpy.data.images.load(image_path, check_existing=True)
    img_node.interpolation = 'Smart'
    return img_node

def link_normal_to_principled(mat, img_node):
    """Link normal map to principled shader"""
    nt = mat.node_tree
    bump = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(img_node.outputs["Color"], bump.inputs["Color"])
    principled = find_principled(mat)
    if principled:
        nt.links.new(bump.outputs["Normal"], principled.inputs["Normal"])

def tune_materials(micro_path):
    """Optimize materials for HD/photoreal rendering"""
    skin_re = re.compile(r"(skin|face|head|neck)", re.I)
    hair_re = re.compile(r"(hair)", re.I)
    eye_re = re.compile(r"(eye|iris|cornea)", re.I)
    tooth_re = re.compile(r"(tooth|teeth|gum|mouth)", re.I)
    cloth_re = re.compile(r"(cloth|fabric|sweater|hoodie)", re.I)
    
    tuned_count = 0
    
    for mat in bpy.data.materials:
        p = find_principled(mat)
        if not p:
            continue
        
        name = (mat.name or "").lower()
        
        # --- SKIN ---
        if skin_re.search(name):
            p.inputs["Metallic"].default_value = 0.0
            p.inputs["Roughness"].default_value = 0.42
            p.inputs["Specular"].default_value = 0.6
            p.inputs["Subsurface"].default_value = 0.2
            p.inputs["Subsurface Radius"].default_value = (1.1, 0.7, 0.6)
            
            if micro_path and os.path.exists(micro_path):
                img = ensure_image_node(mat, micro_path)
                link_normal_to_principled(mat, img)
                print(f"✅ Skin-Material '{mat.name}': Micro-Normal-Map hinzugefügt")
            tuned_count += 1
        
        # --- HAIR ---
        elif hair_re.search(name):
            p.inputs["Anisotropic"].default_value = 0.8
            p.inputs["Roughness"].default_value = 0.33
            mat.blend_method = 'BLEND'
            mat.shadow_method = 'HASHED'
            tuned_count += 1
        
        # --- EYES ---
        elif eye_re.search(name):
            p.inputs["Clearcoat"].default_value = 1.0
            p.inputs["Clearcoat Roughness"].default_value = 0.0
            p.inputs["IOR"].default_value = 1.376
            p.inputs["Specular"].default_value = 0.9
            tuned_count += 1
        
        # --- TEETH / MOUTH ---
        elif tooth_re.search(name):
            p.inputs["Metallic"].default_value = 0.0
            p.inputs["Roughness"].default_value = 0.22
            p.inputs["Specular"].default_value = 0.95
            tuned_count += 1
        
        # --- CLOTH ---
        elif cloth_re.search(name):
            p.inputs["Sheen"].default_value = 0.35
            p.inputs["Roughness"].default_value = 0.55
            tuned_count += 1
    
    print(f"✅ {tuned_count} Materialien optimiert")

def export_glb(path, keep_draco):
    """Export GLB with optimization settings"""
    export_dir = os.path.dirname(path)
    if not os.path.exists(export_dir):
        os.makedirs(export_dir, exist_ok=True)
        print(f"📁 Export-Verzeichnis erstellt: {export_dir}")
    
    kwargs = dict(
        filepath=path,
        export_format='GLB',
        export_texcoords=True,
        export_normals=True,
        export_colors=True,
        export_tangents=True,
        export_materials='EXPORT',
        export_skins=True,
        export_morph=True,  # WICHTIG: Shape Keys exportieren
        export_morph_normal=True,
        export_morph_tangent=False,
        use_selection=False,
        export_yup=True,
        export_apply=True,
        export_extras=True
    )
    
    if keep_draco:
        kwargs.update(dict(
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=5  # Balance zwischen Qualität und Größe
        ))
        print(f"🧩 Draco-Kompression aktiviert (Level 5)")
    
    print(f"📦 Exportiere nach: {path}")
    bpy.ops.export_scene.gltf(**kwargs)
    
    if os.path.exists(path):
        size_mb = os.path.getsize(path) / (1024 * 1024)
        print(f"✅ Export erfolgreich!")
        print(f"   Datei: {path}")
        print(f"   Größe: {size_mb:.2f} MB")
        return True
    else:
        print(f"❌ Export fehlgeschlagen: Datei nicht erstellt")
        return False

def main():
    """Main function"""
    args = parse_args()
    
    print("\n" + "="*60)
    print("🎨 KAYA HD Avatar Enhancement")
    print("="*60)
    print(f"Input:  {args.inp}")
    print(f"Output: {args.outp}")
    if args.micro:
        print(f"Micro Normal: {args.micro}")
    if args.keep_draco:
        print("Draco: Aktiviert")
    print("="*60 + "\n")
    
    sys.stdout.flush()
    
    try:
        clean_scene()
        import_glb(args.inp)
        tune_materials(args.micro)
        
        success = export_glb(args.outp, args.keep_draco)
        
        if success:
            print("\n" + "="*60)
            print("✅ ENHANCEMENT ABGESCHLOSSEN")
            print("="*60)
        else:
            print("\n" + "="*60)
            print("❌ ENHANCEMENT FEHLGESCHLAGEN")
            print("="*60)
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ FEHLER: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    sys.stdout.flush()

if __name__ == "__main__":
    main()


