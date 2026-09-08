import type { TextStyle } from 'react-native';

/**
 * fontFamily의 웹 구현 — 가변 폰트 하나 + 굵기 지정.
 *
 * 네이티브가 쓰는 .otf 4종은 각 1.5MB(합계 6MB)라 웹에 그대로 내보내면 JS 번들보다
 * 폰트가 더 무겁다. 웹에서는 Pretendard 가변 폰트의 **다이나믹 서브셋**을 쓴다 —
 * unicode-range로 잘게 쪼개져 있어 실제 화면에 뜬 글리프의 청크만 내려받는다.
 * (로딩은 `hooks/useAppFonts.web.ts`가 담당)
 *
 * 패밀리가 하나뿐이므로 두께는 `fontWeight`로 구분한다. CDN이 늦거나 막혀도 읽히도록
 * 시스템 폰트 폴백을 함께 적는다 — react-native-web은 이 문자열을 CSS
 * `font-family`로 그대로 넘긴다.
 */
const STACK = "'Pretendard Variable', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

export const fontFamilies = {
  regular: STACK,
  medium: STACK,
  semibold: STACK,
  bold: STACK,
} as const;

export const fontWeights: Record<keyof typeof fontFamilies, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
