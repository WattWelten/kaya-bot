// KAYA Frontend Types

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'audio' | 'image' | 'file';
  metadata?: {
    emotion?: string;
    urgency?: 'low' | 'normal' | 'high' | 'critical';
    persona?: string;
    language?: string;
    intention?: string;
    emotionalState?: string;
    confidence?: number;
  };
}

export interface Session {
  id: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
  context?: {
    previousIntention?: string;
    persona?: string;
    language?: string;
    communicationMode?: 'text' | 'audio';
  };
}

export interface WebSocketMessage {
  type: 'message' | 'response' | 'error' | 'status';
  sessionId: string;
  data: any;
  timestamp: Date;
}

export interface KayaResponse {
  response: string;
  audio?: string;
  mode: 'text' | 'audio';
  language: string;
  communicationMode: 'text' | 'audio';
  metadata?: {
    intention?: string;
    persona?: string;
    emotionalState?: string;
    urgency?: string;
    agent?: string;
  };
}

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 100 | 115 | 130;
  simpleLanguage: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
}

export interface AudioSettings {
  enabled: boolean;
  volume: number;
  language: string;
  voice?: string;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  accessibility: AccessibilitySettings;
  audio: AudioSettings;
}

export interface Intent {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  icon?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  action: string;
  icon?: string;
  category: 'service' | 'information' | 'emergency';
}

export interface ErrorState {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// Component Props Types
export interface AvatarPaneProps {
  isSpeaking: boolean;
  captionText: string;
  setIsSpeaking: (speaking: boolean) => void;
  onEmotionChange?: (emotion: string, intensity: number) => void;
}

export interface ChatPaneProps {
  setCaptionText: (text: string) => void;
  onMessageSend?: (message: string) => void;
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onMessageAction?: (messageId: string, action: string) => void;
}

export interface ComposerProps {
  setCaptionText: (text: string) => void;
  onSendMessage: (message: string) => void;
  isRecording?: boolean;
  isProcessing?: boolean;
}

export interface HeaderProps {
  accessibility: AccessibilitySettings;
  onAccessibilityChange: (settings: AccessibilitySettings) => void;
  onLanguageChange: (language: string) => void;
}

// Hook Types
export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: string) => void;
  lastMessage: WebSocketMessage | null;
  error: ErrorState | null;
}

export interface UseAudioReturn {
  isRecording: boolean;
  isPlaying: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  playAudio: (audioUrl: string) => void;
  error: ErrorState | null;
}

export interface UseSessionReturn {
  session: Session | null;
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  clearSession: () => void;
  isLoading: boolean;
  error: ErrorState | null;
}
