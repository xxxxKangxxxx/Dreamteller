import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient, type User as SupabaseUser } from '@supabase/supabase-js';

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
