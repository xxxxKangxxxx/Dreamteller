import { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';

interface ChatBubbleProps {
  message: string;
  role: 'assistant' | 'user';
  isStreaming?: boolean;
  style?: ViewStyle;
}

export function ChatBubble({ message, role, isStreaming = false, style }: ChatBubbleProps) {
  const isAssistant = role === 'assistant';

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isAssistant ? 'flex-start' : 'flex-end' },
        style,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isAssistant ? styles.assistant : styles.user,
          isAssistant ? styles.tailLeft : styles.tailRight,
        ]}
      >
        {isStreaming && message.length === 0 ? (
          <TypingDots />
        ) : (
          <Text
            style={[
              styles.text,
              { color: isAssistant ? colors.primaryLight : colors.textPrimary },
            ]}
          >
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

function TypingDots() {
  return (
    <View style={styles.dots}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const id = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(id);
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  assistant: {
    backgroundColor: colors.primarySurface,
  },
  user: {
    backgroundColor: colors.bgElevated,
  },
  tailLeft: {
    borderBottomLeftRadius: 4,
  },
  tailRight: {
    borderBottomRightRadius: 4,
  },
  text: {
    ...textStyles.body,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
  },
});
