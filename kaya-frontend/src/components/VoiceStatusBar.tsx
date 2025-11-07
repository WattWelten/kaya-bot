import React from 'react';
import { StopCircle } from 'lucide-react';

interface VoiceStatusBarProps {
  onStop: () => void;
}

export const VoiceStatusBar: React.FC<VoiceStatusBarProps> = ({ onStop }) => {
  return (
    <div className="voice-status-bar px-4 py-3 bg-red-50 border-b border-red-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="pulse-dot w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-700">
            Ich höre zu... (Auto-Stop bei Pause)
          </span>
        </div>
        
        <button
          onClick={onStop}
          className="stop-button inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-red-500 text-red-600 rounded-full font-semibold transition-all duration-300 hover:bg-red-50 active:scale-95"
          aria-label="Aufnahme stoppen und senden"
        >
          <StopCircle className="size-4" />
          Stoppen & Senden
        </button>
      </div>
    </div>
  );
};

