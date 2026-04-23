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
  chatHistory: ChatMessage[];
  interpretation: Interpretation | null;
  characters: { id: string; name: string; relation: string }[];
  places: { id: string; name: string }[];
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
