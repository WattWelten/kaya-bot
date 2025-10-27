import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { AvatarPane } from '@/components/AvatarPane';
import { ChatPane } from '@/components/ChatPane';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import { AccessibilitySettings, UserPreferences } from '@/types';

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

      {/* Header: Zwei Zeilen - Logo + Optionen */}
      <header className="h-[10svh] flex-shrink-0 bg-white border-b border-lc-neutral-200 shadow-sm">
        {/* Zeile 1: Logo + Landkreis */}
        <div className="h-[6svh] px-4 flex items-center justify-between border-b border-lc-neutral-100">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-lc-primary-600">KAYA</div>
            <span className="text-sm text-lc-neutral-600 font-medium">Landkreis Oldenburg</span>
          </div>
        </div>
        
        {/* Zeile 2: Alle Barrierefreiheit-Optionen */}
        <div className="h-[4svh] px-4 flex items-center justify-between">
          {/* Links: Sprache */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLanguageChange('de')}
              className="px-2 py-1 text-xs rounded transition-colors bg-lc-primary-100 text-lc-primary-700 font-semibold"
              aria-label="Deutsch"
            >
              DE
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className="px-2 py-1 text-xs rounded text-lc-neutral-600 hover:bg-lc-neutral-100 transition-colors"
              aria-label="English"
            >
              EN
            </button>
            <button
              onClick={() => handleAccessibilityChange({ ...accessibility, simpleLanguage: !accessibility.simpleLanguage })}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                accessibility.simpleLanguage ? 'bg-lc-primary-100 text-lc-primary-700 font-semibold' : 'text-lc-neutral-600 hover:bg-lc-neutral-100'
              }`}
              aria-label="Leichte Sprache"
            >
              LS
            </button>
          </div>
          
          {/* Rechts: Inklusions-Optionen */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAccessibilityChange({ ...accessibility, fontSize: accessibility.fontSize === 100 ? 130 : 100 })}
              className="p-1.5 rounded-lg hover:bg-lc-neutral-100 transition-colors"
              aria-label="Schriftgröße anpassen"
              title="Schriftgröße"
            >
              <span className="text-base">A+</span>
            </button>
            <button
              onClick={() => handleAccessibilityChange({ ...accessibility, highContrast: !accessibility.highContrast })}
              className="p-1.5 rounded-lg hover:bg-lc-neutral-100 transition-colors"
              aria-label="Hoher Kontrast"
              title="Kontrast"
            >
              <span className="text-base">◐</span>
            </button>
            <button
              onClick={() => handleAccessibilityChange({ ...accessibility, reducedMotion: !accessibility.reducedMotion })}
              className="p-1.5 rounded-lg hover:bg-lc-neutral-100 transition-colors"
              aria-label="Bewegung reduzieren"
              title="Weniger Bewegung"
            >
              <span className="text-base">⏸</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hauptbereich - Vertikal: Header > Avatar > Chat */}
      <main 
        className="flex flex-col h-[90svh] overflow-hidden"
        role="main"
        aria-label="KAYA Chat-Interface"
      >
        {/* Avatar - 70% */}
        <div className="flex-[0.7] relative">
          <AvatarPane
            isSpeaking={isSpeaking}
            captionText={captionText}
            setIsSpeaking={setIsSpeaking}
            onEmotionChange={handleEmotionChange}
          />
        </div>

        {/* Chat Overlay - 20% (untere 20svh) */}
        <div className="h-[20svh] flex-shrink-0 relative z-10">
          <ChatPane
            setCaptionText={setCaptionText}
            onMessageSend={handleMessageSend}
          />
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
