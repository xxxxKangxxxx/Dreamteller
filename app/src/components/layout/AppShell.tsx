import type { ReactNode } from 'react';

/**
 * 네이티브에서는 앱이 화면 전체를 쓰므로 감쌀 것이 없다.
 * 웹 구현은 `AppShell.web.tsx` — 데스크톱 폭 제한을 담당한다.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
