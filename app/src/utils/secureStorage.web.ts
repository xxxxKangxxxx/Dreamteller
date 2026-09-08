/**
 * secureStorage의 웹 구현.
 *
 * 브라우저에는 Keychain에 대응하는 저장소가 없다. localStorage는 XSS에 노출되므로
 * **여기에는 토큰을 넣지 않는다** — 액세스/리프레시 토큰은 Supabase SDK가 자기
 * 저장소에서 관리하고, 앱은 `services/tokenStorage.web.ts`를 통해 SDK에서 직접 읽는다.
 * 이 파일이 담는 것은 진행 중인 꿈 기록 세션 같은 낮은 민감도 데이터뿐이다.
 *
 * 프라이빗 모드나 저장소 차단 설정에서는 접근 자체가 throw하므로 전부 감싼다.
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // 저장 실패는 무시 — 세션 임시저장은 실패해도 기록 자체는 계속 가능해야 한다
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 무시
    }
  },
};
