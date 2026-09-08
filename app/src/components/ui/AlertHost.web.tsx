import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { type AlertDialog, useAlertStore } from '@/store/alertStore';
import type { AlertButton } from '@/types/alert';

/**
 * 웹 전용 확인 대화상자.
 *
 * 네이티브의 `Alert.alert`를 대신한다. 여러 개가 쌓여도 최상단 하나만 렌더하고,
 * 버튼을 누르면 먼저 닫은 뒤 `onPress`를 호출한다 — onPress가 다시 대화상자를
 * 여는 흐름(계정 삭제 2차 확인)이 있어서 순서가 중요하다.
 */
export function AlertHost() {
  const dialogs = useAlertStore((s) => s.dialogs);
  const top = dialogs[dialogs.length - 1];

  if (!top) return null;

  // key로 대화상자가 바뀔 때 내부 상태(키보드 핸들러)가 확실히 새로 붙게 한다
  return <AlertDialogView key={top.id} dialog={top} />;
}

function AlertDialogView({ dialog }: { dialog: AlertDialog }) {
  const dismiss = useAlertStore((s) => s.dismiss);

  const run = useCallback(
    (button: AlertButton) => {
      dismiss(dialog.id);
      button.onPress?.();
    },
    [dialog.id, dismiss],
  );

  // Esc로 취소. 취소 버튼이 없거나 cancelable=false면 아무것도 하지 않는다.
  useEffect(() => {
    if (!dialog.cancelable) return;
    const cancelButton = dialog.buttons.find((b) => b.style === 'cancel');
    if (!cancelButton) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') run(cancelButton);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog.buttons, dialog.cancelable, run]);

  const cancelButton = dialog.buttons.find((b) => b.style === 'cancel');

  return (
    <View style={styles.overlay}>
      {/* 배경 탭은 취소가 있을 때만 닫는다 — 실수로 파괴적 동작이 취소되는 건 안전하지만
          반대로 확인만 있는 안내를 못 닫으면 곤란하므로 확인 하나짜리도 닫아준다 */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          if (!dialog.cancelable) return;
          if (cancelButton) run(cancelButton);
          else if (dialog.buttons.length === 1 && dialog.buttons[0]) run(dialog.buttons[0]);
        }}
      />
      <View style={styles.card} accessibilityRole="alert">
        <Text style={styles.title}>{dialog.title}</Text>
        {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}

        <View style={styles.actions}>
          {dialog.buttons.map((button, index) => (
            <Pressable
              key={`${button.text}_${index}`}
              onPress={() => run(button)}
              style={({ pressed }) => [
                styles.button,
                button.style === 'cancel'
                  ? styles.buttonCancel
                  : button.style === 'destructive'
                    ? styles.buttonDestructive
                    : styles.buttonPrimary,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  button.style === 'destructive' && styles.buttonTextDestructive,
                  button.style === 'cancel' && styles.buttonTextCancel,
                ]}
              >
                {button.text}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    padding: spacing.xl,
  },
  title: {
    ...textStyles.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  button: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDestructive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...textStyles.bodyMd,
    color: colors.textInverse,
  },
  buttonTextDestructive: {
    color: colors.error,
  },
  buttonTextCancel: {
    color: colors.textSecondary,
  },
});
