import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketService, getWebSocketService } from '@/services/WebSocketService';
import { WebSocketMessage, ErrorState } from '@/types';

export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: string) => void;
  sendAudioMessage: (audioData: string, format?: string) => void;
  lastMessage: WebSocketMessage | null;
  error: ErrorState | null;
  reconnect: () => void;
}

export const useWebSocket = (sessionId: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  
  const webSocketServiceRef = useRef<WebSocketService | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket-Service initialisieren
  useEffect(() => {
    const service = getWebSocketService(sessionId);
    webSocketServiceRef.current = service;

    // Event-Listener hinzufügen
    const handleMessage = (message: WebSocketMessage) => {
      setLastMessage(message);
      setError(null); // Fehler zurücksetzen bei erfolgreicher Nachricht
    };

    const handleConnection = (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
      }
    };

    const handleError = (error: ErrorState) => {
      setError(error);
      setIsConnected(false);
    };

    service.addMessageListener(handleMessage);
    service.addConnectionListener(handleConnection);
    service.addErrorListener(handleError);

    // Verbindung herstellen
    service.connect().catch((err) => {
      console.error('❌ WebSocket Verbindung fehlgeschlagen:', err);
      setError({
        code: 'CONNECTION_FAILED',
        message: 'Verbindung zum Server fehlgeschlagen',
        details: err instanceof Error ? err.message : 'Unbekannter Fehler',
        timestamp: new Date()
      });
    });

    // Cleanup
    return () => {
      service.removeMessageListener(handleMessage);
      service.removeConnectionListener(handleConnection);
      service.removeErrorListener(handleError);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [sessionId]);

  // Nachricht senden
  const sendMessage = useCallback((message: string) => {
    if (webSocketServiceRef.current) {
      webSocketServiceRef.current.sendMessage(message);
    } else {
      console.warn('⚠️ WebSocket-Service nicht verfügbar');
    }
  }, []);

  // Audio-Nachricht senden
  const sendAudioMessage = useCallback((audioData: string, format: string = 'audio/wav') => {
    if (webSocketServiceRef.current) {
      webSocketServiceRef.current.sendAudioMessage(audioData, format);
    } else {
      console.warn('⚠️ WebSocket-Service nicht verfügbar');
    }
  }, []);

  // Reconnect
  const reconnect = useCallback(() => {
    if (webSocketServiceRef.current) {
      webSocketServiceRef.current.disconnect();
      webSocketServiceRef.current.connect().catch((err) => {
        console.error('❌ Reconnect fehlgeschlagen:', err);
        setError({
          code: 'RECONNECT_FAILED',
          message: 'Wiederverbindung fehlgeschlagen',
          details: err instanceof Error ? err.message : 'Unbekannter Fehler',
          timestamp: new Date()
        });
      });
    }
  }, []);

  return {
    isConnected,
    sendMessage,
    sendAudioMessage,
    lastMessage,
    error,
    reconnect
  };
};
