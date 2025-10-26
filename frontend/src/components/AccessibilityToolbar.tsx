import React, { useState, useEffect } from 'react';
import { Languages, Type, Contrast, Volume2, Eye, RefreshCw } from 'lucide-react';

interface AccessibilitySettings {
  simpleLanguage: boolean;
  fontSize: 100 | 115 | 130;
  highContrast: boolean;
  reducedMotion: boolean;
  language: 'de' | 'en';
}

export const AccessibilityToolbar: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage or default
    const saved = localStorage.getItem('kaya_accessibility');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getDefaultSettings();
      }
    }
    return getDefaultSettings();
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('kaya_accessibility', JSON.stringify(settings));
    
    // Apply settings to document
    applyAccessibilitySettings(settings);
  }, [settings]);

  const toggleSimpleLanguage = () => {
    setSettings(prev => ({ ...prev, simpleLanguage: !prev.simpleLanguage }));
  };

  const cycleFontSize = () => {
    setSettings(prev => {
      const nextSize = prev.fontSize === 100 ? 115 : prev.fontSize === 115 ? 130 : 100;
      return { ...prev, fontSize: nextSize };
    });
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleReducedMotion = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const resetSettings = () => {
    const defaultSettings = getDefaultSettings();
    setSettings(defaultSettings);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-12 h-12 rounded-full glass shadow-lg
          flex items-center justify-center
          hover:scale-110 active:scale-95
          transition-transform duration-200
          btn-interactive
        "
        aria-label="Barrierefreiheit einstellen"
        aria-expanded={isExpanded}
      >
        <Eye className="w-6 h-6 text-lc-primary-600" />
      </button>

      {/* Expanded Toolbar */}
      {isExpanded && (
        <div className="glass rounded-2xl shadow-2xl mt-4 p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-lc-neutral-700 uppercase tracking-wide">
              Barrierefreiheit
            </h3>
            <button
              onClick={resetSettings}
              className="
                p-1.5 rounded-lg
                hover:bg-lc-neutral-100
                transition-colors
              "
              aria-label="Zurücksetzen"
              title="Einstellungen zurücksetzen"
            >
              <RefreshCw className="w-4 h-4 text-lc-neutral-600" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Einfache Sprache */}
            <button
              onClick={toggleSimpleLanguage}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl
                transition-all duration-200
                ${settings.simpleLanguage ? 'bg-lc-primary-100 border-2 border-lc-primary-300' : 'bg-lc-neutral-50 border-2 border-transparent hover:border-lc-primary-200'}
                btn-interactive
              `}
              aria-label={`Einfache Sprache ${settings.simpleLanguage ? 'aktiviert' : 'deaktiviert'}`}
              aria-pressed={settings.simpleLanguage}
            >
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-lc-primary-600" />
                <span className="text-sm font-medium text-lc-neutral-800">
                  Einfache Sprache
                </span>
              </div>
              {settings.simpleLanguage && (
                <div className="w-5 h-5 rounded-full bg-lc-primary-500 flex items-center justify-center">
                  <span className="text-xs text-white">✓</span>
                </div>
              )}
            </button>

            {/* Schriftgröße */}
            <button
              onClick={cycleFontSize}
              className="
                w-full flex items-center justify-between px-4 py-3 rounded-xl
                bg-lc-neutral-50 hover:bg-lc-primary-50
                border-2 border-transparent hover:border-lc-primary-200
                transition-all duration-200
                btn-interactive
              "
              aria-label={`Schriftgröße: ${settings.fontSize}%`}
            >
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-lc-primary-600" />
                <span className="text-sm font-medium text-lc-neutral-800">
                  Schriftgröße
                </span>
              </div>
              <span className="text-sm font-semibold text-lc-primary-600">
                {settings.fontSize}%
              </span>
            </button>

            {/* Hoher Kontrast */}
            <button
              onClick={toggleHighContrast}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl
                transition-all duration-200
                ${settings.highContrast ? 'bg-lc-primary-100 border-2 border-lc-primary-300' : 'bg-lc-neutral-50 border-2 border-transparent hover:border-lc-primary-200'}
                btn-interactive
              `}
              aria-label={`Hoher Kontrast ${settings.highContrast ? 'aktiviert' : 'deaktiviert'}`}
              aria-pressed={settings.highContrast}
            >
              <div className="flex items-center gap-3">
                <Contrast className="w-5 h-5 text-lc-primary-600" />
                <span className="text-sm font-medium text-lc-neutral-800">
                  Hoher Kontrast
                </span>
              </div>
              {settings.highContrast && (
                <div className="w-5 h-5 rounded-full bg-lc-primary-500 flex items-center justify-center">
                  <span className="text-xs text-white">✓</span>
                </div>
              )}
            </button>

            {/* Weniger Animationen */}
            <button
              onClick={toggleReducedMotion}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl
                transition-all duration-200
                ${settings.reducedMotion ? 'bg-lc-primary-100 border-2 border-lc-primary-300' : 'bg-lc-neutral-50 border-2 border-transparent hover:border-lc-primary-200'}
                btn-interactive
              `}
              aria-label={`Weniger Animationen ${settings.reducedMotion ? 'aktiviert' : 'deaktiviert'}`}
              aria-pressed={settings.reducedMotion}
            >
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-lc-primary-600" />
                <span className="text-sm font-medium text-lc-neutral-800">
                  Weniger Animationen
                </span>
              </div>
              {settings.reducedMotion && (
                <div className="w-5 h-5 rounded-full bg-lc-primary-500 flex items-center justify-center">
                  <span className="text-xs text-white">✓</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function getDefaultSettings(): AccessibilitySettings {
  return {
    simpleLanguage: false,
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
    language: 'de'
  };
}

function applyAccessibilitySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;

  // Font Size
  root.style.fontSize = `${settings.fontSize}%`;

  // High Contrast
  if (settings.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  // Reduced Motion
  if (settings.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  // Simple Language (data-attribute for CSS targeting)
  if (settings.simpleLanguage) {
    root.setAttribute('data-simple-language', 'true');
  } else {
    root.removeAttribute('data-simple-language');
  }
}

