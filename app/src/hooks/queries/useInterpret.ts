import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { queryKeys } from '@/constants/queryKeys';
import { ApiError } from '@/services/api';
import { interpretService } from '@/services/interpretService';
import type { Interpretation } from '@/types/dream';

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_DURATION_MS = 60_000;

const buildPlaceholder = (
  dreamId: string,
  status: 'processing' | 'failed',
): Interpretation => ({
  dreamId,
  status,
  symbolAnalysis: { headline: '', detail: '', keySymbols: [] },
  psychologicalMeaning: { headline: '', detail: '', keySymbols: [], perspective: '' },
  unconsciousMessage: { headline: '', detail: '', keySymbols: [], affirmation: '' },
  symbolAnalysisText: '',
  psychologicalMeaningText: '',
  unconsciousMessageText: '',
});

interface UseInterpretOptions {
  /**
   * 해몽 한도를 넘겼으면 false. 새 해몽 "생성"만 막고 기존 해몽 "조회"는 그대로 둔다
   * — 서버 `/interpret/generate`의 정책과 동일하게 맞춘 것.
   */
  canGenerate?: boolean;
}

export function useInterpret(dreamId: string | undefined, options: UseInterpretOptions = {}) {
  const { canGenerate = true } = options;
  const queryClient = useQueryClient();
  // 이 마운트에서 generate를 이미 쏜 dreamId와 그 시각.
  // 폴링(refetchInterval)이 queryFn 전체를 재실행하면서 generate까지 매번 다시 부르던 것을 막는다.
  const jobRef = useRef<{ dreamId: string; startedAt: number } | null>(null);

  return useQuery({
    queryKey: dreamId ? queryKeys.interpret.detail(dreamId) : ['interpret', 'detail', 'pending'],
    queryFn: async () => {
      if (!dreamId) throw new Error('dreamId is required');

      const load = async (isNewlyGenerated: boolean) => {
        const interpretation = await interpretService.get(dreamId);
        if (isNewlyGenerated) {
          // 방금 해몽이 새로 생겼으므로 이번 달 사용량 카운터가 낡았다.
          // 이걸 갱신하지 않으면 한도를 넘긴 뒤에도 게이트가 열려 서버 429로 떨어진다.
          void queryClient.invalidateQueries({ queryKey: queryKeys.stats.usage() });
        }
        return interpretation;
      };

      // 실패로 끊을 땐 jobRef를 비워서, 다시 진입하거나 refetch하면 generate부터 재시도되게 한다.
      const fail = () => {
        jobRef.current = null;
        return buildPlaceholder(dreamId, 'failed');
      };

      // ── 1. 이 dreamId로 아직 generate를 쏘지 않은 상태
      if (jobRef.current?.dreamId !== dreamId) {
        try {
          return await load(false);
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 404)) throw error;
        }

        // 해몽이 없는데 한도를 넘겼으면 생성하지 않는다(서버 429를 미리 피한다).
        if (!canGenerate) return buildPlaceholder(dreamId, 'failed');

        // generate는 여기서 딱 한 번만. 서버가 (기존 해석 → 진행 중 잡) 순으로 먼저 확인하므로
        // 화면 재진입으로 다시 호출돼도 중복 Gemini 잡은 생기지 않는다.
        jobRef.current = { dreamId, startedAt: Date.now() };
        const job = await interpretService.generate(dreamId);
        return job.status === 'completed'
          ? await load(true)
          : buildPlaceholder(dreamId, 'processing');
      }

      // ── 2. 이후 폴링: generate가 아니라 status만 두드린다.
      // `/status`는 인메모리 _jobs가 비어 있어도 DB로 폴백하므로 서버 재시작에도 안전하다.
      const { status } = await interpretService.status(dreamId);
      if (status === 'completed') return await load(true);
      if (status === 'failed') return fail();

      // processing이 상한을 넘도록 이어지면 무한 폴링 대신 실패로 끊는다.
      if (Date.now() - jobRef.current.startedAt > MAX_POLL_DURATION_MS) return fail();

      return buildPlaceholder(dreamId, 'processing');
    },
    enabled: Boolean(dreamId),
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? POLL_INTERVAL_MS : false,
    staleTime: 0,
  });
}
