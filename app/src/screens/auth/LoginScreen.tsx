import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Navigation>();
  const login = useAuthStore((s) => s.login);

  const handleDevLogin = async () => {
    await login({
      user: {
        id: 'dev-user',
        name: '개발자',
        email: 'dev@dreamteller.local',
        plan: 'FREE',
      },
      accessToken: 'dev-access-token',
      refreshToken: 'dev-refresh-token',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>로그인</Text>
        <Text style={styles.subtitle}>Apple / Google / 이메일 로그인 — 곧 추가됩니다 ✨</Text>
      </View>

      <View style={styles.actions}>
        {__DEV__ ? (
          <Button
            label="개발용 로그인 (시뮬레이터 전용)"
            variant="primary"
            onPress={() => {
              void handleDevLogin();
            }}
            fullWidth
          />
        ) : null}
        <Button
          label="회원가입"
          variant="ghost"
          onPress={() => navigation.navigate('Signup')}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    ...textStyles.heading1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
  },
});
