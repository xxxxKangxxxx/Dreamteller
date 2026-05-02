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

export interface KeySymbol {
  symbol: string;
  meaning: string;
}

export interface SymbolAnalysisPart {
  headline: string;
  detail: string;
  keySymbols: KeySymbol[];
}

export interface PsychologicalPart {
  headline: string;
  detail: string;
  perspective: string;
  keySymbols: KeySymbol[];
}

export interface UnconsciousPart {
  headline: string;
  detail: string;
  affirmation: string;
  keySymbols: KeySymbol[];
}

export interface Interpretation {
  dreamId: string;
  status: 'processing' | 'completed' | 'failed';
  symbolAnalysis: SymbolAnalysisPart;
  psychologicalMeaning: PsychologicalPart;
  unconsciousMessage: UnconsciousPart;
  symbolAnalysisText: string;
  psychologicalMeaningText: string;
  unconsciousMessageText: string;
}

export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}
