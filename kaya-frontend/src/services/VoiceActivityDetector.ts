/**
 * VoiceActivityDetector - Web Audio API Silence Detection
 * 
 * Erkennt Stille im Audio-Stream und triggert automatisch Recording-Stop
 * nach konfigurierbarem Zeitraum (Standard: 2 Sekunden)
 */

export interface VADConfig {
  silenceDuration: number;  // Millisekunden Stille bis Stop
  threshold: number;        // dB Threshold für "Stille"
  onSilenceDetected: () => void; // Callback bei Silence
  onVoiceActivity?: (level: number) => void; // Optional: Audio-Level
}

export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private audioStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private silenceStartTime: number | null = null;
  private config: VADConfig;
  private isActive = false;
  
  // Exponential Moving Average für glatte Audio-Level
  private emaAlpha = 0.1; // Smoothing factor
  private currentLevel = 0;

  constructor(config: VADConfig) {
    this.config = config;
  }

  /**
   * Startet Voice Activity Detection auf einem Audio-Stream
   */
  async start(stream: MediaStream): Promise<void> {
    if (this.isActive) {
      console.warn('⚠️ VAD läuft bereits');
      return;
    }

    this.audioStream = stream;
    
    try {
      // AudioContext erstellen
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // MediaStreamSource verbinden
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // AnalyserNode für Audio-Level
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256; // Für schnelle Performance
      this.analyserNode.smoothingTimeConstant = 0.8;
      
      source.connect(this.analyserNode);
      
      this.isActive = true;
      this.silenceStartTime = null;
      
      // Monitoring-Loop starten
      this.monitor();
      
      console.log('🎤 Voice Activity Detection gestartet');
    } catch (error) {
      console.error('❌ VAD Start-Fehler:', error);
      throw error;
    }
  }

  /**
   * Stoppt Voice Activity Detection
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.isActive = false;
    this.silenceStartTime = null;
    this.currentLevel = 0;
    
    // AudioContext schließen
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.error);
    }
    
    console.log('🛑 Voice Activity Detection gestoppt');
  }

  /**
   * Monitoring-Loop mit requestAnimationFrame
   */
  private monitor(): void {
    if (!this.isActive || !this.analyserNode) {
      return;
    }

    // Audio-Level berechnen
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    
    // RMS (Root Mean Square) für Audio-Level
    const sum = dataArray.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sum / dataArray.length);
    
    // Exponential Moving Average für Glättung
    this.currentLevel = this.emaAlpha * rms + (1 - this.emaAlpha) * this.currentLevel;
    
    // In dB konvertieren (0-255 → dB)
    const db = this.currentLevel > 0 
      ? 20 * Math.log10(this.currentLevel / 255)
      : -Infinity;
    
    // Callback: Audio-Level
    if (this.config.onVoiceActivity) {
      this.config.onVoiceActivity(this.currentLevel / 255 * 100); // 0-100%
    }
    
    // Silence Detection
    if (db < this.config.threshold) {
      // Stille erkannt
      if (this.silenceStartTime === null) {
        this.silenceStartTime = Date.now();
      } else {
        const silenceDuration = Date.now() - this.silenceStartTime;
        
        if (silenceDuration >= this.config.silenceDuration) {
          // Lange genug stille → Recording stoppen
          console.log(`🔇 ${silenceDuration}ms Stille erkannt → Auto-Stop`);
          this.config.onSilenceDetected();
          this.stop();
          return;
        }
      }
    } else {
      // Aktivität erkannt → Silence-Zeit zurücksetzen
      this.silenceStartTime = null;
    }
    
    // Nächster Frame
    this.animationFrameId = requestAnimationFrame(() => this.monitor());
  }

  /**
   * Aktuelles Audio-Level (0-100%)
   */
  getCurrentLevel(): number {
    return this.currentLevel / 255 * 100;
  }

  /**
   * Ist VAD aktiv?
   */
  get isRunning(): boolean {
    return this.isActive;
  }
}

