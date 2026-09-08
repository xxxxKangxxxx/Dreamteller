import { supabase } from '@/services/supabase';

/**
 * tokenStorage의 웹 구현 — **미러를 만들지 않는다.**
 *
 * 웹에서 Supabase SDK는 이미 세션(액세스/리프레시 토큰)을 localStorage에 보관한다.
 * 같은 토큰을 한 벌 더 복사해두면 XSS 노출 표면만 늘어나고, 두 저장소가 어긋나면
 * 만료된 토큰으로 요청이 나가는 버그가 생긴다. 그래서 읽기는 SDK 세션을 그대로
 * 조회하고, 쓰기(`set*`)와 `clear`는 의도적으로 no-op이다.
 *
 * no-op이어도 호출부 의미는 유지된다:
 * - `logout()`/`deleteAccount()`는 `signOut()`으로 SDK 세션을 지우므로 이후 조회가 null
 * - `sessionExpired()`는 원래도 SDK 세션을 파괴하지 않는 것이 의도다 (authStore 주석 참조).
 *   화면 전환은 authStore 상태가 결정하므로 여기서 지울 것이 없다.
 *
 * getSession()은 메모리 캐시를 먼저 보므로 인터셉터에서 매 요청 불러도 부담이 없다.
 */
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  async setAccessToken(_token: string): Promise<void> {
    // no-op — Supabase SDK가 진실 소스
  },
  async getRefreshToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.refresh_token ?? null;
  },
  async setRefreshToken(_token: string): Promise<void> {
    // no-op — Supabase SDK가 진실 소스
  },
  async clear(): Promise<void> {
    // no-op — 세션 파기는 supabase.auth.signOut()이 담당
  },
};
