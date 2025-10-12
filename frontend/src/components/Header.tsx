import React from 'react';
import { Contrast, Globe, Info, Accessibility } from 'lucide-react';
import { AccessibilitySettings } from '@/types';

interface HeaderProps {
  accessibility: AccessibilitySettings;
  onAccessibilityChange: (settings: AccessibilitySettings) => void;
  onLanguageChange: (language: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  accessibility,
  onAccessibilityChange,
  onLanguageChange
}) => {
  const handleContrastToggle = () => {
    onAccessibilityChange({
      ...accessibility,
      highContrast: !accessibility.highContrast
    });
  };

  const handleFontSizeChange = (size: 100 | 115 | 130) => {
    onAccessibilityChange({
      ...accessibility,
      fontSize: size
    });
  };

  const handleSimpleLanguageToggle = () => {
    onAccessibilityChange({
      ...accessibility,
      simpleLanguage: !accessibility.simpleLanguage
    });
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onLanguageChange(event.target.value);
  };

  return (
    <header className="h-16 w-full border-b border-lc-neutral-200 bg-white/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo und Titel */}
        <div className="flex items-center gap-3">
          <div 
            className="h-8 w-8 rounded-xl bg-lc-primary-600" 
            aria-hidden="true"
          />
          <div className="leading-tight">
            <p className="text-sm text-lc-neutral-500">Landkreis Oldenburg</p>
            <h1 className="text-base font-semibold tracking-tight">
              KAYA – Service-Assistentin
            </h1>
          </div>
        </div>

        {/* Navigation und Einstellungen */}
        <nav className="flex items-center gap-2" role="toolbar" aria-label="Einstellungen">
          {/* Kontrast-Toggle */}
          <button
            className="btn-ghost"
            aria-pressed={accessibility.highContrast}
            aria-label="Kontrast umschalten"
            onClick={handleContrastToggle}
          >
            <Contrast className="size-5" />
          </button>

          {/* Schriftgröße */}
          <div className="flex items-center gap-1" role="group" aria-label="Schriftgröße">
            <button
              className={`btn-ghost text-xs ${accessibility.fontSize === 100 ? 'bg-lc-neutral-100' : ''}`}
              aria-label="Schrift 100%"
              onClick={() => handleFontSizeChange(100)}
            >
              A
            </button>
            <button
              className={`btn-ghost text-sm ${accessibility.fontSize === 115 ? 'bg-lc-neutral-100' : ''}`}
              aria-label="Schrift 115%"
              onClick={() => handleFontSizeChange(115)}
            >
              A+
            </button>
            <button
              className={`btn-ghost text-base ${accessibility.fontSize === 130 ? 'bg-lc-neutral-100' : ''}`}
              aria-label="Schrift 130%"
              onClick={() => handleFontSizeChange(130)}
            >
              A++
            </button>
          </div>

          {/* Einfache Sprache */}
          <button
            className="btn-ghost"
            aria-pressed={accessibility.simpleLanguage}
            aria-label="Einfache Sprache umschalten"
            onClick={handleSimpleLanguageToggle}
          >
            <Accessibility className="size-5" />
          </button>

          {/* Sprache */}
          <select
            className="btn-ghost text-sm"
            aria-label="Sprache wechseln"
            onChange={handleLanguageChange}
            defaultValue="de"
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="ar">العربية</option>
            <option value="pl">Polski</option>
            <option value="ru">Русский</option>
          </select>

          {/* Hilfe */}
          <button
            className="btn-ghost"
            aria-label="Hilfe und Hinweise"
            onClick={() => {
              // TODO: Hilfe-Dialog öffnen
              console.log('Hilfe-Dialog öffnen');
            }}
          >
            <Info className="size-5" />
          </button>
        </nav>
      </div>
    </header>
  );
};
