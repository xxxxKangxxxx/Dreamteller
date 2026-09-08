import { useAlertStore } from '@/store/alertStore';
import type { AlertButton, AlertOptions } from '@/types/alert';

export type { AlertButton, AlertButtonStyle, AlertOptions } from '@/types/alert';

/**
 * showAlert의 웹 구현.
 *
 * `window.confirm`을 쓰지 않는 이유: 버튼이 두 개로 고정이고 라벨을 바꿀 수 없다.
 * 이 앱은 "계속하기/그만두기", "취소/영구 삭제"처럼 라벨 자체가 의미를 갖는
 * destructive 확인이 많아서, 앱 디자인 토큰을 쓰는 자체 모달
 * (`components/ui/AlertHost.web.tsx`)로 렌더한다.
 * 버튼이 없으면 닫을 수 있도록 확인 버튼 하나를 기본으로 넣는다.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
): void {
  useAlertStore.getState().push({
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : [{ text: '확인' }],
    cancelable: options?.cancelable ?? true,
  });
}
