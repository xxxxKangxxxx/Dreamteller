import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { type Toast as ToastModel, type ToastVariant, useUIStore } from '@/store/uiStore';

const AUTO_DISMISS_MS = 3500;

const VARIANT_STYLES: Record<ToastVariant, { bg: string; text: string }> = {
  info: { bg: colors.bgElevated, text: colors.textPrimary },
  success: { bg: `${colors.success}33`, text: colors.success },
  error: { bg: `${colors.error}33`, text: colors.error },
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
      style={[styles.toast, { backgroundColor: variantStyle.bg }]}
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
  },
  message: {
    ...textStyles.body,
    textAlign: 'center',
  },
});
