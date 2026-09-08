import * as AppleAuthentication from 'expo-apple-authentication';
import type { StyleProp, ViewStyle } from 'react-native';

import { radius } from '@/constants/spacing';

interface Props {
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}

/**
 * Apple 공식 로그인 버튼. 디자인이 Apple 가이드라인에 묶여 있어 자체 렌더가 아니라
 * 네이티브 컴포넌트를 그대로 쓴다.
 *
 * 웹 구현(`AppleSignInButton.web.tsx`)은 null을 렌더한다 — `expo-apple-authentication`은
 * 웹 번들에서 쓸 수 없고, 웹 Apple 로그인은 별도 콘솔 설정이 필요해 아직 열지 않았다.
 */
export function AppleSignInButton({ style, onPress }: Props) {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={radius.md}
      style={style}
      onPress={onPress}
    />
  );
}
