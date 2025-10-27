import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface Avatar3DProps {
  modelPath: string;
  isSpeaking: boolean;
  emotion?: 'neutral' | 'happy' | 'concerned' | 'speaking';
  visemes?: number[];
}

export function Avatar3D({ modelPath, isSpeaking, emotion = 'neutral', visemes }: Avatar3DProps) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(modelPath);
  
  // Fallback für fehlende Animationen (verhindert undefined-Fehler)
  const animations = gltf.animations || [];
  const scene = gltf.scene;
  
  const { actions } = useAnimations(animations, group);
  
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  
  // Safety check
  if (!scene) {
    console.error('❌ Scene not loaded');
    return <mesh />;
  }

  // Animation basierend auf Zustand
  useEffect(() => {
    if (actions) {
      // Stop all animations first
      Object.values(actions).forEach(action => action?.stop());
      
      if (isSpeaking && actions['speaking']) {
        actions['speaking'].play();
        actions['speaking'].setEffectiveTimeScale(1);
      } else if (actions['idle']) {
        actions['idle'].play();
        actions['idle'].setEffectiveTimeScale(1);
      }
    }
  }, [isSpeaking, actions]);

  // Lippensynchronisation (Morph Targets)
  useEffect(() => {
    if (visemes && scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh && child.morphTargetInfluences) {
          visemes.forEach((value, index) => {
            if (child.morphTargetInfluences && child.morphTargetInfluences[index] !== undefined) {
              child.morphTargetInfluences[index] = value;
            }
          });
        }
      });
    }
  }, [visemes, scene]);

  // Idle-Animation (leichtes Atmen)
  useFrame((state) => {
    if (group.current && !isSpeaking) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={1.5} position={[0, -1, 0]} />
    </group>
  );
}

// Preload GLB für schnelleres Laden
useGLTF.preload('/avatar/kaya.glb');

