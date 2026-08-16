import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionTag } from '@/components/dream/EmotionTag';
import { InterpretCard } from '@/components/dream/InterpretCard';
import { StarParticleLoader } from '@/components/dream/StarParticleLoader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DREAM_CARD_STYLE } from '@/constants/cardStyles';
import { colors } from '@/constants/colors';
import { FALLBACK_MESSAGES } from '@/constants/prompts';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useDreamDetail } from '@/hooks/queries/useDreamDetail';
import { useDreams } from '@/hooks/queries/useDreams';
import { useInterpret } from '@/hooks/queries/useInterpret';
import { useUsage } from '@/hooks/queries/useUsage';
import type { RootStackParamList } from '@/navigation/types';
import { useUIStore } from '@/store/uiStore';
import { formatDateDot } from '@/utils/date';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'InterpretDetail'>;

export function InterpretScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const showToast = useUIStore((s) => s.showToast);

  const routeDreamId =
    typeof route.params === 'object' && route.params !== null && 'dreamId' in route.params
      ? (route.params as { dreamId?: string }).dreamId
      : undefined;

  const dreamsQuery = useDreams({ limit: 1 });
  const fallbackDreamId = dreamsQuery.data?.dreams[0]?.id;
  const dreamId = routeDreamId ?? fallbackDreamId;

  const usageQuery = useUsage();
  const usage = usageQuery.data;

  const interpretLimit = usage?.currentMonth.interpretations;
  // 한도값 자체가 플랜을 반영하므로 사용량 비교만으로 충분하다.
  const isQuotaOver =
    interpretLimit !== undefined && interpretLimit.used >= interpretLimit.limit;

  const dreamDetail = useDreamDetail(dreamId);
  // 한도를 넘겨도 조회는 막지 않는다 — 이미 받은 해몽은 계속 볼 수 있어야 하고,
  // 서버도 새 잡을 시작할 때만 한도를 강제한다. 여기서는 "생성"만 잠근다.
  const interpret = useInterpret(dreamId, { canGenerate: !isQuotaOver });
  const cardTokens = DREAM_CARD_STYLE;

  const dream = dreamDetail.data;

  const handleSaveCard = useCallback(() => {
    if (!dreamId) return;
    navigation.navigate('DreamCard', { dreamId });
  }, [navigation, dreamId]);

  const handleShare = useCallback(async () => {
    if (!dream || !interpret.data || interpret.data.status !== 'completed') return;
    try {
      const d = interpret.data;
      const message = [
        dream.title,
        '',
        `[상징 분석] ${d.symbolAnalysis.headline}`,
        d.symbolAnalysisText,
        '',
        `[심리적 의미] ${d.psychologicalMeaning.headline}`,
        d.psychologicalMeaningText,
        '',
        `[무의식 메시지] ${d.unconsciousMessage.headline}`,
        d.unconsciousMessageText,
        d.unconsciousMessage.affirmation ? `\n— ${d.unconsciousMessage.affirmation}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      await Share.share({ message });
    } catch {
      showToast(FALLBACK_MESSAGES.interpretError, 'error');
    }
  }, [dream, interpret.data, showToast]);

  const isLoading = useMemo(() => {
    if (!dreamId) return dreamsQuery.isLoading;
    if (interpret.isLoading) return true;
    if (interpret.data?.status === 'processing') return true;
    return false;
  }, [dreamId, dreamsQuery.isLoading, interpret.data?.status, interpret.isLoading]);

  const showError = interpret.isError && interpret.data === undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={cardTokens.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="뒤로"
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.headerSide} />
        )}
        <Text style={styles.headerTitle}>꿈 해몽</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {!dreamId && !dreamsQuery.isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>아직 기록된 꿈이 없어요</Text>
            <Text style={styles.emptyHint}>꿈을 기록하면 해몽을 받아볼 수 있어요</Text>
          </View>
        ) : null}

        {dream ? (
          <View style={styles.dreamHeader}>
            <Text style={styles.dreamTitle}>{dream.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaDate}>{formatDateDot(dream.recordedAt)}</Text>
              <EmotionTag emotion={dream.emotion} />
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <StarParticleLoader />
            <Text style={styles.loadingText}>꿈을 해석하는 중...</Text>
          </View>
        ) : null}

        {showError ? (
          <Card variant="default" padding="lg" style={styles.errorCard}>
            <Text style={styles.errorText}>{FALLBACK_MESSAGES.interpretError}</Text>
            <Button
              label="다시 시도"
              variant="secondary"
              onPress={() => {
                void interpret.refetch();
              }}
            />
          </Card>
        ) : null}

        {interpret.data?.status === 'completed' ? (
          <View style={styles.cardStack}>
            <InterpretCard
              kind="symbol"
              headline={interpret.data.symbolAnalysis.headline}
              detail={interpret.data.symbolAnalysisText}
              keySymbols={interpret.data.symbolAnalysis.keySymbols}
            />
            <InterpretCard
              kind="psychological"
              headline={interpret.data.psychologicalMeaning.headline}
              detail={interpret.data.psychologicalMeaningText}
              perspective={interpret.data.psychologicalMeaning.perspective}
            />
            <InterpretCard
              kind="unconscious"
              headline={interpret.data.unconsciousMessage.headline}
              detail={interpret.data.unconsciousMessageText}
              affirmation={interpret.data.unconsciousMessage.affirmation}
            />
          </View>
        ) : null}

        {interpret.data?.status === 'failed' ? (
          <Card variant="default" padding="lg" style={styles.errorCard}>
            <Text style={styles.errorText}>{FALLBACK_MESSAGES.interpretError}</Text>
          </Card>
        ) : null}

        {interpret.data?.status === 'completed' ? (
          <View style={styles.actions}>
            <Button label="해몽 카드로 저장" variant="primary" onPress={handleSaveCard} fullWidth />
            <Button label="공유하기" variant="secondary" onPress={handleShare} fullWidth />
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={isQuotaOver === true && interpret.data?.status !== 'completed'}
        transparent
        animationType="fade"
        onRequestClose={() => navigation.goBack()}
      >
        <View style={styles.modalBackdrop}>
          <Card variant="dream" padding="xl" style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🌙</Text>
            <Text style={styles.modalTitle}>이번 달 해몽을 모두 사용했어요</Text>
            <Text style={styles.modalBody}>
              해몽은 한 달에 {interpretLimit?.limit ?? 5}번까지 받을 수 있어요.{'\n'}
              다음 달 1일에 다시 초기화되니 그때 또 만나요.{'\n'}
              그동안에도 꿈 기록과 아카이브는 그대로 사용할 수 있어요.
            </Text>
            <View style={styles.modalActions}>
              <Button
                label="확인"
                variant="primary"
                onPress={() => navigation.goBack()}
                fullWidth
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerSide: {
    width: 28,
  },
  headerTitle: {
    ...textStyles.bodyMd,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  emptyState: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyText: {
    ...textStyles.heading3,
    color: colors.textPrimary,
  },
  emptyHint: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  dreamHeader: {
    gap: spacing.sm,
  },
  dreamTitle: {
    ...textStyles.heading2,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaDate: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.base,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  cardStack: {
    gap: spacing.base,
  },
  errorCard: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.xl,
  },
  modalEmoji: {
    fontSize: 36,
  },
  modalTitle: {
    ...textStyles.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalBody: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
