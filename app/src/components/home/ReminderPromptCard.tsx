import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TimePicker } from '@/components/ui/TimePicker';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles, typography } from '@/constants/typography';
import {
  isReminderSupported,
  requestNotificationPermission,
} from '@/services/notificationService';
import { shouldShowReminderPrompt, useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { showAlert } from '@/utils/alert';
import { formatClockKo } from '@/utils/date';

/**
 * 홈의 아침 알림 제안 카드.
 *
 * 앱을 설치하는 순간(낮)과 꿈을 기억하는 순간(기상 직후)이 달라서, 첫 실행에 기록할 꿈이
 * 없으면 그대로 이탈하는 사용자가 대부분이었다. 알림은 설정 화면 안쪽에만 있어서
 * 거의 켜지지 않았으므로, 홈에서 시각을 고르고 버튼 한 번으로 권한 요청 + 예약까지 끝낸다.
 */
export function ReminderPromptCard() {
  const visible = useSettingsStore(shouldShowReminderPrompt);
  const defaultHour = useSettingsStore((s) => s.hour);
  const defaultMinute = useSettingsStore((s) => s.minute);
  const setReminder = useSettingsStore((s) => s.setReminder);
  const dismiss = useSettingsStore((s) => s.dismissReminderPrompt);
  const showToast = useUIStore((s) => s.showToast);

  const initialTime = useMemo(() => {
    const d = new Date();
    d.setHours(defaultHour, defaultMinute, 0, 0);
    return d;
  }, [defaultHour, defaultMinute]);
  const [time, setTime] = useState<Date>(initialTime);
  // 안드로이드 시각 선택기는 열자마자 뜨는 모달이라 탭할 때만 띄운다. iOS는 휠을 카드 안에 펼쳐 둔다
  const [androidPickerOpen, setAndroidPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isReminderSupported || !visible) return null;

  const hour = time.getHours();
  const minute = time.getMinutes();

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showAlert(
          '알림 권한이 필요해요',
          '기기 설정 > DreamTeller에서 알림을 허용해 주세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정 열기', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
      await setReminder({ enabled: true, hour, minute });
      showToast(`매일 ${formatClockKo(hour, minute)}에 꿈을 물어볼게요`, 'success');
    } catch {
      showToast('알림을 설정하지 못했어요. 설정에서 다시 시도해 주세요', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="glass" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="alarm-outline" size={18} color={colors.primaryLight} />
        <Text style={styles.title} lineBreakStrategyIOS="hangul-word">
          꿈은 깨고 나면 금방 사라져요
        </Text>
      </View>
      <Text style={styles.desc} lineBreakStrategyIOS="hangul-word">
        일어날 즈음 Luna가 먼저 물어볼게요. 몇 시에 알려드릴까요?
      </Text>

      {Platform.OS === 'ios' ? (
        <TimePicker
          value={time}
          onChange={setTime}
          onRequestClose={() => {}}
          style={styles.picker}
        />
      ) : (
        <>
          <Pressable
            style={styles.androidTimeRow}
            onPress={() => setAndroidPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="알림 시간 선택"
          >
            <Text style={styles.androidTime}>{formatClockKo(hour, minute)}</Text>
          </Pressable>
          {androidPickerOpen ? (
            <TimePicker
              value={time}
              onChange={setTime}
              onRequestClose={() => setAndroidPickerOpen(false)}
            />
          ) : null}
        </>
      )}

      <View style={styles.actions}>
        <Button
          label="다음에"
          variant="secondary"
          onPress={() => void dismiss()}
          disabled={saving}
          style={styles.laterButton}
        />
        <Button
          label="알림 받기"
          variant="primary"
          onPress={() => void handleConfirm()}
          loading={saving}
          disabled={saving}
          style={styles.confirmButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...textStyles.bodyMd,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * 1.4,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  desc: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  picker: {
    alignSelf: 'center',
  },
  androidTimeRow: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  androidTime: {
    ...textStyles.heading3,
    color: colors.primaryLight,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  laterButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});
