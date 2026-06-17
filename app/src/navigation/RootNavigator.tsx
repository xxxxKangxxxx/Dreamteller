import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '@/constants/colors';
import { CharacterDetailScreen } from '@/screens/archive/CharacterDetailScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { OtpVerifyScreen } from '@/screens/auth/OtpVerifyScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { DreamCardScreen } from '@/screens/interpret/DreamCardScreen';
import { InterpretScreen } from '@/screens/interpret/InterpretScreen';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { RecordChatScreen } from '@/screens/record/RecordChatScreen';
import { RecordSummaryScreen } from '@/screens/record/RecordSummaryScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { useAuthStore } from '@/store/authStore';

import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);

  const navigatorKey =
    status === 'authenticated' ? 'app' : status === 'unauthenticated' ? 'auth' : 'splash';

  return (
    <Stack.Navigator
      key={navigatorKey}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgBase },
      }}
    >
      {status === 'idle' || status === 'loading' ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : status === 'authenticated' ? (
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen
            name="RecordChat"
            component={RecordChatScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="RecordSummary" component={RecordSummaryScreen} />
          <Stack.Screen name="InterpretDetail" component={InterpretScreen} />
          <Stack.Screen name="DreamCard" component={DreamCardScreen} />
          <Stack.Screen name="CharacterDetail" component={CharacterDetailScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
