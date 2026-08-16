import type { ChatMessage, Interpretation } from '@/types/dream';

import { request } from './api';

export interface ChatTurnPayload {
  sessionId: string;
  messages: ChatMessage[];
  step: number;
  signal?: AbortSignal;
}

export interface ChatTurnResponse {
  text: string;
  nextStep: number;
  complete: boolean;
}

export const interpretService = {
  chatTurn({ sessionId, messages, step, signal }: ChatTurnPayload) {
    return request<ChatTurnResponse>({
      method: 'POST',
      url: '/interpret/chat',
      data: { sessionId, messages, step },
      signal,
    });
  },

  // 서버는 이미 해석이 있으면 새 잡을 만들지 않고 곧바로 completed를 돌려준다.
  generate(dreamId: string) {
    return request<{ jobId: string; status: 'processing' | 'completed' }>({
      method: 'POST',
      url: '/interpret/generate',
      data: { dreamId },
    });
  },

  get(dreamId: string) {
    return request<Interpretation>({
      method: 'GET',
      url: `/interpret/${dreamId}`,
    });
  },

  status(jobId: string) {
    return request<{ status: 'processing' | 'completed' | 'failed' }>({
      method: 'GET',
      url: `/interpret/status/${jobId}`,
    });
  },
};
