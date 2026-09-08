import { useFonts } from 'expo-font';

/**
 * 앱 폰트 로딩. 로딩이 끝났는지를 반환한다.
 *
 * 네이티브는 번들된 Pretendard .otf 4종을 등록한다.
 * 웹은 `useAppFonts.web.ts` — CDN 가변 폰트를 쓰므로 동작이 완전히 다르다.
 */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
  });
  return loaded;
}
