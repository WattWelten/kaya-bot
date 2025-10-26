import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { AvatarPane } from '@/components/AvatarPane';
import { ChatPane } from '@/components/ChatPane';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import { AccessibilitySettings, UserPreferences } from '@/types';

/**
 * KAYA – Frontend 2025 (Landkreis Oldenburg)
 * - Avatar links (Unity WebGL via createUnityInstance)
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

  // Avatar-Status
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [captionText, setCaptionText] = useState('');

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
        setIsSpeaking(false);
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
        const avatarCanvas = document.getElementById('unity-canvas');
        if (avatarCanvas) {
          avatarCanvas.focus();
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

      {/* Accessibility Toolbar */}
      <AccessibilityToolbar />

      {/* Header */}
      <Header
        accessibility={accessibility}
        onAccessibilityChange={handleAccessibilityChange}
        onLanguageChange={handleLanguageChange}
      />

      {/* Hauptbereich */}
      <main 
        className="grid md:grid-cols-2 grid-cols-1 min-h-[calc(100svh-4rem)]"
        role="main"
        aria-label="KAYA Chat-Interface"
      >
        {/* Avatar-Bereich (links) */}
        <AvatarPane
          isSpeaking={isSpeaking}
          captionText={captionText}
          setIsSpeaking={setIsSpeaking}
          onEmotionChange={handleEmotionChange}
        />

        {/* Chat-Bereich (rechts) */}
        <ChatPane
          setCaptionText={setCaptionText}
          onMessageSend={handleMessageSend}
        />
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
