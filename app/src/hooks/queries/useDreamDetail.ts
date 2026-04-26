import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import { dreamService } from '@/services/dreamService';

export function useDreamDetail(dreamId: string | undefined) {
  return useQuery({
    queryKey: dreamId ? queryKeys.dreams.detail(dreamId) : ['dreams', 'detail', 'pending'],
    queryFn: () => {
      if (!dreamId) throw new Error('dreamId is required');
      return dreamService.get(dreamId);
    },
    enabled: Boolean(dreamId),
  });
}
