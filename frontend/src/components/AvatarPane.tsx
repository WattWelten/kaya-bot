import React, { useEffect, useState } from 'react';
import { Volume2, History } from 'lucide-react';
import { useUnity } from '@/hooks/useUnity';
import { AvatarPaneProps } from '@/types';

export const AvatarPane: React.FC<AvatarPaneProps> = ({
  isSpeaking,
  captionText,
  setIsSpeaking,
  onEmotionChange
}) => {
  const { 
    unity, 
    isLoaded, 
    isLoading, 
    setEmotion, 
    setSpeaking, 
    playGesture, 
    playAnimation,
    error,
    initialize 
  } = useUnity('unity-canvas');

  const [isInitialized, setIsInitialized] = useState(false);

  // Unity initialisieren
  useEffect(() => {
    // Unity-Avatar aktiviert - bereit für Build
    console.log('Unity-Avatar bereit für Initialisierung');
    
    if (!isInitialized && !isLoading && !isLoaded) {
      initialize().then(() => {
        setIsInitialized(true);
        console.log('✅ Unity-Avatar erfolgreich initialisiert');
      }).catch((err) => {
        console.error('❌ Unity-Initialisierung fehlgeschlagen:', err);
        // Fallback: Avatar als statisches Bild anzeigen
        setIsInitialized(true);
      });
    }
  }, [initialize, isInitialized, isLoading, isLoaded]);

  // Sprechen-Status an Unity weiterleiten
  useEffect(() => {
    if (isLoaded) {
      setSpeaking(isSpeaking);
      
      // Emotion basierend auf Sprechen-Status setzen
      if (isSpeaking) {
        setEmotion('speaking', 0.8);
        playAnimation('speaking');
      } else {
        setEmotion('neutral', 0.5);
        playAnimation('idle');
      }
    }
  }, [isSpeaking, isLoaded, setSpeaking, setEmotion, playAnimation]);

  // Emotion-Änderungen an Parent weiterleiten
  useEffect(() => {
    if (onEmotionChange && isLoaded) {
      // Beispiel: Emotion basierend auf Caption-Text analysieren
      if (captionText.includes('Hilfe') || captionText.includes('Problem')) {
        setEmotion('concerned', 0.7);
        onEmotionChange('concerned', 0.7);
      } else if (captionText.includes('Danke') || captionText.includes('Perfekt')) {
        setEmotion('happy', 0.8);
        onEmotionChange('happy', 0.8);
      }
    }
  }, [captionText, onEmotionChange, isLoaded, setEmotion]);

  const handleAudioToggle = () => {
    setIsSpeaking(!isSpeaking);
  };

  const handleHistoryToggle = () => {
    // TODO: Verlauf anzeigen/ausblenden
    console.log('Verlauf umschalten');
  };

  return (
    <section 
      aria-label="Avatar Bereich" 
      className="relative bg-gradient-to-b from-lc-neutral-100 to-lc-neutral-100 md:h-[calc(100svh-4rem)] h-[60svh] overflow-hidden"
    >
      {/* Unity Canvas */}
      <div className="absolute inset-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-lc-neutral-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lc-primary-600 mx-auto mb-4"></div>
              <p className="text-sm text-lc-neutral-600">KAYA wird geladen...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-lc-neutral-100">
            <div className="text-center p-6">
              <div className="text-lc-neutral-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-lc-neutral-800 mb-2">
                Avatar nicht verfügbar
              </h3>
              <p className="text-sm text-lc-neutral-600 mb-4">
                {error.message}
              </p>
              <button
                onClick={() => initialize()}
                className="btn-solid"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )}
        
        <canvas 
          id="unity-canvas" 
          className="w-full h-full block"
          style={{ display: isLoaded ? 'block' : 'none' }}
        />
      </div>

      {/* Overlay Speech Controls */}
      <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 flex items-center justify-between">
        {/* Begrüßungstext */}
        <div className="px-3 py-2 rounded-2xl bg-white/75 backdrop-blur border border-white/60 shadow-soft max-w-[80%]">
          <p className="text-sm text-lc-neutral-800">
            Moin! Ich bin KAYA. Wobei kann ich Ihnen helfen?
          </p>
        </div>

        {/* Steuerungsbuttons */}
        <div className="flex items-center gap-2">
          <button
            className="btn-solid"
            aria-label={isSpeaking ? "Audio stoppen" : "Audio vorlesen"}
            onClick={handleAudioToggle}
          >
            <Volume2 className="size-5" />
          </button>
          <button
            className="btn-ghost"
            aria-label="Verlauf ausblenden"
            onClick={handleHistoryToggle}
          >
            <History className="size-5" />
          </button>
        </div>
      </div>

      {/* Live Captions */}
      {isSpeaking && (
        <div 
          aria-live="polite" 
          className="absolute left-4 right-4 bottom-20 md:bottom-24 text-sm text-lc-neutral-800 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-soft"
        >
          {captionText || 'Ich lese Ihnen die nächsten Schritte vor …'}
        </div>
      )}

      {/* Status-Indikator */}
      <div className="absolute top-4 right-4">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isLoaded ? 'bg-green-100 text-green-800' : 
          isLoading ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {isLoaded ? 'Online' : isLoading ? 'Lädt...' : 'Offline'}
        </div>
      </div>
    </section>
  );
};
