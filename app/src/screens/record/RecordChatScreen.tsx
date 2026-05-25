import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  type AppStateStatus,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/dream/ChatBubble';
import { ToastContainer } from '@/components/ui/Toast';
import { colors } from '@/constants/colors';
import { config } from '@/constants/config';
import { FALLBACK_MESSAGES } from '@/constants/prompts';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useRecordSession } from '@/hooks/useRecordSession';
import type { RootStackParamList } from '@/navigation/types';
import { useRecordStore } from '@/store/recordStore';
import { useUIStore } from '@/store/uiStore';
import type { ChatMessage } from '@/types/dream';
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
  const listRef = useRef<FlatList<ListItem>>(null);

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
  const currentStep = session?.step ?? 1;

  return (
    <>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="기록 닫기"
        >
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.stepIndicator}>{currentStep}/5단계</Text>
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

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="꿈 이야기를 들려주세요"
            placeholderTextColor={colors.textMuted}
            multiline
            editable={!isStreaming}
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
    </SafeAreaView>
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
  stepIndicator: {
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
