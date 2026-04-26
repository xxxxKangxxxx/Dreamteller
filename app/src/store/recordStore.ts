import { create } from 'zustand';

import type { ChatMessage, Emotion } from '@/types/dream';

export type RecordStep = 1 | 2 | 3 | 4 | 5;

export interface RecordSession {
  sessionId: string;
  messages: ChatMessage[];
  step: RecordStep;
  isCompleted: boolean;
  startedAt: string;
  lastActivityAt: string;
  summary: string | null;
  emotion: Emotion | null;
}

interface RecordState {
  session: RecordSession | null;
  startSession: () => void;
  hydrate: (session: RecordSession) => void;
  appendMessage: (message: ChatMessage) => void;
  setStep: (step: RecordStep) => void;
  setSummary: (summary: string) => void;
  setEmotion: (emotion: Emotion) => void;
  complete: () => void;
  reset: () => void;
  touch: () => void;
}

function createSession(): RecordSession {
  const now = new Date().toISOString();
  return {
    sessionId: `sess_${Date.now().toString(36)}`,
    messages: [],
    step: 1,
    isCompleted: false,
    startedAt: now,
    lastActivityAt: now,
    summary: null,
    emotion: null,
  };
}

export const useRecordStore = create<RecordState>((set, get) => ({
  session: null,

  startSession() {
    set({ session: createSession() });
  },

  hydrate(session) {
    set({ session });
  },

  appendMessage(message) {
    const session = get().session;
    if (!session) return;
    set({
      session: {
        ...session,
        messages: [...session.messages, message],
        lastActivityAt: new Date().toISOString(),
      },
    });
  },

  setStep(step) {
    const session = get().session;
    if (!session) return;
    set({ session: { ...session, step, lastActivityAt: new Date().toISOString() } });
  },

  setSummary(summary) {
    const session = get().session;
    if (!session) return;
    set({ session: { ...session, summary } });
  },

  setEmotion(emotion) {
    const session = get().session;
    if (!session) return;
    set({ session: { ...session, emotion } });
  },

  complete() {
    const session = get().session;
    if (!session) return;
    set({ session: { ...session, isCompleted: true } });
  },

  reset() {
    set({ session: null });
  },

  touch() {
    const session = get().session;
    if (!session) return;
    set({ session: { ...session, lastActivityAt: new Date().toISOString() } });
  },
}));
