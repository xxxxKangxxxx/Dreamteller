import { create } from 'zustand';

import { tokenStorage } from '@/services/api';
import { supabaseAuth } from '@/services/authService';
import { mapSupabaseUser, supabase } from '@/services/supabase';
import type { User } from '@/types/user';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  hydrate: () => Promise<void>;
  login: (params: { user: User; accessToken: string; refreshToken: string }) => Promise<void>;
  logout: () => Promise<void>;
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

  async logout() {
    try {
      await supabaseAuth.signOut();
    } catch {
      // 네트워크 등 실패해도 로컬 세션은 정리
    }
    await tokenStorage.clear();
    set({ status: 'unauthenticated', user: null });
  },

  updateUser(patch) {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...patch } });
  },
}));
