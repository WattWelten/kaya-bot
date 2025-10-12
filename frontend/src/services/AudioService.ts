import { ErrorState } from '@/types';

export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;

  // Event listeners
  private recordingListeners: ((recording: boolean) => void)[] = [];
  private playingListeners: ((playing: boolean) => void)[] = [];
  private errorListeners: ((error: ErrorState) => void)[] = [];

  /**
   * Audio-Aufnahme starten
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      this.audioContext = new AudioContext();
      this.audioChunks = [];
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.handleRecordingComplete(audioBlob);
        
        // Stream stoppen
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start(100); // 100ms chunks
      this.isRecording = true;
      this.notifyRecordingListeners(true);

      console.log('🎤 Audio-Aufnahme gestartet');

    } catch (error) {
      console.error('❌ Audio-Aufnahme Fehler:', error);
      this.notifyErrorListeners({
        code: 'RECORDING_ERROR',
        message: 'Audio-Aufnahme fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Audio-Aufnahme stoppen
   */
  stopRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    this.mediaRecorder.stop();
    this.isRecording = false;
    this.notifyRecordingListeners(false);

    console.log('🛑 Audio-Aufnahme gestoppt');
  }

  /**
   * Audio abspielen
   */
  async playAudio(audioUrl: string): Promise<void> {
    if (this.isPlaying) {
      this.stopAudio();
    }

    try {
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onplay = () => {
        this.isPlaying = true;
        this.notifyPlayingListeners(true);
      };

      this.currentAudio.onended = () => {
        this.isPlaying = false;
        this.notifyPlayingListeners(false);
        this.currentAudio = null;
      };

      this.currentAudio.onerror = () => {
        this.isPlaying = false;
        this.notifyPlayingListeners(false);
        this.notifyErrorListeners({
          code: 'PLAYBACK_ERROR',
          message: 'Audio-Wiedergabe fehlgeschlagen',
          details: 'Audio-Datei konnte nicht abgespielt werden',
          timestamp: new Date()
        });
      };

      await this.currentAudio.play();
      console.log('🔊 Audio-Wiedergabe gestartet');

    } catch (error) {
      console.error('❌ Audio-Wiedergabe Fehler:', error);
      this.notifyErrorListeners({
        code: 'PLAYBACK_ERROR',
        message: 'Audio-Wiedergabe fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Audio stoppen
   */
  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.notifyPlayingListeners(false);
  }

  /**
   * Text zu Sprache konvertieren (TTS)
   */
  async textToSpeech(text: string, language: string = 'de-DE'): Promise<string> {
    try {
      // Web Speech API verwenden (Fallback)
      if ('speechSynthesis' in window) {
        return this.webSpeechTTS(text, language);
      }

      // Alternative: Server-basierte TTS
      return this.serverTTS(text, language);

    } catch (error) {
      console.error('❌ TTS Fehler:', error);
      this.notifyErrorListeners({
        code: 'TTS_ERROR',
        message: 'Text-zu-Sprache Konvertierung fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Web Speech API TTS
   */
  private async webSpeechTTS(text: string, language: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        resolve('web-speech-completed');
      };

      utterance.onerror = (event) => {
        reject(new Error(`Web Speech TTS Fehler: ${event.error}`));
      };

      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Server-basierte TTS
   */
  private async serverTTS(text: string, language: string): Promise<string> {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language,
        voice: 'kaya'
      })
    });

    if (!response.ok) {
      throw new Error(`TTS Server Fehler: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return audioUrl;
  }

  /**
   * Audio-Datei zu Text konvertieren (STT)
   */
  async speechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'de-DE');

      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`STT Server Fehler: ${response.status}`);
      }

      const result = await response.json();
      return result.text;

    } catch (error) {
      console.error('❌ STT Fehler:', error);
      this.notifyErrorListeners({
        code: 'STT_ERROR',
        message: 'Sprache-zu-Text Konvertierung fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Audio-Datei in Base64 konvertieren
   */
  async audioToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Base64 ohne Data-URL-Prefix
      };
      reader.onerror = () => {
        reject(new Error('Audio zu Base64 Konvertierung fehlgeschlagen'));
      };
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Aufnahme-Verarbeitung
   */
  private handleRecordingComplete(audioBlob: Blob): void {
    console.log('📹 Audio-Aufnahme abgeschlossen:', audioBlob.size, 'bytes');
    
    // Hier könnte die Aufnahme an den Server gesendet werden
    // oder lokal verarbeitet werden
  }

  /**
   * Event-Listener hinzufügen
   */
  addRecordingListener(listener: (recording: boolean) => void): void {
    this.recordingListeners.push(listener);
  }

  addPlayingListener(listener: (playing: boolean) => void): void {
    this.playingListeners.push(listener);
  }

  addErrorListener(listener: (error: ErrorState) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Event-Listener entfernen
   */
  removeRecordingListener(listener: (recording: boolean) => void): void {
    const index = this.recordingListeners.indexOf(listener);
    if (index > -1) {
      this.recordingListeners.splice(index, 1);
    }
  }

  removePlayingListener(listener: (playing: boolean) => void): void {
    const index = this.playingListeners.indexOf(listener);
    if (index > -1) {
      this.playingListeners.splice(index, 1);
    }
  }

  removeErrorListener(listener: (error: ErrorState) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Status prüfen
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Event-Listener benachrichtigen
   */
  private notifyRecordingListeners(recording: boolean): void {
    this.recordingListeners.forEach(listener => {
      try {
        listener(recording);
      } catch (error) {
        console.error('❌ Recording-Listener Fehler:', error);
      }
    });
  }

  private notifyPlayingListeners(playing: boolean): void {
    this.playingListeners.forEach(listener => {
      try {
        listener(playing);
      } catch (error) {
        console.error('❌ Playing-Listener Fehler:', error);
      }
    });
  }

  private notifyErrorListeners(error: ErrorState): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('❌ Error-Listener Fehler:', err);
      }
    });
  }
}

// Singleton-Instanz für globale Nutzung
let audioService: AudioService | null = null;

export const getAudioService = (): AudioService => {
  if (!audioService) {
    audioService = new AudioService();
  }
  return audioService;
};
