import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

export interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onRequestClose: () => void;
  style?: StyleProp<ViewStyle>;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * TimePicker의 웹 구현.
 *
 * `@react-native-community/datetimepicker`는 웹 구현이 없다. 브라우저 기본
 * `<input type="time">`을 쓰면 모바일에서 OS 시각 선택기가 그대로 뜨고 접근성도
 * 공짜로 따라오므로, 스피너를 흉내 내지 않고 그대로 쓴다.
 *
 * 참고: 지금은 웹에서 알림 기능 자체를 숨기므로(`notificationService.web.ts`의
 * `isReminderSupported: false`) 이 컴포넌트는 렌더되지 않는다. 웹 푸시를 도입하면
 * 그때 살아난다.
 */
export function TimePicker({ value, onChange, style }: TimePickerProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <input
        type="time"
        value={`${pad(value.getHours())}:${pad(value.getMinutes())}`}
        onChange={(event) => {
          const [hour, minute] = event.target.value.split(':').map(Number);
          if (hour === undefined || minute === undefined) return;
          if (Number.isNaN(hour) || Number.isNaN(minute)) return;
          const next = new Date(value);
          next.setHours(hour, minute, 0, 0);
          onChange(next);
        }}
        style={{
          width: '100%',
          padding: spacing.md,
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          background: colors.bgElevated,
          color: colors.textPrimary,
          fontSize: 17,
          colorScheme: 'dark',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: spacing.sm,
  },
});
