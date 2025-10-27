import React, { useEffect, useState, memo } from 'react';
import { useLipSync } from '@/hooks/useLipSync';
import { AvatarPaneProps } from '@/types';
import { ErrorBoundary } from './ErrorBoundary';
import { BabylonAvatar } from './BabylonAvatar';

const AvatarPaneComponent: React.FC<AvatarPaneProps> = ({
  isSpeaking,
  captionText,
  setIsSpeaking,
  onEmotionChange
}) => {
  const [emotion, setEmotion] = useState<'neutral' | 'happy' | 'concerned' | 'speaking'>('neutral');
  
  const { visemes } = useLipSync(null, isSpeaking);

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

  return (
    <section 
      aria-label="Avatar Bereich" 
      className="relative w-full h-full bg-gradient-to-b from-lc-primary-50/40 to-lc-neutral-50/60 overflow-hidden"
    >
      {/* Babylon.js Avatar - Vollbild */}
      <div className="absolute inset-0">
        <ErrorBoundary>
          <BabylonAvatar 
            isSpeaking={isSpeaking}
            emotion={emotion}
            visemes={visemes}
          />
        </ErrorBoundary>
      </div>

      {/* Live Captions - über Avatar */}
      {isSpeaking && captionText && (
        <div 
          aria-live="polite" 
          className="absolute left-4 right-4 top-[70%] text-sm text-lc-neutral-800 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg"
        >
          {captionText}
        </div>
      )}
    </section>
  );
};

// Performance: AvatarPane mit memo + useCallback optimiert
export const AvatarPane = React.memo(AvatarPaneComponent);
AvatarPane.displayName = 'AvatarPane';
