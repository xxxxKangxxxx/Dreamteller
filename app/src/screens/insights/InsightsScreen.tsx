import { StyleSheet, Text, View } from 'react-native';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors } from '@/constants/colors';
import { EMOTION_META, EMOTION_ORDER } from '@/constants/emotion';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useMonthlyStats } from '@/hooks/queries/useMonthlyStats';
import type { Emotion } from '@/types/dream';

const now = new Date();

export function InsightsScreen() {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { data, isLoading, isError, refetch, isRefetching } = useMonthlyStats(year, month);

  return (
    <ScreenWrapper hasTabBar scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>인사이트</Text>
        <Text style={styles.subtitle}>
          {year}년 {month}월
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.list}>
          <Skeleton height={96} />
          <Skeleton height={160} />
          <Skeleton height={80} />
        </View>
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>통계를 불러오지 못했어요</Text>
          <Text style={styles.emptyDesc}>잠시 후 다시 시도해주세요</Text>
          <Button
            label="다시 시도"
            onPress={() => {
              void refetch();
            }}
            loading={isRefetching}
            variant="secondary"
          />
        </View>
      ) : !data || data.totalDreams === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>이번 달 기록이 없어요 🌙</Text>
          <Text style={styles.emptyDesc}>꿈을 기록하면 통계가 나타나요</Text>
        </View>
      ) : (
        <View style={styles.list}>
          <View style={styles.metricRow}>
            <Card variant="default" padding="lg" style={styles.metricCard}>
              <Text style={styles.metricLabel}>총 기록</Text>
              <Text style={styles.metricValue}>{data.totalDreams}</Text>
            </Card>
            <Card variant="default" padding="lg" style={styles.metricCard}>
              <Text style={styles.metricLabel}>스트릭</Text>
              <Text style={styles.metricValue}>{data.streak}일</Text>
            </Card>
          </View>

          <Card variant="default" padding="lg">
            <Text style={styles.sectionTitle}>감정 분포</Text>
            <View style={styles.bars}>
              {EMOTION_ORDER.map((emotion) => (
                <EmotionBar
                  key={emotion}
                  emotion={emotion}
                  count={data.emotionDistribution[emotion] ?? 0}
                  total={data.totalDreams}
                />
              ))}
            </View>
          </Card>

          {data.topThemes.length > 0 ? (
            <Card variant="default" padding="lg">
              <Text style={styles.sectionTitle}>주요 테마</Text>
              <View style={styles.themes}>
                {data.topThemes.map((theme) => (
                  <Badge key={theme} label={theme} variant="count" />
                ))}
              </View>
            </Card>
          ) : null}
        </View>
      )}
    </ScreenWrapper>
  );
}

function EmotionBar({
  emotion,
  count,
  total,
}: {
  emotion: Emotion;
  count: number;
  total: number;
}) {
  const meta = EMOTION_META[emotion];
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelGroup}>
        <Text style={styles.barEmoji}>{meta.emoji}</Text>
        <Text style={styles.barLabel}>{meta.label}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${percent}%`, backgroundColor: meta.color },
          ]}
        />
      </View>
      <Text style={styles.barPercent}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    ...textStyles.heading1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.base,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    gap: spacing.xs,
  },
  metricLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  metricValue: {
    ...textStyles.heading2,
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...textStyles.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  bars: {
    gap: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 64,
  },
  barEmoji: {
    fontSize: 14,
  },
  barLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  barPercent: {
    ...textStyles.caption,
    color: colors.textSecondary,
    width: 36,
    textAlign: 'right',
  },
  themes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  empty: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...textStyles.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
});
