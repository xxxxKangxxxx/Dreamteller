import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';

import { config } from '@/constants/config';
import { supabase } from '@/services/supabase';
import type { ApiError as ApiErrorShape, ApiResponse } from '@/types/api';

const ACCESS_TOKEN_KEY = 'dt.accessToken';
const REFRESH_TOKEN_KEY = 'dt.refreshToken';

export const tokenStorage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async setAccessToken(token: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/**
 * 액세스 토큰 갱신.
 *
 * 이전 구현은 `POST {apiBaseUrl}/auth/refresh`를 불렀는데 **백엔드에 그 라우트가
 * 없다** (인증은 전부 Supabase가 직접 한다). 그래서 이 함수는 항상 실패했고,
 * 실패가 곧바로 `tokenStorage.clear()` + `onUnauthorized()` → `signOut()`으로
 * 이어져 **멀쩡한 세션을 가진 사용자를 강제 로그아웃**시켰다. (CODE_REVIEW A1)
 *
 * 특히 게스트(익명) 사용자는 재로그인 수단이 없어서, 한 번 signOut되면 그 계정의
 * 꿈 기록에 **영구히 접근할 수 없게 된다.**
 *
 * 진실 소스인 Supabase SDK로 갱신한다. SDK가 자기 저장소의 refresh token을 쓰므로
 * 미러(SecureStore)에 의존하지 않는다.
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    // onAuthStateChange(TOKEN_REFRESHED)도 미러를 갱신하지만, 방금 받은 토큰을
    // 곧바로 재시도에 써야 하므로 여기서도 써둔다.
    await tokenStorage.setAccessToken(data.session.access_token);
    await tokenStorage.setRefreshToken(data.session.refresh_token);
    return data.session.access_token;
  } catch {
    return null;
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15_000,
});

api.interceptors.request.use(async (request) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorShape>) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api.request(originalRequest);
      }

      await tokenStorage.clear();
      onUnauthorized?.();
    }

    const body = error.response?.data;
    if (body && body.success === false) {
      throw new ApiError(body.error.code, body.error.message, status ?? 0);
    }
    throw new ApiError(
      'NETWORK_ERROR',
      error.message || '네트워크 오류가 발생했어요',
      status ?? 0,
    );
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiResponse<T>>(config);
  const payload = response.data;
  if (!payload.success) {
    throw new ApiError(payload.error.code, payload.error.message, response.status);
  }
  return payload.data;
}
