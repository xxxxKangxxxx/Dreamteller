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
