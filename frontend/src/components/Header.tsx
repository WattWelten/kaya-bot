import React, { useState } from 'react';
import { Contrast, Globe, Info, Accessibility } from 'lucide-react';
import { AccessibilitySettings } from '@/types';
import { InfoDialog } from './InfoDialog';

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
  const [showInfoDialog, setShowInfoDialog] = useState(false);

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
    <header className="h-16 w-full border-b border-lc-primary-100/30 bg-gradient-to-r from-lc-primary-600 via-lc-primary-500 to-lc-gold-400 backdrop-blur-xl sticky top-0 z-40 shadow-strong">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo und Titel */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lc-gold-400 via-lc-gold-500 to-lc-gold-600 flex items-center justify-center shadow-strong border-2 border-white/40 animate-pulse-soft">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-bold text-white drop-shadow-md flex items-center gap-2">
              KAYA <span className="text-sm font-normal text-white/90">· Landkreis Oldenburg</span>
            </h1>
          </div>
        </div>

        {/* Navigation und Einstellungen */}
        <nav className="flex items-center gap-2" role="toolbar" aria-label="Einstellungen">
          {/* Kontrast-Toggle */}
          <button
            className="btn-ghost text-white hover:bg-white/20"
            aria-pressed={accessibility.highContrast}
            aria-label="Kontrast umschalten"
            onClick={handleContrastToggle}
          >
            <Contrast className="size-5" />
          </button>

          {/* Schriftgröße */}
          <div className="flex items-center gap-1" role="group" aria-label="Schriftgröße">
            <button
              className={`btn-ghost text-xs text-white hover:bg-white/20 ${accessibility.fontSize === 100 ? 'bg-white/30' : ''}`}
              aria-label="Schrift 100%"
              onClick={() => handleFontSizeChange(100)}
            >
              A
            </button>
            <button
              className={`btn-ghost text-sm text-white hover:bg-white/20 ${accessibility.fontSize === 115 ? 'bg-white/30' : ''}`}
              aria-label="Schrift 115%"
              onClick={() => handleFontSizeChange(115)}
            >
              A+
            </button>
            <button
              className={`btn-ghost text-base text-white hover:bg-white/20 ${accessibility.fontSize === 130 ? 'bg-white/30' : ''}`}
              aria-label="Schrift 130%"
              onClick={() => handleFontSizeChange(130)}
            >
              A++
            </button>
          </div>

          {/* Einfache Sprache */}
          <button
            className="btn-ghost text-white hover:bg-white/20"
            aria-pressed={accessibility.simpleLanguage}
            aria-label="Einfache Sprache umschalten"
            onClick={handleSimpleLanguageToggle}
          >
            <Accessibility className="size-5" />
          </button>

          {/* Sprache */}
          <select
            className="btn-ghost text-sm text-white bg-transparent border-none hover:bg-white/20"
            aria-label="Sprache wechseln"
            onChange={handleLanguageChange}
            defaultValue="de"
          >
            <option value="de" className="bg-lc-primary-600">Deutsch</option>
            <option value="en" className="bg-lc-primary-600">English</option>
            <option value="tr" className="bg-lc-primary-600">Türkçe</option>
            <option value="ar" className="bg-lc-primary-600">العربية</option>
            <option value="pl" className="bg-lc-primary-600">Polski</option>
            <option value="ru" className="bg-lc-primary-600">Русский</option>
          </select>

          {/* Hilfe */}
          <button
            className="btn-ghost text-white hover:bg-white/20"
            aria-label="Hilfe und Hinweise"
            onClick={() => setShowInfoDialog(true)}
          >
            <Info className="size-5" />
          </button>
        </nav>
      </div>

      {/* Info-Dialog */}
      <InfoDialog isOpen={showInfoDialog} onClose={() => setShowInfoDialog(false)} />
    </header>
  );
};
