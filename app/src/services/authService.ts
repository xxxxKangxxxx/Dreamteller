import * as Linking from 'expo-linking';
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

  async signInWithGoogle(): Promise<SupabaseSessionResult> {
    const redirectTo = Linking.createURL('auth-callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
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
};
