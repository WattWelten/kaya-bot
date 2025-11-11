/**
 * AvatarLipsync Component
 * Handles viseme timeline and lip sync animation
 */

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { VisemeSegment } from '@/services/LipsyncEngine';

interface AvatarLipsyncProps {
  mesh: BABYLON.AbstractMesh;
  visemeTimeline?: VisemeSegment[];
  isSpeaking: boolean;
}

export function AvatarLipsync({
  mesh,
  visemeTimeline,
  isSpeaking,
}: AvatarLipsyncProps) {
  const animationRef = useRef<BABYLON.AnimationGroup | null>(null);
  const currentVisemeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mesh || !visemeTimeline || visemeTimeline.length === 0) {
      return;
    }

    // Find morph targets
    const morphTargetManager = mesh.morphTargetManager;
    if (!morphTargetManager) {
      console.warn('No morph target manager found');
      return;
    }

    // Map viseme names to morph targets
    const visemeMap: Record<string, BABYLON.MorphTarget> = {};
    for (let i = 0; i < morphTargetManager.numTargets; i++) {
      const target = morphTargetManager.getTarget(i);
      if (target) {
        const name = target.name?.toLowerCase() || '';
        visemeMap[name] = target;
      }
    }

    // Create animation group
    const animationGroup = new BABYLON.AnimationGroup('lipsync');
    const scene = mesh.getScene();

    let currentTime = 0;
    for (const segment of visemeTimeline) {
      const visemeName = segment.viseme.toLowerCase();
      const target = visemeMap[visemeName];

      if (!target) {
        console.warn(`Viseme target not found: ${visemeName}`);
        continue;
      }

      // Create animation for this viseme
      const animation = new BABYLON.Animation(
        `viseme_${segment.viseme}`,
        `morphTargetManager.targets[${morphTargetManager.getTargetIndex(target)}].influence`,
        60,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const keys = [
        { frame: currentTime, value: 0 },
        {
          frame: currentTime + (segment.start * 60) / 1000,
          value: segment.intensity || 1,
        },
        {
          frame: currentTime + (segment.end * 60) / 1000,
          value: segment.intensity || 1,
        },
        {
          frame: currentTime + (segment.end * 60) / 1000 + 1,
          value: 0,
        },
      ];

      animation.setKeys(keys);
      animationGroup.addTargetedAnimation(animation, morphTargetManager);
      currentTime = currentTime + (segment.end * 60) / 1000 + 1;
    }

    // Play animation
    animationGroup.play();
    animationRef.current = animationGroup;

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current.dispose();
      }
    };
  }, [mesh, visemeTimeline]);

  // Reset visemes when not speaking
  useEffect(() => {
    if (!isSpeaking && currentVisemeRef.current) {
      const morphTargetManager = mesh?.morphTargetManager;
      if (morphTargetManager) {
        for (let i = 0; i < morphTargetManager.numTargets; i++) {
          const target = morphTargetManager.getTarget(i);
          if (target) {
            target.influence = 0;
          }
        }
      }
      currentVisemeRef.current = null;
    }
  }, [isSpeaking, mesh]);

  return null;
}

