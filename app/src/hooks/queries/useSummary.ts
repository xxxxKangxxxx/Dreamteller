import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import { dreamService } from '@/services/dreamService';

/**
 * 꿈 줄거리 생성 (S-2).
 *
 * **조회 쿼리를 따로 두지 않는다** — `GET /dreams/{id}`가 이미 `summary`를 내려주고
 * 상세 화면은 그걸 `useDreamDetail`로 읽고 있다. 여기서는 생성만 담당하고,
 * 성공하면 상세를 무효화해 새 줄거리가 흘러들어오게 한다.
 *
 * 서버가 멱등이라 중복 호출해도 Gemini를 두 번 부르지 않는다.
 */
export function useGenerateSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dreamId: string) => dreamService.generateSummary(dreamId),
    onSuccess: (_data, dreamId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dreams.detail(dreamId) });
    },
  });
}
