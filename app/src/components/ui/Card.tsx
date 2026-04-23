import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

export type CardVariant = 'default' | 'glass' | 'dream';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.bgSurface,
  },
  glass: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  dream: {
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
};

export function Card({
  children,
  variant = 'default',
  onPress,
  padding = 'base',
  style,
}: CardProps) {
  const containerStyle: ViewStyle = {
    ...VARIANT_STYLES[variant],
    padding: spacing[padding],
    borderRadius: radius.lg,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [containerStyle, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
});
