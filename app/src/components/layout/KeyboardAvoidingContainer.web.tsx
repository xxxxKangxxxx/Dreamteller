import { type ReactNode, useEffect, useState } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * 키보드에 가려지는 높이(px)를 구한다.
 *
 * **react-native-web에는 키보드 개념이 없다** — `KeyboardAvoidingView`는 자식을 그대로
 * 통과시키고 `Keyboard.addListener`는 영영 발화하지 않는다. 그대로 두면 모바일
 * 브라우저에서 키보드가 올라올 때 입력창이 가려진다. 이 앱의 핵심 플로우가 채팅형
 * 기록이라 그냥 넘길 수 없는 문제다.
 *
 * 브라우저에서 소프트 키보드를 알 수 있는 유일한 통로가 `visualViewport`다. 키보드가
 * 뜨면 레이아웃 뷰포트는 그대로인 채 비주얼 뷰포트만 줄어들고, 그 차이가 곧 가려진
 * 높이다. `offsetTop`을 빼는 이유는 페이지가 이미 밀려 올라간 만큼은 보정됐기 때문.
 *
 * visualViewport가 없는 브라우저에서는 0으로 둔다 — 가려지는 건 여전하지만 잘못된
 * 값으로 레이아웃을 흔드는 것보다 낫다.
 */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = typeof window !== 'undefined' ? window.visualViewport : undefined;
    if (!viewport) return;

    const update = () => {
      const hidden = window.innerHeight - viewport.height - viewport.offsetTop;
      // 1px 미만의 반올림 잡음으로 리렌더가 계속 돌지 않도록 문턱을 둔다
      setInset(hidden > 1 ? Math.round(hidden) : 0);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}

export function KeyboardAvoidingContainer({ style, children }: Props) {
  const keyboardInset = useKeyboardInset();
  return <View style={[style, { paddingBottom: keyboardInset }]}>{children}</View>;
}

export function useKeyboardVisible(): boolean {
  return useKeyboardInset() > 0;
}
