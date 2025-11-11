/**
 * Shared Type Definitions for KAYA Backend
 * These types are used across all services and repositories
 */

export interface Session {
  id: string;
  createdAt: string;
  lastActivity: string;
  messages: Message[];
  context: SessionContext;
  metadata: SessionMetadata;
  status: 'active' | 'expired' | 'deleted';
  messageCount: number;
  totalDuration: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface SessionContext {
  persona: string;
  emotionalState: string;
  urgency: 'normal' | 'high' | 'critical';
  language: string;
  accessibility: {
    needs: string[];
    hasNeeds: boolean;
  };
  previousIntention: string | null;
  conversationHistory: Message[];
  userData?: {
    name?: string;
    [key: string]: any;
  };
}

export interface SessionMetadata {
  userAgent: string;
  ipAddress: string;
  referrer: string;
}

export interface MessageMetadata {
  emotion?: string;
  emotionConfidence?: number;
  agent?: string;
  cached?: boolean;
  intention?: string;
  [key: string]: any;
}

export interface AgentData {
  name: string;
  data: any[];
  lastUpdated: string;
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  namespace?: string;
}

export interface WebSocketClient {
  id: string;
  ws: any;
  ip: string;
  userAgent: string;
  connectedAt: string;
  lastActivity: number;
  messageCount: number;
  sessionId: string | null;
  rooms: Set<string>;
}

export interface EmotionAnalysis {
  emotion: string;
  confidence: number;
  scores: Record<string, number>;
  processingTime: number;
  timestamp: string;
}

export interface VisemeSegment {
  viseme: string;
  start: number;
  end: number;
  intensity?: number;
}

export interface KayaResponse {
  response: string;
  agent?: string;
  cached?: boolean;
  emotion?: string;
  emotionConfidence?: number;
  visemeTimeline?: VisemeSegment[];
  metadata?: MessageMetadata;
}

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

export interface AudioConfig {
  voiceId?: string;
  modelId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speakerBoost: boolean;
}

export interface ServiceConfig {
  [key: string]: any;
}
