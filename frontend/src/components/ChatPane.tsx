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
      content: 'Moin! KAYA hier vom Landkreis Oldenburg. Womit kann ich dir direkt helfen?',
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
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Datei-Upload verarbeiten
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validierung
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    
    if (file.size > maxSize) {
      alert('Datei zu groß. Maximal 5MB erlaubt.');
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      alert('Dateityp nicht erlaubt. Nur PNG, JPG, PDF erlaubt.');
      return;
    }

    // Datei-Info an User anzeigen
    const fileSize = (file.size / 1024).toFixed(2);
    const fileMessage: Message = {
      id: `file_${Date.now()}`,
      content: `📎 ${file.name} (${fileSize} KB)`,
      sender: 'user',
      timestamp: new Date(),
      type: 'file'
    };

    setMessages(prev => [...prev, fileMessage]);

    // TODO: Backend-Upload (falls implementiert)
    // const formData = new FormData();
    // formData.append('file', file);
    // fetch('/api/upload', { method: 'POST', body: formData });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      // Prüfe auf Quellen-Fußzeile
      const footerMatch = content.match(/---\n\*Quelle: (.+?) • Stand: (.+?)\*/);
      if (footerMatch) {
        const [fullMatch, source, timestamp] = footerMatch;
        const contentWithoutFooter = content.replace(fullMatch, '').trim();
        
      return (
        <>
          <span className="whitespace-pre-wrap">{contentWithoutFooter}</span>
          <div className="source-footer mt-3">
            <button 
              onClick={() => setExpandedSources(prev => {
                const newSet = new Set(prev);
                if (newSet.has(`msg-${fullMatch}`)) {
                  newSet.delete(`msg-${fullMatch}`);
                } else {
                  newSet.add(`msg-${fullMatch}`);
                }
                return newSet;
              })}
              className="inline-flex items-center gap-1 text-xs text-lc-neutral-500 hover:text-lc-primary-600 transition-colors"
            >
              <span>{expandedSources.has(`msg-${fullMatch}`) ? '−' : '+'}</span>
              <span>Quelle anzeigen</span>
            </button>
            {expandedSources.has(`msg-${fullMatch}`) && (
              <p className="text-xs text-lc-neutral-600 mt-1">
                <strong>Quelle:</strong> {source} • <strong>Stand:</strong> {timestamp}
              </p>
            )}
          </div>
        </>
      );
      }
      return content;
    }

    // Prüfe auf Quellen-Fußzeile
    const footerMatch = content.match(/---\n\*Quelle: (.+?) • Stand: (.+?)\*/);
    if (footerMatch) {
      const [fullMatch, source, timestamp] = footerMatch;
      
      // Entferne Fußzeile aus Inhalt für Link-Rendering
      const contentWithoutFooter = content.replace(fullMatch, '').trim();
      
      // Führe Link-Rendering für Content ohne Footer durch
      const footerMatches: RegExpExecArray[] = [];
      const footerLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let footerLinkMatch;
      
      while ((footerLinkMatch = footerLinkRegex.exec(contentWithoutFooter)) !== null) {
        footerMatches.push(footerLinkMatch);
      }
      
      const footerParts: (string | JSX.Element)[] = [];
      let footerLastIndex = 0;
      
      footerMatches.forEach((match, index) => {
        if (match.index > footerLastIndex) {
          footerParts.push(contentWithoutFooter.substring(footerLastIndex, match.index));
        }
        
        const linkText = match[1];
        const linkUrl = match[2];
        footerParts.push(
          <a 
            key={`footer-link-${match.index}-${index}`}
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
        
        footerLastIndex = match.index + match[0].length;
      });
      
      if (footerLastIndex < contentWithoutFooter.length) {
        footerParts.push(contentWithoutFooter.substring(footerLastIndex));
      }
      
      return (
        <>
          {/* Haupt-Content mit Links */}
          <span className="whitespace-pre-wrap">{footerParts.length > 0 ? footerParts : contentWithoutFooter}</span>
          {/* Quellen-Fußzeile */}
          <div className="source-footer mt-3">
            <button 
              onClick={() => setExpandedSources(prev => {
                const newSet = new Set(prev);
                if (newSet.has(`msg-${fullMatch}`)) {
                  newSet.delete(`msg-${fullMatch}`);
                } else {
                  newSet.add(`msg-${fullMatch}`);
                }
                return newSet;
              })}
              className="inline-flex items-center gap-1 text-xs text-lc-neutral-500 hover:text-lc-primary-600 transition-colors"
            >
              <span>{expandedSources.has(`msg-${fullMatch}`) ? '−' : '+'}</span>
              <span>Quelle anzeigen</span>
            </button>
            {expandedSources.has(`msg-${fullMatch}`) && (
              <p className="text-xs text-lc-neutral-600 mt-1">
                <strong>Quelle:</strong> {source} • <strong>Stand:</strong> {timestamp}
              </p>
            )}
          </div>
        </>
      );
    }

    return parts;
  };

  // Smart Quick-Actions basierend auf letzter Nachricht
  const getSmartSuggestions = () => {
    if (messages.length < 2) {
      // Initial suggestions
      return [
        { label: 'KFZ', icon: '🚗' },
        { label: 'Bürgergeld', icon: '💰' },
        { label: 'Kreistag', icon: '🏛️' },
        { label: 'Termin', icon: '📅' }
      ];
    }

    const lastMessage = messages[messages.length - 1];
    const intention = lastMessage.metadata?.intention;

    switch (intention) {
      case 'jobcenter':
        return [
          { label: 'Antrag stellen', icon: '📄' },
          { label: 'Termin buchen', icon: '📅' },
          { label: 'Unterlagen?', icon: '📋' }
        ];
      case 'kfz_zulassung':
        return [
          { label: 'Termin KFZ', icon: '🚗' },
          { label: 'Kosten?', icon: '💰' },
          { label: 'Unterlagen?', icon: '📄' }
        ];
      case 'buergerdienste':
        return [
          { label: 'An-/Ummeldung', icon: '🏠' },
          { label: 'Ausweis', icon: '🆔' },
          { label: 'Termin', icon: '📅' }
        ];
      case 'politik':
        return [
          { label: 'Sitzungskalender', icon: '📅' },
          { label: 'Fraktionen', icon: '👥' },
          { label: 'Vorlagen', icon: '📄' }
        ];
      default:
        return [
          { label: 'KFZ', icon: '🚗' },
          { label: 'Bürgergeld', icon: '💰' },
          { label: 'Kreistag', icon: '🏛️' },
          { label: 'Termin', icon: '📅' }
        ];
    }
  };

  const smartSuggestions = getSmartSuggestions();

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
              className="chip-link btn-interactive"
              aria-label={`Schnellstart ${intent.label}`}
              onClick={() => handleSendMessage(intent.label)}
            >
              {intent.label}
            </button>
          ))}
        </div>

        {/* Smart Suggestions - Kontextabhängig */}
        {messages.length >= 2 && (
          <div className="px-4 sm:px-6 py-2 border-b border-lc-primary-100 bg-lc-primary-50/50">
            <p className="text-xs text-lc-neutral-600 mb-2">Schnell-Aktionen:</p>
            <div className="flex flex-wrap gap-2">
              {smartSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="
                    inline-flex items-center gap-2
                    rounded-full px-4 py-2.5
                    bg-white border-2 border-lc-primary-300
                    text-sm font-semibold text-lc-primary-700
                    transition-all duration-300
                    hover:bg-gradient-to-r hover:from-lc-primary-500 hover:to-lc-gold-400
                    hover:text-white hover:border-transparent
                    hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]
                    hover:scale-105
                    active:scale-95
                    min-h-[48px]
                  "
                  aria-label={`Schnellaktion: ${suggestion.label}`}
                  onClick={() => handleSendMessage(suggestion.label)}
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nachrichten-Liste */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-animate`}
            >
              <div
                className={`max-w-[70ch] md:max-w-[62ch] rounded-2xl px-5 py-4 ${
                  message.sender === 'user'
                    ? 'chat-message-user'
                    : 'chat-message-assistant'
                }`}
              >
                <div className="text-sm leading-relaxed">
                  {renderMessageContent(message.content)}
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-[70ch] md:max-w-[62ch] rounded-2xl px-4 py-3 bg-lc-primary-50 border border-lc-primary-200 message-animate">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-lc-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-lc-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-lc-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-sm text-lc-neutral-600">KAYA antwortet...</p>
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
            {/* Audio-Button - Größer für Accessibility */}
            <button
              type="button"
              className={`
                w-14 h-14 rounded-full
                flex items-center justify-center
                text-white
                bg-gradient-to-br from-lc-primary-500 to-lc-accent-500
                ${isRecording ? 'mic-button recording' : 'mic-button'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'btn-interactive'}
              `}
              aria-label={isRecording ? "Aufnahme stoppen" : "Diktieren starten"}
              onClick={handleAudioToggle}
              disabled={isProcessing}
              title={isRecording ? "Aufnahme läuft... (Klicken zum Stoppen)" : "Mikrofon aktivieren (56x56px)"}
            >
              {isRecording ? (
                <Mic className="size-7 text-white" />
              ) : (
                <Mic className="size-7 text-white" />
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
              className="flex-1 resize-none rounded-2xl px-4 py-2 message-input"
              disabled={isProcessing}
            />

            {/* Action-Buttons */}
            <div className="flex items-center gap-2">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="btn-ghost"
                aria-label="Datei anhängen"
                onClick={() => fileInputRef.current?.click()}
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
