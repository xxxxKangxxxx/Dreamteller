import {
  isCurrentSessionAnonymous,
  readErrorMessage,
  sharedAuth,
  type SupabaseSessionResult,
} from '@/services/authService.shared';
import { supabase } from '@/services/supabase';

export { authService } from '@/services/authService.shared';
export type { SupabaseSessionResult } from '@/services/authService.shared';

/**
 * 웹 인증. 공통 동작은 `sharedAuth`와 같고 OAuth 방식만 다르다.
 */
export const supabaseAuth = {
  ...sharedAuth,

  /**
   * 웹 Google 로그인은 **페이지 리다이렉트**다.
   *
   * 네이티브처럼 인앱 브라우저를 띄우고 결과 URL을 받아 파싱하는 게 아니라, 브라우저가
   * 통째로 Google로 떠났다가 콜백 URL로 돌아온다. 돌아온 URL의 토큰은
   * `supabase.web.ts`의 `detectSessionInUrl: true`가 주워 세션으로 만들고,
   * authStore의 `onAuthStateChange`가 그걸 받아 로그인 상태로 바꾼다.
   *
   * 그래서 이 함수는 **정상 흐름에서 반환하지 않는다.** 아래 never-resolving Promise는
   * 그 사실을 그대로 표현한 것이다 — 호출부의 로딩 표시가 페이지가 떠날 때까지
   * 유지되고, 성공 결과를 여기서 반환할 방법도 없다(이미 문서가 사라진 뒤다).
   */
  async signInWithGoogle(): Promise<SupabaseSessionResult> {
    const redirectTo = window.location.origin;

    // 게스트(익명) 세션이면 linkIdentity로 같은 계정에 Google을 연결해 기록을 유지한다.
    const linkToGuest = await isCurrentSessionAnonymous();
    const { error } = linkToGuest
      ? await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo } })
      : await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });

    if (error) {
      throw new Error(readErrorMessage(error, 'Google 로그인을 시작하지 못했어요'));
    }

    return new Promise<never>(() => {});
  },

  /**
   * 웹에서는 Apple 로그인을 노출하지 않는다.
   *
   * Supabase는 Apple OAuth 웹 플로우를 지원하지만 Apple Developer 콘솔에서 Services ID와
   * 도메인 검증을 따로 설정해야 한다. 별도 작업으로 미루고, 지금은 이메일/Google/게스트
   * 세 경로만 연다. (`components/auth/AppleSignInButton.web.tsx`가 버튼도 숨긴다)
   */
  async isAppleAvailable(): Promise<boolean> {
    return false;
  },

  async signInWithApple(): Promise<SupabaseSessionResult> {
    throw new Error('웹에서는 Apple 로그인을 사용할 수 없어요');
  },
};
