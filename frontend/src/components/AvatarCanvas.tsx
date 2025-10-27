import React, { Suspense, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Avatar3D } from './Avatar3D';

interface AvatarCanvasProps {
  isSpeaking: boolean;
  emotion?: 'neutral' | 'happy' | 'concerned' | 'speaking';
  visemes?: number[];
}

function AvatarCanvasComponent({ isSpeaking, emotion, visemes }: AvatarCanvasProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Beleuchtung */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />

          {/* Environment Map für Reflektionen */}
          <Environment preset="studio" />

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
