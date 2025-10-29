/**
 * AudioManager - Zentraler Audio-State-Manager
 * 
 * Verwaltet alle Audio-Operationen:
 * - Mikrofon-Aufnahme (Recording)
 * - Audio-Wiedergabe (Playback) - nur 1 gleichzeitig
 * - TTS-Queue für gestaffelte Sprachausgabe
 * - Priorisierung: Chat > Avatar
 * - Voice Activity Detection (Auto-Stop bei Stille)
 */

import { VoiceActivityDetector, VADConfig } from './VoiceActivityDetector';

export type AudioSource = 'chat' | 'avatar';

export interface AudioState {
  isRecording: boolean;
  isPlaying: boolean;
  currentSource: AudioSource | null;
  currentUrl: string | null;
  audioLevel?: number; // 0-100% für Visualisierung
  audioAmplitude?: number; // 0-1 für Avatar-Lipsync (real-time)
}

export type AudioStateCallback = (state: AudioState) => void;

class AudioManagerClass {
  private static instance: AudioManagerClass | null = null;
  
  // Audio State
  private audioPlayer: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private amplitudeAnimationFrame: number | null = null;
  private isRecording = false;
  private isPlaying = false;
  private currentSource: AudioSource | null = null;
  private currentUrl: string | null = null;
  private currentAmplitude = 0;
  
  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordedAudioBlob: Blob | null = null;
  private vadDetector: VoiceActivityDetector | null = null;
  private currentAudioLevel = 0;
  
  // TTS Queue
  private ttsQueue: Array<{ text: string; source: AudioSource }> = [];
  private processingTTS = false;
  
  // Subscribers (React Hooks)
  private subscribers: Set<AudioStateCallback> = new Set();
  
  // Private Constructor für Singleton
  private constructor() {}
  
  /**
   * Singleton getInstance
   */
  static getInstance(): AudioManagerClass {
    if (!AudioManagerClass.instance) {
      AudioManagerClass.instance = new AudioManagerClass();
    }
    return AudioManagerClass.instance;
  }
  
  /**
   * State für React Hooks abonnieren
   */
  subscribe(callback: AudioStateCallback): () => void {
    this.subscribers.add(callback);
    
    // Sofort aktuellen State senden
    callback(this.getState());
    
    // Unsubscribe-Funktion zurückgeben
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  /**
   * Aktuellen State abfragen
   */
  getState(): AudioState {
    return {
      isRecording: this.isRecording,
      isPlaying: this.isPlaying,
      currentSource: this.currentSource,
      currentUrl: this.currentUrl,
      audioLevel: this.currentAudioLevel,
      audioAmplitude: this.currentAmplitude
    };
  }
  
  /**
   * State an alle Subscriber senden
   */
  private notifySubscribers() {
    const state = this.getState();
    this.subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('❌ Subscriber callback error:', error);
      }
    });
  }
  
  // ==================== Recording ====================
  
  /**
   * Mikrofon-Aufnahme starten
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('⚠️ Bereits am Aufnehmen');
      return;
    }
    
    // User-Interrupt: Wenn KAYA spricht, sofort stoppen
    if (this.isPlaying) {
      console.log('🛑 User unterbricht KAYA');
      this.stopAudio();
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
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
        this.recordedAudioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Stream stoppen
        stream.getTracks().forEach(track => track.stop());
        
        // VAD stoppen
        if (this.vadDetector) {
          this.vadDetector.stop();
          this.vadDetector = null;
        }
      };
      
      // Voice Activity Detection starten
      this.vadDetector = new VoiceActivityDetector({
        silenceDuration: 2000, // 2 Sekunden Stille
        threshold: -50,         // dB
        onSilenceDetected: () => {
          console.log('🔇 2 Sekunden Stille erkannt → Auto-Stop');
          this.stopRecording();
        },
        onVoiceActivity: (level) => {
          this.currentAudioLevel = level;
          this.notifySubscribers();
        }
      });
      
      await this.vadDetector.start(stream);
      
      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.currentAudioLevel = 0;
      this.notifySubscribers();
      
      console.log('🎤 Recording gestartet mit VAD');
    } catch (error: any) {
      console.error('❌ Recording-Fehler:', error);
      this.isRecording = false;
      this.notifySubscribers();
      
      // Spezifische Fehler-Handling
      if (error.name === 'NotAllowedError') {
        throw new Error('MICROPHONE_DENIED');
      } else if (error.name === 'NotFoundError') {
        throw new Error('NO_MICROPHONE');
      }
      
      throw error;
    }
  }
  
  /**
   * Mikrofon-Aufnahme stoppen
   */
  async stopRecording(): Promise<Blob | null> {
    if (!this.isRecording || !this.mediaRecorder) {
      return null;
    }
    
    // VAD stoppen
    if (this.vadDetector) {
      this.vadDetector.stop();
      this.vadDetector = null;
    }
    
    this.mediaRecorder.stop();
    this.isRecording = false;
    this.currentAudioLevel = 0;
    this.notifySubscribers();
    
    console.log('🛑 Recording gestoppt');
    
    // Warten auf Blob
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.recordedAudioBlob;
  }
  
  /**
   * Recorded Audio abrufen
   */
  getRecordedAudio(): Blob | null {
    return this.recordedAudioBlob;
  }
  
  // ==================== Playback ====================
  
  /**
   * Audio abspielen (stoppt vorheriges Audio)
   * Priorisierung: Chat > Avatar
   */
  async playAudio(url: string, source: AudioSource): Promise<void> {
    // Stop vorheriges Audio nur wenn niedrigere Priorität
    if (this.isPlaying && this.currentSource) {
      const priorities = { chat: 2, avatar: 1 };
      
      if (priorities[source] <= priorities[this.currentSource]) {
        console.log(`🛑 Stoppe vorheriges Audio (${this.currentSource})`);
        this.stopAudio();
      } else {
        console.log(`⚠️ Höhere Priorität läuft (${this.currentSource}), überspringe ${source}`);
        return;
      }
    }
    
    try {
      this.audioPlayer = new Audio(url);
      
      // WebAudio Analyser Setup für Amplitude-Tracking
      this.setupAudioAnalyser(this.audioPlayer);
      
      // Startzeit für Lipsync-Synchronisation
      const audioStartTime = Date.now();
      
      this.audioPlayer.onplay = () => {
        this.isPlaying = true;
        this.currentSource = source;
        this.currentUrl = url;
        this.startAmplitudeTracking();
        this.notifySubscribers();
        console.log(`🔊 Playing ${source} audio (Start: ${audioStartTime})`);
        
        // Event für Lipsync-Synchronisation (optional, für externe Komponenten)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('audioPlayStart', {
            detail: { startTime: audioStartTime, source, url }
          }));
        }
      };
      
      this.audioPlayer.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
        this.currentUrl = null;
        this.stopAmplitudeTracking();
        this.cleanupAudioAnalyser();
        this.audioPlayer = null;
        this.notifySubscribers();
        console.log(`✅ ${source} audio ended`);
        
        // Event für Lipsync-Synchronisation
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('audioPlayEnd', {
            detail: { source }
          }));
        }
        
        // Nächstes TTS aus Queue verarbeiten
        this.processTTSQueue();
      };
      
      this.audioPlayer.onerror = (error) => {
        console.error(`❌ Audio playback error (${source}):`, error);
        this.isPlaying = false;
        this.currentSource = null;
        this.currentUrl = null;
        this.stopAmplitudeTracking();
        this.cleanupAudioAnalyser();
        this.audioPlayer = null;
        this.notifySubscribers();
      };
      
      await this.audioPlayer.play();
    } catch (error) {
      console.error(`❌ Audio play error (${source}):`, error);
      this.isPlaying = false;
      this.currentSource = null;
      this.currentUrl = null;
      this.cleanupAudioAnalyser();
      this.notifySubscribers();
      throw error;
    }
  }

  /**
   * WebAudio Analyser Setup (für Amplitude-Tracking)
   */
  private setupAudioAnalyser(audioElement: HTMLAudioElement): void {
    try {
      // AudioContext erstellen (falls nicht vorhanden)
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }

      // Falls suspendiert: resume
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // MediaElementSourceNode erstellen (nur einmal pro Audio-Element)
      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
        
        // AnalyserNode erstellen
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 256; // Für schnelle Updates
        this.analyserNode.smoothingTimeConstant = 0.8; // Smoothing
        
        // Verbinden: Source → Analyser → Destination
        this.sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
      }
    } catch (error) {
      console.warn('⚠️ WebAudio Analyser Setup fehlgeschlagen (Fallback auf einfaches Tracking):', error);
      // Fallback: Amplitude-Tracking wird übersprungen, aber Audio funktioniert
    }
  }

  /**
   * Starte Amplitude-Tracking (requestAnimationFrame)
   */
  private startAmplitudeTracking(): void {
    if (this.amplitudeAnimationFrame !== null) {
      return; // Bereits aktiv
    }

    const trackAmplitude = () => {
      if (!this.analyserNode || !this.isPlaying) {
        this.amplitudeAnimationFrame = null;
        return;
      }

      try {
        // TimeDomainData für Amplitude
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteTimeDomainData(dataArray);

        // RMS (Root Mean Square) für Amplitude berechnen
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128; // -1 bis 1
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);
        
        // Normalisiert auf 0-1 (mit Threshold für Stille)
        this.currentAmplitude = Math.max(0, Math.min(1, rms * 3)); // Multiplikator für bessere Sichtbarkeit
        
        // State aktualisieren (nur wenn sichtbarer Unterschied)
        if (Math.abs(this.currentAmplitude - (this.getState().audioAmplitude || 0)) > 0.05) {
          this.notifySubscribers();
        }
      } catch (error) {
        // Silent fail - Analyser nicht verfügbar
      }

      this.amplitudeAnimationFrame = requestAnimationFrame(trackAmplitude);
    };

    this.amplitudeAnimationFrame = requestAnimationFrame(trackAmplitude);
  }

  /**
   * Stoppe Amplitude-Tracking
   */
  private stopAmplitudeTracking(): void {
    if (this.amplitudeAnimationFrame !== null) {
      cancelAnimationFrame(this.amplitudeAnimationFrame);
      this.amplitudeAnimationFrame = null;
    }
    this.currentAmplitude = 0;
    this.notifySubscribers();
  }

  /**
   * Cleanup WebAudio Analyser
   */
  private cleanupAudioAnalyser(): void {
    this.stopAmplitudeTracking();

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        // Ignore
      }
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch (e) {
        // Ignore
      }
      this.analyserNode = null;
    }

    // AudioContext bleibt aktiv (für nächsten Playback)
  }
  
  /**
   * Audio stoppen
   */
  stopAudio(): void {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
      this.audioPlayer = null;
    }
    
    this.stopAmplitudeTracking();
    this.cleanupAudioAnalyser();
    
    this.isPlaying = false;
    this.currentSource = null;
    this.currentUrl = null;
    this.notifySubscribers();
    
    console.log('🛑 Audio stopped');
  }
  
  // ==================== TTS Queue ====================
  
  /**
   * Text-to-Speech zur Queue hinzufügen
   */
  async textToSpeech(text: string, source: AudioSource): Promise<void> {
    this.ttsQueue.push({ text, source });
    this.processTTSQueue();
  }
  
  /**
   * TTS Queue verarbeiten
   */
  private async processTTSQueue(): Promise<void> {
    if (this.processingTTS || this.ttsQueue.length === 0 || this.isPlaying) {
      return;
    }
    
    this.processingTTS = true;
    const item = this.ttsQueue.shift();
    
    if (!item) {
      this.processingTTS = false;
      return;
    }
    
    try {
      // TTS an Backend senden
      const audioUrl = await this.requestTTS(item.text);
      
      if (audioUrl) {
        await this.playAudio(audioUrl, item.source);
      }
    } catch (error) {
      console.error(`❌ TTS error for ${item.source}:`, error);
    } finally {
      this.processingTTS = false;
    }
  }
  
  /**
   * TTS Request an Backend
   */
  private async requestTTS(text: string): Promise<string | null> {
    try {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://api.kaya.wattweiser.com/api/tts'
        : 'http://localhost:3001/api/tts';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: 'de-DE',
          voice: 'kaya'
        })
      });
      
      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('❌ TTS request error:', error);
      return null;
    }
  }
  
  // ==================== Cleanup ====================
  
  /**
   * Alle Ressourcen freigeben
   */
  cleanup(): void {
    this.stopAudio();
    
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
    
    this.audioChunks = [];
    this.recordedAudioBlob = null;
    this.ttsQueue = [];
    
    this.notifySubscribers();
  }
}

// Export Singleton-Instance
export const AudioManager = AudioManagerClass.getInstance();

