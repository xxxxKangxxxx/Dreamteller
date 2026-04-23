import { Placeholder } from '@/components/layout/Placeholder';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export function ArchiveScreen() {
  return (
    <ScreenWrapper hasTabBar>
      <Placeholder
        title="드림 아카이브"
        description="등장인물 / 장소 / 테마 3탭 그리드 예정"
      />
    </ScreenWrapper>
  );
}
