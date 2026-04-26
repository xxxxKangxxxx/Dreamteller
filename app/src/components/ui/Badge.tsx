import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { EMOTION_META } from '@/constants/emotion';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { DreamType, Emotion } from '@/types/dream';

export type BadgeVariant = 'emotion' | 'dreamType' | 'soulType' | 'count' | 'premium';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  emotion?: Emotion;
  dreamType?: DreamType;
  style?: ViewStyle;
}

export const DREAM_TYPE_EMOJI: Record<DreamType, string> = {
  PREDICTION: '🔮',
  EMOTIONAL_RELEASE: '💜',
  DAILY: '☁️',
  NIGHTMARE: '🌑',
  LUCID: '✨',
  SYMBOLIC: '🌀',
};

function resolveColors(
  variant: BadgeVariant,
  emotion?: Emotion,
): { bg: string; text: string } {
  switch (variant) {
    case 'emotion': {
      const color = emotion ? EMOTION_META[emotion].color : colors.primaryLight;
      return { bg: `${color}26`, text: color };
    }
    case 'dreamType':
      return { bg: `${colors.primaryLight}26`, text: colors.primaryLight };
    case 'soulType':
      return { bg: `${colors.info}26`, text: colors.info };
    case 'count':
      return { bg: colors.border, text: colors.textSecondary };
    case 'premium':
      return { bg: `${colors.warning}26`, text: colors.warning };
  }
}

export function Badge({ label, variant = 'count', emotion, dreamType, style }: BadgeProps) {
  const { bg, text } = resolveColors(variant, emotion);
  const emoji =
    variant === 'emotion' && emotion
      ? EMOTION_META[emotion].emoji
      : variant === 'dreamType' && dreamType
        ? DREAM_TYPE_EMOJI[dreamType]
        : variant === 'premium'
          ? '👑'
          : null;

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, { color: text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  emoji: {
    fontSize: 12,
  },
  label: {
    ...textStyles.label,
  },
});
