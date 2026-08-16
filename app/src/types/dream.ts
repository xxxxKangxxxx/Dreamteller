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

/**
 * 꿈 기록 대화에서 모아야 하는 정보 슬롯.
 * 4개가 모두 채워지면 대화가 끝나고 줄거리·해몽 단계로 넘어간다.
 * 진행은 턴 수가 아니라 이 슬롯 충족 여부로 판정한다 — docs/PROMPT_GUIDE.md §1
 */
export const DREAM_SLOT_KEYS = ['place', 'people', 'event', 'emotion'] as const;
export type DreamSlotKey = (typeof DREAM_SLOT_KEYS)[number];
export type DreamSlots = Record<DreamSlotKey, string | null>;

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
  /**
   * `absent`는 서버가 보내지 않는 **클라이언트 전용** 상태 — "아직 해몽을 요청한
   * 적이 없다"를 뜻한다. 이게 없으면 "한도 초과"와 "미요청"이 둘 다 `failed`로
   * 뭉개져서 화면이 에러를 띄울지 '해몽 받기' 버튼을 띄울지 구분할 수 없다.
   */
  status: 'absent' | 'processing' | 'completed' | 'failed';
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
