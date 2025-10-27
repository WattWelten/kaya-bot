import React from 'react';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';

type VoiceState = 'idle' | 'recording' | 'processing' | 'playing' | 'error';

interface VoiceButtonProps {
  voiceState: VoiceState;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  voiceState,
  error,
  onStart,
  onStop
}) => {
  const getStatusText = () => {
    switch (voiceState) {
      case 'idle':
        return 'Mit KAYA sprechen';
      case 'recording':
        return 'Ich höre zu...';
      case 'processing':
        return 'Einen Moment...';
      case 'playing':
        return 'KAYA antwortet';
      case 'error':
        return error || 'Fehler';
      default:
        return 'Bereit';
    }
  };

  const getStatusIcon = () => {
    switch (voiceState) {
      case 'idle':
        return <Mic className="size-7 text-white" />;
      case 'recording':
        return <MicOff className="size-7 text-white" />;
      case 'processing':
        return <Loader2 className="size-7 text-white animate-spin" />;
      case 'playing':
        return <Volume2 className="size-7 text-white" />;
      case 'error':
        return <AlertCircle className="size-7 text-white" />;
      default:
        return <Mic className="size-7 text-white" />;
    }
  };

  const getButtonClasses = () => {
    const base = 'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300';
    const stateClasses = {
      idle: 'bg-gradient-to-br from-lc-primary-500 to-lc-accent-500 hover:scale-110 active:scale-95',
      recording: 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse',
      processing: 'bg-gradient-to-br from-blue-500 to-blue-600',
      playing: 'bg-gradient-to-br from-green-500 to-green-600',
      error: 'bg-gradient-to-br from-orange-500 to-orange-600 animate-shake'
    };
    
    return `${base} ${stateClasses[voiceState]}`;
  };

  const handleClick = () => {
    if (voiceState === 'idle' || voiceState === 'error') {
      onStart();
    } else if (voiceState === 'recording') {
      onStop();
    }
  };

  const isDisabled = voiceState === 'processing' || voiceState === 'playing';

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className={getButtonClasses()}
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={voiceState === 'idle' ? 'Mit KAYA sprechen' : `Status: ${voiceState}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {getStatusIcon()}
      </button>
      
      <span className="text-xs text-lc-neutral-600 font-medium">
        {getStatusText()}
      </span>
      
      {/* Error Tooltip */}
      {voiceState === 'error' && error && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-orange-500 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
          {error}
        </div>
      )}

      {/* Screen-Reader Announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {voiceState === 'recording' && 'Aufnahme läuft. Sprich jetzt.'}
        {voiceState === 'processing' && 'Deine Anfrage wird verarbeitet.'}
        {voiceState === 'playing' && 'KAYA antwortet dir jetzt.'}
      </div>
    </div>
  );
};

