import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';

import { Card } from '../ui/Card';

export type InterpretCardKind = 'symbol' | 'psychological' | 'unconscious';

interface InterpretCardProps {
  kind: InterpretCardKind;
  body: string;
}

const META: Record<InterpretCardKind, { emoji: string; title: string; accent: string }> = {
  symbol: { emoji: '🔵', title: '상징 분석', accent: colors.info },
  psychological: { emoji: '🟣', title: '심리적 의미', accent: colors.primaryLight },
  unconscious: { emoji: '✨', title: '무의식 메시지', accent: colors.emotionMixed },
};

export function InterpretCard({ kind, body }: InterpretCardProps) {
  const meta = META[kind];

  return (
    <Card variant="glass" padding="lg">
      <View style={styles.header}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
        <Text style={[styles.title, { color: meta.accent }]}>{meta.title}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 16,
  },
  title: {
    ...textStyles.heading3,
  },
  body: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
});
