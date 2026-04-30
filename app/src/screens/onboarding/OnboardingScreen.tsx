import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🌙',
    title: '꿈을 잊기 전에',
    body: 'AI가 먼저 물어볼게요',
  },
  {
    emoji: '🔮',
    title: '꿈에 숨겨진 이야기',
    body: '당신만의 의미로 해석해드려요',
  },
  {
    emoji: '📖',
    title: '나만의 꿈 세계관',
    body: '아카이브로 차곡차곡 쌓아가요',
  },
];

const { width } = Dimensions.get('window');

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const listRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setCurrentIndex(Math.round(x / width));
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topRow}>
        {!isLast ? (
          <Pressable
            onPress={() => navigation.navigate('Login')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="건너뛰기"
          >
            <Text style={styles.skip}>건너뛰기</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, idx) => `slide-${idx}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, idx) => (
          <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {isLast ? (
          <>
            <Button
              label="로그인"
              onPress={() => navigation.navigate('Login')}
              fullWidth
            />
            <Button
              label="회원가입"
              variant="secondary"
              onPress={() => navigation.navigate('Signup')}
              fullWidth
            />
          </>
        ) : (
          <Button label="다음" onPress={goNext} fullWidth />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  topRow: {
    height: 44,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  skip: {
    ...textStyles.bodyMd,
    color: colors.textSecondary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.base,
  },
  title: {
    ...textStyles.heading1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primaryLight,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
});
