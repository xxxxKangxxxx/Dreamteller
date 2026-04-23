export const colors = {
  primary: '#6B3FA0',
  primaryLight: '#9575CD',
  primarySurface: '#2D1B69',

  bgBase: '#0D0D1A',
  bgSurface: '#16213E',
  bgElevated: '#1E2A4A',

  textPrimary: '#E8E8F0',
  textSecondary: '#A0A0C0',
  textMuted: '#606080',
  textInverse: '#FFFFFF',

  success: '#4CAF80',
  warning: '#FFB74D',
  error: '#E57373',
  info: '#64B5F6',

  emotionPositive: '#81C784',
  emotionNegative: '#E57373',
  emotionNeutral: '#90A4AE',
  emotionMixed: '#CE93D8',

  border: '#2A2A4A',
  borderLight: '#3A3A60',
  overlay: 'rgba(0, 0, 0, 0.6)',
  glassBackground: 'rgba(107, 63, 160, 0.15)',
  glassBorder: 'rgba(149, 117, 205, 0.3)',
} as const;

export type ColorToken = keyof typeof colors;
