import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Record: undefined;
  Interpret: undefined;
  Archive: undefined;
  Insights: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  RecordChat: undefined;
  RecordSummary: { sessionId: string };
  InterpretDetail: { dreamId: string };
  DreamCard: { dreamId: string };
  CharacterDetail: { characterId: string };
  Settings: undefined;
  Login: undefined;
  Signup: undefined;
  OtpVerify: { email: string };
  Onboarding: undefined;
  Welcome: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
