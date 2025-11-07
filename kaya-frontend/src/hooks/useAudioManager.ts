import { useState, useEffect } from 'react';
import { AudioManager, AudioState, AudioSource } from '@/services/AudioManager';

/**
 * useAudioManager - React Hook für AudioManager
 * 
 * Zentraler Hook für alle Audio-Operationen:
 * - Recording State
 * - Playback State
 * - TTS Handling
 * - Source-basierte Priorisierung
 */
export function useAudioManager() {
  const [state, setState] = useState<AudioState>({
    isRecording: false,
    isPlaying: false,
    currentSource: null,
    currentUrl: null
  });
  
  useEffect(() => {
    const unsubscribe = AudioManager.subscribe(setState);
    return unsubscribe;
  }, []);
  
  return {
    // State
    ...state,
    
    // Recording
    startRecording: () => AudioManager.startRecording(),
    stopRecording: () => AudioManager.stopRecording(),
    getRecordedAudio: () => AudioManager.getRecordedAudio(),
    
    // Playback
    playAudio: (url: string, source: AudioSource) => 
      AudioManager.playAudio(url, source),
    stopAudio: () => AudioManager.stopAudio(),
    
    // TTS
    textToSpeech: (text: string, source: AudioSource) =>
      AudioManager.textToSpeech(text, source),
    
    // Cleanup (für useEffect cleanup)
    cleanup: () => AudioManager.cleanup()
  };
}

