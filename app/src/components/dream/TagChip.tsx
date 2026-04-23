import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';

interface TagChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
}

export function TagChip({ label, onPress, selected = false, style }: TagChipProps) {
  const bg = selected ? colors.primary : colors.bgElevated;
  const text = selected ? colors.textInverse : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: pressed && onPress ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: text }]} numberOfLines={1}>
        #{label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    ...textStyles.label,
  },
});
