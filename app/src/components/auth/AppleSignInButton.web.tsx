import type { StyleProp, ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}

/**
 * 웹에서는 Apple 로그인을 노출하지 않으므로 아무것도 렌더하지 않는다.
 * 이유는 `services/authService.web.ts`의 `isAppleAvailable` 주석 참조.
 * (해당 함수가 false를 반환하므로 이 컴포넌트는 실제로는 렌더되지도 않는다)
 */
export function AppleSignInButton(_props: Props) {
  return null;
}
