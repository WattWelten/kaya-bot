import { useState, useCallback, useRef } from 'react';
import { useAudio } from './useAudio';

type VoiceState = 'idle' | 'recording' | 'processing' | 'playing' | 'error';

export interface VoiceDialogReturn {
  voiceState: VoiceState;
  startVoiceDialog: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error: string | null;
  transcription: string | null;
  response: string | null;
  audioUrl: string | null;
}

export const useVoiceDialog = (
  onTranscription: (text: string) => Promise<string>,
  onAudioResponse: (audioUrl: string, text: string) => void
): VoiceDialogReturn => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const { startRecording, stopRecording: stopRecordingAudio, textToSpeech } = useAudio();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startVoiceDialog = useCallback(async () => {
    if (voiceState !== 'idle') return;
    
    try {
      setError(null);
      setVoiceState('recording');
      
      // Mikrofon-Zugriff anfordern
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      
      // MediaRecorder initialisieren
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        await handleRecordingComplete();
      };
      
      mediaRecorder.start(100);
      
      // Auto-Stop nach Stille (1.5s)
      setupSilenceDetection(stream);
      
    } catch (err) {
      console.error('❌ Voice-Dialog Start fehlgeschlagen:', err);
      handleError(err);
    }
  }, [voiceState, onTranscription, onAudioResponse]);

  const stopRecording = useCallback(async () => {
    if (voiceState !== 'recording') return;
    
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, [voiceState]);

  const handleRecordingComplete = async () => {
    try {
      setVoiceState('processing');
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size < 1000) {
        throw new Error('Aufnahme zu kurz');
      }
      
      // Audio-Chat an Backend senden
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const apiUrl = import.meta.env.PROD
        ? 'https://api.kaya.wattweiser.com/api/audio-chat'
        : 'http://localhost:3001/api/audio-chat';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Audio-Chat fehlgeschlagen: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('✅ Voice-Dialog Response:', result);
      
      // Transkription und Antwort speichern
      setTranscription(result.transcription || '');
      setResponse(result.response || '');
      
      // KAYA-Antwort mit Audio abspielen
      if (result.audioUrl) {
        setAudioUrl(result.audioUrl);
        setVoiceState('playing');
        
        const audio = new Audio(result.audioUrl);
        
        // Audio-Wiedergabe mit Error-Handling
        await new Promise<void>((resolve) => {
          audio.onended = () => {
            console.log('✅ Audio fertig abgespielt');
            resolve();
          };
          audio.onerror = (err) => {
            console.error('❌ Audio-Error:', err);
            // Trotzdem fortfahren, nicht blockieren
            resolve();
          };
        });
        
        // Audio an Parent zurückgeben
        if (result.response) {
          onAudioResponse(result.audioUrl, result.response);
        }
      }
      
      // Status zurück zu Idle
      setVoiceState('idle');
      setAudioUrl(null); // Cleanup
      
    } catch (err) {
      console.error('❌ Recording-Verarbeitung fehlgeschlagen:', err);
      handleError(err);
    }
  };

  const setupSilenceDetection = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let lastSpeechTime = Date.now();
    
    const checkSilence = () => {
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const db = 20 * Math.log10(average / 255);
      
      if (db > -45) {
        lastSpeechTime = Date.now();
      }
      
      if (Date.now() - lastSpeechTime > 1500) {
        stopRecording();
        audioContext.close();
      } else {
        requestAnimationFrame(checkSilence);
      }
    };
    
    checkSilence();
  };

  const handleError = (err: any) => {
    let errorMessage = 'Etwas ist schiefgelaufen';
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMessage = 'Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMessage = 'Kein Mikrofon gefunden. Bitte schließe ein Mikrofon an.';
    } else if (err.message.includes('zu kurz')) {
      errorMessage = 'Aufnahme zu kurz. Bitte versuche es erneut mit einer längeren Nachricht.';
    }
    
    setError(errorMessage);
    setVoiceState('error');
    
    setTimeout(() => {
      setVoiceState('idle');
      setError(null);
    }, 3000);
  };

  return {
    voiceState,
    startVoiceDialog,
    stopRecording,
    error,
    transcription,
    response,
    audioUrl
  };
};

