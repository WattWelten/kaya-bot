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

// ---- Dials: HIER nur Zahlen anpassen, wenn nötig ----
const DIAL = {
  yawDeg: 45,         // ~45° nach rechts (frontaler Blick zur Mitte)
  fovDeg: 30,         // 28-32 empfohlen; kleiner = näher
  padding: 1.10,      // 1.06-1.18 Luft um Kopf/Schultern
  eyeLine: 0.62,      // 0..1, Augenlinie im Bild
  betaMin: 60,        // Kamerakipp-Limits (in Grad)
  betaMax: 88,
  xShift: -0.055      // horizontale Komposition (Avatar minimal weiter links)
};

/** Pivot auf Brustbein setzen + Vorwärtsachse auf -Z normalisieren */
function normalizePivotAndForward(root: BABYLON.AbstractMesh) {
  const { min, max } = root.getHierarchyBoundingVectors(true);
  const size = max.subtract(min);
  const h = size.y;
  const center = min.add(size.scale(0.5));
  const sternum = new BABYLON.Vector3(center.x, min.y + h * 0.58, center.z);

  const pivot = new BABYLON.TransformNode("kaya_pivot", root.getScene());
  pivot.position = sternum.clone();
  root.setParent(pivot);

  // Falls Modell nach +Z schaut → um Y 180° drehen, damit "nach vorne" = -Z
  const looksPlusZ = size.z > size.x && max.z > Math.abs(min.z);
  if (looksPlusZ) pivot.rotate(BABYLON.Axis.Y, BABYLON.Tools.ToRadians(180));

  // Rotation vereinheitlichen
  if (pivot.rotationQuaternion) {
    pivot.rotation = pivot.rotationQuaternion.toEulerAngles();
    pivot.rotationQuaternion = null;
  }
  pivot.scaling = BABYLON.Vector3.One();
  return { pivot, height: h, size };
}

/** Portrait-Framing (9:16), Augenlinie ~62%, kein "von unten" */
function framePortrait(scene: BABYLON.Scene, pivot: BABYLON.TransformNode, cam: BABYLON.ArcRotateCamera, dial = DIAL) {
  const { min, max } = (pivot as any).getHierarchyBoundingVectors(true);
  const size = max.subtract(min);
  const h = size.y;
  const r = size.length() * 0.5;
  
  // xShift für horizontale Komposition
  const target = pivot.position.add(new BABYLON.Vector3(size.x * dial.xShift, 0, 0));

  const vFov = BABYLON.Tools.ToRadians(dial.fovDeg);
  const aspect = scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight();
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const dist = (r * dial.padding) / Math.sin(Math.min(vFov, hFov) / 2);

  // Avatar schaut −Z → Kamera auf +Z
  const pos = target.add(new BABYLON.Vector3(0, 0, dist));
  const v = pos.subtract(target);
  
  // yawDeg wird über Pivot-Rotation angewendet → hier keine zusätzliche Alpha-Rotation
  const alpha = Math.atan2(v.x, v.z);
  const beta = Math.atan2(v.y, Math.sqrt(v.x * v.x + v.z * v.z));

  cam.setTarget(target);
  cam.alpha = alpha;
  cam.beta = BABYLON.Scalar.Clamp(beta, BABYLON.Tools.ToRadians(dial.betaMin), BABYLON.Tools.ToRadians(dial.betaMax));
  cam.radius = v.length();
  cam.fov = vFov;

  // Augenlinie höher
  const offsetY = h * (dial.eyeLine - 0.5);
  cam.target = (cam as any)._target.add(new BABYLON.Vector3(0, offsetY, 0));

  // Interaktion eng begrenzen (kein Panning)
  cam.panningSensibility = 0;
  cam.useAutoRotationBehavior = false;
  cam.lowerBetaLimit = BABYLON.Tools.ToRadians(dial.betaMin);
  cam.upperBetaLimit = BABYLON.Tools.ToRadians(dial.betaMax);
  const alphaBand = BABYLON.Tools.ToRadians(20);
  cam.lowerAlphaLimit = alpha - alphaBand;
  cam.upperAlphaLimit = alpha + alphaBand;
  cam.lowerRadiusLimit = dist * 0.55;
  cam.upperRadiusLimit = dist * 1.6;
  cam.wheelPrecision = 80;
  cam.inertia = 0.2;

  cam.minZ = 0.05;
  cam.maxZ = dist * 10;
  scene.getEngine().setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));
}

/** Kamera-Interaktionsgrenzen setzen */
function limitInteraction(cam: BABYLON.ArcRotateCamera, dial = DIAL) {
  cam.panningSensibility = 0; // kein Panning
  cam.useAutoRotationBehavior = false;
  cam.lowerRadiusLimit = 0.55; // Zoom enger erlaubt, weil FOV klein
  cam.upperRadiusLimit = 2.2;
  cam.wheelPrecision = 70;
  cam.inertia = 0.2;

  cam.lowerBetaLimit = BABYLON.Tools.ToRadians(dial.betaMin);
  cam.upperBetaLimit = BABYLON.Tools.ToRadians(dial.betaMax);
  cam.lowerAlphaLimit = -BABYLON.Tools.ToRadians(25);
  cam.upperAlphaLimit = BABYLON.Tools.ToRadians(25);
}

export function BabylonAvatar({ isSpeaking, emotion = 'neutral', emotionConfidence = 50, visemeTimeline }: BabylonAvatarProps) {
  // ===== ALLE HOOKS ZUERST (React Rules of Hooks) =====
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const meshRef = useRef<BABYLON.AbstractMesh | null>(null);
  const morphTargetManagerRef = useRef<BABYLON.MorphTargetManager | null>(null);
  const glowLayerRef = useRef<BABYLON.GlowLayer | null>(null);
  const lipsyncEngineRef = useRef<LipsyncEngine | null>(null);
  const emotionMapperRef = useRef<EmotionMapper | null>(null);
  
  // Ready-Flag + Timeline-Puffer für robustes Lipsync
  const avatarReadyRef = useRef(false);
  const bufferedTimelineRef = useRef<VisemeSegment[]>([]);

  // Mobile Detection
  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  // DEBUG: Component Mount
  console.log('🎨 BabylonAvatar Component mounted');
  console.log('🎨 Initial isLoading:', isLoading);
  console.log('🎨 isSpeaking:', isSpeaking);

  // Timeout für Loading: Wird automatisch gecancelt, sobald Avatar lädt
  useEffect(() => {
    // Wenn Avatar bereits geladen (isLoading = false), Timeout nicht starten
    if (!isLoading) {
      console.log('🎨 Avatar bereits geladen, Timeout übersprungen');
      return;
    }

    console.log('🎨 Timeout useEffect läuft - Timeout in 15s');
    const timeout = setTimeout(() => {
      console.warn('⚠️ Avatar Loading Timeout (15s) - Zeige Fallback');
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingFailed(true);
    }, 15000); // 15 Sekunden
    
    return () => {
      console.log('🎨 Timeout useEffect Cleanup (Timeout gecancelt)');
      clearTimeout(timeout);
    };
  }, [isLoading]); // ← Dependency: isLoading (wird gecancelt, sobald Avatar lädt)

  useEffect(() => {
    console.log('🎨 Babylon useEffect läuft');
    console.log('🎨 Canvas Ref:', canvasRef.current);
    console.log('🎨 isMobile:', isMobile);
    
    if (!canvasRef.current) {
      console.warn('⚠️ Canvas Ref ist NULL! Babylon.js kann nicht starten');
      return;
    }
    
    console.log('✅ Canvas Ref vorhanden, starte Babylon.js Engine');

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

    // Camera mit harten Limits (kein "von unten", minimaler Orbit)
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      0,
      0,
      2,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.panningSensibility = 0; // kein Panning
    camera.useAutoRotationBehavior = false;
    camera.lowerRadiusLimit = 0.6;
    camera.upperRadiusLimit = 3.0;
    camera.wheelPrecision = 70;
    camera.inertia = 0.2;

    // Interaktions-Limits (nur leichter Orbit)
    camera.lowerBetaLimit = BABYLON.Tools.ToRadians(60);
    camera.upperBetaLimit = BABYLON.Tools.ToRadians(88);
    camera.lowerAlphaLimit = -BABYLON.Tools.ToRadians(25);
    camera.upperAlphaLimit = BABYLON.Tools.ToRadians(25);

    // 3-Punkt-Licht Setup
    const keyLight = new BABYLON.DirectionalLight('key', new BABYLON.Vector3(-1, -1.5, 1), scene);
    keyLight.intensity = 1.2;
    keyLight.position = new BABYLON.Vector3(5, 8, -5);

    const fillLight = new BABYLON.HemisphericLight('fill', new BABYLON.Vector3(0, 1, 0), scene);
    fillLight.intensity = 0.6;
    fillLight.groundColor = new BABYLON.Color3(0.9, 0.95, 1.0);

    if (!isMobile) {
      const rimLight = new BABYLON.DirectionalLight('rim', new BABYLON.Vector3(1, 0, -1), scene);
      rimLight.intensity = 0.4;
      rimLight.position = new BABYLON.Vector3(-3, 3, 3);
    }

    // Glow Layer für Sprech-Feedback (Primary Color: Türkis/Teal)
    const glowLayer = new BABYLON.GlowLayer('glow', scene, {
      mainTextureFixedSize: 512,
      blurKernelSize: 64
    });
    glowLayer.intensity = 0;
    glowLayerRef.current = glowLayer;

    // Draco lokal konfigurieren (CSP-sicher, kein externes CDN)
    try {
      // Hinweis: Dateien müssen unter /babylon/draco/ bereitliegen
      // draco_decoder_gltf.wasm, draco_decoder_gltf.js, draco_wasm_wrapper.js
      // Falls nicht vorhanden, lädt die unkomprimierte GLB unten trotzdem.
      // @ts-ignore - Typen können variieren je nach Babylon Version
      BABYLON.DracoCompression.Configuration = {
        decoder: {
          wasmUrl: '/babylon/draco/draco_decoder_gltf.wasm',
          wasmBinaryUrl: '/babylon/draco/draco_decoder_gltf.wasm',
          jsUrl: '/babylon/draco/draco_decoder_gltf.js',
          wasmWasmUrl: '/babylon/draco/draco_wasm_wrapper.js'
        }
      } as any;
      console.log('🧩 Draco lokal konfiguriert (ohne CDN)');
    } catch (e) {
      console.warn('⚠️ Draco-Konfiguration übersprungen:', e);
    }

    // Load GLB Model: ZUERST unkomprimierte GLB (CSP-sicher, kein Draco nötig)
    console.log('📦 Starte GLB-Loading (fallback, ohne Draco): /avatar/Kayanew.glb');
    BABYLON.SceneLoader.Append('/avatar/', 'Kayanew.glb', scene, () => {
      console.log('✅ GLB erfolgreich geladen!');
      setIsLoading(false);
      
      // Skinned Mesh mit MorphTargets finden
      const skinned = scene.meshes.find(m => (m as any).morphTargetManager) as BABYLON.AbstractMesh;
      
      if (skinned) {
        // 1) Normalisierung: Pivot + Vorwärtsachse
        const { pivot } = normalizePivotAndForward(skinned);
        meshRef.current = skinned;
        
        // 2) Zusätzliche reale Drehung ~45° nach rechts am Pivot
        pivot.rotation.y += BABYLON.Tools.ToRadians(DIAL.yawDeg);

        // 3) Portrait-Framing (yawDeg bereits am Pivot angewandt → im Frame 0 setzen)
        framePortrait(scene, pivot, camera, { ...DIAL, yawDeg: 0 });
        
        // 4) Morph Targets + Engines initialisieren
        const mtm = (skinned as any).morphTargetManager as BABYLON.MorphTargetManager | undefined;
        morphTargetManagerRef.current = mtm || null;
        
        if (mtm && glowLayerRef.current) {
          console.log('📦 Babylon Avatar geladen:', scene.meshes.length, 'Meshes, Morph Targets:', mtm.numTargets);
          
          lipsyncEngineRef.current = new LipsyncEngine(mtm);
          emotionMapperRef.current = new EmotionMapper(mtm, glowLayerRef.current);
          avatarReadyRef.current = true;
          
          console.log('🎭 Lipsync Engine & Emotion Mapper initialisiert');
          console.log('✅ Avatar Ready-Flag gesetzt');
        }
        
        // 5) Resize-Handler mit Reframing
        const onResize = () => {
          engine.resize();
          framePortrait(scene, pivot, camera, { ...DIAL, yawDeg: 0 });
        };
        window.addEventListener('resize', onResize);
        
    // Event für Chat-Wheel (stoppt Zoom beim Scrollen im Chat) – präzise auf .messages und .composer
    const chat = document.getElementById("chatPane");
    if (chat) {
      chat.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
    }
    // Zusätzlich direkt auf .messages und .composer für maximale Präzision
    document.querySelectorAll('.messages, .composer').forEach(el => {
      el.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
    });
      }
    }, (progressEvent) => {
      if (progressEvent.loaded && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setLoadingProgress(percent);
        console.log(`📦 Loading GLB: ${percent}%`);
      }
    }, (scene, message, exception) => {
      console.error('❌ GLB Loading Fehler (Fallback ohne Draco):', message, exception);
      // Zweiter Versuch: Draco-komprimierte Datei (falls lokale Draco-Dateien vorhanden sind)
      console.log('🔁 Versuche Draco-Variante zu laden: /avatar/Kayanew-draco.glb');
      BABYLON.SceneLoader.Append('/avatar/', 'Kayanew-draco.glb', scene, () => {
        console.log('✅ GLB (Draco) erfolgreich geladen!');
        setIsLoading(false);
      }, (progressEvent2) => {
        if (progressEvent2.loaded && progressEvent2.total) {
          const percent2 = Math.round((progressEvent2.loaded / progressEvent2.total) * 100);
          setLoadingProgress(percent2);
          console.log(`📦 Loading GLB (Draco): ${percent2}%`);
        }
      }, (scene2, message2, exception2) => {
        console.error('❌ GLB Loading Fehler (Draco):', message2, exception2);
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingFailed(true);
      });
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
      // Entferne eventuelles onBeforeRenderObservable für Micro-Motion
      // (wird in eigenem Effect bereinigt)
      scene.dispose();
      engine.dispose();
    };
  }, [isMobile]);

  // Lipsync: Viseme-Timeline puffern (falls zu früh kommt)
  useEffect(() => {
    console.log('🎭 Timeline useEffect triggered');
    console.log('🎭 visemeTimeline:', visemeTimeline);
    console.log('🎭 avatarReady:', avatarReadyRef.current);

    if (!visemeTimeline || visemeTimeline.length === 0) {
      console.warn('⚠️ visemeTimeline leer oder undefined');
      bufferedTimelineRef.current = [];
      return;
    }

    // Timeline puffern
    bufferedTimelineRef.current = visemeTimeline;
    console.log('📦 Timeline gepuffert:', visemeTimeline.length, 'Segmente');
  }, [visemeTimeline]);

  // Lipsync: Start bei isSpeaking (wenn Avatar ready + Timeline vorhanden)
  useEffect(() => {
    console.log('🎭 isSpeaking useEffect triggered');
    console.log('🎭 isSpeaking:', isSpeaking);
    console.log('🎭 avatarReady:', avatarReadyRef.current);
    console.log('🎭 bufferedTimeline length:', bufferedTimelineRef.current.length);

    if (!avatarReadyRef.current) {
      console.warn('⚠️ Avatar noch nicht bereit');
      return;
    }

    if (!lipsyncEngineRef.current) {
      console.warn('⚠️ LipsyncEngine nicht initialisiert');
      return;
    }

    if (isSpeaking && bufferedTimelineRef.current.length > 0) {
      console.log('✅ Starte Lipsync mit', bufferedTimelineRef.current.length, 'Segmenten');
      lipsyncEngineRef.current.start(bufferedTimelineRef.current);
    } else if (!isSpeaking) {
      console.log('🛑 Stoppe Lipsync (isSpeaking = false)');
      lipsyncEngineRef.current.stop();
    }

    return () => {
      if (lipsyncEngineRef.current && isSpeaking) {
        console.log('🎭 Lipsync cleanup');
        lipsyncEngineRef.current.stop();
      }
    };
  }, [isSpeaking]);

  // Idle Micro-Motion (Kopf subtile Bewegung) – respektiert Reduced Motion
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduced-motion');
    if (prefersReduced) return;

    let pivotNode: BABYLON.TransformNode | null = null;
    
    const obs = scene.onBeforeRenderObservable.add(() => {
      // Versuche den Pivot über den Namen zu finden
      if (!pivotNode) {
        const node = scene.getTransformNodeByName('kaya_pivot');
        if (node && node instanceof BABYLON.TransformNode) pivotNode = node;
      }
      
      if (!pivotNode) return;
      
      const t = performance.now() / 1000;
      const baseYaw = BABYLON.Tools.ToRadians(DIAL.yawDeg);
      const microYaw = Math.sin(t * 0.33) * BABYLON.Tools.ToRadians(0.6);
      const microPitch = Math.sin(t * 0.27) * BABYLON.Tools.ToRadians(0.4);
      pivotNode.rotation.y = baseYaw + microYaw;
      pivotNode.rotation.x = microPitch;
    });

    return () => {
      scene.onBeforeRenderObservable.remove(obs);
    };
  }, []);

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

  // ===== RENDER: Canvas IMMER anzeigen, Overlays für Loading/Fallback =====
  return (
    <div className="relative w-full h-full">
      {/* Canvas IMMER rendern (damit Babylon.js initialisiert werden kann) */}
      <canvas 
        ref={canvasRef}
        id="babylon-canvas"
        className={isLoading || loadingFailed ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}
      />
      
      {/* Weiche Kante zwischen Avatar und Chat */}
      <div className="avatar-shadow" aria-hidden="true" />

      {/* Loading Overlay (darüber, während GLB lädt) */}
      {isLoading && !loadingFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-lc-primary-50 to-lc-accent-50">
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
      )}

      {/* Fallback Overlay (wenn Loading fehlschlägt) */}
      {loadingFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-lc-primary-50 to-lc-accent-50">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">👤</div>
            <p className="text-lg font-medium text-lc-neutral-700">KAYA ist bereit</p>
            <p className="text-sm text-lc-neutral-500 mt-2">Avatar wird nachgeladen...</p>
          </div>
        </div>
      )}
    </div>
  );
}

