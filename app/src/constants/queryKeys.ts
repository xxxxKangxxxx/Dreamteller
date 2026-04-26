import type { DreamListFilter } from '@/services/dreamService';

export const queryKeys = {
  dreams: {
    all: ['dreams'] as const,
    list: (filter: DreamListFilter = {}) => ['dreams', 'list', filter] as const,
    detail: (dreamId: string) => ['dreams', 'detail', dreamId] as const,
  },
  interpret: {
    detail: (dreamId: string) => ['interpret', 'detail', dreamId] as const,
  },
  stats: {
    monthly: (year: number, month: number) => ['stats', 'monthly', year, month] as const,
    usage: () => ['stats', 'usage'] as const,
  },
  archive: {
    characters: () => ['archive', 'characters'] as const,
    places: () => ['archive', 'places'] as const,
    themes: () => ['archive', 'themes'] as const,
  },
} as const;
