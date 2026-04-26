import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import { statsService } from '@/services/statsService';

export function useMonthlyStats(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.stats.monthly(year, month),
    queryFn: () => statsService.monthly({ year, month }),
  });
}
