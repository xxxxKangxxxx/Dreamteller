import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * 아침 꿈 알림 (로컬 알림, 서버 없음).
 * 매일 지정 시각에 1회 반복 알림 → 탭하면 RecordChat으로 이동.
 */

const ANDROID_CHANNEL_ID = 'morning-dream';
export const NOTIFICATION_SCREEN_RECORD = 'RecordChat';

const REMINDER_TITLE = '간밤의 꿈, 기억나세요?';
const REMINDER_BODY = '사라지기 전에 지금 기록해보세요';

let handlerConfigured = false;

/** 포그라운드에서도 알림 배너/소리가 뜨도록 핸들러 등록 (앱 시작 시 1회) */
export function configureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: '아침 꿈 알림',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** 알림 권한 요청 (이미 허용돼 있으면 즉시 true). 사용자가 토글을 켤 때 호출 */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** 기존 예약을 모두 지우고 매일 hour:minute에 반복 알림 예약 */
export async function scheduleDailyReminder(hour: number, minute: number) {
  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: REMINDER_TITLE,
      body: REMINDER_BODY,
      data: { screen: NOTIFICATION_SCREEN_RECORD },
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/** 예약된 알림 모두 취소 (토글 OFF 시) */
export async function cancelDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
