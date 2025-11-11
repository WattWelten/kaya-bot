/**
 * AvatarCamera Component
 * Handles camera positioning and framing
 */

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface AvatarCameraProps {
  scene: BABYLON.Scene;
  pivot: BABYLON.TransformNode;
  cameraConfig?: {
    fovDeg?: number;
    padding?: number;
    eyeLine?: number;
    betaMin?: number;
    betaMax?: number;
    yawDeg?: number;
  };
}

const DEFAULT_CONFIG = {
  fovDeg: 26,
  padding: 1.05,
  eyeLine: 0.62,
  betaMin: 65,
  betaMax: 82,
  yawDeg: 0,
};

export function AvatarCamera({
  scene,
  pivot,
  cameraConfig = {},
}: AvatarCameraProps) {
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const config = { ...DEFAULT_CONFIG, ...cameraConfig };

  useEffect(() => {
    if (!scene || !pivot) return;

    const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
    if (!camera || !(camera instanceof BABYLON.ArcRotateCamera)) {
      return;
    }

    cameraRef.current = camera;

    // Frame avatar
    const frameAvatar = () => {
      if (!pivot || !camera) return;

      pivot.computeWorldMatrix(true);
      const { min, max } = (pivot as any).getHierarchyBoundingVectors(true);
      const size = max.subtract(min);
      const h = size.y;

      const vFov = BABYLON.Tools.ToRadians(config.fovDeg);
      const aspect =
        scene.getEngine().getRenderWidth() /
        scene.getEngine().getRenderHeight();
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const r = max.subtract(min).length() * 0.5;
      const dist = (r * config.padding) / Math.sin(Math.min(vFov, hFov) / 2);

      const pivotWorldMatrix = pivot.getWorldMatrix();
      const pivotWorldPosition = BABYLON.Vector3.TransformCoordinates(
        BABYLON.Vector3.Zero(),
        pivotWorldMatrix
      );

      const eyeLineOffset = h * (config.eyeLine - 0.5);
      const finalTarget = pivotWorldPosition.add(
        new BABYLON.Vector3(0, eyeLineOffset, 0)
      );

      const pivotForward = new BABYLON.Vector3(0, 0, 1);
      const pivotRotation = pivot.rotation;
      const pivotRotationMatrix = BABYLON.Matrix.RotationYawPitchRoll(
        pivotRotation.y,
        pivotRotation.x,
        pivotRotation.z
      );

      const worldForward = BABYLON.Vector3.TransformNormal(
        pivotForward,
        pivotRotationMatrix
      );

      const cameraPos = finalTarget.add(worldForward.scale(dist));
      const v = cameraPos.subtract(finalTarget);

      const alpha = Math.atan2(v.x, v.z) + BABYLON.Tools.ToRadians(config.yawDeg);
      const beta = Math.atan2(v.y, Math.sqrt(v.x * v.x + v.z * v.z));

      camera.setTarget(finalTarget);
      camera.alpha = alpha;
      camera.beta = Math.max(
        BABYLON.Tools.ToRadians(config.betaMin),
        Math.min(BABYLON.Tools.ToRadians(config.betaMax), beta)
      );
      camera.radius = dist;
    };

    frameAvatar();

    // Update on scene changes
    const observer = scene.onBeforeRenderObservable.add(() => {
      frameAvatar();
    });

    return () => {
      scene.onBeforeRenderObservable.remove(observer);
    };
  }, [scene, pivot, config]);

  return null;
}

