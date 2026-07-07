import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleLogo } from '@/components/icons/GoogleLogo';
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
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={radius.md}
                style={styles.appleButton}
                onPress={() => {
                  void handleAppleLogin();
                }}
              />
            ) : null}

            {/* Google 공식 브랜드 버튼(neutral/white). 색상은 Google 가이드라인 고정값. */}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: anySubmitting, busy: googleSubmitting }}
              disabled={anySubmitting}
              onPress={() => {
                void handleGoogleLogin();
              }}
              style={({ pressed }) => [
                styles.googleButton,
                { opacity: anySubmitting ? 0.5 : pressed ? 0.85 : 1 },
              ]}
            >
              {googleSubmitting ? (
                <ActivityIndicator color="#1F1F1F" />
              ) : (
                <View style={styles.googleContent}>
                  <GoogleLogo size={20} />
                  <Text style={styles.googleLabel}>Google로 계속하기</Text>
                </View>
              )}
            </Pressable>

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
  // Google 공식 neutral 버튼: 흰 배경 + 회색 테두리 + 진한 텍스트 (Google 브랜드 가이드 고정값)
  googleButton: {
    height: 48,
    alignSelf: 'stretch',
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#747775',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  googleLabel: {
    // Apple 네이티브 버튼 텍스트 크기에 맞춤(48px 높이 기준). 필요 시 실기기에서 ±1~2 조정
    fontSize: 18,
    fontWeight: '500',
    color: '#1F1F1F',
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
