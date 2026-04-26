import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { queryKeys } from '@/constants/queryKeys';
import { dreamService, type DreamListFilter } from '@/services/dreamService';

export function useDreams(filter: DreamListFilter = {}) {
  return useQuery({
    queryKey: queryKeys.dreams.list(filter),
    queryFn: () => dreamService.list(filter),
  });
}

export function useInvalidateDreams() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.dreams.all });
  }, [queryClient]);
}
