const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

export const config = {
  apiBaseUrl,
  sessionIdleTimeoutMs: 30 * 60 * 1000,
} as const;
