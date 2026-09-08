export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export interface AlertOptions {
  /**
   * false면 바깥을 눌러도 닫히지 않는다.
   * 네이티브에서는 Android 전용 옵션이지만, 웹 모달에서는 배경 탭/Esc 처리에 그대로 쓴다.
   */
  cancelable?: boolean;
}
