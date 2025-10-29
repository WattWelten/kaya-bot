import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { LipsyncEngine, VisemeSegment } from '../services/LipsyncEngine';
import { EmotionMapper, EmotionType } from '../services/EmotionMapper';
import { speak, stopSpeaking } from '../services/TTSService';
import { useAudioManager } from '../hooks/useAudioManager';

interface BabylonAvatarProps {
  isSpeaking: boolean;
  emotion?: EmotionType;
  emotionConfidence?: number;
  visemeTimeline?: VisemeSegment[];
}

// ---- Dials: HIER nur Zahlen anpassen, wenn nötig ----
const DIAL = {
  yawDeg: -18,         // leicht nach rechts zur Mitte (negativ = rechts)
  fovDeg: 30,
  padding: 1.10,
  eyeLine: 0.62,
  betaMin: 60,
  betaMax: 88,
  xShift: -0.055
};

// Merker für Basis-Ausrichtung
let baseAlpha = 0;

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
  const size = max.subtract(min), h = size.y;
  const target = pivot.position.add(new BABYLON.Vector3(size.x * (dial.xShift ?? 0), 0, 0));

  const vFov = BABYLON.Tools.ToRadians(dial.fovDeg);
  const aspect = scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight();
  const hFov = 2 * Math.atan(Math.tan(vFov/2) * aspect);
  const r = max.subtract(min).length() * 0.5;
  const dist = (r * dial.padding) / Math.sin(Math.min(vFov, hFov)/2);

  // Avatar blickt -Z → Kamera auf +Z
  const pos = target.add(new BABYLON.Vector3(0, 0, dist));
  const v = pos.subtract(target);

  baseAlpha = Math.atan2(v.x, v.z) + BABYLON.Tools.ToRadians(dial.yawDeg);  // KEIN Clamping!
  const beta = Math.atan2(v.y, Math.sqrt(v.x*v.x + v.z*v.z));

  // Debug: Yaw-Wert
  console.log('🎯 Avatar Yaw:', (baseAlpha * 180 / Math.PI).toFixed(2), '° (yawDeg:', dial.yawDeg, ')');

  cam.setTarget(target);
  cam.alpha = baseAlpha;
  cam.beta = BABYLON.Scalar.Clamp(beta, BABYLON.Tools.ToRadians(dial.betaMin), BABYLON.Tools.ToRadians(dial.betaMax));
  cam.radius = v.length();
  cam.fov = vFov;

  // Augenlinie
  cam.target = (cam as any)._target.add(new BABYLON.Vector3(0, h * (dial.eyeLine - 0.5), 0));

  // Interaktionsfenster eng um baseAlpha
  const band = BABYLON.Tools.ToRadians(20);
  cam.lowerAlphaLimit = baseAlpha - band;
  cam.upperAlphaLimit = baseAlpha + band;
  
  // Debug: Alpha-Limits
  console.log('🎯 Alpha Limits:', (cam.lowerAlphaLimit * 180 / Math.PI).toFixed(2), 'bis', (cam.upperAlphaLimit * 180 / Math.PI).toFixed(2), '°');
  cam.panningSensibility = 0;
  cam.useAutoRotationBehavior = false;
  cam.lowerRadiusLimit = dist * 0.75;
  cam.upperRadiusLimit = dist * 1.35;
  cam.wheelPrecision = 0;
  cam.wheelDeltaPercentage = 0;
  cam.inertia = 0.15;
  cam.minZ = 0.05;
  cam.maxZ = dist * 10;
}

/** Kamera-Interaktionsgrenzen setzen */
function limitInteraction(cam: BABYLON.ArcRotateCamera, dial = DIAL) {
  cam.panningSensibility = 0; // kein Panning
  cam.useAutoRotationBehavior = false;
  cam.lowerRadiusLimit = 0.55; // Zoom enger erlaubt, weil FOV klein
  cam.upperRadiusLimit = 2.2;
  cam.wheelPrecision = 0; // Wheel komplett deaktivieren
  cam.wheelDeltaPercentage = 0;
  cam.inertia = 0.2;

  cam.lowerBetaLimit = BABYLON.Tools.ToRadians(dial.betaMin);
  cam.upperBetaLimit = BABYLON.Tools.ToRadians(dial.betaMax);
  cam.lowerAlphaLimit = -BABYLON.Tools.ToRadians(25);
  cam.upperAlphaLimit = BABYLON.Tools.ToRadians(25);
}

function BabylonAvatarComponent({ isSpeaking, emotion = 'neutral', emotionConfidence = 50, visemeTimeline }: BabylonAvatarProps) {
  // ===== ALLE HOOKS ZUERST (React Rules of Hooks) =====
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    currentViseme: 'none',
    mappedMorph: 'none',
    influence: 0,
    amplitude: 0,
    timelineLength: 0
  });
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
  
  // Audio-Amplitude für Fallback-Lipsync
  const audioManager = useAudioManager();
  const amplitudeFallbackTargetRef = useRef<any>(null); // MorphTarget für Jaw/MouthOpen
  const amplitudeFallbackAnimationFrameRef = useRef<number | null>(null);

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
    
    // Wheel am Canvas komplett deaktivieren (verhindert Zoom)
    canvasRef.current?.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
    
    camera.panningSensibility = 0; // kein Panning
    camera.useAutoRotationBehavior = false;
    camera.lowerRadiusLimit = 0.6;
    camera.upperRadiusLimit = 3.0;
    camera.wheelPrecision = 0; // Wheel komplett deaktivieren
    camera.wheelDeltaPercentage = 0;
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

    // Load GLB Model: ZUERST neue GLB mit Shape Keys (kayanew_mouth.glb), Fallback auf alte
    console.log('📦 Starte GLB-Loading (mit Shape Keys): /avatar/Kayanew_mouth.glb');
    BABYLON.SceneLoader.Append('/avatar/', 'Kayanew_mouth.glb', scene, () => {
      console.log('✅ GLB erfolgreich geladen!');
      setIsLoading(false);
      
      // Skinned Mesh mit MorphTargets finden
      // PRIORITÄT: Head_Mesh (meiste Morph Targets), dann andere
      const meshesWithMorphs = scene.meshes.filter(m => {
        const mtm = (m as any).morphTargetManager;
        return mtm && mtm.numTargets > 0;
      }) as BABYLON.AbstractMesh[];
      
      if (meshesWithMorphs.length === 0) {
        console.error('❌ Kein Mesh mit Morph Targets gefunden!');
        setIsLoading(false);
        return;
      }
      
      // Sortiere nach Anzahl Morph Targets (meiste zuerst) und präferiere "Head" im Namen
      meshesWithMorphs.sort((a, b) => {
        const aMtm = (a as any).morphTargetManager;
        const bMtm = (b as any).morphTargetManager;
        const aCount = aMtm?.numTargets || 0;
        const bCount = bMtm?.numTargets || 0;
        const aIsHead = a.name?.toLowerCase().includes('head') ? 1 : 0;
        const bIsHead = b.name?.toLowerCase().includes('head') ? 1 : 0;
        return (bIsHead - aIsHead) || (bCount - aCount);
      });
      
      const skinned = meshesWithMorphs[0];
      console.log(`🎯 Gewähltes Mesh: '${skinned.name}' mit ${(skinned as any).morphTargetManager?.numTargets || 0} Morph Targets`);
      if (meshesWithMorphs.length > 1) {
        console.log(`📋 Alle Meshes mit Morph Targets:`);
        meshesWithMorphs.forEach(m => {
          const mtm = (m as any).morphTargetManager;
          console.log(`   - ${m.name}: ${mtm?.numTargets || 0} Morph Targets`);
        });
      }
      
      if (skinned) {
        // 1) Normalisierung: Pivot + Vorwärtsachse
        const { pivot } = normalizePivotAndForward(skinned);
        meshRef.current = skinned;
        
        // 2) Portrait-Framing (yawDeg wird in framePortrait auf alpha addiert)
        framePortrait(scene, pivot, camera, DIAL);
        
        // 4) Morph Targets + Engines initialisieren
        const mtm = (skinned as any).morphTargetManager as BABYLON.MorphTargetManager | undefined;
        morphTargetManagerRef.current = mtm || null;
        
        if (mtm && glowLayerRef.current) {
          console.log('📦 Babylon Avatar geladen:', scene.meshes.length, 'Meshes, Morph Targets:', mtm.numTargets);
          
          lipsyncEngineRef.current = new LipsyncEngine(mtm);
          emotionMapperRef.current = new EmotionMapper(mtm, glowLayerRef.current);
          
          // Amplitude-Fallback: Finde Jaw/MouthOpen MorphTarget (auto-detect)
          const fallbackTargets = ['mouthOpen', 'jawOpen', 'jaw', 'mouth', 'aa'];
          for (const name of fallbackTargets) {
            try {
              const target = mtm.getTargetByName(name);
              if (target) {
                amplitudeFallbackTargetRef.current = target;
                console.log(`✅ Amplitude-Fallback Target gefunden: ${name}`);
                break;
              }
            } catch (e) {
              // Ignore
            }
          }
          
          avatarReadyRef.current = true;
          
          console.log('🎭 Lipsync Engine & Emotion Mapper initialisiert');
          console.log('✅ Avatar Ready-Flag gesetzt');
          
          // Mapping-Report ausgeben (für Debug)
          if (lipsyncEngineRef.current) {
            const report = lipsyncEngineRef.current.getMappingReport();
            const mapped = Object.entries(report).filter(([_, name]) => name !== null).length;
            console.log(`📊 Viseme-Mapping: ${mapped}/${Object.keys(report).length} gemappt`);
          }
          
          // Expose speak function für externe Nutzung
          (window as any).kayaSpeak = (text: string) => {
            if (lipsyncEngineRef.current) {
              speak(text, lipsyncEngineRef.current);
            }
          };
          
          (window as any).kayaStop = () => {
            if (lipsyncEngineRef.current) {
              stopSpeaking(lipsyncEngineRef.current);
            }
          };
        }
        
        // 5) Resize-Handler mit Reframing
        const onResize = () => {
          engine.resize();
          framePortrait(scene, pivot, camera, DIAL);
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
      console.error('❌ GLB Loading Fehler (mit Shape Keys):', message, exception);
      // Fallback 1: Alte Version ohne Shape Keys
      console.log('🔁 Versuche alte GLB: /avatar/Kayanew.glb');
      BABYLON.SceneLoader.Append('/avatar/', 'Kayanew.glb', scene, () => {
        console.log('✅ GLB (alte Version) erfolgreich geladen!');
        setIsLoading(false);
      }, (progressEvent2) => {
        if (progressEvent2.loaded && progressEvent2.total) {
          const percent2 = Math.round((progressEvent2.loaded / progressEvent2.total) * 100);
          setLoadingProgress(percent2);
          console.log(`📦 Loading GLB (alte): ${percent2}%`);
        }
      }, (scene2, message2, exception2) => {
        console.error('❌ GLB Loading Fehler (alte Version):', message2, exception2);
        // Fallback 2: Draco-komprimierte Datei
        console.log('🔁 Versuche Draco-Variante: /avatar/Kayanew-draco.glb');
        BABYLON.SceneLoader.Append('/avatar/', 'Kayanew-draco.glb', scene2, () => {
          console.log('✅ GLB (Draco) erfolgreich geladen!');
          setIsLoading(false);
        }, (progressEvent3) => {
          if (progressEvent3.loaded && progressEvent3.total) {
            const percent3 = Math.round((progressEvent3.loaded / progressEvent3.total) * 100);
            setLoadingProgress(percent3);
            console.log(`📦 Loading GLB (Draco): ${percent3}%`);
          }
        }, (scene3, message3, exception3) => {
          console.error('❌ GLB Loading Fehler (alle Varianten):', message3, exception3);
          setIsLoading(false);
          setLoadingProgress(0);
          setLoadingFailed(true);
        });
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

  // Exakte Audio-Synchronisation: Event-Listener für audioPlayStart/audioPlayEnd
  useEffect(() => {
    const handleAudioStart = (event: CustomEvent) => {
      console.log('🎵 Audio-Start Event empfangen:', event.detail);
      if (!avatarReadyRef.current || !lipsyncEngineRef.current) return;

      // Timeline vorhanden → starte Lipsync mit exakter Startzeit
      if (bufferedTimelineRef.current.length > 0) {
        console.log('✅ Timeline-Lipsync gestartet (exakte Sync):', bufferedTimelineRef.current.length, 'Segmente');
        lipsyncEngineRef.current.start(bufferedTimelineRef.current);
      } else {
        // Keine Timeline → starte Amplitude-Fallback
        console.log('⚠️ Keine Timeline - Amplitude-Fallback aktiviert');
      }
    };

    const handleAudioEnd = (event: CustomEvent) => {
      console.log('🎵 Audio-End Event empfangen:', event.detail);
      if (lipsyncEngineRef.current) {
        lipsyncEngineRef.current.stop();
      }
      // Amplitude-Fallback stoppen wird in eigenem useEffect behandelt
    };

    window.addEventListener('audioPlayStart', handleAudioStart as EventListener);
    window.addEventListener('audioPlayEnd', handleAudioEnd as EventListener);

    return () => {
      window.removeEventListener('audioPlayStart', handleAudioStart as EventListener);
      window.removeEventListener('audioPlayEnd', handleAudioEnd as EventListener);
    };
  }, []);

  // Lipsync: Start bei isSpeaking (wenn Avatar ready) - auch ohne Timeline!
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

    // Falls Audio-Events nicht gefeuert wurden (Fallback)
    if (isSpeaking) {
      if (bufferedTimelineRef.current.length > 0) {
        // Timeline vorhanden → realistisches Lipsync
        console.log('✅ Timeline-Lipsync gestartet:', bufferedTimelineRef.current.length, 'Segmente');
        lipsyncEngineRef.current.start(bufferedTimelineRef.current);
      } else {
        // Keine Timeline → Fallback: Avatar "spricht" sichtbar (Idle intensiviert)
        console.log('⚠️ Keine Timeline - Fallback aktiv (Avatar reagiert auf Audio mit Micro-Motion)');
        // Micro-Motion wird durch isSpeaking bereits intensiviert (siehe useEffect für Micro-Motion)
      }
    } else {
      console.log('🛑 Stoppe Lipsync (Audio beendet)');
      lipsyncEngineRef.current.stop();
    }

    return () => {
      if (lipsyncEngineRef.current && !isSpeaking) {
        console.log('🎭 Lipsync cleanup (isSpeaking=false)');
        lipsyncEngineRef.current.stop();
      }
    };
  }, [isSpeaking]);

  // Amplitude-Fallback: Animiert Jaw/MouthOpen basierend auf Audio-Amplitude
  useEffect(() => {
    if (!isSpeaking || !amplitudeFallbackTargetRef.current) {
      // Stoppe Fallback-Animation
      if (amplitudeFallbackAnimationFrameRef.current !== null) {
        cancelAnimationFrame(amplitudeFallbackAnimationFrameRef.current);
        amplitudeFallbackAnimationFrameRef.current = null;
      }
      // Reset MorphTarget
      if (amplitudeFallbackTargetRef.current) {
        amplitudeFallbackTargetRef.current.influence = 0;
      }
      return;
    }

    // Nur aktivieren, wenn keine Timeline vorhanden ist
    if (bufferedTimelineRef.current.length > 0) {
      return; // Timeline hat Priorität
    }

    // Amplitude-basierte Animation starten
    const animateAmplitude = () => {
      if (!isSpeaking || !amplitudeFallbackTargetRef.current) {
        amplitudeFallbackAnimationFrameRef.current = null;
        return;
      }

      const amplitude = audioManager.audioAmplitude || 0;
      
      // Sanftes Easing (exponentielles Glätten) für natürlichere Bewegung
      const currentInfluence = amplitudeFallbackTargetRef.current.influence || 0;
      const targetInfluence = Math.max(0, Math.min(1, amplitude * 1.5)); // Multiplikator für Sichtbarkeit
      const smoothed = currentInfluence * 0.7 + targetInfluence * 0.3; // Easing-Faktor

      amplitudeFallbackTargetRef.current.influence = smoothed;

      // Debug-Info aktualisieren
      if (showDebugOverlay) {
        setDebugInfo(prev => ({
          ...prev,
          amplitude: amplitude,
          mappedMorph: amplitudeFallbackTargetRef.current?.name || 'fallback',
          influence: smoothed
        }));
      }

      // Warnung bei dauerhaft 0 Influence (nur einmal loggen)
      if (smoothed < 0.01 && isSpeaking) {
        const lastWarning = (window as any).__kayaAmplitudeWarning;
        if (!lastWarning || Date.now() - lastWarning > 5000) {
          console.warn('⚠️ Amplitude-Fallback: Influence bleibt bei 0 (Audio möglicherweise stumm)');
          (window as any).__kayaAmplitudeWarning = Date.now();
        }
      }

      amplitudeFallbackAnimationFrameRef.current = requestAnimationFrame(animateAmplitude);
    };

    amplitudeFallbackAnimationFrameRef.current = requestAnimationFrame(animateAmplitude);

    return () => {
      if (amplitudeFallbackAnimationFrameRef.current !== null) {
        cancelAnimationFrame(amplitudeFallbackAnimationFrameRef.current);
        amplitudeFallbackAnimationFrameRef.current = null;
      }
    };
  }, [isSpeaking, audioManager.audioAmplitude, showDebugOverlay]);

  // Debug-Info aktualisieren (für Overlay)
  useEffect(() => {
    if (!showDebugOverlay) return;

    const updateDebugInfo = () => {
      setDebugInfo({
        currentViseme: 'N/A', // Wird von LipsyncEngine gesetzt (später erweitern)
        mappedMorph: amplitudeFallbackTargetRef.current?.name || 'none',
        influence: amplitudeFallbackTargetRef.current?.influence || 0,
        amplitude: audioManager.audioAmplitude || 0,
        timelineLength: bufferedTimelineRef.current.length
      });
    };

    const interval = setInterval(updateDebugInfo, 100); // 10fps für Debug
    return () => clearInterval(interval);
  }, [showDebugOverlay, audioManager.audioAmplitude]);

  // Toggle Debug-Overlay mit Tastenkombination (Strg+D in Entwicklung)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setShowDebugOverlay(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      
      // Intensivere Bewegung während isSpeaking
      const intensity = isSpeaking ? 3.0 : 1.0;
      const headNod = isSpeaking ? Math.sin(t * 2) * BABYLON.Tools.ToRadians(0.3) : 0;
      
      const microYaw = Math.sin(t * 0.33) * BABYLON.Tools.ToRadians(0.6 * intensity);
      const microPitch = headNod + Math.sin(t * 0.27) * BABYLON.Tools.ToRadians(0.4 * intensity);
      
      pivotNode.rotation.y = baseYaw + microYaw;
      pivotNode.rotation.x = microPitch;
    });

    return () => {
      scene.onBeforeRenderObservable.remove(obs);
    };
  }, [isSpeaking]);

  // Emotion: Avatar-Mimik + Glow anpassen
  useEffect(() => {
    if (!emotionMapperRef.current) {
      console.warn('⚠️ EmotionMapper nicht initialisiert');
      return;
    }

    console.log('😊 Emotion Update für Avatar:', emotion, emotionConfidence, '%');
    emotionMapperRef.current.applyEmotion(emotion, emotionConfidence).catch(err => {
      console.error('❌ Emotion-Anwendung fehlgeschlagen:', err);
    });
  }, [emotion, emotionConfidence]);

  // Glow-Effekt: Wenn Avatar spricht (zusätzlich zur Emotion)
  useEffect(() => {
    if (!glowLayerRef.current || !meshRef.current) return;

    if (isSpeaking) {
      // Glow während des Sprechens intensivieren
      const currentIntensity = glowLayerRef.current.intensity;
      glowLayerRef.current.intensity = Math.min(currentIntensity + 0.2, 1.0);
      glowLayerRef.current.addIncludedOnlyMesh(meshRef.current as BABYLON.Mesh);
      console.log('✨ Glow-Effekt aktiviert (Sprechen)');
    } else {
      // Glow bleibt auf Emotion-Level (wird von EmotionMapper gesetzt)
      console.log('✨ Glow-Effekt auf Emotion-Level zurückgesetzt');
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

      {/* Debug-Overlay (nur in Development, Strg+D zum Toggle) */}
      {process.env.NODE_ENV === 'development' && showDebugOverlay && (
        <div className="absolute top-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg font-mono z-50 max-w-xs">
          <div className="font-bold mb-2 text-yellow-400">🐛 Debug Info</div>
          <div className="space-y-1">
            <div>
              <span className="text-gray-400">Viseme:</span>{' '}
              <span className="text-white">{debugInfo.currentViseme}</span>
            </div>
            <div>
              <span className="text-gray-400">Morph:</span>{' '}
              <span className="text-white">{debugInfo.mappedMorph}</span>
            </div>
            <div>
              <span className="text-gray-400">Influence:</span>{' '}
              <span className="text-green-400">{(debugInfo.influence * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Amplitude:</span>{' '}
              <span className="text-blue-400">{(debugInfo.amplitude * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Timeline:</span>{' '}
              <span className="text-purple-400">{debugInfo.timelineLength} Segmente</span>
            </div>
            <div>
              <span className="text-gray-400">isSpeaking:</span>{' '}
              <span className={isSpeaking ? 'text-green-400' : 'text-red-400'}>
                {isSpeaking ? 'Ja' : 'Nein'}
              </span>
            </div>
            {lipsyncEngineRef.current && (
              <div>
                <span className="text-gray-400">Lipsync:</span>{' '}
                <span className={lipsyncEngineRef.current.isRunning ? 'text-green-400' : 'text-gray-500'}>
                  {lipsyncEngineRef.current.isRunning ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500 border-t border-gray-700 pt-2">
            Strg+D zum Ausblenden
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with React.memo to prevent infinite re-renders
export const BabylonAvatar = React.memo(
  BabylonAvatarComponent,
  (prev, next) => {
    // Only re-render if critical props changed
    return (
      prev.isSpeaking === next.isSpeaking &&
      prev.emotion === next.emotion &&
      prev.emotionConfidence === next.emotionConfidence &&
      prev.visemeTimeline === next.visemeTimeline
    );
  }
);

