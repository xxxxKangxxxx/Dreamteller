import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import { statsService } from '@/services/statsService';

export function useUsage() {
  return useQuery({
    queryKey: queryKeys.stats.usage(),
    queryFn: () => statsService.usage(),
  });
}
