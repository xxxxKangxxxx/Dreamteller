import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const showToast = useUIStore((s) => s.showToast);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuest = async () => {
    if (guestLoading) return;
    setGuestLoading(true);
    try {
      await continueAsGuest();
    } catch (err) {
      const message = err instanceof Error ? err.message : '게스트로 시작하지 못했어요';
      showToast(message, 'error');
      setGuestLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.spacerTop} />
      <View style={styles.brandBlock}>
        <Text style={styles.logo}>DreamTeller</Text>
        <Text style={styles.tagline}>대화하며 기록하는 꿈</Text>
      </View>
      <View style={styles.spacerBottom} />
      <View style={styles.actions}>
        <Button
          label="둘러보기"
          onPress={() => {
            void handleGuest();
          }}
          loading={guestLoading}
          disabled={guestLoading}
          fullWidth
        />
        <Button
          label="로그인 / 회원가입"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
          disabled={guestLoading}
          fullWidth
        />
        <Button
          label="앱 소개 보기"
          variant="ghost"
          onPress={() => navigation.navigate('Onboarding')}
          disabled={guestLoading}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
  },
  spacerTop: {
    flex: 1,
  },
  spacerBottom: {
    flex: 1.8,
  },
  brandBlock: {
    gap: spacing.sm,
  },
  logo: {
    ...textStyles.heading1,
    color: colors.textPrimary,
  },
  tagline: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
  },
});
