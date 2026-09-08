/**
 * notificationService의 웹 구현 — 전부 no-op.
 *
 * 아침 꿈 알림은 OS 로컬 반복 알림이라 브라우저에 대응물이 없다. 웹 푸시로 흉내내려면
 * VAPID 키와 서비스 워커, 그리고 알림을 쏘아줄 서버가 필요하고, iOS Safari는 홈 화면에
 * 추가된 상태에서만 동작한다 — 별도 Phase로 미룬다.
 *
 * `isReminderSupported: false`를 보고 설정 화면이 알림 UI를 통째로 숨기므로,
 * 아래 함수들은 실제로는 호출되지 않는 방어선이다.
 */
export const NOTIFICATION_SCREEN_RECORD = 'RecordChat';

export const isReminderSupported = false;

export function configureNotificationHandler(): void {
  // no-op
}

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleDailyReminder(_hour: number, _minute: number): Promise<void> {
  // no-op
}

export async function cancelDailyReminder(): Promise<void> {
  // no-op
}

export function addRecordIntentListener(_onRecordIntent: () => void): () => void {
  return () => {};
}
