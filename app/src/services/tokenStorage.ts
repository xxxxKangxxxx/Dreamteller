import { secureStorage } from '@/utils/secureStorage';

const ACCESS_TOKEN_KEY = 'dt.accessToken';
const REFRESH_TOKEN_KEY = 'dt.refreshToken';

/**
 * API 요청에 붙일 토큰 보관소.
 *
 * 네이티브에서는 Supabase SDK 저장소와 별개로 SecureStore에 미러를 둔다. axios
 * 인터셉터가 동기에 가깝게 토큰을 읽어야 하기 때문이다.
 * 웹 구현은 `tokenStorage.web.ts` 참조 — 거기서는 미러를 두지 않는다.
 */
export const tokenStorage = {
  getAccessToken(): Promise<string | null> {
    return secureStorage.getItem(ACCESS_TOKEN_KEY);
  },
  async setAccessToken(token: string): Promise<void> {
    await secureStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  getRefreshToken(): Promise<string | null> {
    return secureStorage.getItem(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    await secureStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    await secureStorage.removeItem(ACCESS_TOKEN_KEY);
    await secureStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
