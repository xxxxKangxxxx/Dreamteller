import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';

import { config } from '@/constants/config';
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

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post<ApiResponse<{ accessToken: string }>>(
      `${config.apiBaseUrl}/auth/refresh`,
      { refreshToken },
      { timeout: 10_000 },
    );
    const payload = response.data;
    if (!payload.success) return null;
    await tokenStorage.setAccessToken(payload.data.accessToken);
    return payload.data.accessToken;
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
