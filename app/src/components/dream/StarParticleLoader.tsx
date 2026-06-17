import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';

type Hue = 'light' | 'white' | 'info';

interface ParticleSpec {
  left: number;
  size: number;
  delay: number;
  duration: number;
  hue: Hue;
  drift: number;
}

// 화면 폭을 가득 채우도록 left 2%~98%에 고르게 분포 (30개)
const PARTICLES: ParticleSpec[] = [
  { left: 2, size: 3, delay: 0, duration: 2200, hue: 'light', drift: -2 },
  { left: 8, size: 5, delay: 450, duration: 2600, hue: 'white', drift: 3 },
  { left: 12, size: 4, delay: 900, duration: 2400, hue: 'info', drift: -1 },
  { left: 18, size: 6, delay: 200, duration: 2800, hue: 'light', drift: 4 },
  { left: 23, size: 3, delay: 1200, duration: 2000, hue: 'white', drift: -3 },
  { left: 28, size: 4, delay: 600, duration: 2500, hue: 'light', drift: 2 },
  { left: 33, size: 5, delay: 100, duration: 2700, hue: 'info', drift: -2 },
  { left: 38, size: 3, delay: 800, duration: 2300, hue: 'white', drift: 3 },
  { left: 43, size: 4, delay: 1400, duration: 2600, hue: 'light', drift: -4 },
  { left: 48, size: 5, delay: 350, duration: 2900, hue: 'info', drift: 1 },
  { left: 53, size: 3, delay: 1700, duration: 2100, hue: 'white', drift: -2 },
  { left: 58, size: 4, delay: 1000, duration: 2500, hue: 'light', drift: 3 },
  { left: 63, size: 3, delay: 1900, duration: 2300, hue: 'info', drift: -3 },
  { left: 68, size: 4, delay: 1550, duration: 2700, hue: 'white', drift: 2 },
  { left: 73, size: 3, delay: 1100, duration: 2400, hue: 'light', drift: -1 },
  { left: 78, size: 6, delay: 1300, duration: 2800, hue: 'info', drift: 4 },
  { left: 83, size: 4, delay: 500, duration: 2500, hue: 'white', drift: -2 },
  { left: 88, size: 5, delay: 1600, duration: 2650, hue: 'light', drift: 3 },
  { left: 93, size: 3, delay: 950, duration: 2200, hue: 'info', drift: -2 },
  { left: 98, size: 4, delay: 1850, duration: 2750, hue: 'white', drift: 2 },
  // 두 번째 레이어 — 사이사이를 채워 밀도 ↑ (delay/속도 다르게)
  { left: 5, size: 4, delay: 1350, duration: 2550, hue: 'info', drift: 2 },
  { left: 15, size: 3, delay: 700, duration: 2350, hue: 'light', drift: -3 },
  { left: 26, size: 5, delay: 1750, duration: 2850, hue: 'white', drift: 4 },
  { left: 36, size: 3, delay: 250, duration: 2150, hue: 'info', drift: -1 },
  { left: 46, size: 4, delay: 1450, duration: 2600, hue: 'light', drift: 3 },
  { left: 56, size: 3, delay: 550, duration: 2300, hue: 'white', drift: -4 },
  { left: 66, size: 5, delay: 1650, duration: 2900, hue: 'light', drift: 1 },
  { left: 76, size: 3, delay: 400, duration: 2250, hue: 'info', drift: -2 },
  { left: 86, size: 4, delay: 1500, duration: 2700, hue: 'white', drift: 3 },
  { left: 96, size: 3, delay: 850, duration: 2400, hue: 'light', drift: -3 },
];

const HUE_COLORS: Record<Hue, string> = {
  light: colors.primaryLight,
  white: colors.textPrimary,
  info: colors.info,
};

function Particle({
  left,
  size,
  delay,
  duration,
  hue,
  drift,
  fallHeight,
}: ParticleSpec & { fallHeight: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const translateY = -8 + p * (fallHeight + 16);
    const translateX = drift * Math.sin(p * Math.PI * 2);
    const fadeIn = p < 0.18 ? p / 0.18 : 1;
    const fadeOut = p > 0.82 ? (1 - p) / 0.18 : 1;
    const opacity = Math.min(fadeIn, fadeOut);
    const scale = 0.55 + Math.sin(p * Math.PI) * 0.55;
    return {
      opacity,
      transform: [{ translateX }, { translateY }, { scale }],
    };
  });

  const color = HUE_COLORS[hue];

  return (
    <Animated.View
      style={[
        styles.particle,
        {
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

interface StarParticleLoaderProps {
  /** 파티클이 떨어지는 영역 높이 (폭은 부모 가득 채움) */
  height?: number;
}

export function StarParticleLoader({ height = 200 }: StarParticleLoaderProps) {
  return (
    <View style={[styles.container, { height }]}>
      {PARTICLES.map((p, idx) => (
        <Particle key={idx} {...p} fallHeight={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'stretch', // 화면(부모) 폭을 가득 채워 파티클이 넓게 퍼지도록
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
