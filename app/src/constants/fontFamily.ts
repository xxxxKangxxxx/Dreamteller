import type { TextStyle } from 'react-native';

/**
 * 폰트 패밀리/두께의 플랫폼 교체 지점.
 *
 * 네이티브는 굵기별로 별도 .otf를 번들해 패밀리 이름 자체가 두께를 담는다.
 * 그래서 `fontWeight`는 지정하지 않는다(undefined) — 이미 두께가 정해진 파일에
 * 굵기를 또 얹으면 iOS에서 합성 볼드가 끼어들 수 있다.
 *
 * 웹 구현은 `fontFamily.web.ts` 참조.
 */
export const fontFamilies = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export const fontWeights: Record<keyof typeof fontFamilies, TextStyle['fontWeight']> = {
  regular: undefined,
  medium: undefined,
  semibold: undefined,
  bold: undefined,
};
