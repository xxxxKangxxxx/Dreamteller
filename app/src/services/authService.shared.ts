import { mapSupabaseUser, supabase } from '@/services/supabase';
import { request } from '@/services/api';
import type { User } from '@/types/user';

export interface SupabaseSessionResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function readErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

// 현재 세션이 익명(게스트)인지 확인. 게스트가 OAuth로 가입하면 linkIdentity로
// 같은 계정에 연결해 기존 기록을 보존하기 위함.
export async function isCurrentSessionAnonymous(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.is_anonymous === true;
}

/**
 * Supabase SDK만으로 끝나는 인증 동작 — 네이티브/웹이 완전히 동일하다.
 * 플랫폼별로 갈리는 건 OAuth(브라우저 리다이렉트 방식)와 Apple 로그인뿐이라,
 * 그 둘만 `authService.ts` / `authService.web.ts`가 각자 얹는다.
 */
export const sharedAuth = {
  async signInWithEmail(email: string, password: string): Promise<SupabaseSessionResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      throw new Error(readErrorMessage(error, '로그인에 실패했어요'));
    }
    return {
      user: mapSupabaseUser(data.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },

  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
  ): Promise<SupabaseSessionResult | null> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error || !data.user) {
      throw new Error(readErrorMessage(error, '회원가입에 실패했어요'));
    }
    if (!data.session) {
      return null;
    }
    return {
      user: mapSupabaseUser(data.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },

  async verifySignupOtp(email: string, token: string): Promise<SupabaseSessionResult> {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error || !data.session || !data.user) {
      throw new Error(readErrorMessage(error, '인증 코드가 올바르지 않아요'));
    }
    return {
      user: mapSupabaseUser(data.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },

  async resendSignupOtp(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      throw new Error(readErrorMessage(error, '인증 코드 재발송에 실패했어요'));
    }
  },

  // 게스트(익명) 진입 — 회원가입 없이 핵심 기능을 사용. 정식 가입 시 linkIdentity로 데이터 보존.
  async continueAsGuest(): Promise<SupabaseSessionResult> {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session || !data.user) {
      throw new Error(readErrorMessage(error, '게스트로 시작하지 못했어요'));
    }
    return {
      user: mapSupabaseUser(data.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(readErrorMessage(error, '로그아웃에 실패했어요'));
  },

  async restoreSession(): Promise<SupabaseSessionResult | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session || !data.session.user) return null;
    return {
      user: mapSupabaseUser(data.session.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },
};

// 백엔드에는 `/auth/*` 라우트가 없다 — 인증은 전부 Supabase가 직접 처리한다.
// 여기 있던 login/refresh/logout은 호출처가 0인 죽은 코드였고(CODE_REVIEW A2),
// 그중 refresh는 api.ts가 흉내 내다 강제 로그아웃 버그(A1)를 만들었다.
// 없는 엔드포인트를 부르는 함수를 남겨두면 같은 실수가 반복되므로 삭제했다.
// 이 서비스에서 실제로 백엔드를 타는 것은 deleteAccount 하나뿐이다.
export const authService = {
  deleteAccount() {
    return request<{ deleted: true }>({
      method: 'DELETE',
      url: '/account',
    });
  },
};
