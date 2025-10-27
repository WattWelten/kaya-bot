import React, { Suspense, memo, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Avatar3D } from './Avatar3D';
import * as THREE from 'three';

interface AvatarCanvasProps {
  isSpeaking: boolean;
  emotion?: 'neutral' | 'happy' | 'concerned' | 'speaking';
  visemes?: number[];
}

// Loading Fallback für GLB Loading
function AvatarLoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color="#0066cc" />
    </mesh>
  );
}

function AvatarCanvasComponent({ isSpeaking, emotion, visemes }: AvatarCanvasProps) {
  // Mobile Detection mit useMemo
  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' && (
      window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  }, []);
  
  // Performance-basiertes DPR (Tuple Type für Canvas)
  const dpr = useMemo<[number, number]>(() => {
    return isMobile ? [0.75, 1] : [1, 2];
  }, [isMobile]);
  
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ 
          antialias: !isMobile, // Kein Antialiasing auf Mobile
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={dpr}
        shadows={!isMobile} // Schatten nur auf Desktop
      >
        <Suspense fallback={<AvatarLoadingFallback />}>
          {/* Beleuchtung */}
          <ambientLight intensity={0.5} />
          
          {/* Conditional Shadow-Casting für Performance */}
          {!isMobile && (
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          )}
          {isMobile && (
            <directionalLight position={[5, 5, 5]} intensity={1} />
          )}
          
          <pointLight position={[-5, 5, -5]} intensity={0.5} />

          {/* Environment Map nur auf Desktop */}
          {!isMobile && <Environment preset="studio" />}

          {/* KAYA Avatar */}
          <Avatar3D 
            modelPath="/avatar/kaya.glb"
            isSpeaking={isSpeaking}
            emotion={emotion}
            visemes={visemes}
          />

          {/* Kamera-Steuerung (optional, für Debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <OrbitControls 
              enableZoom={false} 
              enablePan={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 2}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

// Performance: AvatarCanvas mit memo (Three.js re-renders sind teuer)
export const AvatarCanvas = memo(AvatarCanvasComponent);
AvatarCanvas.displayName = 'AvatarCanvas';
