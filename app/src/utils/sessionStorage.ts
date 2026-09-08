import type { RecordSession } from '@/store/recordStore';
import { secureStorage } from '@/utils/secureStorage';

const KEY = 'dt.recordSession';

export const sessionStorage = {
  async save(session: RecordSession) {
    await secureStorage.setItem(KEY, JSON.stringify(session));
  },
  async load(): Promise<RecordSession | null> {
    const raw = await secureStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RecordSession;
    } catch {
      return null;
    }
  },
  async clear() {
    await secureStorage.removeItem(KEY);
  },
};
