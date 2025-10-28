import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { AvatarPane } from '@/components/AvatarPane';
import { ChatPane } from '@/components/ChatPane';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import { AccessibilitySettings, UserPreferences } from '@/types';
import { useWebSocket } from '@/hooks/useWebSocket';
import { EmotionType } from '@/services/EmotionMapper';
import { VisemeSegment } from '@/services/LipsyncEngine';
import { useAudioManager } from '@/hooks/useAudioManager';

/**
 * KAYA – Frontend 2025 (Landkreis Oldenburg)
 * - Avatar links (Three.js via react-three/fiber)
 * - Chat rechts (Rauslauf 20% des Viewports)
 * - CI-Übernahme via :root CSS-Variablen (Fallbacks)
 * - A11y: Skiplink, Captions, Toggles (Kontrast/Schrift/Einfache Sprache)
 * - Backend-Integration via WebSocket
 */
export default function KayaPage() {
  // Accessibility-Einstellungen
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    highContrast: false,
    fontSize: 100,
    simpleLanguage: false,
    reducedMotion: false,
    screenReader: false
  });

  // Benutzer-Einstellungen
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'de',
    theme: 'light',
    notifications: true,
    accessibility,
    audio: {
      enabled: true,
      volume: 1.0,
      language: 'de-DE'
    }
  });

  // Avatar-Status über AudioManager synchronisieren
  const audioManager = useAudioManager();
  const isSpeaking = audioManager.isPlaying; // Avatar spricht, wenn Audio spielt
  const [captionText, setCaptionText] = useState('');

  // WebSocket Integration
  const getSessionId = () => {
    let sessionId = localStorage.getItem('kaya-session-id');
    if (!sessionId) {
      sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('kaya-session-id', sessionId);
    }
    return sessionId;
  };

  const sessionId = getSessionId();
  const { isConnected, lastMessage } = useWebSocket(sessionId);

  // Emotion State für Avatar
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [emotionConfidence, setEmotionConfidence] = useState<number>(50);
  const [visemeTimeline, setVisemeTimeline] = useState<VisemeSegment[]>([]);

  // Accessibility-Einstellungen aktualisieren
  const handleAccessibilityChange = (newSettings: AccessibilitySettings) => {
    setAccessibility(newSettings);
    setPreferences(prev => ({
      ...prev,
      accessibility: newSettings
    }));
  };

  // Sprache ändern
  const handleLanguageChange = (language: string) => {
    setPreferences(prev => ({
      ...prev,
      language,
      audio: {
        ...prev.audio,
        language: language === 'de' ? 'de-DE' : 'en-US'
      }
    }));
  };

  // WebSocket Message Handler
  useEffect(() => {
    if (!lastMessage) return;

    console.log('📨 WebSocket Message:', lastMessage.type);

    switch (lastMessage.type) {
      case 'connected':
        console.log('🔗 WebSocket verbunden:', lastMessage.data.message);
        // Connection-Feedback: WebSocket ist bereit
        break;

      case 'heartbeat':
        // Heartbeat ignorieren (Keep-Alive vom Server)
        break;

      case 'connection':
        // Connection-Event ignorieren (wird nur für Status genutzt)
        break;

      case 'emotion':
        if (lastMessage.data.emotion && lastMessage.data.confidence !== undefined) {
          setCurrentEmotion(lastMessage.data.emotion);
          setEmotionConfidence(lastMessage.data.confidence);
          console.log(`😊 Emotion Update: ${lastMessage.data.emotion} (${lastMessage.data.confidence}%)`);
        }
        break;

      case 'visemeTimeline':
        if (lastMessage.data.timeline && lastMessage.data.timeline.length > 0) {
          setVisemeTimeline(lastMessage.data.timeline);
          console.log(`🎭 VisemeTimeline Update: ${lastMessage.data.timeline.length} Segmente`);
        }
        break;

      case 'chat':
        // Bestehende Chat-Logik
        break;

      default:
        console.log('📨 Unbekannter WebSocket Type:', lastMessage.type);
    }
  }, [lastMessage]);

  // Emotion-Änderung vom Avatar
  const handleEmotionChange = (emotion: string, intensity: number) => {
    console.log('🎭 Avatar-Emotion geändert:', emotion, intensity);
    // Hier könnte die Emotion für weitere Logik verwendet werden
  };

  // Nachricht senden
  const handleMessageSend = (message: string) => {
    console.log('📤 Nachricht gesendet:', message);
    // Hier könnte die Nachricht für weitere Verarbeitung verwendet werden
  };

  // CSS-Klassen basierend auf Accessibility-Einstellungen
  const getAccessibilityClasses = () => {
    const classes = [
      'min-h-[100svh] bg-lc-neutral-50 text-lc-neutral-800'
    ];

    if (accessibility.highContrast) {
      classes.push('contrast-125');
    }

    if (accessibility.fontSize === 115) {
      classes.push('text-[1.03rem]');
    } else if (accessibility.fontSize === 130) {
      classes.push('text-[1.1rem]');
    }

    if (accessibility.simpleLanguage) {
      classes.push('simple-language');
    }

    if (accessibility.reducedMotion) {
      classes.push('reduce-motion');
    }

    return classes.join(' ');
  };

  // Theme-Änderungen anwenden
  useEffect(() => {
    const root = document.documentElement;
    
    // CSS-Variablen für Theme setzen
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Reduced Motion
    if (accessibility.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--animation-iteration-count', '1');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--animation-iteration-count');
    }

  }, [preferences.theme, accessibility.reducedMotion]);

  // Keyboard-Navigation für Accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape-Taste: Sprechen stoppen
      if (event.key === 'Escape' && isSpeaking) {
        // Sprechen sofort stoppen
        audioManager.stopAudio();
      }

      // Alt + S: Skiplink zum Chat
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        const chatRoot = document.getElementById('chat-root');
        if (chatRoot) {
          chatRoot.focus();
          chatRoot.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // Alt + A: Avatar fokussieren
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        const avatarCanvas = document.querySelector('[aria-label="Avatar Bereich"]');
        if (avatarCanvas) {
          (avatarCanvas as HTMLElement).focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSpeaking]);

  return (
    <div className={getAccessibilityClasses()}>
      {/* Animierter Hintergrund */}
      <div className="animated-background" aria-hidden="true">
        <div className="blob-3" />
      </div>

      {/* Skiplink für Accessibility */}
      <a 
        href="#chat-root" 
        className="skiplink"
        aria-label="Zum Chat-Bereich springen"
      >
        Zum Chat springen
      </a>

      {/* Hauptbereich - Portrait Layout 9:16 */}
      <main 
        className="h-[100svh] overflow-hidden"
        role="main"
        aria-label="KAYA Chat-Interface"
      >
        {/* Frame Container mit Utility-Bar */}
        <div className="kaya-frame">
          {/* Utility-Bar (über Avatar-Kopf) */}
          <div className="utility-bar" role="toolbar" aria-label="Barrierefreiheit">
            <button
              onClick={() => handleLanguageChange('de')}
              className={preferences.language === 'de' ? 'active' : ''}
              title="Deutsch"
            >
              DE
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={preferences.language === 'en' ? 'active' : ''}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => handleAccessibilityChange({ ...accessibility, simpleLanguage: !accessibility.simpleLanguage })}
              className={accessibility.simpleLanguage ? 'active' : ''}
              title="Leichte Sprache"
            >
              LS
            </button>
            <div className="spacer" />
            <button
              onClick={() => handleAccessibilityChange({ ...accessibility, fontSize: accessibility.fontSize === 100 ? 130 : 100 })}
              title="Schrift größer"
            >
              A+
            </button>
            <button
              onClick={() => handleAccessibilityChange({ ...accessibility, highContrast: !accessibility.highContrast })}
              aria-pressed={accessibility.highContrast}
              title="Kontrastmodus"
            >
              ◎
            </button>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, audio: { ...prev.audio, enabled: !prev.audio.enabled } }))}
              aria-pressed={preferences.audio.enabled}
              title="Audio an/aus"
            >
              🔊
            </button>
          </div>

          {/* Portrait Container: 9:16, Grid 62%/38% */}
          <div className="kaya-portrait">
          {/* Avatar Pane */}
          <section id="avatarPane">
            <AvatarPane
              isSpeaking={isSpeaking}
              captionText={captionText}
              setIsSpeaking={(speaking: boolean) => {
                if (!speaking) audioManager.stopAudio();
              }}
              onEmotionChange={handleEmotionChange}
              emotion={currentEmotion}
              emotionConfidence={emotionConfidence}
              visemeTimeline={visemeTimeline}
            />
          </section>

          {/* Überlappungsnaht (Seam) zwischen Avatar & Chat */}
          <div className="seam" aria-hidden />

          {/* Chat Pane ohne Top-Mask (echte Überlappung) */}
          <section id="chatPane">
            <ChatPane
              setCaptionText={setCaptionText}
              onMessageSend={handleMessageSend}
            />
          </section>
        </div>
        </div>
      </main>

      {/* Accessibility-Hinweise */}
      {accessibility.screenReader && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          <p>
            KAYA Chat-Interface geladen. 
            {isSpeaking ? 'KAYA spricht gerade.' : 'KAYA ist bereit für Ihre Fragen.'}
            {accessibility.highContrast ? ' Hoher Kontrast aktiviert.' : ''}
            {accessibility.simpleLanguage ? ' Einfache Sprache aktiviert.' : ''}
            Schriftgröße: {accessibility.fontSize}%.
          </p>
        </div>
      )}

      {/* Debug-Informationen (nur in Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded opacity-50">
          <div>Session: {preferences.language}</div>
          <div>Accessibility: {accessibility.fontSize}%</div>
          <div>Speaking: {isSpeaking ? 'Ja' : 'Nein'}</div>
        </div>
      )}
    </div>
  );
}
