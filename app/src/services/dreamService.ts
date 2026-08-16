import { request } from './api';
import type { ChatMessage, Dream, Emotion, Interpretation } from '@/types/dream';

export interface DreamListFilter {
  page?: number;
  limit?: number;
  emotion?: Emotion;
  from?: string;
  to?: string;
}

export interface DreamListResponse {
  dreams: Dream[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CreateDreamPayload {
  rawContent: string;
  chatHistory: ChatMessage[];
  emotion: Emotion;
  recordedAt: string;
}

export interface CreateDreamResponse {
  id: string;
  title: string;
  rawContent: string;
  tags: { label: string }[];
}

export interface DreamDetail extends Dream {
  /** AI 줄거리. 아직 생성하지 않았으면 null (S-2) */
  summary: string | null;
  chatHistory: ChatMessage[];
  interpretation: Interpretation | null;
  characters: { id: string; name: string; relation: string }[];
  places: { id: string; name: string }[];
}

export interface GenerateSummaryResponse {
  dreamId: string;
  summary: string;
  /** 이미 있던 줄거리를 그대로 돌려준 경우 true (서버가 멱등 처리) */
  cached: boolean;
}

export const dreamService = {
  list(filter: DreamListFilter = {}) {
    return request<DreamListResponse>({
      method: 'GET',
      url: '/dreams',
      params: filter,
    });
  },

  get(id: string) {
    return request<DreamDetail>({
      method: 'GET',
      url: `/dreams/${id}`,
    });
  },

  // 서버가 멱등 처리한다 — 이미 줄거리가 있으면 Gemini를 부르지 않고 기존 값을 준다.
  generateSummary(id: string) {
    return request<GenerateSummaryResponse>({
      method: 'POST',
      url: `/dreams/${id}/summary`,
    });
  },

  create(payload: CreateDreamPayload) {
    return request<CreateDreamResponse>({
      method: 'POST',
      url: '/dreams',
      data: payload,
    });
  },

  update(id: string, patch: { rawContent?: string; emotion?: Emotion; title?: string }) {
    return request<Dream>({
      method: 'PATCH',
      url: `/dreams/${id}`,
      data: patch,
    });
  },

  remove(id: string) {
    return request<{ success: true }>({
      method: 'DELETE',
      url: `/dreams/${id}`,
    });
  },
};
