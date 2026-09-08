import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

/**
 * 화면 ↔ URL 매핑 (웹 전용).
 *
 * 이게 없으면 모든 화면이 `/` 하나를 공유해서, 새로고침하면 첫 화면으로 튕기고
 * 브라우저 뒤로가기가 앱을 통째로 벗어난다. 모바일 브라우저에서 뒤로가기는 사실상
 * 기본 조작이라 필수 배선이다.
 *
 * `Splash`는 일부러 뺐다 — 인증 확인 중에만 뜨는 과도기 화면이라 주소로 남을 이유가 없다.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Tabs: {
        path: '',
        screens: {
          Home: '',
          Record: 'record',
          Interpret: 'interpret',
          Archive: 'archive',
          Insights: 'insights',
        },
      },
      RecordChat: 'record/new',
      RecordSummary: 'record/:sessionId/summary',
      InterpretDetail: 'dreams/:dreamId/interpret',
      DreamCard: 'dreams/:dreamId/card',
      CharacterDetail: 'characters/:characterId',
      Settings: 'settings',

      Welcome: 'welcome',
      Onboarding: 'onboarding',
      Login: 'login',
      Signup: 'signup',
      OtpVerify: 'signup/verify',
    },
  },
};
