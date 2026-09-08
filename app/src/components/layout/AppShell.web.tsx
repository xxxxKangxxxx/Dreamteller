import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/colors';

/**
 * 웹 전용 셸.
 *
 * 주 사용 시나리오는 휴대폰 브라우저라 대부분 화면을 꽉 채우고, 데스크톱에서 열렸을
 * 때만 480px로 좁혀 중앙에 놓는다(양옆은 배경색).
 *
 * 높이를 `100vh`가 아니라 `100dvh`로 잡는 이유: iOS Safari의 `100vh`는 주소창이
 * 접힌 상태를 기준으로 계산돼 실제 보이는 영역보다 커진다. 그러면 하단 탭바와
 * 입력창이 주소창 뒤로 잘린다. `dvh`는 실제 보이는 높이를 따라간다.
 * (react-native-web은 숫자가 아닌 문자열 길이값을 CSS로 그대로 넘긴다)
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <View style={styles.page}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    height: '100dvh' as unknown as number,
    width: '100%',
    backgroundColor: colors.bgBase,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
});
