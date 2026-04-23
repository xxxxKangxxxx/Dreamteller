import { create } from 'zustand';

import { tokenStorage } from '@/services/api';
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

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,

  async hydrate() {
    set({ status: 'loading' });
    const accessToken = await tokenStorage.getAccessToken();
    if (!accessToken) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    set({ status: 'authenticated' });
  },

  async login({ user, accessToken, refreshToken }) {
    await tokenStorage.setAccessToken(accessToken);
    await tokenStorage.setRefreshToken(refreshToken);
    set({ status: 'authenticated', user });
  },

  async logout() {
    await tokenStorage.clear();
    set({ status: 'unauthenticated', user: null });
  },

  updateUser(patch) {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...patch } });
  },
}));
