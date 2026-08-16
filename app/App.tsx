import {
  createNavigationContainerRef,
  DarkTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastContainer } from '@/components/ui/Toast';
import { colors } from '@/constants/colors';
import { RootNavigator } from '@/navigation/RootNavigator';
import type { RootStackParamList } from '@/navigation/types';
import { setUnauthorizedHandler } from '@/services/api';
import {
  configureNotificationHandler,
  NOTIFICATION_SCREEN_RECORD,
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

  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  });

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
    const isRecordIntent = (data: unknown) =>
      (data as { screen?: string } | undefined)?.screen === NOTIFICATION_SCREEN_RECORD;

    // 앱 실행 중 알림 탭
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isRecordIntent(response.notification.request.content.data)) tryNavigateToRecord();
    });

    // 알림 탭으로 콜드 스타트된 경우
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && isRecordIntent(response.notification.request.content.data)) {
        tryNavigateToRecord();
      }
    });

    // 인증 완료 후 보류된 이동 실행
    const unsubAuth = useAuthStore.subscribe((state) => {
      if (state.status === 'authenticated' && pendingRecordNav) {
        setTimeout(tryNavigateToRecord, 0);
      }
    });

    return () => {
      responseSub.remove();
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
        <NavigationContainer
          ref={navigationRef}
          theme={navigationTheme}
          onReady={() => {
            if (pendingRecordNav) tryNavigateToRecord();
          }}
        >
          <StatusBar style="light" />
          <RootNavigator />
          <ToastContainer topOffset={48} />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
