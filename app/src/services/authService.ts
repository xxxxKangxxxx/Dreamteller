import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { mapSupabaseUser, supabase } from './supabase';
import { request } from './api';
import type { User } from '@/types/user';

WebBrowser.maybeCompleteAuthSession();

export type AuthProvider = 'apple' | 'google' | 'email';

export interface LoginPayload {
  provider: AuthProvider;
  idToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SupabaseSessionResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

// 현재 세션이 익명(게스트)인지 확인. 게스트가 OAuth로 가입하면 linkIdentity로
// 같은 계정에 연결해 기존 기록을 보존하기 위함.
async function isCurrentSessionAnonymous(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.is_anonymous === true;
}

export const supabaseAuth = {
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
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
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

  async signInWithGoogle(): Promise<SupabaseSessionResult> {
    const redirectTo = Linking.createURL('auth-callback');

    // 게스트(익명) 세션이면 linkIdentity로 같은 계정에 Google을 연결해 기록을 유지한다.
    const linkToGuest = await isCurrentSessionAnonymous();
    const { data, error } = linkToGuest
      ? await supabase.auth.linkIdentity({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        })
      : await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
    if (error || !data?.url) {
      throw new Error(readErrorMessage(error, 'Google 로그인 URL을 받지 못했어요'));
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('로그인을 취소했어요');
    }
    if (result.type !== 'success' || !result.url) {
      throw new Error('Google 로그인에 실패했어요');
    }

    const fragment = result.url.includes('#') ? result.url.split('#')[1] ?? '' : '';
    const queryString = result.url.includes('?') ? result.url.split('?')[1]?.split('#')[0] ?? '' : '';
    const params = new URLSearchParams(fragment || queryString);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const oauthError = params.get('error_description') ?? params.get('error');
    if (oauthError) {
      throw new Error(decodeURIComponent(oauthError));
    }
    if (!accessToken || !refreshToken) {
      throw new Error('Google 로그인 토큰을 받지 못했어요');
    }

    const { data: sessionData, error: setError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setError || !sessionData.session || !sessionData.user) {
      throw new Error(readErrorMessage(setError, 'Google 세션을 저장하지 못했어요'));
    }

    return {
      user: mapSupabaseUser(sessionData.user),
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
    };
  },

  // 기기에서 Sign in with Apple을 쓸 수 있는지 (iOS 13+ 실기기)
  async isAppleAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  },

  async signInWithApple(): Promise<SupabaseSessionResult> {
    // nonce: 원본은 Supabase로, SHA-256 해시는 Apple로 전달해 재생 공격을 방지
    const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '');
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
        throw new Error('로그인을 취소했어요');
      }
      throw new Error(readErrorMessage(err, 'Apple 로그인에 실패했어요'));
    }

    if (!credential.identityToken) {
      throw new Error('Apple 인증 토큰을 받지 못했어요');
    }

    // Apple은 최초 1회만 이름을 제공 → 받은 경우 메타데이터로 활용
    const fullName = [credential.fullName?.familyName, credential.fullName?.givenName]
      .filter(Boolean)
      .join('')
      .trim();

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error || !data.session || !data.user) {
      throw new Error(readErrorMessage(error, 'Apple 로그인에 실패했어요'));
    }

    // 최초 로그인 시 이름이 비어 있으면 Apple이 준 이름으로 보강
    if (fullName && !data.user.user_metadata?.name) {
      await supabase.auth.updateUser({ data: { name: fullName } }).catch(() => {});
    }

    return {
      user: mapSupabaseUser(data.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
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

  async signOut() {
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

export const authService = {
  login(payload: LoginPayload) {
    return request<LoginResponse>({
      method: 'POST',
      url: '/auth/login',
      data: payload,
    });
  },

  refresh(refreshToken: string) {
    return request<{ accessToken: string }>({
      method: 'POST',
      url: '/auth/refresh',
      data: { refreshToken },
    });
  },

  logout() {
    return request<{ success: true }>({
      method: 'DELETE',
      url: '/auth/logout',
    });
  },

  deleteAccount() {
    return request<{ deleted: true }>({
      method: 'DELETE',
      url: '/account',
    });
  },
};
