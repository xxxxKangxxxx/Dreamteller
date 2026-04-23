import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CharacterDetailScreen } from '@/screens/archive/CharacterDetailScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { DreamCardScreen } from '@/screens/interpret/DreamCardScreen';
import { InterpretScreen } from '@/screens/interpret/InterpretScreen';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { RecordChatScreen } from '@/screens/record/RecordChatScreen';
import { RecordSummaryScreen } from '@/screens/record/RecordSummaryScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="RecordChat"
        component={RecordChatScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="RecordSummary" component={RecordSummaryScreen} />
      <Stack.Screen name="InterpretDetail" component={InterpretScreen} />
      <Stack.Screen name="DreamCard" component={DreamCardScreen} />
      <Stack.Screen name="CharacterDetail" component={CharacterDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    </Stack.Navigator>
  );
}
