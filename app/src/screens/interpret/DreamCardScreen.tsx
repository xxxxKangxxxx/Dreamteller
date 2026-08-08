import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

import { EmotionTag } from '@/components/dream/EmotionTag';
import { Button } from '@/components/ui/Button';
import { DREAM_CARD_STYLE } from '@/constants/cardStyles';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useDreamDetail } from '@/hooks/queries/useDreamDetail';
import { useInterpret } from '@/hooks/queries/useInterpret';
import type { RootStackParamList } from '@/navigation/types';
import { useUIStore } from '@/store/uiStore';
import { formatDateDot } from '@/utils/date';
import { splitIntoParagraphs } from '@/utils/text';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'DreamCard'>;
type Route = RouteProp<RootStackParamList, 'DreamCard'>;

export function DreamCardScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const showToast = useUIStore((s) => s.showToast);

  const { dreamId } = route.params;

  const dreamQuery = useDreamDetail(dreamId);
  const interpretQuery = useInterpret(dreamId);

  const tokens = DREAM_CARD_STYLE;

  const cardRef = useRef<ViewShot>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);

  const captureAsync = useCallback(async (): Promise<string | null> => {
    const node = cardRef.current;
    if (!node || typeof node.capture !== 'function') return null;
    try {
      return await node.capture();
    } catch {
      return null;
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (busy) return;
    setBusy('save');
    try {
      const uri = await captureAsync();
      if (!uri) {
        showToast('카드를 만드는 데 실패했어요', 'error');
        return;
      }
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('사진 접근 권한이 필요해요', '설정에서 사진 접근을 허용해주세요.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      showToast('사진 앱에 저장됐어요', 'success');
    } catch {
      showToast('저장에 실패했어요', 'error');
    } finally {
      setBusy(null);
    }
  }, [busy, captureAsync, showToast]);

  const handleShare = useCallback(async () => {
    if (busy) return;
    setBusy('share');
    try {
      const uri = await captureAsync();
      if (!uri) {
        showToast('카드를 만드는 데 실패했어요', 'error');
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showToast('이 기기에서는 공유를 사용할 수 없어요', 'error');
        return;
      }
      await Sharing.shareAsync(uri, {
        dialogTitle: '해몽 카드 공유',
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    } catch {
      showToast('공유에 실패했어요', 'error');
    } finally {
      setBusy(null);
    }
  }, [busy, captureAsync, showToast]);

  const dream = dreamQuery.data;
  const interpret = interpretQuery.data;
  const ready = dream && interpret && interpret.status === 'completed';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={tokens.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>해몽 카드</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {!ready ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primaryLight} />
            <Text style={styles.loadingText}>해몽을 불러오고 있어요</Text>
          </View>
        ) : (
          <>
            <ViewShot
              ref={cardRef}
              options={{ format: 'png', quality: 1, result: 'tmpfile' }}
              style={styles.captureWrapper}
            >
              <LinearGradient
                colors={tokens.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.capture}
              >
                <View style={styles.capturePadding}>
                  <Text style={[styles.dateLabel, { color: tokens.textSecondary }]}>
                    {formatDateDot(dream.recordedAt)}
                  </Text>
                  <Text style={[styles.title, { color: tokens.textPrimary }]} numberOfLines={2}>
                    {dream.title || '꿈 일기'}
                  </Text>
                  <View style={styles.emotionRow}>
                    <EmotionTag
                      emotion={dream.emotion}
                      textColor={tokens.textPrimary}
                      borderColor={tokens.chipBorder}
                    />
                  </View>

                  <View style={styles.divider} />

                  <CaptureSection
                    index="01"
                    accent={tokens.accentSymbol}
                    labelEn="SYMBOL"
                    labelKo="상징 분석"
                    headline={interpret.symbolAnalysis.headline}
                    detail={interpret.symbolAnalysisText}
                    textPrimary={tokens.textPrimary}
                    textSecondary={tokens.textSecondary}
                  />
                  <CaptureSection
                    index="02"
                    accent={tokens.accentPsychological}
                    labelEn="PSYCHOLOGY"
                    labelKo="심리적 의미"
                    headline={interpret.psychologicalMeaning.headline}
                    detail={interpret.psychologicalMeaningText}
                    textPrimary={tokens.textPrimary}
                    textSecondary={tokens.textSecondary}
                  />
                  <CaptureSection
                    index="03"
                    accent={tokens.accentUnconscious}
                    labelEn="UNCONSCIOUS"
                    labelKo="무의식 메시지"
                    headline={interpret.unconsciousMessage.headline}
                    detail={interpret.unconsciousMessageText}
                    textPrimary={tokens.textPrimary}
                    textSecondary={tokens.textSecondary}
                  />

                  {interpret.unconsciousMessage.affirmation ? (
                    <View
                      style={[
                        styles.affirmationBox,
                        { borderColor: `${tokens.accentUnconscious}55` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.affirmationLabel,
                          { color: tokens.accentUnconscious },
                        ]}
                      >
                        NOTE TO SELF
                      </Text>
                      <Text style={[styles.affirmationText, { color: tokens.textPrimary }]}>
                        {interpret.unconsciousMessage.affirmation}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.brandRow}>
                    <Text style={[styles.brand, { color: tokens.watermark }]}>DREAMTELLER</Text>
                  </View>
                </View>
              </LinearGradient>
            </ViewShot>

            <View style={styles.actions}>
              <Button
                label={busy === 'save' ? '저장 중…' : '사진 앱에 저장'}
                variant="primary"
                onPress={handleSave}
                disabled={busy !== null}
                fullWidth
              />
              <Button
                label={busy === 'share' ? '공유 중…' : '공유하기'}
                variant="secondary"
                onPress={handleShare}
                disabled={busy !== null}
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface CaptureSectionProps {
  index: string;
  accent: string;
  labelEn: string;
  labelKo: string;
  headline: string;
  detail: string;
  textPrimary: string;
  textSecondary: string;
}

function CaptureSection({
  index,
  accent,
  labelEn,
  labelKo,
  headline,
  detail,
  textPrimary,
  textSecondary,
}: CaptureSectionProps) {
  const paragraphs = splitIntoParagraphs(detail);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionIndex, { color: accent }]}>{index}</Text>
        <View style={styles.sectionLabelStack}>
          <Text style={[styles.sectionLabelEn, { color: accent }]}>{labelEn}</Text>
          <Text style={[styles.sectionLabelKo, { color: textSecondary }]}>{labelKo}</Text>
        </View>
      </View>
      {headline ? (
        <Text style={[styles.sectionHeadline, { color: textPrimary }]}>{headline}</Text>
      ) : null}
      {paragraphs.length > 0
        ? paragraphs.map((p, i) => (
            <Text key={i} style={[styles.sectionDetail, { color: textPrimary }]}>
              {p}
            </Text>
          ))
        : detail
          ? <Text style={[styles.sectionDetail, { color: textPrimary }]}>{detail}</Text>
          : null}
    </View>
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
  headerTitle: {
    ...textStyles.bodyMd,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  loadingBlock: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  captureWrapper: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  capture: {
    borderRadius: radius.xl,
  },
  capturePadding: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  dateLabel: {
    ...textStyles.caption,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    ...textStyles.heading2,
  },
  emotionRow: {
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginVertical: spacing.lg,
  },
  section: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  sectionIndex: {
    ...textStyles.label,
    fontSize: 18,
    letterSpacing: 1.5,
    lineHeight: 20,
    opacity: 0.85,
  },
  sectionLabelStack: {
    gap: 1,
  },
  sectionLabelEn: {
    ...textStyles.label,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  sectionLabelKo: {
    ...textStyles.caption,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  sectionHeadline: {
    ...textStyles.bodyMd,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  sectionDetail: {
    ...textStyles.body,
    fontSize: 12.5,
    lineHeight: 21,
    letterSpacing: 0.05,
  },
  affirmationBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  affirmationLabel: {
    ...textStyles.label,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  affirmationText: {
    ...textStyles.bodyMd,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.05,
  },
  brandRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    ...textStyles.label,
    fontSize: 10,
    letterSpacing: 2.2,
  },
  actions: {
    gap: spacing.sm,
  },
});
