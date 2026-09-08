import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export { mapSupabaseUser } from '@/services/supabase.shared';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다',
  );
}

/**
 * Supabase 클라이언트의 웹 구현. 네이티브(`supabase.ts`)와 두 가지가 다르다.
 *
 * 1. `storage`를 넘기지 않는다 — 웹에서는 SDK 기본값인 localStorage가 맞다.
 *    (네이티브는 AsyncStorage를 명시해야 한다)
 * 2. `detectSessionInUrl: true` — 웹 OAuth는 인앱 브라우저가 아니라 **페이지 리다이렉트**로
 *    돌아온다. 콜백 URL 프래그먼트에 담겨 오는 토큰을 SDK가 직접 주워 세션으로
 *    만들게 해야 한다. 네이티브에서 이걸 켜지 않는 이유는 거기선 `WebBrowser`가
 *    돌려준 URL을 코드가 직접 파싱하기 때문이다.
 *
 * 또 `AppState` 리스너를 달지 않는다. 그건 앱이 백그라운드로 가면 JS 타이머가 멈추는
 * RN 특성을 메우려는 배선인데, 브라우저 탭에는 해당하지 않는다.
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
