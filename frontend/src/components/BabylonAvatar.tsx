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

    // Camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 2.5,
      3,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvasRef.current, false);
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 5;

    // Lighting
    const ambientLight = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.6;

    if (!isMobile) {
      const directionalLight = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(1, -1, 1), scene);
      directionalLight.intensity = 0.8;
      directionalLight.position = new BABYLON.Vector3(5, 5, 5);
    }

    // Load GLB Model
    BABYLON.SceneLoader.ImportMesh('', '/avatar/', 'kaya.glb', scene, (meshes) => {
      if (meshes.length > 0) {
        meshRef.current = meshes[0];
        meshes[0].position.y = -1;
        meshes[0].scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
        console.log('📦 Babylon Avatar geladen:', meshes.length, 'Meshes');
      }
    }, undefined, (scene, message) => {
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
    if (!meshRef.current || !visemes || visemes.length === 0) return;

    const mesh = meshRef.current as BABYLON.Mesh;
    const morphTargetManager = mesh.morphTargetManager;

    if (morphTargetManager) {
      visemes.forEach((value, index) => {
        if (index < morphTargetManager.numTargets) {
          morphTargetManager.getTarget(index).influence = value;
        }
      });
    }
  }, [visemes]);

  // Idle Animation (Breathing)
  useEffect(() => {
    if (!meshRef.current || isSpeaking) return;

    const startTime = Date.now();
    const animate = () => {
      if (!meshRef.current || isSpeaking) return;
      const elapsed = (Date.now() - startTime) / 1000;
      meshRef.current.position.y = -1 + Math.sin(elapsed * 0.5) * 0.02;
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isSpeaking]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
    />
  );
}

