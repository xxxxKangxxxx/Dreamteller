import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

/**
 * 네이티브에서는 URL 라우팅을 쓰지 않는다.
 *
 * `linking`을 넘기면 NavigationContainer가 첫 렌더 전에 `getInitialURL()`을 기다리는데,
 * 딥링크로 진입할 일이 없는 지금 구조에서는 이득 없이 스플래시만 길어진다.
 * (알림 탭 진입은 `App.tsx`의 `addRecordIntentListener`가 직접 처리한다)
 *
 * 웹 구현은 `linking.web.ts` — 거기서는 새로고침과 브라우저 뒤로가기 때문에 필수다.
 */
export const linking: LinkingOptions<RootStackParamList> | undefined = undefined;
