import React, { useEffect, useState, memo } from 'react';
import { useLipSync } from '@/hooks/useLipSync';
import { AvatarPaneProps } from '@/types';
import { ErrorBoundary } from './ErrorBoundary';
import { BabylonAvatar } from './BabylonAvatar';
import { EmotionType } from '@/services/EmotionMapper';
import { VisemeSegment } from '@/services/LipsyncEngine';

const AvatarPaneComponent: React.FC<AvatarPaneProps> = ({
  isSpeaking,
  captionText,
  setIsSpeaking,
  onEmotionChange,
  emotion = 'neutral',
  emotionConfidence = 50,
  visemeTimeline = []
}) => {
  const { visemes } = useLipSync(null, isSpeaking);

  return (
    <>
      {/* Babylon.js Avatar - Vollbild */}
      <ErrorBoundary>
        <BabylonAvatar 
          isSpeaking={isSpeaking}
          emotion={emotion}
          emotionConfidence={emotionConfidence}
          visemeTimeline={visemeTimeline}
        />
      </ErrorBoundary>

      {/* Avatar Shadow */}
      <div className="avatar-shadow" aria-hidden="true" />

      {/* Live Captions - über Avatar */}
      {isSpeaking && captionText && (
        <div 
          aria-live="polite" 
          className="absolute left-4 right-4 top-[70%] text-sm text-lc-neutral-800 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg z-10"
        >
          {captionText}
        </div>
      )}
    </>
  );
};

// Performance: AvatarPane mit memo + useCallback optimiert
export const AvatarPane = React.memo(AvatarPaneComponent);
AvatarPane.displayName = 'AvatarPane';
