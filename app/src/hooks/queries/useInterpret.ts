import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import { ApiError } from '@/services/api';
import { interpretService } from '@/services/interpretService';

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_DURATION_MS = 60_000;

export function useInterpret(dreamId: string | undefined) {
  return useQuery({
    queryKey: dreamId ? queryKeys.interpret.detail(dreamId) : ['interpret', 'detail', 'pending'],
    queryFn: async () => {
      if (!dreamId) throw new Error('dreamId is required');
      try {
        return await interpretService.get(dreamId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await interpretService.generate(dreamId);
          return interpretService.get(dreamId);
        }
        throw error;
      }
    },
    enabled: Boolean(dreamId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return POLL_INTERVAL_MS;
      if (data.status === 'processing') {
        const elapsed = Date.now() - (query.state.dataUpdatedAt ?? 0);
        return elapsed > MAX_POLL_DURATION_MS ? false : POLL_INTERVAL_MS;
      }
      return false;
    },
    staleTime: 0,
  });
}

export function useGenerateInterpret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dreamId: string) => interpretService.generate(dreamId),
    onSuccess: (_data, dreamId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.interpret.detail(dreamId) });
    },
  });
}
