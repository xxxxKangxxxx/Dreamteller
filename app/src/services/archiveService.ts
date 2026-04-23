import { request } from './api';

export interface ArchiveCharacter {
  id: string;
  name: string;
  relation: string;
  appearCount: number;
  lastSeenAt: string;
  recentDreams: { id: string; title: string }[];
}

export interface ArchivePlace {
  id: string;
  name: string;
  appearCount: number;
}

export interface ArchiveTheme {
  label: string;
  count: number;
  weight: number;
}

export const archiveService = {
  characters() {
    return request<ArchiveCharacter[]>({
      method: 'GET',
      url: '/archive/characters',
    });
  },

  places() {
    return request<ArchivePlace[]>({
      method: 'GET',
      url: '/archive/places',
    });
  },

  themes() {
    return request<ArchiveTheme[]>({
      method: 'GET',
      url: '/archive/themes',
    });
  },
};
