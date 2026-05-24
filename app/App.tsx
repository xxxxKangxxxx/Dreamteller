import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastContainer } from '@/components/ui/Toast';
import { colors } from '@/constants/colors';
import { RootNavigator } from '@/navigation/RootNavigator';
import { setUnauthorizedHandler } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

void SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bgBase,
    card: colors.bgSurface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
    notification: colors.primaryLight,
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  });

  useEffect(() => {
    void hydrate();
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <RootNavigator />
          <ToastContainer topOffset={48} />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
