import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles, typography } from '@/constants/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<ButtonSize, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 36, paddingH: 14, fontSize: typography.sizes.sm },
  md: { height: 48, paddingH: 20, fontSize: typography.sizes.base },
  lg: { height: 56, paddingH: 28, fontSize: typography.sizes.md },
};

const VARIANT_STYLES: Record<
  ButtonVariant,
  { bg: string; text: string; border: string | null }
> = {
  primary: { bg: colors.primary, text: colors.textInverse, border: null },
  secondary: {
    bg: colors.primarySurface,
    text: colors.primaryLight,
    border: colors.glassBorder,
  },
  ghost: { bg: 'transparent', text: colors.primaryLight, border: null },
  danger: { bg: `${colors.error}33`, text: colors.error, border: colors.error },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  fullWidth = false,
  style,
  ...pressableProps
}: ButtonProps) {
  const sizeTokens = SIZE_MAP[size];
  const variantTokens = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: sizeTokens.height,
          paddingHorizontal: sizeTokens.paddingH,
          backgroundColor: variantTokens.bg,
          borderColor: variantTokens.border ?? 'transparent',
          borderWidth: variantTokens.border ? 1 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantTokens.text} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text
            style={[
              styles.label,
              {
                color: variantTokens.text,
                fontSize: sizeTokens.fontSize,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...textStyles.label,
  },
});
