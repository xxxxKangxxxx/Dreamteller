import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const first = trimmed[0] ?? '';
  return first.toUpperCase();
}

export function Avatar({ uri, name = '', size = 40, style }: AvatarProps) {
  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius.full,
    overflow: 'hidden',
  };

  if (uri) {
    return (
      <View style={[containerStyle, styles.imageWrapper, style]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={150}
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, styles.fallback, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.42 }]}>
        {initialsFromName(name) || '🌙'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    backgroundColor: colors.bgElevated,
  },
  fallback: {
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primaryLight,
    fontFamily: typography.fonts.semibold,
  },
});
