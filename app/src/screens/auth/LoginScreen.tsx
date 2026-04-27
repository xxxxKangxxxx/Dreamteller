import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
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
  const showToast = useUIStore((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !submitting;

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>로그인</Text>
            <Text style={styles.subtitle}>이메일로 시작해요 ✨</Text>
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
              autoComplete="password"
              editable={!submitting}
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
            <Button
              label="회원가입"
              variant="ghost"
              onPress={() => navigation.navigate('Signup')}
              disabled={submitting}
              fullWidth
            />
          </View>
        </ScrollView>
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
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    ...textStyles.body,
  },
  actions: {
    gap: spacing.sm,
  },
});
