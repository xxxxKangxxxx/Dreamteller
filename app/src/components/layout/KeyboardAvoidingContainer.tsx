import { type ReactNode, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * 키보드가 입력창을 가리지 않게 하는 컨테이너.
 *
 * 네이티브는 기존 `KeyboardAvoidingView` 사용을 그대로 옮겨온 것이다 — 동작이
 * 바뀌지 않도록 behavior/offset 값을 유지한다. 웹은 방식이 완전히 달라
 * `KeyboardAvoidingContainer.web.tsx`에 따로 있다.
 */
export function KeyboardAvoidingContainer({ style, children }: Props) {
  return (
    <KeyboardAvoidingView
      style={style}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

/**
 * 키보드가 떠 있는지. 키보드가 하단 세이프 에어리어를 덮으므로, 그동안은 하단
 * 여백을 빼기 위해 쓴다.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
}
