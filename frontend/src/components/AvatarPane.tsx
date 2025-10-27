import React, { useEffect, useState, Suspense, lazy, memo, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { useLipSync } from '@/hooks/useLipSync';
import { AvatarPaneProps } from '@/types';
import { ErrorBoundary } from './ErrorBoundary';

// Lazy-Load Three.js Canvas
const AvatarCanvas = lazy(() => import('./AvatarCanvas').then(m => ({ default: m.AvatarCanvas })));

// LoadingSpinner Component für verzögertes Avatar-Loading
function LoadingSpinner() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white/90">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lc-primary-600 mx-auto mb-4"></div>
        <p className="text-sm text-lc-neutral-600">KAYA Avatar lädt...</p>
      </div>
    </div>
  );
}

const AvatarPaneComponent: React.FC<AvatarPaneProps> = ({
  isSpeaking,
  captionText,
  setIsSpeaking,
  onEmotionChange
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<'neutral' | 'happy' | 'concerned' | 'speaking'>('neutral');
  
  // Verzögere Avatar-Loading um React-Initialisierung sicherzustellen
  const [shouldLoadAvatar, setShouldLoadAvatar] = useState(false);
  
  const { visemes, isAnalyzing } = useLipSync(audioUrl, isSpeaking);

  // Delayed Avatar Loading: Nach 500ms Avatar laden (React ist dann initialisiert)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadAvatar(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (captionText.includes('Hilfe') || captionText.includes('Problem')) {
      setEmotion('concerned');
      onEmotionChange?.('concerned', 0.7);
    } else if (captionText.includes('Danke') || captionText.includes('Perfekt')) {
      setEmotion('happy');
      onEmotionChange?.('happy', 0.8);
    } else if (isSpeaking) {
      setEmotion('speaking');
    } else {
      setEmotion('neutral');
    }
  }, [captionText, isSpeaking, onEmotionChange]);

  const handleAudioToggle = useCallback(() => {
    setIsSpeaking(!isSpeaking);
  }, [isSpeaking, setIsSpeaking]);

  return (
    <section 
      aria-label="Avatar Bereich" 
      className="relative bg-gradient-to-b from-lc-primary-50/40 to-lc-neutral-50/60 md:h-[calc(100svh-4rem)] h-[60svh] overflow-hidden"
    >
      {/* Three.js Canvas - Delayed Loading */}
      <div className="absolute inset-0">
        <ErrorBoundary>
          {shouldLoadAvatar ? (
            <Suspense fallback={<LoadingSpinner />}>
              <AvatarCanvas 
                isSpeaking={isSpeaking}
                emotion={emotion}
                visemes={visemes}
              />
            </Suspense>
          ) : (
            <LoadingSpinner />
          )}
        </ErrorBoundary>
      </div>

      {/* Overlay: Begrüßungstext & Controls */}
      <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 flex items-center justify-between">
        <div className="px-3 py-2 rounded-2xl bg-white/75 backdrop-blur border border-white/60 shadow-soft max-w-[80%]">
          <p className="text-sm text-lc-neutral-800">
            Moin! Ich bin KAYA. Wobei kann ich Ihnen helfen?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-solid"
            aria-label={isSpeaking ? "Audio stoppen" : "Audio vorlesen"}
            onClick={handleAudioToggle}
          >
            <Volume2 className="size-5" />
          </button>
        </div>
      </div>

      {/* Live Captions */}
      {isSpeaking && (
        <div 
          aria-live="polite" 
          className="absolute left-4 right-4 bottom-20 md:bottom-24 text-sm text-lc-neutral-800 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-soft"
        >
          {captionText || 'Ich lese Ihnen die nächsten Schritte vor ...'}
        </div>
      )}

      {/* Status */}
      <div className="absolute top-4 right-4">
        <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {isAnalyzing ? 'Analysiere...' : 'Online'}
        </div>
      </div>
    </section>
  );
};

// Performance: AvatarPane mit memo + useCallback optimiert
export const AvatarPane = React.memo(AvatarPaneComponent);
AvatarPane.displayName = 'AvatarPane';
