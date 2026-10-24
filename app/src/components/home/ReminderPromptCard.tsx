import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import {
  isReminderSupported,
  requestNotificationPermission,
} from '@/services/notificationService';
import { shouldShowReminderPrompt, useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { showAlert } from '@/utils/alert';

/**
 * 홈 상단의 아침 알림 제안 카드.
 *
 * 앱을 설치하는 순간(낮)과 꿈을 기억하는 순간(기상 직후)이 달라서, 첫 실행에 기록할 꿈이
 * 없으면 그대로 이탈하는 사용자가 대부분이었다. 알림은 설정 화면 안쪽에만 있어서
 * 거의 켜지지 않았으므로, 시간 버튼 한 번으로 권한 요청 + 예약까지 끝내게 한다.
 */

const TIME_OPTIONS = [7, 8, 9] as const;

interface ReminderPromptCardProps {
  onPressOtherTime: () => void;
}

export function ReminderPromptCard({ onPressOtherTime }: ReminderPromptCardProps) {
  const visible = useSettingsStore(shouldShowReminderPrompt);
  const setReminder = useSettingsStore((s) => s.setReminder);
  const dismiss = useSettingsStore((s) => s.dismissReminderPrompt);
  const showToast = useUIStore((s) => s.showToast);
  const [pendingHour, setPendingHour] = useState<number | null>(null);

  if (!isReminderSupported || !visible) return null;

  const handleSelect = async (hour: number) => {
    if (pendingHour !== null) return;
    setPendingHour(hour);
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
      await setReminder({ enabled: true, hour, minute: 0 });
      showToast(`매일 오전 ${hour}시에 꿈을 물어볼게요`, 'success');
    } catch {
      showToast('알림을 설정하지 못했어요. 설정에서 다시 시도해 주세요', 'error');
    } finally {
      setPendingHour(null);
    }
  };

  return (
    <Card variant="glass" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="alarm-outline" size={20} color={colors.primaryLight} />
        <Text style={styles.title}>꿈은 깨고 나면 금방 사라져요</Text>
      </View>
      <Text style={styles.desc}>
        매일 아침 일어날 즈음 Luna가 먼저 물어볼게요. 몇 시가 좋아요?
      </Text>

      <View style={styles.chips}>
        {TIME_OPTIONS.map((hour) => (
          <Pressable
            key={hour}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => void handleSelect(hour)}
            disabled={pendingHour !== null}
            accessibilityRole="button"
            accessibilityLabel={`매일 오전 ${hour}시에 알림 받기`}
          >
            <Text style={styles.chipText}>
              {pendingHour === hour ? '설정 중…' : `오전 ${hour}시`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onPressOtherTime} hitSlop={8} accessibilityRole="button">
          <Text style={styles.footerLink}>다른 시간</Text>
        </Pressable>
        <Pressable onPress={() => void dismiss()} hitSlop={8} accessibilityRole="button">
          <Text style={styles.footerLink}>다음에</Text>
        </Pressable>
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
    gap: spacing.sm,
  },
  title: {
    ...textStyles.heading3,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  desc: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  chipPressed: {
    backgroundColor: colors.primarySurface,
  },
  chipText: {
    ...textStyles.label,
    color: colors.textInverse,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  footerLink: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
});
