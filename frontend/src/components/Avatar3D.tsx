import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
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
  
  const scene = gltf.scene;
  const animations = gltf.animations || [];
  
  console.log(`📦 Avatar3D geladen: ${animations.length} Animationen gefunden`);
  
  // Safety check
  if (!scene) {
    console.error('❌ Scene not loaded');
    return <mesh />;
  }

  // ⚠️ KEINE useAnimations() - GLB hat keine Animationen!
  // Avatar verwendet stattdessen Morph Targets für Lipsync

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
