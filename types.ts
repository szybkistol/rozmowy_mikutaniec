
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}

export enum Sentiment {
  POSITIVE = 'Dobrze',
  NEUTRAL = 'Neutralnie',
  NEGATIVE = 'Źle'
}

export interface TranscriptSegment {
  id: number;
  speaker: string;
  text: string;
  timestamp: string; // e.g., "00:15"
}

export type ActionType = 'event' | 'task';

export interface ActionItem {
  id: string;
  type: ActionType;
  content: string;
  date?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface Conversation {
  id: string;
  title: string;
  date: string; // ISO String
  clientId: string | null;
  shortDescription: string;
  detailedSummary: string;
  sentiment: Sentiment;
  segments: TranscriptSegment[];
  actionItems: ActionItem[];
  audioUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  citations?: number[]; // IDs of TranscriptSegments
  isThinking?: boolean;
}

export type ViewState = 'dashboard' | 'clients' | 'conversation_detail' | 'client_detail';
