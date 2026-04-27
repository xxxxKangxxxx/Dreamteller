import { mapSupabaseUser, supabase } from './supabase';
import { request } from './api';
import type { User } from '@/types/user';

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
