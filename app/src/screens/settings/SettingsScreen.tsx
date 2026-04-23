import { Placeholder } from '@/components/layout/Placeholder';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export function SettingsScreen() {
  return (
    <ScreenWrapper scrollable>
      <Placeholder
        title="설정"
        description="프로필 / 알림 / 구독 / 데이터 내보내기 예정"
      />
    </ScreenWrapper>
  );
}
