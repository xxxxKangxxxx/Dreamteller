import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

export type ColorScheme = 'dark' | 'light';

interface UIState {
  colorScheme: ColorScheme;
  isNetworkOnline: boolean;
  toasts: Toast[];
  setColorScheme: (scheme: ColorScheme) => void;
  setNetworkOnline: (online: boolean) => void;
  showToast: (message: string, variant?: ToastVariant) => string;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  colorScheme: 'dark',
  isNetworkOnline: true,
  toasts: [],

  setColorScheme(scheme) {
    set({ colorScheme: scheme });
  },

  setNetworkOnline(online) {
    set({ isNetworkOnline: online });
  },

  showToast(message, variant = 'info') {
    const id = `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    set({ toasts: [...get().toasts, { id, message, variant }] });
    return id;
  },

  dismissToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
