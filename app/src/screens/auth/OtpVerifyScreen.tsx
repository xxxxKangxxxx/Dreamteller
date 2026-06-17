import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles, typography } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';
import { supabaseAuth } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'OtpVerify'>;
type Route = RouteProp<RootStackParamList, 'OtpVerify'>;

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export function OtpVerifyScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { email } = route.params;

  const login = useAuthStore((s) => s.login);
  const showToast = useUIStore((s) => s.showToast);

  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const canVerify = code.length === CODE_LENGTH && !verifying;

  const handleVerify = async () => {
    if (!canVerify) return;
    setVerifying(true);
    try {
      const result = await supabaseAuth.verifySignupOtp(email, code);
      await login(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '인증에 실패했어요';
      showToast(message, 'error');
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await supabaseAuth.resendSignupOtp(email);
      showToast('인증 코드를 다시 보냈어요', 'success');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      const message = err instanceof Error ? err.message : '재발송에 실패했어요';
      showToast(message, 'error');
    } finally {
      setResending(false);
    }
  };

  const onChangeCode = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.headerBlock}>
            <Text style={styles.title}>이메일 인증</Text>
            <Text style={styles.subtitle}>
              <Text style={styles.emailHighlight}>{email}</Text>
              {'\n'}로 보낸 6자리 코드를 입력해주세요
            </Text>
          </View>

          <View style={styles.codeWrapper}>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={onChangeCode}
              style={styles.hiddenInput}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus
              editable={!verifying}
              caretHidden
            />
            <Pressable
              style={styles.codeCells}
              onPress={() => inputRef.current?.focus()}
            >
              {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                const char = code[i] ?? '';
                const isActive = i === code.length;
                return (
                  <View
                    key={i}
                    style={[
                      styles.codeCell,
                      isActive && styles.codeCellActive,
                      char && styles.codeCellFilled,
                    ]}
                  >
                    <Text style={styles.codeChar}>{char}</Text>
                  </View>
                );
              })}
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Button
              label="인증하기"
              variant="primary"
              onPress={() => {
                void handleVerify();
              }}
              disabled={!canVerify}
              loading={verifying}
              fullWidth
            />
            <Pressable
              onPress={() => {
                void handleResend();
              }}
              disabled={cooldown > 0 || resending}
              style={styles.resendBlock}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.resendText,
                  (cooldown > 0 || resending) && styles.resendTextDisabled,
                ]}
              >
                {cooldown > 0
                  ? `재발송하기 (${cooldown}s)`
                  : resending
                    ? '재발송 중...'
                    : '인증 코드 다시 받기'}
              </Text>
            </Pressable>
            <Button
              label="이메일 다시 입력하기"
              variant="ghost"
              onPress={() => navigation.goBack()}
              disabled={verifying}
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  content: {
    flex: 1,
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
    lineHeight: 22,
  },
  emailHighlight: {
    color: colors.primaryLight,
    fontFamily: typography.fonts.semibold,
  },
  codeWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  codeCells: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  codeCell: {
    width: 48,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellActive: {
    borderColor: colors.primaryLight,
  },
  codeCellFilled: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderLight,
  },
  codeChar: {
    ...textStyles.heading2,
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.sm,
  },
  resendBlock: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  resendText: {
    ...textStyles.caption,
    color: colors.primaryLight,
  },
  resendTextDisabled: {
    color: colors.textMuted,
  },
});
