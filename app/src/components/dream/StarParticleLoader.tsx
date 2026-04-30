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

const PARTICLES: ParticleSpec[] = [
  { left: 6, size: 3, delay: 0, duration: 2200, hue: 'light', drift: -2 },
  { left: 14, size: 5, delay: 450, duration: 2600, hue: 'white', drift: 3 },
  { left: 22, size: 4, delay: 900, duration: 2400, hue: 'info', drift: -1 },
  { left: 30, size: 6, delay: 200, duration: 2800, hue: 'light', drift: 4 },
  { left: 38, size: 3, delay: 1200, duration: 2000, hue: 'white', drift: -3 },
  { left: 46, size: 4, delay: 600, duration: 2500, hue: 'light', drift: 2 },
  { left: 54, size: 5, delay: 100, duration: 2700, hue: 'info', drift: -2 },
  { left: 62, size: 3, delay: 800, duration: 2300, hue: 'white', drift: 3 },
  { left: 70, size: 4, delay: 1400, duration: 2600, hue: 'light', drift: -4 },
  { left: 78, size: 5, delay: 350, duration: 2900, hue: 'info', drift: 1 },
  { left: 86, size: 3, delay: 1700, duration: 2100, hue: 'white', drift: -2 },
  { left: 94, size: 4, delay: 1000, duration: 2500, hue: 'light', drift: 3 },
  { left: 18, size: 3, delay: 1900, duration: 2300, hue: 'info', drift: -3 },
  { left: 42, size: 4, delay: 1550, duration: 2700, hue: 'white', drift: 2 },
  { left: 66, size: 3, delay: 1100, duration: 2400, hue: 'light', drift: -1 },
  { left: 82, size: 6, delay: 1300, duration: 2800, hue: 'info', drift: 4 },
];

const HUE_COLORS: Record<Hue, string> = {
  light: colors.primaryLight,
  white: colors.textPrimary,
  info: colors.info,
};

function Particle({ left, size, delay, duration, hue, drift }: ParticleSpec) {
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
    const translateY = -8 + p * 150;
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
  size?: number;
}

export function StarParticleLoader({ size = 180 }: StarParticleLoaderProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {PARTICLES.map((p, idx) => (
        <Particle key={idx} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
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
