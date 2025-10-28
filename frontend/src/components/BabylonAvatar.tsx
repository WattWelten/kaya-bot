import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { LipsyncEngine, VisemeSegment } from '../services/LipsyncEngine';
import { EmotionMapper, EmotionType } from '../services/EmotionMapper';

interface BabylonAvatarProps {
  isSpeaking: boolean;
  emotion?: EmotionType;
  emotionConfidence?: number;
  visemeTimeline?: VisemeSegment[];
}

export function BabylonAvatar({ isSpeaking, emotion = 'neutral', emotionConfidence = 50, visemeTimeline }: BabylonAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const meshRef = useRef<BABYLON.AbstractMesh | null>(null);
  const morphTargetManagerRef = useRef<BABYLON.MorphTargetManager | null>(null);
  const glowLayerRef = useRef<BABYLON.GlowLayer | null>(null);
  const lipsyncEngineRef = useRef<LipsyncEngine | null>(null);
  const emotionMapperRef = useRef<EmotionMapper | null>(null);

  // Mobile Detection
  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  // Loading Placeholder
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lc-primary-50 to-lc-accent-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-lc-primary-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-lc-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-lg font-medium text-lc-neutral-700">KAYA lädt...</p>
          {loadingProgress > 0 && loadingProgress < 100 && (
            <p className="text-sm text-lc-neutral-500 mt-2">{loadingProgress}%</p>
          )}
        </div>
      </div>
    );
  }

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
    BABYLON.SceneLoader.Append('/avatar/', 'Kayanew-draco.glb', scene, () => {
      setIsLoading(false);
      // Skinned Mesh mit MorphTargets finden
      const skinned = scene.meshes.find(m => (m as any).morphTargetManager) as BABYLON.AbstractMesh;
      
      if (skinned) {
        meshRef.current = skinned;
        skinned.position.y = -3.5; // Noch tiefer (nur Oberkörper + Kopf)
        skinned.scaling = new BABYLON.Vector3(4.5, 4.5, 4.5); // 3x größer
        
        const mtm = (skinned as any).morphTargetManager as BABYLON.MorphTargetManager | undefined;
        morphTargetManagerRef.current = mtm || null;
        
        if (mtm && glowLayer) {
          console.log('📦 Babylon Avatar geladen:', scene.meshes.length, 'Meshes, Morph Targets:', mtm.numTargets);
          
          // Initialisiere Lipsync Engine
          lipsyncEngineRef.current = new LipsyncEngine(mtm);
          
          // Initialisiere Emotion Mapper
          emotionMapperRef.current = new EmotionMapper(mtm, glowLayer);
          
          console.log('🎭 Lipsync Engine & Emotion Mapper initialisiert');
        }
      }
    }, (progressEvent) => {
      if (progressEvent.loaded && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setLoadingProgress(percent);
        console.log(`📦 Loading GLB: ${percent}%`);
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

  // Lipsync: Viseme-Timeline abspielen
  useEffect(() => {
    if (!lipsyncEngineRef.current || !visemeTimeline || visemeTimeline.length === 0) return;

    console.log('🎭 Starte Lipsync mit', visemeTimeline.length, 'Segmenten');
    lipsyncEngineRef.current.start(visemeTimeline);

    return () => {
      if (lipsyncEngineRef.current) {
        lipsyncEngineRef.current.stop();
      }
    };
  }, [visemeTimeline]);

  // Idle Animation (Breathing)
  useEffect(() => {
    if (!meshRef.current || isSpeaking) return;

    const startTime = Date.now();
    const animate = () => {
      if (!meshRef.current || isSpeaking) return;
      const elapsed = (Date.now() - startTime) / 1000;
      meshRef.current.position.y = -3.5 + Math.sin(elapsed * 0.5) * 0.02; // Idle-Animation bei -3.5
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isSpeaking]);

  // Emotion: Avatar-Mimik + Glow anpassen
  useEffect(() => {
    if (!emotionMapperRef.current) return;

    console.log('😊 Emotion Update:', emotion, emotionConfidence);
    emotionMapperRef.current.applyEmotion(emotion, emotionConfidence);
  }, [emotion, emotionConfidence]);

  // Glow-Effekt: Wenn Avatar spricht (zusätzlich zur Emotion)
  useEffect(() => {
    if (!glowLayerRef.current || !meshRef.current) return;

    if (isSpeaking) {
      glowLayerRef.current.intensity = Math.min(glowLayerRef.current.intensity + 0.3, 1.0);
      glowLayerRef.current.addIncludedOnlyMesh(meshRef.current as BABYLON.Mesh);
    } else {
      // Intensität auf Emotion-Level zurücksetzen (wird von EmotionMapper gesetzt)
    }
  }, [isSpeaking]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
    />
  );
}

