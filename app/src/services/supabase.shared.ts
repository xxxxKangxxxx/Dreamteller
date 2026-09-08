import type { User as SupabaseUser } from '@supabase/supabase-js';

import type { User } from '@/types/user';

/** Supabase 사용자 → 앱 사용자 모델. 플랫폼과 무관하므로 양쪽 구현이 공유한다. */
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
