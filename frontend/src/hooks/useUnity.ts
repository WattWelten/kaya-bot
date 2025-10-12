import { useState, useEffect, useCallback, useRef } from 'react';
import { UnityService, getUnityService } from '@/services/UnityService';
import { UnityMessage, ErrorState } from '@/types';

export interface UseUnityReturn {
  unity: any;
  isLoaded: boolean;
  isLoading: boolean;
  sendUnityMessage: (message: UnityMessage) => void;
  setEmotion: (emotion: string, intensity?: number) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  playGesture: (gesture: string) => void;
  playAnimation: (animation: string) => void;
  error: ErrorState | null;
  initialize: () => Promise<void>;
}

export const useUnity = (canvasId: string = 'unity-canvas'): UseUnityReturn => {
  const [unity, setUnity] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  
  const unityServiceRef = useRef<UnityService | null>(null);

  // Unity-Service initialisieren
  useEffect(() => {
    const service = getUnityService();
    unityServiceRef.current = service;

    // Event-Listener hinzufügen
    const handleLoad = (loaded: boolean) => {
      setIsLoaded(loaded);
      setIsLoading(false);
      if (loaded) {
        setUnity(service);
        setError(null);
      }
    };

    const handleError = (error: ErrorState) => {
      setError(error);
      setIsLoading(false);
      setIsLoaded(false);
    };

    service.addLoadListener(handleLoad);
    service.addErrorListener(handleError);

    // Cleanup
    return () => {
      service.removeLoadListener(handleLoad);
      service.removeErrorListener(handleError);
    };
  }, []);

  // Unity initialisieren
  const initialize = useCallback(async () => {
    if (unityServiceRef.current && !isLoaded && !isLoading) {
      setIsLoading(true);
      setError(null);
      
      try {
        await unityServiceRef.current.initialize(canvasId);
      } catch (err) {
        console.error('❌ Unity-Initialisierung fehlgeschlagen:', err);
        setError({
          code: 'INITIALIZATION_FAILED',
          message: 'Unity-Initialisierung fehlgeschlagen',
          details: err instanceof Error ? err.message : 'Unbekannter Fehler',
          timestamp: new Date()
        });
        setIsLoading(false);
      }
    }
  }, [canvasId, isLoaded, isLoading]);

  // Unity-Nachricht senden
  const sendUnityMessage = useCallback((message: UnityMessage) => {
    if (unityServiceRef.current) {
      unityServiceRef.current.sendUnityMessage(message);
    } else {
      console.warn('⚠️ Unity-Service nicht verfügbar');
    }
  }, []);

  // Emotion setzen
  const setEmotion = useCallback((emotion: string, intensity: number = 0.5) => {
    if (unityServiceRef.current) {
      unityServiceRef.current.setEmotion(emotion, intensity);
    }
  }, []);

  // Sprechen-Status setzen
  const setSpeaking = useCallback((isSpeaking: boolean) => {
    if (unityServiceRef.current) {
      unityServiceRef.current.setSpeaking(isSpeaking);
    }
  }, []);

  // Geste abspielen
  const playGesture = useCallback((gesture: string) => {
    if (unityServiceRef.current) {
      unityServiceRef.current.playGesture(gesture);
    }
  }, []);

  // Animation abspielen
  const playAnimation = useCallback((animation: string) => {
    if (unityServiceRef.current) {
      unityServiceRef.current.playAnimation(animation);
    }
  }, []);

  return {
    unity,
    isLoaded,
    isLoading,
    sendUnityMessage,
    setEmotion,
    setSpeaking,
    playGesture,
    playAnimation,
    error,
    initialize
  };
};
