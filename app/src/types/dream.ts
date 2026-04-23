export type Emotion = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';

export type DreamType =
  | 'PREDICTION'
  | 'EMOTIONAL_RELEASE'
  | 'DAILY'
  | 'NIGHTMARE'
  | 'LUCID'
  | 'SYMBOLIC';

export interface DreamTag {
  label: string;
}

export interface Dream {
  id: string;
  title: string;
  rawContent: string;
  emotion: Emotion;
  dreamType?: DreamType;
  illustrationUrl: string | null;
  tags: DreamTag[];
  hasInterpretation: boolean;
  recordedAt: string;
}

export interface Interpretation {
  dreamId: string;
  symbolAnalysis: string;
  psychologicalMeaning: string;
  unconsciousMessage: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}
