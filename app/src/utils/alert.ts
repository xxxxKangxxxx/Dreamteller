import { Alert } from 'react-native';

import type { AlertButton, AlertOptions } from '@/types/alert';

export type { AlertButton, AlertButtonStyle, AlertOptions } from '@/types/alert';

/**
 * 확인 대화상자의 플랫폼 공용 진입점.
 *
 * **react-native-web은 `Alert`를 export하지 않는다** — 웹에서 `Alert.alert`를 부르면
 * undefined 접근으로 터진다. 그래서 호출부는 RN의 `Alert`를 직접 쓰지 않고 전부 이
 * 함수를 쓴다. 시그니처를 `Alert.alert`와 동일하게 맞춰 두어 네이티브 동작은 그대로다.
 *
 * 웹 구현은 `alert.web.ts` + `components/ui/AlertHost.web.tsx` 참조.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
): void {
  Alert.alert(title, message, buttons, options);
}
