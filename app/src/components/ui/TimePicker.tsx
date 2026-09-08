import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';

export interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  /** 안드로이드는 선택 즉시 닫히는 모달이라 호출부가 열림 상태를 내려야 한다 */
  onRequestClose: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * 시각 선택기. `@react-native-community/datetimepicker`는 웹을 지원하지 않아
 * `TimePicker.web.tsx`에 별도 구현이 있다.
 */
export function TimePicker({ value, onChange, onRequestClose, style }: TimePickerProps) {
  return (
    <DateTimePicker
      value={value}
      mode="time"
      display="spinner"
      textColor={colors.textPrimary}
      style={style}
      onChange={(event, date) => {
        if (Platform.OS === 'android') onRequestClose();
        if (event.type === 'dismissed' || !date) return;
        onChange(date);
      }}
    />
  );
}
