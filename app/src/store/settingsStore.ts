import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { cancelDailyReminder, scheduleDailyReminder } from '@/services/notificationService';

const STORAGE_KEY = '@dreamteller/reminder';

export const DEFAULT_REMINDER_HOUR = 8;
export const DEFAULT_REMINDER_MINUTE = 0;

interface ReminderPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}

interface SettingsState extends ReminderPrefs {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** 토글/시간 변경을 저장하고 OS 예약을 동기화 */
  setReminder: (next: ReminderPrefs) => Promise<void>;
}

async function persist(prefs: ReminderPrefs) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export const useSettingsStore = create<SettingsState>((set) => ({
  enabled: false,
  hour: DEFAULT_REMINDER_HOUR,
  minute: DEFAULT_REMINDER_MINUTE,
  hydrated: false,

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const prefs = JSON.parse(raw) as ReminderPrefs;
        set({ ...prefs, hydrated: true });
        // 저장된 설정대로 OS 예약을 보장 (앱 재설치/시간 변경 대비)
        if (prefs.enabled) {
          await scheduleDailyReminder(prefs.hour, prefs.minute);
        }
        return;
      }
    } catch {
      // 손상된 값이면 기본값 유지
    }
    set({ hydrated: true });
  },

  async setReminder(next) {
    set(next);
    await persist(next);
    if (next.enabled) {
      await scheduleDailyReminder(next.hour, next.minute);
    } else {
      await cancelDailyReminder();
    }
  },
}));
