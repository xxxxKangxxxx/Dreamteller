import { create } from 'zustand';

import { tokenStorage } from '@/services/api';
import { authService, supabaseAuth } from '@/services/authService';
import { mapSupabaseUser, supabase } from '@/services/supabase';
import type { User } from '@/types/user';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  hydrate: () => Promise<void>;
  login: (params: { user: User; accessToken: string; refreshToken: string }) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  sessionExpired: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

let supabaseSubscriptionStarted = false;

function startSupabaseSubscription(): void {
  if (supabaseSubscriptionStarted) return;
  supabaseSubscriptionStarted = true;

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session && session.user) {
      await tokenStorage.setAccessToken(session.access_token);
      await tokenStorage.setRefreshToken(session.refresh_token);
      useAuthStore.setState({
        status: 'authenticated',
        user: mapSupabaseUser(session.user),
      });
    } else {
      await tokenStorage.clear();
      useAuthStore.setState({ status: 'unauthenticated', user: null });
    }
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,

  async hydrate() {
    set({ status: 'loading' });
    startSupabaseSubscription();

    const restored = await supabaseAuth.restoreSession();
    if (restored) {
      await tokenStorage.setAccessToken(restored.accessToken);
      await tokenStorage.setRefreshToken(restored.refreshToken);
      set({ status: 'authenticated', user: restored.user });
      return;
    }

    await tokenStorage.clear();
    set({ status: 'unauthenticated', user: null });
  },

  async login({ user, accessToken, refreshToken }) {
    await tokenStorage.setAccessToken(accessToken);
    await tokenStorage.setRefreshToken(refreshToken);
    set({ status: 'authenticated', user });
  },

  async continueAsGuest() {
    const result = await supabaseAuth.continueAsGuest();
    await tokenStorage.setAccessToken(result.accessToken);
    await tokenStorage.setRefreshToken(result.refreshToken);
    set({ status: 'authenticated', user: result.user });
  },

  async deleteAccount() {
    // 유효한 세션(JWT)으로 서버에 삭제 요청 → auth.users 삭제(cascade)
    await authService.deleteAccount();
    try {
      await supabaseAuth.signOut();
    } catch {
      // 이미 삭제된 계정이라 signOut이 실패할 수 있음 → 무시
    }
    await tokenStorage.clear();
    set({ status: 'unauthenticated', user: null });
  },

  async logout() {
    try {
      await supabaseAuth.signOut();
    } catch {
      // 네트워크 등 실패해도 로컬 세션은 정리
    }
    await tokenStorage.clear();
    set({ status: 'unauthenticated', user: null });
  },

  /**
   * 토큰 갱신에 실패해 401이 확정됐을 때 부른다.
   *
   * `logout()`과 달리 **`signOut()`을 부르지 않는다.** 네트워크 오류 같은 일시적
   * 실패로 Supabase 세션을 파괴하면, 재로그인 수단이 없는 **게스트(익명) 사용자는
   * 자기 꿈 기록에 영구히 접근할 수 없게 된다** — "둘러보기"를 다시 눌러도 새 익명
   * 계정이 생길 뿐이다.
   *
   * 로컬 상태만 정리해 로그인 화면으로 보내고, 세션이 실제로 살아 있으면 다음
   * 콜드 스타트의 `hydrate()`가 복구한다.
   */
  async sessionExpired() {
    await tokenStorage.clear();
    set({ status: 'unauthenticated', user: null });
  },

  updateUser(patch) {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...patch } });
  },
}));
