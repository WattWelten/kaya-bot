import React, { useState, useRef, useEffect } from 'react';
import { Mic, Paperclip, Send, Volume2 } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAudio } from '@/hooks/useAudio';
import { useVoiceDialog } from '@/hooks/useVoiceDialog';
import { VoiceButton } from './VoiceButton';
import { VoiceStatusBar } from './VoiceStatusBar';
import { Message, ChatPaneProps } from '@/types';
import { getAudioService } from '@/services/AudioService';

export const ChatPane: React.FC<ChatPaneProps> = ({
  setCaptionText,
  onMessageSend
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Moin! Ich bin KAYA, die KI-basierte Assistenz des Landkreis Oldenburg. Wie kann ich dir helfen?',
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
  const { voiceState, startVoiceDialog, stopRecording: stopVoiceRecording, error: voiceError, transcription, response, audioUrl } = useVoiceDialog(
    async (text: string) => {
      // User-Nachricht hinzufügen
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        content: text,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      return text;
    },
    (audioUrl: string, text: string) => {
      // KAYA-Antwort hinzufügen
      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        content: text,
        sender: 'assistant',
        timestamp: new Date(),
        metadata: {
          emotion: 'friendly',
          urgency: 'normal',
          persona: 'general',
          language: 'de'
        }
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Caption-Text für Avatar
      setCaptionText(text);
      
      // Parent benachrichtigen
      if (onMessageSend) {
        onMessageSend(text);
      }
    }
  );
  
  // Effect: Wenn Transcription und Response vorhanden sind, anzeigen
  useEffect(() => {
    if (transcription && response && voiceState === 'idle') {
      console.log('📝 Voice-Dialog Complete:', { transcription, response });
    }
  }, [transcription, response, voiceState]);

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

  // Smart Quick-Actions - 3 Ebenen System
  const getSmartSuggestions = () => {
    // Ebene 1: Initial (keine Historie)
    if (messages.length < 2) {
      return [
        { label: 'KFZ zulassen', icon: '🚗', query: 'Ich möchte ein KFZ zulassen', category: 'kfz' },
        { label: 'Wohnsitz anmelden', icon: '🏠', query: 'Ich möchte meinen Wohnsitz anmelden', category: 'buergerdienste' },
        { label: 'Termin buchen', icon: '📅', query: 'Ich brauche einen Termin', category: 'termin' },
        { label: 'Bürgergeld', icon: '💰', query: 'Ich brauche Informationen zu Bürgergeld', category: 'soziales' }
      ];
    }

    // Ebene 2: Kontext-basiert
    const lastMessage = messages[messages.length - 1];
    const intention = lastMessage.metadata?.intention;
    const lastContent = lastMessage.content.toLowerCase();

    // KFZ-Kontext
    if (intention === 'kfz_zulassung' || lastContent.includes('kfz') || lastContent.includes('auto') || lastContent.includes('fahrzeug')) {
      return [
        { label: 'Termin KFZ', icon: '📅', query: 'Termin für KFZ-Zulassung', category: 'kfz' },
        { label: 'Kosten?', icon: '💰', query: 'Was kostet die KFZ-Zulassung?', category: 'kfz' },
        { label: 'Unterlagen?', icon: '📄', query: 'Welche Unterlagen brauche ich für die Zulassung?', category: 'kfz' },
        { label: 'Online', icon: '💻', query: 'Kann ich online zulassen?', category: 'kfz' }
      ];
    }

    // Jobcenter-Kontext
    if (intention === 'jobcenter' || lastContent.includes('bürgergeld') || lastContent.includes('jobcenter')) {
      return [
        { label: 'Antrag stellen', icon: '📝', query: 'Bürgergeld-Antrag stellen', category: 'soziales' },
        { label: 'Termin', icon: '📅', query: 'Termin im Jobcenter buchen', category: 'termin' },
        { label: 'Unterlagen', icon: '📄', query: 'Welche Unterlagen brauche ich für Bürgergeld?', category: 'soziales' },
        { label: 'Kontakt', icon: '📞', query: 'Kontakt Jobcenter Landkreis Oldenburg', category: 'kontakt' }
      ];
    }

    // Bürgerservice-Kontext
    if (intention === 'buergerdienste' || lastContent.includes('wohnsitz') || lastContent.includes('ummelden') || lastContent.includes('anmelden')) {
      return [
        { label: 'An-/Ummeldung', icon: '🏠', query: 'Wohnsitz an- oder ummelden', category: 'buergerdienste' },
        { label: 'Ausweis', icon: '🆔', query: 'Ausweis beantragen', category: 'ausweis' },
        { label: 'Führungszeugnis', icon: '📜', query: 'Führungszeugnis beantragen', category: 'buergerdienste' },
        { label: 'Termin', icon: '📅', query: 'Termin Bürgerbüro buchen', category: 'termin' }
      ];
    }

    // Politik-Kontext
    if (intention === 'politik' || lastContent.includes('kreistag') || lastContent.includes('politik')) {
      return [
        { label: 'Sitzungen', icon: '📅', query: 'Sitzungskalender Kreistag', category: 'politik' },
        { label: 'Fraktionen', icon: '👥', query: 'Fraktionen im Kreistag', category: 'politik' },
        { label: 'Vorlagen', icon: '📄', query: 'Sitzungsvorlagen Kreistag', category: 'politik' },
        { label: 'Landrat', icon: '👤', query: 'Informationen zum Landrat', category: 'politik' }
      ];
    }

    // Bau-Kontext
    if (intention === 'bau' || lastContent.includes('bau') || lastContent.includes('bauantrag')) {
      return [
        { label: 'Bauantrag', icon: '📝', query: 'Bauantrag stellen', category: 'bau' },
        { label: 'Formulare', icon: '📄', query: 'Bauantragsformulare', category: 'bau' },
        { label: 'Kosten', icon: '💰', query: 'Kosten Baugenehmigung', category: 'bau' },
        { label: 'Beratung', icon: '💬', query: 'Bauberatung Termin', category: 'bau' }
      ];
    }

    // Standard-Fallback
    return [
      { label: 'KFZ', icon: '🚗', query: 'KFZ zulassen', category: 'kfz' },
      { label: 'Termin', icon: '📅', query: 'Termin buchen', category: 'termin' },
      { label: 'Bürgergeld', icon: '💰', query: 'Bürgergeld Informationen', category: 'soziales' },
      { label: 'Kreistag', icon: '🏛️', query: 'Kreistag Informationen', category: 'politik' }
    ];
  };

  const smartSuggestions = getSmartSuggestions();

  // Top-Intents - professionell
  const topIntents = [
    { id: 'kfz', label: 'KFZ zulassen', query: 'Ich möchte ein KFZ zulassen', category: 'kfz' },
    { id: 'meldewesen', label: 'Wohnsitz', query: 'Wohnsitz anmelden', category: 'meldewesen' },
    { id: 'ausweis', label: 'Ausweis', query: 'Ausweis beantragen', category: 'ausweis' },
    { id: 'termin', label: 'Termin', query: 'Termin buchen', category: 'termin' },
    { id: 'jobcenter', label: 'Jobcenter', query: 'Jobcenter Landkreis Oldenburg', category: 'soziales' },
    { id: 'kreistag', label: 'Kreistag', query: 'Kreistag Informationen', category: 'politik' }
  ];

  return (
    <section 
      id="chat-root" 
      aria-label="Chat Bereich" 
      className="relative bg-white h-[calc(100vh-4rem)] flex flex-col"
    >
      <div className="h-full flex flex-col">
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

        {/* Top-Intents - Horizontal Scroll auf Mobile */}
        <div className="px-3 sm:px-6 py-2 overflow-x-auto border-b border-lc-neutral-100 bg-white/60">
          <div className="inline-flex gap-2">
            {topIntents.map(intent => (
              <button
                key={intent.id}
                className="chip-link btn-interactive text-xs sm:text-sm whitespace-nowrap"
                aria-label={`Schnellstart ${intent.label}`}
                data-category={intent.category}
                onClick={() => handleSendMessage(intent.query)}
              >
                {intent.label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Status Bar - Während Aufnahme */}
        {voiceState === 'recording' && (
          <VoiceStatusBar onStop={stopVoiceRecording} />
        )}

        {/* Smart Suggestions - Nur auf Tablet/Desktop */}
        {messages.length >= 2 && (
          <div className="hidden sm:block px-4 sm:px-6 py-2 border-b border-lc-primary-100 bg-lc-primary-50/50">
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
                  data-category={suggestion.category}
                  onClick={() => handleSendMessage(suggestion.query)}
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nachrichten-Liste */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-animate`}
            >
              <div
                className={`max-w-[85vw] sm:max-w-[60ch] md:max-w-[70ch] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 ${
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
        <div className="px-3 sm:px-6 py-2 sm:py-4 border-t border-lc-neutral-200 bg-white/90 backdrop-blur sticky bottom-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-1 sm:gap-2"
            aria-label="Nachricht verfassen"
          >
            {/* Voice-Button - Compact auf Mobile */}
            <VoiceButton
              voiceState={voiceState}
              error={voiceError}
              onStart={startVoiceDialog}
              onStop={stopVoiceRecording}
            />

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
              placeholder="Deine Frage..."
              className="flex-1 text-sm sm:text-base resize-none rounded-2xl px-4 py-2 message-input"
              disabled={isProcessing}
            />

            {/* Action-Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
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
                className="btn-ghost p-2"
                aria-label="Datei anhängen"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-4 sm:size-5" />
              </button>
              <button
                type="submit"
                className="btn-solid p-2"
                aria-label="Senden"
                disabled={!inputValue.trim() || isProcessing}
              >
                <Send className="size-4 sm:size-5" />
              </button>
            </div>
          </form>

          {/* Hinweis-Text - Nur Desktop */}
          <p className="hidden md:block mt-2 text-xs text-lc-neutral-600">
            Hinweis: KAYA nutzt öffentliche Informationen des Landkreises Oldenburg. 
            Keine Rechtsberatung – Notfälle: 112 / 110.
          </p>
        </div>
      </div>
    </section>
  );
};
