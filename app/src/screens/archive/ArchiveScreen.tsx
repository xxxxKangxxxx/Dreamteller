import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { DreamCard } from '@/components/dream/DreamCard';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useDreams } from '@/hooks/queries/useDreams';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ArchiveScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch, isRefetching } = useDreams();

  const dreams = data?.dreams ?? [];

  return (
    <ScreenWrapper hasTabBar scrollable>
      <Text style={styles.title}>드림 아카이브</Text>

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={84} />
          ))}
        </View>
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>꿈 목록을 불러오지 못했어요</Text>
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
      ) : dreams.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>아직 기록한 꿈이 없어요 🌙</Text>
          <Text style={styles.emptyDesc}>오늘 밤 꾼 꿈을 기록해볼까요?</Text>
          <Button
            label="기록 시작"
            onPress={() => navigation.navigate('RecordChat')}
            variant="primary"
          />
        </View>
      ) : (
        <View style={styles.list}>
          {dreams.map((dream) => (
            <DreamCard
              key={dream.id}
              dream={dream}
              onPress={(id) => navigation.navigate('InterpretDetail', { dreamId: id })}
            />
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    ...textStyles.heading1,
    color: colors.textPrimary,
    paddingTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
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
