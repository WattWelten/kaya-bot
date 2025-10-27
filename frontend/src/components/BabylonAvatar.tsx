import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface BabylonAvatarProps {
  isSpeaking: boolean;
  emotion?: 'neutral' | 'happy' | 'concerned' | 'speaking';
  visemes?: number[];
}

export function BabylonAvatar({ isSpeaking, emotion = 'neutral', visemes }: BabylonAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const meshRef = useRef<BABYLON.AbstractMesh | null>(null);
  const morphTargetManagerRef = useRef<BABYLON.MorphTargetManager | null>(null);
  const glowLayerRef = useRef<BABYLON.GlowLayer | null>(null);

  // Mobile Detection
  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    // Engine Setup mit Mobile Optimization
    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
      powerPreference: isMobile ? 'low-power' : 'high-performance'
    });
    
    engineRef.current = engine;

    // Scene Setup
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent
    sceneRef.current = scene;

    // Camera (näher + leicht nach unten)
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,      // Horizontal
      Math.PI / 2.5,    // Vertikal
      2,                // Distance (näher: 3 → 2)
      new BABYLON.Vector3(0, 0, 0), // Center point
      scene
    );
    camera.attachControl(canvasRef.current, false);
    camera.lowerRadiusLimit = 1.5;
    camera.upperRadiusLimit = 4;

    // Lighting
    const ambientLight = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.6;

    if (!isMobile) {
      const directionalLight = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(1, -1, 1), scene);
      directionalLight.intensity = 0.8;
      directionalLight.position = new BABYLON.Vector3(5, 5, 5);
    }

    // Glow Layer für Sprech-Feedback (Primary Color: Türkis/Teal)
    const glowLayer = new BABYLON.GlowLayer('glow', scene, {
      mainTextureFixedSize: 512,
      blurKernelSize: 64
    });
    glowLayer.intensity = 0;
    glowLayerRef.current = glowLayer;

    // Load GLB Model mit SceneLoader.Append (korrekt für Morph Targets)
    BABYLON.SceneLoader.Append('/avatar/', 'Kayanew.glb', scene, () => {
      // Skinned Mesh mit MorphTargets finden
      const skinned = scene.meshes.find(m => (m as any).morphTargetManager) as BABYLON.AbstractMesh;
      
      if (skinned) {
        meshRef.current = skinned;
        skinned.position.y = -2; // Leicht nach unten (-1.67 → -2)
        skinned.scaling = new BABYLON.Vector3(4.5, 4.5, 4.5); // 3x größer
        
        const mtm = (skinned as any).morphTargetManager as BABYLON.MorphTargetManager | undefined;
        morphTargetManagerRef.current = mtm || null;
        
        if (mtm) {
          console.log('📦 Babylon Avatar geladen:', scene.meshes.length, 'Meshes, Morph Targets:', mtm.numTargets);
        }
      }
    }, (progressEvent) => {
      if (progressEvent.loaded && progressEvent.total) {
        const percent = (progressEvent.loaded / progressEvent.total) * 100;
        console.log(`📦 Loading GLB: ${Math.round(percent)}%`);
      }
    }, (scene, message) => {
      console.error('❌ GLB Loading Fehler:', message);
    });

    // Render Loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Resize Handler
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [isMobile]);

  // Lipsync: Morph Targets Update
  useEffect(() => {
    if (!morphTargetManagerRef.current || !visemes || visemes.length === 0) return;

    const mtm = morphTargetManagerRef.current;

    // Viseme-Namen (Beispiel-Mapping, anpassen nach deiner GLB)
    const VISEME_NAMES = [
      'mouthFunnel', // AA
      'mouthO', // O
      'mouthClose', // F
      'tongueOut', // L
      'mouthSmile_L', // SMILE
      // ... weitere
    ];

    visemes.forEach((value, index) => {
      if (index < VISEME_NAMES.length) {
        const target = mtm.getTargetByName(VISEME_NAMES[index]);
        if (target) {
          target.influence = value;
        }
      }
    });
  }, [visemes]);

  // Idle Animation (Breathing)
  useEffect(() => {
    if (!meshRef.current || isSpeaking) return;

    const startTime = Date.now();
    const animate = () => {
      if (!meshRef.current || isSpeaking) return;
      const elapsed = (Date.now() - startTime) / 1000;
      meshRef.current.position.y = -2 + Math.sin(elapsed * 0.5) * 0.02; // Anfang bei -2
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isSpeaking]);

  // Glow-Effekt: Wenn Avatar spricht
  useEffect(() => {
    if (!glowLayerRef.current || !meshRef.current) return;

    if (isSpeaking) {
      glowLayerRef.current.intensity = 0.8;
      glowLayerRef.current.addIncludedOnlyMesh(meshRef.current as BABYLON.Mesh);
    } else {
      glowLayerRef.current.intensity = 0;
    }
  }, [isSpeaking]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
    />
  );
}

