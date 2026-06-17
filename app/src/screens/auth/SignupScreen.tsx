import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
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

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export function SignupScreen() {
  const navigation = useNavigation<Navigation>();
  const login = useAuthStore((s) => s.login);
  const showToast = useUIStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    !submitting;

  const handleSignup = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      const result = await supabaseAuth.signUpWithEmail(
        trimmedEmail,
        password,
        name.trim(),
      );
      if (result) {
        await login(result);
        return;
      }
      navigation.navigate('OtpVerify', { email: trimmedEmail });
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입에 실패했어요';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
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
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>꿈을 함께 풀어가요</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="이름"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              editable={!submitting}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!submitting}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 (6자 이상)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!submitting}
            />
          </View>

          <View style={styles.actions}>
            <Button
              label="가입하기"
              variant="primary"
              onPress={() => {
                void handleSignup();
              }}
              disabled={!canSubmit}
              loading={submitting}
              fullWidth
            />
            <Button
              label="이미 계정이 있어요"
              variant="ghost"
              onPress={() => navigation.navigate('Login')}
              disabled={submitting}
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
});
