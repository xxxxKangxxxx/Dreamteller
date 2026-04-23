import { config } from '@/constants/config';
import type { ChatMessage, Interpretation } from '@/types/dream';

import { ApiError, request, tokenStorage } from './api';

export type ChatStreamEvent =
  | { type: 'text'; content: string }
  | { type: 'step'; nextStep: number }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface ChatStreamPayload {
  sessionId: string;
  messages: ChatMessage[];
  step: number;
  signal?: AbortSignal;
  onEvent: (event: ChatStreamEvent) => void;
}

async function readSseStream(
  response: Response,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError('AI_SERVICE_ERROR', 'SSE 스트림을 열 수 없어요', 0);

  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n');
    while (boundary !== -1) {
      const line = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);
      boundary = buffer.indexOf('\n');
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const event = JSON.parse(payload) as ChatStreamEvent;
        onEvent(event);
        if (event.type === 'done') return;
      } catch {
        onEvent({ type: 'error', message: '스트림 파싱 오류' });
        return;
      }
    }
  }
}

export const interpretService = {
  async streamChat({ sessionId, messages, step, signal, onEvent }: ChatStreamPayload) {
    const token = await tokenStorage.getAccessToken();
    const response = await fetch(`${config.apiBaseUrl}/interpret/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId, messages, step }),
      signal,
    });

    if (!response.ok) {
      throw new ApiError('AI_SERVICE_ERROR', `AI 응답 실패 (${response.status})`, response.status);
    }

    await readSseStream(response, onEvent);
  },

  generate(dreamId: string) {
    return request<{ jobId: string; status: 'processing' }>({
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
