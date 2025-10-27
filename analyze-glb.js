const { Document, NodeIO } = require('@gltf-transform/core');

async function analyzeGLB() {
  const io = new NodeIO();
  
  try {
    console.log('📦 Loading GLB file...');
    const doc = await io.read('frontend/public/avatar/kaya.glb');
    
    console.log('\n=== GLB Analysis ===\n');
    
    // Animations
    const animations = doc.getRoot().listAnimations();
    console.log(`📹 Animations: ${animations.length}`);
    animations.forEach((anim, i) => {
      const channels = anim.listChannels();
      console.log(`  ${i+1}. "${anim.getName()}" (${channels.length} channels)`);
      channels.forEach(ch => {
        console.log(`     - ${ch.getTargetPath()} on ${ch.getTargetNode()?.getName() || 'unknown'}`);
      });
    });
    
    // Meshes
    const meshes = doc.getRoot().listMeshes();
    console.log(`\n🎭 Meshes: ${meshes.length}`);
    meshes.forEach((mesh, i) => {
      const primitives = mesh.listPrimitives();
      primitives.forEach((prim, j) => {
        const targets = prim.listTargets();
        console.log(`  ${i+1}.${j+1}. "${mesh.getName()}" - ${targets.length} morph targets`);
        targets.forEach((target, k) => {
          const attrs = target.listSemantics();
          console.log(`     Target ${k+1}: ${attrs.join(', ')}`);
        });
      });
    });
    
    // Nodes (Armatures/Bones)
    const nodes = doc.getRoot().listNodes();
    console.log(`\n🔗 Nodes: ${nodes.length}`);
    const nodesWithSkin = nodes.filter(n => n.getSkin());
    console.log(`  Nodes with Skin: ${nodesWithSkin.length}`);
    
    // Skins
    const skins = doc.getRoot().listSkins();
    console.log(`\n🦴 Skins: ${skins.length}`);
    skins.forEach((skin, i) => {
      const joints = skin.listJoints();
      console.log(`  ${i+1}. "${skin.getName()}" - ${joints.length} joints`);
    });
    
    console.log('\n✅ Analysis complete!\n');
    
    // Summary
    if (animations.length === 0) {
      console.log('❌ WARNING: GLB enthält KEINE Animationen!');
      console.log('   → Avatar kann keine Animations spielen');
      console.log('   → Muss mit Animationen neu exportiert werden');
    } else {
      console.log('✅ GLB enthält Animationen');
    }
    
    if (nodesWithSkin.length === 0 && skins.length === 0) {
      console.log('⚠️  WARNING: Keine Armature/Skin gefunden');
      console.log('   → Nur statisches Mesh (kein Bone-Rig)');
    } else {
      console.log('✅ GLB enthält Skin/Armature');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeGLB().catch(console.error);

