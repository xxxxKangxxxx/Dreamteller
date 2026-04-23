import { StyleSheet, Text, View } from 'react-native';

import { DreamCard } from '@/components/dream/DreamCard';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { Dream } from '@/types/dream';

const SAMPLE_DREAMS: Dream[] = [
  {
    id: '1',
    title: '구름 위에서 날다',
    rawContent: '하늘 위에서 자유롭게 날아다녔다.',
    emotion: 'POSITIVE',
    dreamType: 'LUCID',
    illustrationUrl: null,
    tags: [{ label: '비행' }, { label: '구름' }],
    hasInterpretation: true,
    recordedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '어두운 숲의 낯선 만남',
    rawContent: '어두운 숲에서 낯선 사람을 만났다.',
    emotion: 'NEGATIVE',
    dreamType: 'SYMBOLIC',
    illustrationUrl: null,
    tags: [{ label: '숲' }],
    hasInterpretation: false,
    recordedAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

export function HomeScreen() {
  return (
    <ScreenWrapper hasTabBar scrollable>
      <View style={styles.header}>
        <Text style={styles.greeting}>좋은 아침이에요 🌙</Text>
        <Text style={styles.subtitle}>오늘 밤엔 어떤 꿈을 꿨나요?</Text>
      </View>

      <Card variant="dream" padding="lg" style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>오늘 꿈을 기록해볼까요?</Text>
        <Text style={styles.ctaDesc}>Luna가 대화로 도와드릴게요 ✨</Text>
        <Button label="기록 시작" onPress={() => {}} variant="primary" fullWidth />
      </Card>

      <Text style={styles.sectionLabel}>최근 꿈</Text>
      <View style={styles.list}>
        {SAMPLE_DREAMS.map((dream) => (
          <DreamCard key={dream.id} dream={dream} onPress={() => {}} />
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  greeting: {
    ...textStyles.heading1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  ctaCard: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  ctaTitle: {
    ...textStyles.heading3,
    color: colors.textPrimary,
  },
  ctaDesc: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
});
