import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { User } from '@/types/user';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다',
  );
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// RN에서는 앱이 백그라운드로 가면 JS 타이머가 멈춰 autoRefreshToken이 제때 돌지
// 못한다. 그 상태로 1시간(액세스 토큰 TTL) 뒤에 복귀하면, 갱신 타이머와 화면의
// 첫 API 호출이 경쟁하다가 만료 토큰으로 요청이 나가 401이 뜬다.
// 포그라운드 복귀 시점에 갱신을 명시적으로 재개해 그 경쟁을 없앤다.
// (supabase-js가 React Native에서 권장하는 필수 배선)
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});

export function mapSupabaseUser(user: SupabaseUser): User {
  const isAnonymous = user.is_anonymous === true;
  const metadataName = (user.user_metadata?.name as string | undefined) ?? undefined;
  const fallbackName = isAnonymous ? '게스트' : user.email?.split('@')[0] ?? '사용자';
  return {
    id: user.id,
    email: user.email ?? '',
    name: metadataName ?? fallbackName,
    plan: 'FREE',
    isAnonymous,
  };
}
