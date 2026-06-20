import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { type Toast as ToastModel, type ToastVariant, useUIStore } from '@/store/uiStore';

const AUTO_DISMISS_MS = 3500;

// 불투명한 elevated 배경 + 변형별 컬러 텍스트/보더 (기존 알파 33은 너무 투명해 가독성 떨어짐)
const VARIANT_STYLES: Record<ToastVariant, { bg: string; text: string; border: string }> = {
  info: { bg: colors.bgElevated, text: colors.textPrimary, border: colors.borderLight },
  success: { bg: colors.bgElevated, text: colors.success, border: `${colors.success}80` },
  error: { bg: colors.bgElevated, text: colors.error, border: `${colors.error}80` },
};

function ToastItem({ toast }: { toast: ToastModel }) {
  const dismissToast = useUIStore((s) => s.dismissToast);
  const variantStyle = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [dismissToast, toast.id]);

  return (
    <Pressable
      onPress={() => dismissToast(toast.id)}
      accessibilityRole="alert"
      style={[styles.toast, { backgroundColor: variantStyle.bg, borderColor: variantStyle.border }]}
    >
      <Text style={[styles.message, { color: variantStyle.text }]}>{toast.message}</Text>
    </Pressable>
  );
}

interface ToastContainerProps {
  topOffset?: number;
}

export function ToastContainer({ topOffset = 0 }: ToastContainerProps) {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.overlay} edges={['top']}>
      <View pointerEvents="box-none" style={[styles.stack, { paddingTop: topOffset + 8 }]}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  stack: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  toast: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    // 어두운 배경 위에서 떠 보이도록 그림자 추가
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  message: {
    ...textStyles.body,
    textAlign: 'center',
  },
});
