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
  /**
   * `autoInterpret`: 기록 완료 후 '해몽 받기'로 들어왔을 때만 true.
   * 이때만 해몽을 자동 생성한다 — '줄거리 받기'나 홈·아카이브 진입에서
   * 자동 생성되면 FREE 해몽 한도(월 5회)가 의도치 않게 소모된다.
   */
  InterpretDetail: { dreamId: string; autoInterpret?: boolean };
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
