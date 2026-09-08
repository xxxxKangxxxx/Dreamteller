import {
  createNavigationContainerRef,
  DarkTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/layout/AppShell';
import { AlertHost } from '@/components/ui/AlertHost';
import { ToastContainer } from '@/components/ui/Toast';
import { colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/useAppFonts';
import { linking } from '@/navigation/linking';
import { RootNavigator } from '@/navigation/RootNavigator';
import type { RootStackParamList } from '@/navigation/types';
import { setUnauthorizedHandler } from '@/services/api';
import {
  addRecordIntentListener,
  configureNotificationHandler,
} from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';

void SplashScreen.preventAutoHideAsync().catch(() => {});

configureNotificationHandler();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// 알림 탭으로 RecordChat 진입 요청. 인증/네비 준비 전이면 보류했다가 인증 완료 후 실행
let pendingRecordNav = false;

function tryNavigateToRecord() {
  if (!navigationRef.isReady()) return;
  if (useAuthStore.getState().status !== 'authenticated') {
    pendingRecordNav = true;
    return;
  }
  pendingRecordNav = false;
  navigationRef.navigate('RecordChat');
}

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
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  const fontsLoaded = useAppFonts();

  useEffect(() => {
    void hydrate();
    void hydrateSettings();
    setUnauthorizedHandler(() => {
      // logout()이 아니라 sessionExpired() — signOut()으로 Supabase 세션까지
      // 파괴하면 재로그인 수단이 없는 게스트는 기록을 영구히 잃는다.
      void useAuthStore.getState().sessionExpired();
    });
    return () => setUnauthorizedHandler(null);
  }, [hydrate, hydrateSettings]);

  useEffect(() => {
    // 알림 탭(실행 중 + 콜드 스타트) 구독. 웹에서는 no-op이다.
    const unsubNotifications = addRecordIntentListener(tryNavigateToRecord);

    // 인증 완료 후 보류된 이동 실행
    const unsubAuth = useAuthStore.subscribe((state) => {
      if (state.status === 'authenticated' && pendingRecordNav) {
        setTimeout(tryNavigateToRecord, 0);
      }
    });

    return () => {
      unsubNotifications();
      unsubAuth();
    };
  }, []);

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
        <AppShell>
          <NavigationContainer
            ref={navigationRef}
            theme={navigationTheme}
            linking={linking}
            onReady={() => {
              if (pendingRecordNav) tryNavigateToRecord();
            }}
          >
            <StatusBar style="light" />
            <RootNavigator />
            <ToastContainer topOffset={48} />
            <AlertHost />
          </NavigationContainer>
        </AppShell>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
