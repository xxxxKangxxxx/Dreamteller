import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';
import { requestNotificationPermission } from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const TERMS_URL = 'https://dreamteller.io.kr/terms.html';
const PRIVACY_URL = 'https://dreamteller.io.kr/privacy.html';

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const reminderEnabled = useSettingsStore((s) => s.enabled);
  const reminderHour = useSettingsStore((s) => s.hour);
  const reminderMinute = useSettingsStore((s) => s.minute);
  const setReminder = useSettingsStore((s) => s.setReminder);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const reminderDate = useMemo(() => {
    const d = new Date();
    d.setHours(reminderHour, reminderMinute, 0, 0);
    return d;
  }, [reminderHour, reminderMinute]);

  const formatTime = (h: number, m: number) => {
    const period = h < 12 ? '오전' : '오후';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${period} ${hour12}:${String(m).padStart(2, '0')}`;
  };

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          '알림 권한이 필요해요',
          '기기 설정 > DreamTeller에서 알림을 허용해 주세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정 열기', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
      await setReminder({ enabled: true, hour: reminderHour, minute: reminderMinute });
    } else {
      setShowTimePicker(false);
      await setReminder({ enabled: false, hour: reminderHour, minute: reminderMinute });
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !date) return;
    void setReminder({ enabled: true, hour: date.getHours(), minute: date.getMinutes() });
  };

  const handleOpenURL = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('링크를 열 수 없어요', '잠시 후 다시 시도해 주세요.');
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>프로필</Text>
        <Card variant="default" padding="lg" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Text style={styles.profileName}>{user?.name ?? '익명'}</Text>
            {user?.plan ? (
              <Badge
                label={user.plan}
                variant={user.plan === 'PREMIUM' ? 'premium' : 'count'}
              />
            ) : null}
          </View>
          <Text style={styles.profileEmail}>{user?.email ?? '-'}</Text>
        </Card>

        <Text style={styles.sectionLabel}>알림</Text>
        <View style={styles.linkCard}>
          <View style={styles.linkRow}>
            <View style={styles.reminderTexts}>
              <Text style={styles.linkLabel}>아침 꿈 알림</Text>
              <Text style={styles.reminderHint}>
                매일 정해진 시간에 꿈 기록을 알려드려요
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={(v) => void handleToggleReminder(v)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.textPrimary}
            />
          </View>
          {reminderEnabled ? (
            <>
              <View style={styles.linkDivider} />
              <Pressable
                style={styles.linkRow}
                onPress={() => setShowTimePicker((p) => !p)}
                accessibilityRole="button"
                accessibilityLabel="알림 시간 변경"
              >
                <Text style={styles.linkLabel}>알림 시간</Text>
                <Text style={styles.reminderTime}>
                  {formatTime(reminderHour, reminderMinute)}
                </Text>
              </Pressable>
              {showTimePicker ? (
                <DateTimePicker
                  value={reminderDate}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor={colors.textPrimary}
                  style={styles.timePicker}
                />
              ) : null}
            </>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>약관 및 정책</Text>
        <View style={styles.linkCard}>
          <LinkRow label="서비스 이용약관" onPress={() => handleOpenURL(TERMS_URL)} />
          <View style={styles.linkDivider} />
          <LinkRow label="개인정보처리방침" onPress={() => handleOpenURL(PRIVACY_URL)} />
        </View>

        <Text style={styles.sectionLabel}>계정</Text>
        <Button
          label="로그아웃"
          variant="danger"
          onPress={handleLogout}
          loading={loggingOut}
          disabled={loggingOut}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

type LinkRowProps = {
  label: string;
  onPress: () => void;
};

function LinkRow({ label, onPress }: LinkRowProps) {
  return (
    <Pressable
      style={styles.linkRow}
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    ...textStyles.heading3,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 28 },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginTop: spacing.base,
  },
  profileCard: {
    gap: spacing.xs,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    ...textStyles.heading3,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  linkCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  linkLabel: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  linkDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  reminderTexts: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.base,
  },
  reminderHint: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  reminderTime: {
    ...textStyles.body,
    color: colors.primaryLight,
  },
  timePicker: {
    alignSelf: 'center',
  },
});
