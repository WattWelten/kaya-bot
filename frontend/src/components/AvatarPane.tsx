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
      className="relative bg-gradient-to-b from-lc-primary-50/40 to-lc-neutral-50/60 md:h-[calc(100svh-4rem)] h-[60svh] overflow-hidden backdrop-blur-sm"
    >
      {/* Unity Canvas / Placeholder */}
      <div className="absolute inset-0">
        {/* Illustrierter KAYA-Placeholder */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          {/* Hintergrund-Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#26A69A" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Zentrale Illustration */}
          <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
            {/* KAYA Icon - Abstrakte Windmühle/Natur-Symbol mit Gold-Akzent */}
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-lc-primary-500 via-lc-primary-600 to-lc-gold-500 flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.4)] border-2 border-white/30 animate-pulse-soft">
                <svg viewBox="0 0 200 200" className="w-32 h-32 text-white">
                  <g className="animate-spin" style={{ animationDuration: '20s' }}>
                    {/* Windmühlen-Flügel (stilisiert) */}
                    <ellipse cx="100" cy="40" rx="15" ry="35" fill="currentColor" opacity="0.9"/>
                    <ellipse cx="160" cy="100" rx="35" ry="15" fill="currentColor" opacity="0.9"/>
                    <ellipse cx="100" cy="160" rx="15" ry="35" fill="currentColor" opacity="0.9"/>
                    <ellipse cx="40" cy="100" rx="35" ry="15" fill="currentColor" opacity="0.9"/>
                  </g>
                  {/* Zentrum */}
                </svg>
              </div>
              
              {/* Glow-Effekt mit Gold */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-lc-primary-400 via-lc-gold-400 to-lc-primary-600 blur-3xl opacity-30 animate-pulse-soft" style={{ animationDelay: '1s' }}/>
            </div>

            {/* KAYA Branding */}
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-bold text-lc-primary-700 tracking-tight">
                KAYA
              </h2>
              <p className="text-lg text-lc-neutral-600 font-medium">
                Deine digitale Assistentin
              </p>
              <p className="text-sm text-lc-neutral-500 max-w-xs mx-auto leading-relaxed">
                Landkreis Oldenburg · Immer für dich da
              </p>
            </div>

            {/* Status-Indikator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-lc-primary-200 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
              <span className="text-sm text-lc-neutral-700 font-medium">Bereit für deine Fragen</span>
            </div>
          </div>

          {/* Dekorative Elemente - Regionale Symbole */}
          <div className="absolute bottom-8 left-8 opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>
            <svg width="60" height="60" viewBox="0 0 60 60" className="text-lc-primary-500">
              {/* Stilisiertes Baum-Symbol */}
              <circle cx="30" cy="45" r="3" fill="currentColor"/>
              <rect x="28" y="30" width="4" height="15" fill="currentColor"/>
              <path d="M30 10 L20 25 L40 25 Z" fill="currentColor" opacity="0.8"/>
              <path d="M30 18 L22 30 L38 30 Z" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>

          <div className="absolute top-16 right-12 opacity-20 animate-float" style={{ animationDelay: '1.2s' }}>
            <svg width="50" height="50" viewBox="0 0 50 50" className="text-lc-primary-400">
              {/* Stilisierte Welle (für Nordsee-Nähe) */}
              <path d="M0 25 Q10 15, 20 25 T40 25 T60 25" stroke="currentColor" strokeWidth="3" fill="none"/>
              <path d="M0 32 Q10 22, 20 32 T40 32 T60 32" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
            </svg>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lc-primary-600 mx-auto mb-4"></div>
              <p className="text-sm text-lc-neutral-600">KAYA wird geladen...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-lc-primary-50 to-lc-neutral-50">
            <div className="text-center p-8 animate-pulse-soft">
              {/* Norddeutscher Humor Icon */}
              <div className="text-7xl mb-6 animate-bounce">
                ☕
              </div>
              
              {/* Norddeutscher Humor Text */}
              <h3 className="text-2xl font-bold text-lc-primary-700 mb-4">
                Moin! Avatar macht grad Pause
              </h3>
              
              <p className="text-base text-lc-neutral-700 mb-6 max-w-md mx-auto leading-relaxed">
                Kein Stress – im Chat bin ich trotzdem für dich da! 👇<br/>
                Schreib mir einfach unten.
              </p>
              
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full border-2 border-lc-primary-300 shadow-sm animate-pulse">
                  <span className="text-2xl">💬</span>
                  <p className="text-sm font-semibold text-lc-primary-700">
                    Dat kriegen wir auch so hin!
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => initialize()}
                className="mt-6 px-4 py-2 text-sm text-lc-neutral-500 hover:text-lc-primary-600 transition-colors"
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
