import { fontFamilies, fontWeights } from './fontFamily';

export const typography = {
  // 패밀리/두께는 플랫폼별로 갈린다 — `constants/fontFamily.ts` / `.web.ts` 참조
  fonts: fontFamilies,
  weights: fontWeights,

  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
} as const;

export const textStyles = {
  heading1: {
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes['3xl'],
    lineHeight: typography.sizes['3xl'] * 1.2,
  },
  heading2: {
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes['2xl'],
    lineHeight: typography.sizes['2xl'] * 1.2,
  },
  heading3: {
    fontFamily: typography.fonts.semibold,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.xl,
    lineHeight: typography.sizes.xl * 1.3,
  },
  body: {
    fontFamily: typography.fonts.regular,
    fontWeight: typography.weights.regular,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.6,
  },
  bodyMd: {
    fontFamily: typography.fonts.medium,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.6,
  },
  caption: {
    fontFamily: typography.fonts.regular,
    fontWeight: typography.weights.regular,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.5,
  },
  label: {
    fontFamily: typography.fonts.semibold,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
} as const;
