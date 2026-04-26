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

const PARTICLES = [
  { left: 12, top: 22, size: 4, delay: 0, duration: 1600 },
  { left: 38, top: 8, size: 6, delay: 250, duration: 1900 },
  { left: 62, top: 30, size: 3, delay: 500, duration: 1400 },
  { left: 80, top: 14, size: 5, delay: 700, duration: 1800 },
  { left: 24, top: 60, size: 5, delay: 350, duration: 1700 },
  { left: 52, top: 70, size: 4, delay: 600, duration: 1500 },
  { left: 74, top: 56, size: 3, delay: 200, duration: 1600 },
  { left: 88, top: 78, size: 4, delay: 800, duration: 1900 },
];

interface ParticleProps {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

function Particle({ left, top, size, delay, duration }: ParticleProps) {
  const opacity = useSharedValue(0.2);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.2, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${left}%`,
          top: `${top}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

interface StarParticleLoaderProps {
  size?: number;
}

export function StarParticleLoader({ size = 160 }: StarParticleLoaderProps) {
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
  },
  particle: {
    position: 'absolute',
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primaryLight,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
