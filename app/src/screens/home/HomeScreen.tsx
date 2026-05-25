import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DreamCard } from '@/components/dream/DreamCard';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useDreams } from '@/hooks/queries/useDreams';
import type { RootStackParamList } from '@/navigation/types';
import { getGreeting } from '@/utils/date';
import { maybePromptResume } from '@/utils/sessionResume';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const RECENT_LIMIT = 3;

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const greeting = getGreeting();
  const { data, isLoading, isError } = useDreams();

  const recentDreams = (data?.dreams ?? []).slice(0, RECENT_LIMIT);

  useEffect(() => {
    void maybePromptResume(() => navigation.navigate('RecordChat'));
  }, [navigation]);

  const handleDreamPress = useCallback(
    (id: string) => navigation.navigate('InterpretDetail', { dreamId: id }),
    [navigation],
  );

  return (
    <ScreenWrapper hasTabBar scrollable>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>
            {greeting.label} {greeting.emoji}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="설정"
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>오늘 밤엔 어떤 꿈을 꿨나요?</Text>
      </View>

      <Card variant="dream" padding="lg" style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>오늘 꿈을 기록해볼까요?</Text>
        <Text style={styles.ctaDesc}>Luna가 대화로 도와드릴게요 ✨</Text>
        <Button
          label="기록 시작"
          onPress={() => navigation.navigate('RecordChat')}
          variant="primary"
          fullWidth
        />
      </Card>

      <Text style={styles.sectionLabel}>최근 꿈</Text>
      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={84} />
          ))}
        </View>
      ) : isError ? (
        <Text style={styles.placeholder}>꿈 목록을 불러오지 못했어요</Text>
      ) : recentDreams.length === 0 ? (
        <Text style={styles.placeholder}>아직 기록한 꿈이 없어요</Text>
      ) : (
        <View style={styles.list}>
          {recentDreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} onPress={handleDreamPress} />
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  placeholder: {
    ...textStyles.caption,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },
});
