import { UnityInstance, UnityMessage, UnityConfig, ErrorState } from '@/types';

declare global {
  interface Window {
    createUnityInstance: (canvas: HTMLCanvasElement, config: UnityConfig) => Promise<UnityInstance>;
  }
}

export class UnityService {
  private unity: UnityInstance | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isLoaded = false;
  private isLoading = false;

  // Event listeners
  private loadListeners: ((loaded: boolean) => void)[] = [];
  private errorListeners: ((error: ErrorState) => void)[] = [];

  /**
   * Unity-Instanz initialisieren
   */
  async initialize(canvasId: string = 'unity-canvas'): Promise<void> {
    if (this.isLoading || this.isLoaded) {
      return;
    }

    this.isLoading = true;
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (!this.canvas) {
      throw new Error(`Canvas mit ID '${canvasId}' nicht gefunden`);
    }

    try {
      // Unity Loader laden falls nicht vorhanden
      if (!window.createUnityInstance) {
        await this.loadUnityLoader();
      }

      // Unity-Instanz erstellen
      const config: UnityConfig = {
        dataUrl: '/unity/kaya/Build/Build.data',
        frameworkUrl: '/unity/kaya/Build/Build.framework.js',
        codeUrl: '/unity/kaya/Build/Build.wasm',
        streamingAssetsUrl: '/unity/kaya/StreamingAssets',
        companyName: 'Landkreis Oldenburg',
        productName: 'KAYA Avatar',
        productVersion: '2.0.0'
      };

      console.log('🎮 Unity-Instanz wird erstellt...');
      this.unity = await window.createUnityInstance(this.canvas, config);

      this.isLoaded = true;
      this.isLoading = false;
      this.notifyLoadListeners(true);

      console.log('✅ Unity-Instanz erfolgreich geladen');
      
      // Initiale Nachricht an Unity senden
      this.sendUnityMessage({
        type: 'emotion',
        data: {
          emotion: 'neutral',
          intensity: 0.5
        }
      });

    } catch (error) {
      this.isLoading = false;
      this.notifyErrorListeners({
        code: 'UNITY_LOAD_ERROR',
        message: 'Unity-Instanz konnte nicht geladen werden',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Unity Loader laden
   */
  private async loadUnityLoader(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/unity/kaya/Build/Build.loader.js';
      script.onload = () => {
        console.log('📦 Unity Loader geladen');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Unity Loader konnte nicht geladen werden'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Nachricht an Unity senden
   */
  sendUnityMessage(message: UnityMessage): void {
    if (!this.unity) {
      console.warn('⚠️ Unity-Instanz nicht verfügbar');
      return;
    }

    try {
      const jsonData = JSON.stringify(message.data);
      
      switch (message.type) {
        case 'emotion':
          this.unity.SendMessage('KayaController', 'SetEmotion', jsonData);
          break;
        case 'speaking':
          this.unity.SendMessage('KayaController', 'SetSpeaking', jsonData);
          break;
        case 'gesture':
          this.unity.SendMessage('KayaController', 'SetGesture', jsonData);
          break;
        case 'animation':
          this.unity.SendMessage('KayaController', 'PlayAnimation', jsonData);
          break;
        default:
          console.warn('⚠️ Unbekannter Unity-Nachrichtentyp:', message.type);
      }

      console.log('📤 Unity-Nachricht gesendet:', message);
    } catch (error) {
      console.error('❌ Unity-Nachricht Fehler:', error);
      this.notifyErrorListeners({
        code: 'UNITY_MESSAGE_ERROR',
        message: 'Nachricht an Unity fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date()
      });
    }
  }

  /**
   * Emotion setzen
   */
  setEmotion(emotion: string, intensity: number = 0.5): void {
    this.sendUnityMessage({
      type: 'emotion',
      data: { emotion, intensity }
    });
  }

  /**
   * Sprechen-Status setzen
   */
  setSpeaking(isSpeaking: boolean): void {
    this.sendUnityMessage({
      type: 'speaking',
      data: { isSpeaking }
    });
  }

  /**
   * Geste ausführen
   */
  playGesture(gesture: string): void {
    this.sendUnityMessage({
      type: 'gesture',
      data: { gesture }
    });
  }

  /**
   * Animation abspielen
   */
  playAnimation(animation: string): void {
    this.sendUnityMessage({
      type: 'animation',
      data: { animation }
    });
  }

  /**
   * Unity-Instanz beenden
   */
  async quit(): Promise<void> {
    if (this.unity) {
      try {
        await this.unity.Quit();
        this.unity = null;
        this.isLoaded = false;
        this.notifyLoadListeners(false);
        console.log('🛑 Unity-Instanz beendet');
      } catch (error) {
        console.error('❌ Unity-Quit Fehler:', error);
      }
    }
  }

  /**
   * Event-Listener hinzufügen
   */
  addLoadListener(listener: (loaded: boolean) => void): void {
    this.loadListeners.push(listener);
  }

  addErrorListener(listener: (error: ErrorState) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Event-Listener entfernen
   */
  removeLoadListener(listener: (loaded: boolean) => void): void {
    const index = this.loadListeners.indexOf(listener);
    if (index > -1) {
      this.loadListeners.splice(index, 1);
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
  isUnityLoaded(): boolean {
    return this.isLoaded && this.unity !== null;
  }

  isUnityLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Event-Listener benachrichtigen
   */
  private notifyLoadListeners(loaded: boolean): void {
    this.loadListeners.forEach(listener => {
      try {
        listener(loaded);
      } catch (error) {
        console.error('❌ Load-Listener Fehler:', error);
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
let unityService: UnityService | null = null;

export const getUnityService = (): UnityService => {
  if (!unityService) {
    unityService = new UnityService();
  }
  return unityService;
};
