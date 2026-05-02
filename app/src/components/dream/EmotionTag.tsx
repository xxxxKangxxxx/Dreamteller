import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { EMOTION_META } from '@/constants/emotion';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { Emotion } from '@/types/dream';

interface EmotionTagProps {
  emotion: Emotion;
  textColor?: string;
  borderColor?: string;
}

export function EmotionTag({
  emotion,
  textColor = colors.textPrimary,
  borderColor = colors.border,
}: EmotionTagProps) {
  const meta = EMOTION_META[emotion];
  return (
    <View style={[styles.container, { borderColor }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.label, { color: textColor }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...textStyles.label,
    fontSize: 11,
    letterSpacing: 0.4,
  },
});
