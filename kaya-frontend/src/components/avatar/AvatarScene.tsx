/**
 * AvatarScene Component
 * Handles Babylon.js scene initialization and management
 */

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface AvatarSceneProps {
  onSceneReady: (scene: BABYLON.Scene) => void;
  onError: (error: Error) => void;
}

export function AvatarScene({ onSceneReady, onError }: AvatarSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Create engine
      const engine = new BABYLON.Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      engineRef.current = engine;

      // Create scene
      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Enable shadows
      scene.shadowsEnabled = true;

      // Create lighting
      const light = new BABYLON.HemisphericLight(
        'light',
        new BABYLON.Vector3(0, 1, 0),
        scene
      );
      light.intensity = 0.8;

      // Create camera (will be positioned by AvatarCamera)
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        0,
        Math.PI / 3,
        5,
        BABYLON.Vector3.Zero(),
        scene
      );
      camera.attachControls(canvasRef.current, true);

      // Handle resize
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      // Render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      // Notify parent
      onSceneReady(scene);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        scene.dispose();
        engine.dispose();
      };
    } catch (error) {
      onError(error as Error);
    }
  }, [onSceneReady, onError]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

