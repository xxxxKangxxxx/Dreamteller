import { colors } from './colors';
import type { Emotion } from '@/types/dream';

export interface EmotionMeta {
  label: string;
  emoji: string;
  color: string;
}

export const EMOTION_META: Record<Emotion, EmotionMeta> = {
  POSITIVE: { label: '긍정', emoji: '😊', color: colors.emotionPositive },
  NEGATIVE: { label: '부정', emoji: '😰', color: colors.emotionNegative },
  NEUTRAL: { label: '중립', emoji: '😐', color: colors.emotionNeutral },
  MIXED: { label: '복합', emoji: '🌀', color: colors.emotionMixed },
};

export const EMOTION_ORDER: Emotion[] = ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'];
