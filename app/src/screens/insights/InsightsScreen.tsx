import { Placeholder } from '@/components/layout/Placeholder';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export function InsightsScreen() {
  return (
    <ScreenWrapper scrollable hasTabBar>
      <Placeholder
        title="인사이트"
        description="기록 수 / 스트릭 / 감정 분포 차트 예정"
      />
    </ScreenWrapper>
  );
}
