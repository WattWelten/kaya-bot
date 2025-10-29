import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send } from 'lucide-react';
import { useAudioManager } from '@/hooks/useAudioManager';
import { Message, ChatPaneProps } from '@/types';
import { AudioWaveform } from './AudioWaveform';

const ChatPaneComponent: React.FC<ChatPaneProps> = ({
  setCaptionText,
  onMessageSend,
  setVisemeTimeline,
  setEmotion,
  setEmotionConfidence
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [typingMessage, setTypingMessage] = useState<{id: string, content: string, sender: string} | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hooks
  const audioManager = useAudioManager();

  // Auto-Scroll zu neuesten Nachrichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio-Aufnahme mit Backend-Verarbeitung
  const handleAudioToggle = async () => {
    if (audioManager.isRecording) {
      // Stop recording & Process
      setIsProcessing(true);
      
      try {
        // Audio abrufen (await für korrektes Timing)
        const audioBlob = await audioManager.stopRecording();
        
        if (!audioBlob) {
          throw new Error('Kein Audio vorhanden');
        }

        console.log('🎙️ Starte Audio-Chat Processing...');

        // SessionId aus localStorage oder generieren
        const getSessionId = () => {
          let sessionId = localStorage.getItem('kaya-session-id');
          if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('kaya-session-id', sessionId);
          }
          return sessionId;
        };

        // Audio-Chat Request an Backend mit Timeout
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('sessionId', getSessionId());

        const apiUrl = process.env.NODE_ENV === 'production' 
          ? 'https://api.kaya.wattweiser.com/api/audio-chat'
          : 'http://localhost:3001/api/audio-chat';

        // Timeout-Handling: 15 Sekunden
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Audio-Chat Fehler: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Audio-Chat Response:', result);
        console.log('🔊 visemeTimeline vom Backend:', result.visemeTimeline);

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
          timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        
        setCaptionText(result.response);

        // VisemeTimeline aus HTTP-Response setzen (falls vorhanden)
        if (result.visemeTimeline && Array.isArray(result.visemeTimeline) && result.visemeTimeline.length > 0) {
          console.log('🎭 VisemeTimeline aus HTTP-Response:', result.visemeTimeline.length, 'Segmente');
          setVisemeTimeline?.(result.visemeTimeline);
        }

        // Emotion aus HTTP-Response setzen (falls vorhanden)
        if (result.emotion && result.emotionConfidence !== undefined) {
          console.log('😊 Emotion aus HTTP-Response:', result.emotion, result.emotionConfidence);
          setEmotion?.(result.emotion);
          setEmotionConfidence?.(result.emotionConfidence);
        }

        // Audio abspielen (Backend liefert audioUrl)
        if (result.audioUrl) {
          console.log('🔊 Spiele Audio von Backend ab');
          await audioManager.playAudio(result.audioUrl, 'chat');
        }

      } catch (err) {
        console.error('❌ Audio-Chat fehlgeschlagen:', err);
        
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          content: `Entschuldigung, Audio-Verarbeitung fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
      }

    } else {
      // Start recording mit Error-Handling
      try {
        await audioManager.startRecording();
        setAudioError(null);
      } catch (err: any) {
        console.error('❌ Recording-Fehler:', err);
        
        if (err.message === 'MICROPHONE_DENIED') {
          setAudioError('Mikrofon-Zugriff verweigert. Bitte erlauben Sie den Zugriff.');
        } else if (err.message === 'NO_MICROPHONE') {
          setAudioError('Kein Mikrofon gefunden. Bitte Text-Eingabe verwenden.');
        } else {
          setAudioError('Audio-Fehler. Bitte Text-Eingabe verwenden.');
        }
      }
    }
  };

  // Textarea-Größe anpassen
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 80)}px`;
  };

  // Enter-Taste verarbeiten
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // Text-Nachricht senden
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setInputValue('');
    
    // User-Message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Backend-Request
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://api.kaya.wattweiser.com/api/chat'
        : 'http://localhost:3001/api/chat';

      const sessionId = localStorage.getItem('kaya-session-id') || 
                        'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('kaya-session-id', sessionId);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId })
      });

      if (!response.ok) {
        throw new Error(`Chat Fehler: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Text-Chat Response:', result);

      // Assistant-Response
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        content: result.response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCaptionText(result.response);

      // VisemeTimeline aus HTTP-Response setzen (falls vorhanden)
      if (result.visemeTimeline && Array.isArray(result.visemeTimeline) && result.visemeTimeline.length > 0) {
        console.log('🎭 VisemeTimeline aus HTTP-Response (Text-Chat):', result.visemeTimeline.length, 'Segmente');
        setVisemeTimeline?.(result.visemeTimeline);
      }

      // Emotion aus HTTP-Response setzen (falls vorhanden)
      if (result.emotion && result.emotionConfidence !== undefined) {
        console.log('😊 Emotion aus HTTP-Response (Text-Chat):', result.emotion, result.emotionConfidence);
        setEmotion?.(result.emotion);
        setEmotionConfidence?.(result.emotionConfidence);
      }

      // Audio abspielen (falls Backend audioUrl liefert)
      if (result.audioUrl) {
        console.log('🔊 Spiele Audio von Backend ab');
        await audioManager.playAudio(result.audioUrl, 'chat');
      }

      onMessageSend?.(text);

    } catch (err) {
      console.error('❌ Text-Chat fehlgeschlagen:', err);
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        content: `Entschuldigung, ich konnte nicht antworten: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Markdown-Links in HTML umwandeln
  const renderMessageContent = (content: string) => {
    // Markdown-Links: [Text](URL) → <a href="URL">Text</a>
    // Stoppt bei \n um über-Zeilenumbrüche zu verhindern
    const linkRegex = /\[([^\]\n]+)\]\(([^)\n]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let linkCount = 0;

    // Alle Matches finden ohne .test() vorher
    const matches: RegExpExecArray[] = [];
    while ((match = linkRegex.exec(content)) !== null) {
      matches.push(match);
    }

    console.log(`🔗 ${matches.length} Markdown-Links gefunden in Nachricht`);

    // Jetzt die Matches verarbeiten
    matches.forEach((match, index) => {
      // Text vor dem Link
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Link als <a> Element mit verbessertem Styling
      const linkText = match[1];
      const linkUrl = match[2];
      linkCount++;
      
      console.log(`🔗 Link ${linkCount}: "${linkText}" -> "${linkUrl}"`);
      
      parts.push(
        <a 
          key={`link-${match.index}-${linkCount}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-1.5
            text-lc-primary-600 hover:text-lc-primary-700
            underline decoration-2 decoration-lc-primary-300
            hover:decoration-lc-primary-500
            transition-all duration-300
            font-medium
            hover:gap-2
            group
          "
          onClick={(e) => {
            console.log('🔗 Link geklickt:', linkUrl);
            e.stopPropagation();
          }}
        >
          {linkText}
          <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      );

      lastIndex = match.index + match[0].length;
    });

    // Rest-Text nach dem letzten Link
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    // Falls keine Links gefunden: normaler Text
    if (parts.length === 0 || matches.length === 0) {
      return content;
    }

    return parts;
  };

  return (
    <>
      {/* Error-Banner */}
      {audioError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 m-2 rounded">
          <p className="text-sm text-red-700">{audioError}</p>
          <button
            onClick={() => setAudioError(null)}
            className="mt-1 text-xs text-red-600 underline hover:text-red-800"
          >
            OK
          </button>
        </div>
      )}

      {/* AudioWaveform während Recording */}
      <AudioWaveform 
        audioLevel={audioManager.audioLevel || 0}
        isRecording={audioManager.isRecording}
      />

      {/* Chat-Messages mit .messages Klasse - Scrollbar, alle Nachrichten */}
      <div className="messages">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-base ${
                message.sender === 'user'
                  ? 'bg-lc-primary-500 text-white'
                  : 'bg-lc-neutral-100 text-lc-neutral-800'
              }`}
            >
              {renderMessageContent(message.content)}
            </div>
          </div>
        ))}
        
        {typingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-xl px-3 py-2 text-sm bg-lc-neutral-100 text-lc-neutral-800">
              {renderMessageContent(typingMessage.content)}
              <span className="inline-block w-1 h-3 ml-1 bg-lc-primary-500 animate-pulse">▊</span>
            </div>
          </div>
        )}

        {isProcessing && !typingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-xl px-3 py-2 bg-lc-primary-50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-lc-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-lc-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-lc-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-xs">KAYA antwortet...</p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Composer mit .composer Klasse - Text-Input + Audio-Button */}
      <div className="composer">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyPress}
          placeholder="Schreibe eine Nachricht..."
          disabled={isProcessing}
          rows={1}
          className="flex-1 resize-none rounded-xl border-2 border-lc-neutral-200 px-4 py-2 text-sm focus:outline-none focus:border-lc-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: '80px' }}
        />
        <button
          onClick={() => handleSendMessage(inputValue)}
          disabled={isProcessing || !inputValue.trim()}
          className="send disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Nachricht senden"
        >
          <Send className="w-5 h-5" />
        </button>
        <button
          onClick={handleAudioToggle}
          disabled={isProcessing}
          className={`mic ${audioManager.isRecording ? 'recording' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={audioManager.isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
        >
          {audioManager.isRecording ? (
            <div className="w-4 h-4 bg-white rounded-sm" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      </div>
    </>
  );
};

// Performance: ChatPane mit memo wrappen
export const ChatPane = React.memo(ChatPaneComponent);
ChatPane.displayName = 'ChatPane';
