import { colors } from './colors';

export interface DreamCardStyleTokens {
  label: string;
  swatch: string;
  background: readonly [string, string, ...string[]];
  cardSurface: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accentSymbol: string;
  accentPsychological: string;
  accentUnconscious: string;
  chipBackground: string;
  chipBorder: string;
  chipText: string;
  shadow: string;
  watermark: string;
}

export const DREAM_CARD_STYLE: DreamCardStyleTokens = {
  label: 'Galaxy',
  swatch: '#9FB7FF',
  background: ['#0D0D1A', '#1B1340', '#2D1B69'] as readonly [string, string, string],
  cardSurface: 'rgba(45, 27, 105, 0.55)',
  cardBorder: 'rgba(149, 117, 205, 0.45)',
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  accentSymbol: '#9FB7FF',
  accentPsychological: '#C8A8FF',
  accentUnconscious: '#FFD86B',
  chipBackground: 'rgba(149, 117, 205, 0.18)',
  chipBorder: 'rgba(149, 117, 205, 0.45)',
  chipText: '#E0D6FF',
  shadow: 'rgba(149, 117, 205, 0.6)',
  watermark: 'rgba(232, 232, 240, 0.45)',
};
