import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <Text style={styles.logo}>DreamTeller</Text>
        <Text style={styles.tagline}>대화하며 기록하는 꿈 ✨</Text>
      </View>
      <View style={styles.actions}>
        <Button label="시작하기" onPress={() => navigation.navigate('Login')} fullWidth />
        <Button
          label="앱 소개 보기"
          variant="ghost"
          onPress={() => navigation.navigate('Onboarding')}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
  },
  brandBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logo: {
    ...textStyles.heading1,
    color: colors.textPrimary,
  },
  tagline: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  actions: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
  },
});
