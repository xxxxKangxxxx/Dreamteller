import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { EMOTION_META } from '@/constants/emotion';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { Dream } from '@/types/dream';
import { formatDateKoShort } from '@/utils/date';

import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface DreamCardProps {
  dream: Pick<Dream, 'id' | 'title' | 'emotion' | 'illustrationUrl' | 'recordedAt'>;
  onPress: (id: string) => void;
}

export function DreamCard({ dream, onPress }: DreamCardProps) {
  return (
    <Card onPress={() => onPress(dream.id)} padding="md">
      <View style={styles.row}>
        <View style={styles.thumb}>
          {dream.illustrationUrl ? (
            <Image
              source={{ uri: dream.illustrationUrl }}
              style={styles.thumbImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <Text style={styles.emoji}>{EMOTION_META[dream.emotion].emoji}</Text>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {dream.title || '제목 없는 꿈'}
          </Text>
          <Text style={styles.date}>{formatDateKoShort(dream.recordedAt)}</Text>
          <View style={styles.badges}>
            <Badge
              variant="emotion"
              emotion={dream.emotion}
              label={EMOTION_META[dream.emotion].label}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 26,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...textStyles.bodyMd,
    color: colors.textPrimary,
  },
  date: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 2,
    flexWrap: 'wrap',
  },
});
