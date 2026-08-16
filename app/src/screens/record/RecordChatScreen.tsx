import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  type AppStateStatus,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/dream/ChatBubble';
import { ToastContainer } from '@/components/ui/Toast';
import { colors } from '@/constants/colors';
import { config } from '@/constants/config';
import { FALLBACK_MESSAGES } from '@/constants/prompts';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useRecordSession } from '@/hooks/useRecordSession';
import type { RootStackParamList } from '@/navigation/types';
import { countFilledSlots, EMPTY_SLOTS, useRecordStore } from '@/store/recordStore';
import { useUIStore } from '@/store/uiStore';
import { type ChatMessage, DREAM_SLOT_KEYS } from '@/types/dream';
import { sessionStorage } from '@/utils/sessionStorage';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'RecordChat'>;

interface ListItem {
  id: string;
  message: ChatMessage;
  isStreaming?: boolean;
}

export function RecordChatScreen() {
  const navigation = useNavigation<Navigation>();
  const { session, streamingText, isStreaming, ensureSession, send, cancel } =
    useRecordSession();
  const resetStore = useRecordStore((s) => s.reset);
  const showToast = useUIStore((s) => s.showToast);

  const [input, setInput] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const listRef = useRef<FlatList<ListItem>>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  useEffect(() => {
    if (session?.isCompleted) {
      navigation.replace('RecordSummary', { sessionId: session.sessionId });
    }
  }, [navigation, session?.isCompleted, session?.sessionId]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const current = useRecordStore.getState().session;
      if (!current) return;
      if (nextState === 'background' || nextState === 'inactive') {
        await sessionStorage.save(current);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!session || session.isCompleted) return;
    const elapsed = Date.now() - new Date(session.lastActivityAt).getTime();
    const remaining = Math.max(0, config.sessionIdleTimeoutMs - elapsed);
    const timer = setTimeout(() => {
      Alert.alert('세션 만료', FALLBACK_MESSAGES.sessionExpired, [
        {
          text: '확인',
          onPress: () => {
            cancel();
            resetStore();
            void sessionStorage.clear();
            navigation.goBack();
          },
        },
      ]);
    }, remaining);
    return () => clearTimeout(timer);
  }, [cancel, navigation, resetStore, session]);

  const items = useMemo<ListItem[]>(() => {
    if (!session) return [];
    const list: ListItem[] = session.messages.map((message, index) => ({
      id: `${session.sessionId}-${index}`,
      message,
    }));
    if (isStreaming) {
      list.push({
        id: `${session.sessionId}-streaming`,
        message: { role: 'assistant', content: streamingText },
        isStreaming: true,
      });
    }
    return list.reverse();
  }, [isStreaming, session, streamingText]);

  useEffect(() => {
    if (items.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [items.length]);

  const handleClose = useCallback(() => {
    Alert.alert('기록을 그만둘까요?', '지금까지 입력한 내용은 사라져요', [
      { text: '계속하기', style: 'cancel' },
      {
        text: '그만두기',
        style: 'destructive',
        onPress: () => {
          cancel();
          resetStore();
          void sessionStorage.clear();
          navigation.goBack();
        },
      },
    ]);
  }, [cancel, navigation, resetStore]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    const { error } = await send(text);
    if (error) showToast(FALLBACK_MESSAGES.chatError, 'error');
  }, [input, isStreaming, send, showToast]);

  const canSend = input.trim().length > 0 && !isStreaming;
  // 진행 표시는 턴 수가 아니라 채워진 슬롯 수 — 한 번에 다 말하면 그만큼 건너뛴다.
  const slots = session?.slots ?? EMPTY_SLOTS;
  const filledSlots = countFilledSlots(slots);
  const insets = useSafeAreaInsets();

  return (
    <>
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="기록 닫기"
        >
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </Pressable>
        <View
          style={styles.progress}
          accessibilityRole="progressbar"
          accessibilityLabel={`꿈 정보 ${filledSlots}개 담김, 전체 ${DREAM_SLOT_KEYS.length}개`}
        >
          <View style={styles.dots}>
            {DREAM_SLOT_KEYS.map((key) => (
              <View key={key} style={[styles.dot, slots[key] ? styles.dotFilled : null]} />
            ))}
          </View>
          <Text style={styles.progressLabel}>
            {filledSlots}/{DREAM_SLOT_KEYS.length} 담김
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ChatBubble
              message={item.message.content}
              role={item.message.role}
              isStreaming={item.isStreaming}
            />
          )}
        />

        <View
          style={[
            styles.inputRow,
            {
              paddingBottom: keyboardVisible
                ? spacing.sm
                : Math.max(insets.bottom, spacing.sm),
            },
          ]}
        >
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="꿈 이야기를 들려주세요"
            placeholderTextColor={colors.textMuted}
            multiline
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="전송"
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={canSend ? colors.textInverse : colors.textMuted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
    <ToastContainer topOffset={48} />
    </>
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
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotFilled: {
    backgroundColor: colors.primaryLight,
  },
  progressLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  headerRight: {
    width: 28,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgBase,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...textStyles.body,
    // body 기본 lineHeight(15×1.6=24)는 살짝 아래, 자연값은 살짝 위로 보임 → 중간값으로 수직 중앙 보정
    lineHeight: 22,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.bgElevated,
  },
});
