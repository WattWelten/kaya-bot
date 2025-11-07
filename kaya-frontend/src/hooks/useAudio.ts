import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioService, getAudioService } from '@/services/AudioService';
import { ErrorState } from '@/types';

export interface UseAudioReturn {
  isRecording: boolean;
  isPlaying: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playAudio: (audioUrl: string) => Promise<void>;
  stopAudio: () => void;
  textToSpeech: (text: string, language?: string) => Promise<string>;
  speechToText: (audioBlob: Blob) => Promise<string>;
  error: ErrorState | null;
}

export const useAudio = (): UseAudioReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  
  const audioServiceRef = useRef<AudioService | null>(null);

  // Audio-Service initialisieren
  useEffect(() => {
    const service = getAudioService();
    audioServiceRef.current = service;

    // Event-Listener hinzufügen
    const handleRecording = (recording: boolean) => {
      setIsRecording(recording);
    };

    const handlePlaying = (playing: boolean) => {
      setIsPlaying(playing);
    };

    const handleError = (error: ErrorState) => {
      setError(error);
    };

    service.addRecordingListener(handleRecording);
    service.addPlayingListener(handlePlaying);
    service.addErrorListener(handleError);

    // Cleanup
    return () => {
      service.removeRecordingListener(handleRecording);
      service.removePlayingListener(handlePlaying);
      service.removeErrorListener(handleError);
    };
  }, []);

  // Aufnahme starten
  const startRecording = useCallback(async () => {
    if (audioServiceRef.current) {
      try {
        await audioServiceRef.current.startRecording();
        setError(null);
      } catch (err) {
        console.error('❌ Aufnahme-Start fehlgeschlagen:', err);
        setError({
          code: 'RECORDING_START_FAILED',
          message: 'Aufnahme konnte nicht gestartet werden',
          details: err instanceof Error ? err.message : 'Unbekannter Fehler',
          timestamp: new Date()
        });
      }
    }
  }, []);

  // Aufnahme stoppen
  const stopRecording = useCallback(() => {
    if (audioServiceRef.current) {
      audioServiceRef.current.stopRecording();
    }
  }, []);

  // Audio abspielen
  const playAudio = useCallback(async (audioUrl: string) => {
    if (audioServiceRef.current) {
      try {
        await audioServiceRef.current.playAudio(audioUrl);
        setError(null);
      } catch (err) {
        console.error('❌ Audio-Wiedergabe fehlgeschlagen:', err);
        setError({
          code: 'PLAYBACK_FAILED',
          message: 'Audio konnte nicht abgespielt werden',
          details: err instanceof Error ? err.message : 'Unbekannter Fehler',
          timestamp: new Date()
        });
      }
    }
  }, []);

  // Audio stoppen
  const stopAudio = useCallback(() => {
    if (audioServiceRef.current) {
      audioServiceRef.current.stopAudio();
    }
  }, []);

  // Text zu Sprache
  const textToSpeech = useCallback(async (text: string, language: string = 'de-DE') => {
    if (audioServiceRef.current) {
      try {
        const result = await audioServiceRef.current.textToSpeech(text, language);
        setError(null);
        return result;
      } catch (err) {
        console.error('❌ TTS fehlgeschlagen:', err);
        setError({
          code: 'TTS_FAILED',
          message: 'Text-zu-Sprache Konvertierung fehlgeschlagen',
          details: err instanceof Error ? err.message : 'Unbekannter Fehler',
          timestamp: new Date()
        });
        throw err;
      }
    }
    throw new Error('Audio-Service nicht verfügbar');
  }, []);

  // Sprache zu Text
  const speechToText = useCallback(async (audioBlob: Blob) => {
    if (audioServiceRef.current) {
      try {
        const result = await audioServiceRef.current.speechToText(audioBlob);
        setError(null);
        return result;
      } catch (err) {
        console.error('❌ STT fehlgeschlagen:', err);
        setError({
          code: 'STT_FAILED',
          message: 'Sprache-zu-Text Konvertierung fehlgeschlagen',
          details: err instanceof Error ? err.message : 'Unbekannter Fehler',
          timestamp: new Date()
        });
        throw err;
      }
    }
    throw new Error('Audio-Service nicht verfügbar');
  }, []);

  return {
    isRecording,
    isPlaying,
    startRecording,
    stopRecording,
    playAudio,
    stopAudio,
    textToSpeech,
    speechToText,
    error
  };
};
