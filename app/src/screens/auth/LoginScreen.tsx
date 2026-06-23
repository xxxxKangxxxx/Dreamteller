import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';
import { supabaseAuth } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Navigation>();
  const login = useAuthStore((s) => s.login);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const showToast = useUIStore((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [appleSubmitting, setAppleSubmitting] = useState(false);
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabaseAuth.isAppleAvailable().then((available) => {
      if (mounted) setAppleAvailable(available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const anySubmitting = submitting || googleSubmitting || appleSubmitting || guestSubmitting;
  const canSubmit = email.trim().length > 0 && password.length >= 6 && !anySubmitting;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await supabaseAuth.signInWithEmail(email.trim(), password);
      await login(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했어요';
      showToast(message, 'error');
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (anySubmitting) return;
    setGoogleSubmitting(true);
    try {
      const result = await supabaseAuth.signInWithGoogle();
      await login(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google 로그인에 실패했어요';
      if (message !== '로그인을 취소했어요') {
        showToast(message, 'error');
      }
      setGoogleSubmitting(false);
    }
  };

  const handleAppleLogin = async () => {
    if (anySubmitting) return;
    setAppleSubmitting(true);
    try {
      const result = await supabaseAuth.signInWithApple();
      await login(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Apple 로그인에 실패했어요';
      if (message !== '로그인을 취소했어요') {
        showToast(message, 'error');
      }
      setAppleSubmitting(false);
    }
  };

  const handleGuest = async () => {
    if (anySubmitting) return;
    setGuestSubmitting(true);
    try {
      await continueAsGuest();
    } catch (err) {
      const message = err instanceof Error ? err.message : '게스트로 시작하지 못했어요';
      showToast(message, 'error');
      setGuestSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>로그인</Text>
            <Text style={styles.subtitle}>이메일로 시작해요</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!anySubmitting}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 (6자 이상)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!anySubmitting}
            />
          </View>

          <View style={styles.actions}>
            <Button
              label="로그인"
              variant="primary"
              onPress={() => {
                void handleLogin();
              }}
              disabled={!canSubmit}
              loading={submitting}
              fullWidth
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {Platform.OS === 'ios' && appleAvailable ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={radius.md}
                style={styles.appleButton}
                onPress={() => {
                  void handleAppleLogin();
                }}
              />
            ) : null}

            <Button
              label="Google로 계속하기"
              variant="secondary"
              onPress={() => {
                void handleGoogleLogin();
              }}
              disabled={anySubmitting}
              loading={googleSubmitting}
              fullWidth
            />

            <Button
              label="회원가입"
              variant="ghost"
              onPress={() => navigation.navigate('Signup')}
              disabled={anySubmitting}
              fullWidth
            />

            <Button
              label="로그인 없이 둘러보기"
              variant="ghost"
              onPress={() => {
                void handleGuest();
              }}
              disabled={anySubmitting}
              loading={guestSubmitting}
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  headerBlock: {
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  title: {
    ...textStyles.heading1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.sm,
  },
  input: {
    height: 48,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 0,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    ...textStyles.body,
    // 단일 행 입력창은 상속된 lineHeight가 있으면 iOS에서 수직 중앙이 틀어짐 → 해제
    lineHeight: undefined,
    textAlignVertical: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
  appleButton: {
    height: 48,
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
});
