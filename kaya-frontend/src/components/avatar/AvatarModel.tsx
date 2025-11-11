/**
 * AvatarModel Component
 * Handles GLB model loading and management
 */

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface AvatarModelProps {
  scene: BABYLON.Scene;
  modelPath: string;
  onModelLoaded: (mesh: BABYLON.AbstractMesh) => void;
  onError: (error: Error) => void;
}

export function AvatarModel({
  scene,
  modelPath,
  onModelLoaded,
  onError,
}: AvatarModelProps) {
  const meshRef = useRef<BABYLON.AbstractMesh | null>(null);

  useEffect(() => {
    if (!scene) return;

    let loading = true;
    const timeout = setTimeout(() => {
      if (loading) {
        loading = false;
        onError(new Error('Avatar loading timeout'));
      }
    }, 10000); // 10 second timeout

    BABYLON.SceneLoader.ImportMesh(
      '',
      modelPath,
      '',
      scene,
      (meshes) => {
        if (!loading) return;
        loading = false;
        clearTimeout(timeout);

        if (meshes.length === 0) {
          onError(new Error('No meshes loaded'));
          return;
        }

        const rootMesh = meshes[0];
        meshRef.current = rootMesh;
        onModelLoaded(rootMesh);
      },
      undefined,
      (error) => {
        if (!loading) return;
        loading = false;
        clearTimeout(timeout);
        onError(error);
      }
    );

    return () => {
      loading = false;
      clearTimeout(timeout);
      if (meshRef.current) {
        meshRef.current.dispose();
      }
    };
  }, [scene, modelPath, onModelLoaded, onError]);

  return null;
}

