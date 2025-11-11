/**
 * AvatarEmotion Component
 * Handles emotion-based facial expressions
 */

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface AvatarEmotionProps {
  mesh: BABYLON.AbstractMesh;
  emotion: string;
  emotionConfidence: number;
}

const EMOTION_MORPH_TARGETS: Record<string, string[]> = {
  happy: ['smile', 'happy', 'joy'],
  sad: ['sad', 'frown', 'unhappy'],
  angry: ['angry', 'frown', 'mad'],
  surprised: ['surprised', 'shock', 'wide'],
  fearful: ['fear', 'worried', 'anxious'],
  disgusted: ['disgust', 'disgusted'],
  neutral: ['neutral', 'default'],
};

export function AvatarEmotion({
  mesh,
  emotion,
  emotionConfidence,
}: AvatarEmotionProps) {
  const previousEmotionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mesh) return;

    const morphTargetManager = mesh.morphTargetManager;
    if (!morphTargetManager) {
      console.warn('No morph target manager for emotions');
      return;
    }

    // Find emotion targets
    const emotionTargets = EMOTION_MORPH_TARGETS[emotion] || ['neutral'];
    const intensity = emotionConfidence / 100;

    // Reset previous emotion
    if (previousEmotionRef.current && previousEmotionRef.current !== emotion) {
      const prevTargets = EMOTION_MORPH_TARGETS[previousEmotionRef.current] || [];
      for (const targetName of prevTargets) {
        for (let i = 0; i < morphTargetManager.numTargets; i++) {
          const target = morphTargetManager.getTarget(i);
          if (target?.name?.toLowerCase().includes(targetName.toLowerCase())) {
            BABYLON.Animation.CreateAndStartAnimation(
              `reset_${targetName}`,
              morphTargetManager,
              `targets[${i}].influence`,
              30,
              10,
              target.influence,
              0,
              BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
          }
        }
      }
    }

    // Apply new emotion
    for (const targetName of emotionTargets) {
      for (let i = 0; i < morphTargetManager.numTargets; i++) {
        const target = morphTargetManager.getTarget(i);
        if (target?.name?.toLowerCase().includes(targetName.toLowerCase())) {
          BABYLON.Animation.CreateAndStartAnimation(
            `emotion_${targetName}`,
            morphTargetManager,
            `targets[${i}].influence`,
            30,
            10,
            target.influence,
            intensity,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );
        }
      }
    }

    previousEmotionRef.current = emotion;
  }, [mesh, emotion, emotionConfidence]);

  return null;
}

