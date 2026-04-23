import * as SecureStore from 'expo-secure-store';

import type { RecordSession } from '@/store/recordStore';

const KEY = 'dt.recordSession';

export const sessionStorage = {
  async save(session: RecordSession) {
    await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  },
  async load(): Promise<RecordSession | null> {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RecordSession;
    } catch {
      return null;
    }
  },
  async clear() {
    await SecureStore.deleteItemAsync(KEY);
  },
};
