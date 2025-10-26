import React, { useState, useRef, useEffect } from 'react';
import { Mic, Paperclip, Send, Volume2 } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAudio } from '@/hooks/useAudio';
import { Message, ChatPaneProps } from '@/types';
import { getAudioService } from '@/services/AudioService';

export const ChatPane: React.FC<ChatPaneProps> = ({
  setCaptionText,
  onMessageSend
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Moin! Ich bin KAYA, der digitale Assistent des Landkreises Oldenburg. Wobei kann ich Ihnen helfen?',
      sender: 'assistant',
      timestamp: new Date(),
      metadata: {
        emotion: 'friendly',
        urgency: 'normal',
        persona: 'general',
        language: 'de'
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hooks
  const { isConnected, sendMessage, sendAudioMessage, lastMessage, error } = useWebSocket(sessionId);
  const { isRecording, startRecording, stopRecording, textToSpeech } = useAudio();

  // Auto-Scroll zu neuesten Nachrichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket-Nachrichten verarbeiten
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'response') {
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        content: lastMessage.data.response || 'Antwort erhalten',
        sender: 'assistant',
        timestamp: new Date(),
        metadata: lastMessage.data.metadata
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsProcessing(false);
      
      // Caption-Text für Avatar setzen
      if (lastMessage.data.audio) {
        setCaptionText(newMessage.content);
      }
    }
  }, [lastMessage, setCaptionText]);

  // WebSocket-Fehler verarbeiten
  useEffect(() => {
    if (error) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        content: `Entschuldigung, es ist ein Fehler aufgetreten: ${error.message}`,
        sender: 'assistant',
        timestamp: new Date(),
        metadata: {
          emotion: 'concerned',
          urgency: 'high',
          persona: 'system',
          language: 'de'
        }
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsProcessing(false);
    }
  }, [error]);

  // Nachricht senden
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Nachricht über WebSocket senden
    sendMessage(content.trim());
    
    // Parent-Komponente benachrichtigen
    if (onMessageSend) {
      onMessageSend(content.trim());
    }
  };

  // Audio-Aufnahme mit Backend-Verarbeitung
  const handleAudioToggle = async () => {
    if (isRecording) {
      // Stop recording & Process
      stopRecording();
      setIsProcessing(true);

      try {
        // Audio abrufen (from AudioService)
        const audioService = getAudioService();
        const audioBlob = audioService.getRecordedAudio();
        
        if (!audioBlob) {
          throw new Error('Kein Audio vorhanden');
        }

        console.log('🎙️ Starte Audio-Chat Processing...');

        // Audio-Chat Request an Backend
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const apiUrl = process.env.NODE_ENV === 'production' 
          ? 'https://api.kaya.wattweiser.com/api/audio-chat'
          : 'http://localhost:3001/api/audio-chat';

        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Audio-Chat Fehler: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Audio-Chat Response:', result);

        // User-Message (Transkription)
        const userMessage: Message = {
          id: `msg_${Date.now()}`,
          content: result.transcription,
          sender: 'user',
          timestamp: new Date()
        };

        // KAYA-Response (Text)
        const assistantMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          content: result.response,
          sender: 'assistant',
          timestamp: new Date(),
          metadata: {
            emotion: 'friendly',
            urgency: 'normal',
            persona: 'general',
            language: 'de'
          }
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        
        // Audio abspielen
        if (result.audioUrl) {
          await textToSpeech(result.response);
        }
        
        // Audio von Service löschen
        audioService.clearRecordedAudio();

        setCaptionText(result.response);

      } catch (err) {
        console.error('❌ Audio-Chat fehlgeschlagen:', err);
        
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          content: `Entschuldigung, Audio-Verarbeitung fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
          sender: 'assistant',
          timestamp: new Date(),
          metadata: {
            emotion: 'concerned',
            urgency: 'high',
            persona: 'system',
            language: 'de'
          }
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
      }

    } else {
      // Start recording
      try {
        await startRecording();
      } catch (err) {
        console.error('❌ Audio-Aufnahme fehlgeschlagen:', err);
      }
    }
  };

  // Textarea-Größe anpassen
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // Enter-Taste verarbeiten
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // Top-Intents
  const topIntents = [
    { id: 'kfz', label: 'KFZ', description: 'Fahrzeug-Zulassung' },
    { id: 'meldebescheinigung', label: 'Meldebescheinigung', description: 'Wohnsitz-Nachweis' },
    { id: 'wohngeld', label: 'Wohngeld', description: 'Wohnkosten-Zuschuss' },
    { id: 'termin', label: 'Termin', description: 'Terminvereinbarung' },
    { id: 'stellen', label: 'Stellen', description: 'Job-Angebote' },
    { id: 'kreistag', label: 'Kreistag', description: 'Politik & Verwaltung' }
  ];

  return (
    <section 
      id="chat-root" 
      aria-label="Chat Bereich" 
      className="relative bg-white md:h-[calc(100svh-4rem)] h-[80svh] md:overflow-visible overflow-hidden"
    >
      {/* Rauslauf-Zone (letzte 20% des Viewports) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[20vw] max-w-[20%] bg-gradient-to-l from-white to-transparent" />
      
      <div className="h-full flex flex-col pr-[5vw] md:mr-[-20vw] mr-[-20%]">
        {/* Chat-Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-lc-neutral-200 bg-white/75 backdrop-blur sticky top-0 z-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-lc-neutral-700 uppercase">
              Chat
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-xs text-lc-neutral-500">
                {isConnected ? 'Verbunden' : 'Getrennt'}
              </p>
            </div>
          </div>
        </div>

        {/* Top-Intents */}
        <div className="px-4 sm:px-6 py-3 flex flex-wrap gap-2 border-b border-lc-neutral-100 bg-white/60">
          {topIntents.map(intent => (
            <button
              key={intent.id}
              className="chip-link"
              aria-label={`Schnellstart ${intent.label}`}
              onClick={() => handleSendMessage(intent.label)}
            >
              {intent.label}
            </button>
          ))}
        </div>

        {/* Nachrichten-Liste */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70ch] md:max-w-[62ch] rounded-2xl px-4 py-3 shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-lc-neutral-900 text-white'
                    : 'bg-lc-primary-50 border border-lc-primary-200 text-lc-neutral-900'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.metadata && (
                  <div className="mt-2 text-xs opacity-70">
                    {message.metadata.emotion && (
                      <span className="mr-2">Emotion: {message.metadata.emotion}</span>
                    )}
                    {message.metadata.urgency && (
                      <span>Dringlichkeit: {message.metadata.urgency}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-[70ch] md:max-w-[62ch] rounded-2xl px-4 py-3 bg-lc-primary-50 border border-lc-primary-200">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-lc-primary-600"></div>
                  <p className="text-sm text-lc-neutral-600">KAYA denkt nach...</p>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Nachrichten-Eingabe */}
        <div className="px-4 sm:px-6 py-4 border-t border-lc-neutral-200 bg-white/90 backdrop-blur sticky bottom-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-end gap-2"
            aria-label="Nachricht verfassen"
          >
            {/* Audio-Button */}
            <button
              type="button"
              className={`btn-ghost ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : ''} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isRecording ? "Aufnahme stoppen" : "Diktieren starten"}
              onClick={handleAudioToggle}
              disabled={isProcessing}
              title={isRecording ? "Aufnahme läuft... (Klicken zum Stoppen)" : "Mikrofon aktivieren"}
            >
              {isRecording ? (
                <div className="relative">
                  <Mic className="size-5" />
                  <span className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></span>
                </div>
              ) : (
                <Mic className="size-5" />
              )}
            </button>

            {/* Textarea */}
            <label className="sr-only" htmlFor="message">
              Nachricht
            </label>
            <textarea
              id="message"
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              rows={1}
              placeholder="Fragen Sie z. B.: 'KFZ ummelden – welche Unterlagen?'"
              className="flex-1 resize-none rounded-2xl border border-lc-neutral-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-lc-accent-600/60"
              disabled={isProcessing}
            />

            {/* Action-Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost"
                aria-label="Datei anhängen"
                onClick={() => {
                  // TODO: Datei-Upload implementieren
                  console.log('Datei-Upload');
                }}
              >
                <Paperclip className="size-5" />
              </button>
              <button
                type="submit"
                className="btn-solid"
                aria-label="Senden"
                disabled={!inputValue.trim() || isProcessing}
              >
                <Send className="size-5" />
              </button>
            </div>
          </form>

          {/* Hinweis-Text */}
          <p className="mt-2 text-[11px] text-lc-neutral-600">
            Hinweis: KAYA nutzt öffentliche Informationen des Landkreises Oldenburg. 
            Keine Rechtsberatung – Notfälle: 112 / 110.
          </p>
        </div>
      </div>
    </section>
  );
};
