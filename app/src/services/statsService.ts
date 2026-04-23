import { request } from './api';
import type { DreamType, Emotion } from '@/types/dream';
import type { Plan } from '@/types/user';

export interface MonthlyStats {
  totalDreams: number;
  streak: number;
  emotionDistribution: Record<Emotion, number>;
  dreamTypeDistribution: Partial<Record<DreamType, number>>;
  topThemes: string[];
}

export interface UsageStats {
  plan: Plan;
  currentMonth: {
    dreams: { used: number; limit: number };
    interpretations: { used: number; limit: number };
    illustrations: { used: number; limit: number };
  };
}

export const statsService = {
  monthly(params: { year: number; month: number }) {
    return request<MonthlyStats>({
      method: 'GET',
      url: '/stats/monthly',
      params,
    });
  },

  usage() {
    return request<UsageStats>({
      method: 'GET',
      url: '/stats/usage',
    });
  },
};
