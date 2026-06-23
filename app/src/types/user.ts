export type Plan = 'FREE' | 'PREMIUM';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  avatarUrl?: string;
  isAnonymous?: boolean;
}
