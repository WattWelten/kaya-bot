import { WebSocketMessage, KayaResponse, ErrorState } from '@/types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  public sessionId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  // Event listeners
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private errorListeners: ((error: ErrorState) => void)[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Verbindung zum WebSocket-Server herstellen
   */
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = this.getWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔗 WebSocket verbunden');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ WebSocket Nachricht-Parsing Fehler:', error);
          this.notifyErrorListeners({
            code: 'PARSE_ERROR',
            message: 'Fehler beim Verarbeiten der Nachricht',
            details: error instanceof Error ? error.message : 'Unbekannter Fehler',
            timestamp: new Date()
          });
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket geschlossen:', event.code, event.reason);
        this.isConnecting = false;
        this.notifyConnectionListeners(false);
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket Fehler:', error);
        this.isConnecting = false;
        this.notifyErrorListeners({
          code: 'WEBSOCKET_ERROR',
          message: 'Verbindungsfehler',
          details: 'WebSocket-Verbindung fehlgeschlagen',
          timestamp: new Date()
        });
      };

    } catch (error) {
      this.isConnecting = false;
      this.notifyErrorListeners({
        code: 'CONNECTION_ERROR',
        message: 'Verbindung fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Nachricht senden
   */
  sendMessage(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket nicht verbunden');
      return;
    }

    const wsMessage: WebSocketMessage = {
      type: 'message',
      sessionId: this.sessionId,
      data: {
        message,
        timestamp: new Date().toISOString(),
        type: 'text'
      },
      timestamp: new Date()
    };

    this.ws.send(JSON.stringify(wsMessage));
  }

  /**
   * Audio-Nachricht senden
   */
  sendAudioMessage(audioData: string, audioFormat: string = 'audio/wav'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket nicht verbunden');
      return;
    }

    const wsMessage: WebSocketMessage = {
      type: 'message',
      sessionId: this.sessionId,
      data: {
        message: audioData,
        type: 'audio',
        format: audioFormat,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };

    this.ws.send(JSON.stringify(wsMessage));
  }

  /**
   * Verbindung schließen
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Event-Listener hinzufügen
   */
  addMessageListener(listener: (message: WebSocketMessage) => void): void {
    this.messageListeners.push(listener);
  }

  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }

  addErrorListener(listener: (error: ErrorState) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Event-Listener entfernen
   */
  removeMessageListener(listener: (message: WebSocketMessage) => void): void {
    const index = this.messageListeners.indexOf(listener);
    if (index > -1) {
      this.messageListeners.splice(index, 1);
    }
  }

  removeConnectionListener(listener: (connected: boolean) => void): void {
    const index = this.connectionListeners.indexOf(listener);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  removeErrorListener(listener: (error: ErrorState) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Verbindungsstatus prüfen
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * WebSocket-URL generieren
   */
  private getWebSocketUrl(): string {
    // In Production: API-Server URL, in Development: localhost
    if (process.env.NODE_ENV === 'production') {
      return `wss://api.kaya.wattweiser.com/ws?sessionId=${this.sessionId}`;
    } else {
      return `ws://localhost:3001/ws?sessionId=${this.sessionId}`;
    }
  }

  /**
   * Nachricht verarbeiten
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 WebSocket Nachricht erhalten:', message);
    this.notifyMessageListeners(message);
  }

  /**
   * Reconnect planen
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnect in ${delay}ms (Versuch ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('❌ Reconnect fehlgeschlagen:', error);
      });
    }, delay);
  }

  /**
   * Event-Listener benachrichtigen
   */
  private notifyMessageListeners(message: WebSocketMessage): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('❌ Message-Listener Fehler:', error);
      }
    });
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('❌ Connection-Listener Fehler:', error);
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
let webSocketService: WebSocketService | null = null;

export const getWebSocketService = (sessionId?: string): WebSocketService => {
  if (!webSocketService || (sessionId && webSocketService.sessionId !== sessionId)) {
    if (webSocketService) {
      webSocketService.disconnect();
    }
    webSocketService = new WebSocketService(sessionId || generateSessionId());
  }
  return webSocketService;
};

// Session-ID generieren
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
