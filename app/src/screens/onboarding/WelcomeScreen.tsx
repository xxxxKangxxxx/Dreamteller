import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.brandBlock}>
        <Text style={styles.logo}>DreamTeller</Text>
        <Text style={styles.tagline}>대화하며 기록하는 꿈, 따뜻하게 풀어내는 해몽 ✨</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="시작하기"
          variant="primary"
          onPress={() => navigation.navigate('Login')}
          fullWidth
        />
        <Button
          label="앱 소개 보기"
          variant="ghost"
          onPress={() => navigation.navigate('Onboarding')}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
    justifyContent: 'space-between',
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
    gap: spacing.sm,
  },
});
