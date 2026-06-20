import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { EMOTION_META, EMOTION_ORDER } from '@/constants/emotion';
import { FALLBACK_MESSAGES } from '@/constants/prompts';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useInvalidateDreams } from '@/hooks/queries/useDreams';
import { dreamService } from '@/services/dreamService';
import type { RootStackParamList } from '@/navigation/types';
import { useRecordStore } from '@/store/recordStore';
import { useUIStore } from '@/store/uiStore';
import type { Emotion } from '@/types/dream';
import { sessionStorage } from '@/utils/sessionStorage';
import { draftSummaryFromChat } from '@/utils/summary';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'RecordSummary'>;
type Route = RouteProp<RootStackParamList, 'RecordSummary'>;

export function RecordSummaryScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const session = useRecordStore((s) => s.session);
  const setStoreSummary = useRecordStore((s) => s.setSummary);
  const setStoreEmotion = useRecordStore((s) => s.setEmotion);
  const resetStore = useRecordStore((s) => s.reset);
  const showToast = useUIStore((s) => s.showToast);
  const invalidateDreams = useInvalidateDreams();

  const initialSummary = useMemo(() => {
    if (session?.summary) return session.summary;
    if (session) return draftSummaryFromChat(session.messages);
    return '';
  }, [session]);

  const [summary, setSummary] = useState(initialSummary);
  const [emotion, setEmotion] = useState<Emotion | null>(session?.emotion ?? null);
  const [submitting, setSubmitting] = useState<'save' | 'interpret' | null>(null);

  useEffect(() => {
    if (!session && route.params?.sessionId) {
      navigation.goBack();
    }
  }, [navigation, route.params?.sessionId, session]);

  const handleSummaryChange = useCallback(
    (text: string) => {
      setSummary(text);
      setStoreSummary(text);
    },
    [setStoreSummary],
  );

  const handleEmotionSelect = useCallback(
    (value: Emotion) => {
      setEmotion(value);
      setStoreEmotion(value);
    },
    [setStoreEmotion],
  );

  const finalize = useCallback(async () => {
    resetStore();
    await sessionStorage.clear();
    invalidateDreams();
  }, [invalidateDreams, resetStore]);

  const submit = useCallback(
    async (mode: 'save' | 'interpret') => {
      if (!session) return;
      const trimmed = summary.trim();
      if (!trimmed || !emotion || submitting) return;

      setSubmitting(mode);
      try {
        const dream = await dreamService.create({
          rawContent: trimmed,
          chatHistory: session.messages,
          emotion,
          recordedAt: session.startedAt,
        });

        if (mode === 'interpret') {
          // 해몽 생성은 기다리지 않고 바로 이동 — InterpretScreen의 useInterpret가
          // 생성을 트리거하며 별빛 로더로 대기시간 전체를 덮는다 (체감 로딩 개선)
          await finalize();
          navigation.reset({
            index: 1,
            routes: [{ name: 'Tabs' }, { name: 'InterpretDetail', params: { dreamId: dream.id } }],
          });
        } else {
          await finalize();
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }
      } catch {
        showToast(FALLBACK_MESSAGES.chatError, 'error');
        setSubmitting(null);
      }
    },
    [emotion, finalize, navigation, session, showToast, submitting, summary],
  );

  const handleSave = useCallback(() => submit('save'), [submit]);
  const handleInterpret = useCallback(() => submit('interpret'), [submit]);

  const canSubmit = summary.trim().length > 0 && emotion !== null && submitting === null;

  if (!session) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>세션 정보를 찾을 수 없어요</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>꿈 요약 확인</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>이 내용이 맞아요?</Text>
            <Text style={styles.sectionHint}>
              이야기한 내용을 정리했어요. 자유롭게 다듬어도 좋아요.
            </Text>
            <TextInput
              style={styles.summaryInput}
              value={summary}
              onChangeText={handleSummaryChange}
              placeholder="꿈의 흐름을 적어주세요"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              editable={submitting === null}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>이 꿈의 감정은 어땠어요?</Text>
            <View style={styles.emotionRow}>
              {EMOTION_ORDER.map((value) => {
                const meta = EMOTION_META[value];
                const selected = emotion === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => handleEmotionSelect(value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`감정 ${meta.label}`}
                    style={[
                      styles.emotionChip,
                      selected && {
                        borderColor: meta.color,
                        backgroundColor: `${meta.color}26`,
                      },
                    ]}
                  >
                    <Text style={styles.emotionEmoji}>{meta.emoji}</Text>
                    <Text
                      style={[
                        styles.emotionLabel,
                        selected && { color: meta.color },
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="그냥 저장"
            variant="secondary"
            onPress={handleSave}
            disabled={!canSubmit}
            loading={submitting === 'save'}
            fullWidth
          />
          <Button
            label="해몽 받기"
            variant="primary"
            onPress={handleInterpret}
            disabled={!canSubmit}
            loading={submitting === 'interpret'}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  headerRight: {
    width: 28,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...textStyles.heading3,
    color: colors.textPrimary,
  },
  sectionHint: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  summaryInput: {
    minHeight: 180,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    ...textStyles.body,
  },
  emotionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emotionChip: {
    flexGrow: 1,
    flexBasis: '22%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emotionEmoji: {
    fontSize: 24,
  },
  emotionLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgBase,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
});
