import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

interface ScreenWrapperProps {
  children: ReactNode;
  scrollable?: boolean;
  safeArea?: boolean;
  bgColor?: string;
  hasTabBar?: boolean;
  style?: ViewStyle;
}

const TAB_BAR_SPACE = 72;

export function ScreenWrapper({
  children,
  scrollable = false,
  safeArea = true,
  bgColor = colors.bgBase,
  hasTabBar = false,
  style,
}: ScreenWrapperProps) {
  const Container = safeArea ? SafeAreaView : View;
  const bodyPadding = hasTabBar ? { paddingBottom: TAB_BAR_SPACE } : undefined;

  const content = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, bodyPadding]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.body, bodyPadding, style]}>{children}</View>
  );

  return (
    <Container style={[styles.flex, { backgroundColor: bgColor }]} edges={['top']}>
      {content}
    </Container>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
});
