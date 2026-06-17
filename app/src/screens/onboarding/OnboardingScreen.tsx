import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface Slide {
  kicker: string;
  title: string;
  body: string;
  points: string[];
}

const SLIDES: Slide[] = [
  {
    kicker: 'STEP 01 · 기록',
    title: '대화하듯, 꿈을 기록해요',
    body: '빈 화면에 막막하게 적지 않아도 돼요. AI가 건네는 질문에 답하다 보면 흐릿했던 꿈이 한 편의 이야기로 정리돼요.',
    points: ['짧은 5단계 대화로 진행', '떠오르는 대로 편하게 답하기', '어젯밤 꿈이 또렷한 기록으로'],
  },
  {
    kicker: 'STEP 02 · 해몽',
    title: '꿈에 숨은 의미를 풀어드려요',
    body: '기록한 꿈을 세 가지 관점으로 깊이 있게 해석해, 단순한 꿈풀이를 넘어 오늘의 나를 돌아보게 해요.',
    points: ['상징 분석', '심리학적 의미', '무의식의 메시지'],
  },
  {
    kicker: 'STEP 03 · 아카이브',
    title: '나만의 꿈 세계관을 쌓아가요',
    body: '기록이 쌓일수록 감정의 흐름과 자주 나타나는 테마가 한눈에 보여요. 마음에 든 해몽은 꿈 카드로 간직하고 공유할 수도 있어요.',
    points: ['감정 분포 인사이트', '반복되는 테마 발견', '감성 꿈 카드 저장·공유'],
  },
];

const { width } = Dimensions.get('window');

interface StarSpec {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  hue: 'white' | 'light';
}

const STARS: StarSpec[] = [
  { top: 8, left: 12, size: 2, delay: 0, duration: 2200, opacity: 0.9, hue: 'white' },
  { top: 14, left: 78, size: 3, delay: 600, duration: 2600, opacity: 0.8, hue: 'light' },
  { top: 20, left: 40, size: 1.5, delay: 1200, duration: 2000, opacity: 0.7, hue: 'white' },
  { top: 26, left: 88, size: 2, delay: 300, duration: 2400, opacity: 0.85, hue: 'white' },
  { top: 30, left: 22, size: 2.5, delay: 900, duration: 2800, opacity: 0.75, hue: 'light' },
  { top: 36, left: 62, size: 1.5, delay: 1500, duration: 2100, opacity: 0.7, hue: 'white' },
  { top: 42, left: 8, size: 2, delay: 450, duration: 2500, opacity: 0.8, hue: 'white' },
  { top: 46, left: 50, size: 3, delay: 1100, duration: 2700, opacity: 0.85, hue: 'light' },
  { top: 52, left: 84, size: 2, delay: 200, duration: 2300, opacity: 0.75, hue: 'white' },
  { top: 58, left: 30, size: 1.5, delay: 1700, duration: 2200, opacity: 0.7, hue: 'white' },
  { top: 62, left: 70, size: 2.5, delay: 750, duration: 2600, opacity: 0.8, hue: 'light' },
  { top: 70, left: 16, size: 2, delay: 1350, duration: 2400, opacity: 0.75, hue: 'white' },
  { top: 74, left: 92, size: 1.5, delay: 500, duration: 2000, opacity: 0.7, hue: 'white' },
  { top: 80, left: 46, size: 2, delay: 1600, duration: 2700, opacity: 0.8, hue: 'light' },
  { top: 86, left: 74, size: 2.5, delay: 1000, duration: 2500, opacity: 0.75, hue: 'white' },
  { top: 90, left: 26, size: 1.5, delay: 1900, duration: 2100, opacity: 0.7, hue: 'white' },
];

const STAR_COLORS = { white: colors.textPrimary, light: colors.primaryLight } as const;

function TwinkleStar({ top, left, size, delay, duration, opacity, hue }: StarSpec) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [delay, duration, v]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity * (0.25 + v.value * 0.75),
  }));

  const color = STAR_COLORS[hue];

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top: `${top}%`,
          left: `${left}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

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
    <View style={styles.root}>
      <LinearGradient
        colors={['#0D0D1A', '#171029', '#241548', '#0D0D1A']}
        locations={[0, 0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STARS.map((s, idx) => (
          <TwinkleStar key={idx} {...s} />
        ))}
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
              <Text style={styles.kicker}>{item.kicker}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <View style={styles.points}>
                {item.points.map((point) => (
                  <View key={point} style={styles.pointRow}>
                    <View style={styles.pointDot} />
                    <Text style={styles.pointText}>{point}</Text>
                  </View>
                ))}
              </View>
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
              <Button label="로그인" onPress={() => navigation.navigate('Login')} fullWidth />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  safe: {
    flex: 1,
  },
  star: {
    position: 'absolute',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
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
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  kicker: {
    ...textStyles.label,
    color: colors.primaryLight,
    letterSpacing: 1.5,
  },
  title: {
    ...textStyles.heading1,
    color: colors.textPrimary,
  },
  body: {
    ...textStyles.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  points: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pointDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primaryLight,
  },
  pointText: {
    ...textStyles.bodyMd,
    color: colors.textPrimary,
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
