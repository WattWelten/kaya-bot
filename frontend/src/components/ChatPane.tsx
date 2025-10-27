import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send } from 'lucide-react';
import { useAudioManager } from '@/hooks/useAudioManager';
import { Message, ChatPaneProps } from '@/types';

const ChatPaneComponent: React.FC<ChatPaneProps> = ({
  setCaptionText,
  onMessageSend
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [typingMessage, setTypingMessage] = useState<{id: string, content: string, sender: string} | null>(null);
  
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
      audioManager.stopRecording();
      setIsProcessing(true);

      try {
        // Audio abrufen (from AudioManager)
        const audioBlob = audioManager.getRecordedAudio();
        
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
          timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        
        // Audio abspielen (via AudioManager für koordiniertes Playback)
        if (result.audioUrl) {
          await audioManager.playAudio(result.audioUrl, 'chat');
        }
        
        // Audio wurde vom AudioManager abgespielt

        setCaptionText(result.response);

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
      // Start recording
      try {
        await audioManager.startRecording();
      } catch (err) {
        console.error('❌ Audio-Aufnahme fehlgeschlagen:', err);
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
    
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      content: text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    try {
      await onMessageSend?.(text);
    } catch (err) {
      console.error('❌ Nachricht fehlgeschlagen:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Markdown-Links in HTML umwandeln
  const renderMessageContent = (content: string) => {
    // Markdown-Links: [Text](URL) → <a href="URL">Text</a>
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
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
    <section 
      id="chat-root" 
      aria-label="Chat Bereich" 
      className="relative w-full h-full bg-white/98 backdrop-blur-xl flex flex-col border-t-2 border-lc-primary-300 shadow-[0_-15px_40px_rgba(15,118,110,0.15)]"
    >
      {/* Chat-Messages - Scrollbar, 70% der Chat-Höhe */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.slice(-3).map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
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

      {/* Text-Input - Optional neben Audio */}
      <div className="flex-shrink-0 px-4 pb-2 pt-2 flex items-center gap-2 border-t border-lc-neutral-200 bg-gradient-to-t from-white to-transparent">
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
          className="p-3 rounded-xl bg-lc-primary-500 text-white hover:bg-lc-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          aria-label="Nachricht senden"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Audio-Button - Zentral */}
      <div className="flex-shrink-0 flex items-center justify-center py-2 bg-gradient-to-t from-white/50 to-transparent">
        <button
          onClick={handleAudioToggle}
          disabled={isProcessing}
          className={`
            w-16 h-16 rounded-full shadow-lg
            transition-all duration-300
            ${audioManager.isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110 shadow-red-300/50' 
              : 'bg-lc-primary-500 hover:bg-lc-primary-600 hover:scale-105 shadow-lc-primary-300/50'
            }
            shadow-xl
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center
          `}
          aria-label={audioManager.isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
        >
          {audioManager.isRecording ? (
            <div className="w-5 h-5 bg-white rounded-sm" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )}
        </button>
      </div>
    </section>
  );
};

// Performance: ChatPane mit memo wrappen
export const ChatPane = React.memo(ChatPaneComponent);
ChatPane.displayName = 'ChatPane';
