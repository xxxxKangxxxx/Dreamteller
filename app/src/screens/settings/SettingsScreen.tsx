import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const TERMS_URL = 'https://dreamteller.io.kr/terms.html';
const PRIVACY_URL = 'https://dreamteller.io.kr/privacy.html';

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

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
});
