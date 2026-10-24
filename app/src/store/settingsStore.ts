import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { cancelDailyReminder, scheduleDailyReminder } from '@/services/notificationService';

const STORAGE_KEY = '@dreamteller/reminder';
const PROMPT_DISMISSED_KEY = '@dreamteller/reminder-prompt-dismissed-at';

export const DEFAULT_REMINDER_HOUR = 8;
export const DEFAULT_REMINDER_MINUTE = 0;

/** 홈의 알림 제안 카드에서 "다음에"를 누르면 이 기간 동안 다시 띄우지 않는다 */
const PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

interface ReminderPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}

interface SettingsState extends ReminderPrefs {
  hydrated: boolean;
  /** 알림 제안 카드를 "다음에"로 닫은 시각 (epoch ms). 닫은 적 없으면 null */
  promptDismissedAt: number | null;
  hydrate: () => Promise<void>;
  /** 토글/시간 변경을 저장하고 OS 예약을 동기화 */
  setReminder: (next: ReminderPrefs) => Promise<void>;
  dismissReminderPrompt: () => Promise<void>;
}

async function persist(prefs: ReminderPrefs) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/** 홈에 알림 제안 카드를 띄울지 — 알림이 꺼져 있고, 최근에 닫지 않았을 때만 */
export function shouldShowReminderPrompt(
  state: Pick<SettingsState, 'hydrated' | 'enabled' | 'promptDismissedAt'>,
  now: number = Date.now(),
): boolean {
  if (!state.hydrated || state.enabled) return false;
  if (state.promptDismissedAt === null) return true;
  return now - state.promptDismissedAt > PROMPT_SNOOZE_MS;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  enabled: false,
  hour: DEFAULT_REMINDER_HOUR,
  minute: DEFAULT_REMINDER_MINUTE,
  hydrated: false,
  promptDismissedAt: null,

  async hydrate() {
    try {
      const dismissedRaw = await AsyncStorage.getItem(PROMPT_DISMISSED_KEY);
      const dismissedAt = dismissedRaw ? Number(dismissedRaw) : NaN;
      if (Number.isFinite(dismissedAt)) set({ promptDismissedAt: dismissedAt });
    } catch {
      // 못 읽으면 닫은 적 없는 것으로 본다
    }
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

  async dismissReminderPrompt() {
    const now = Date.now();
    set({ promptDismissedAt: now });
    try {
      await AsyncStorage.setItem(PROMPT_DISMISSED_KEY, String(now));
    } catch {
      // 저장 실패해도 이번 실행 동안은 숨겨진다
    }
  },
}));
