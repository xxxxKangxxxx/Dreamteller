import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import { STEP_OPENING_QUESTIONS } from '@/constants/prompts';
import { interpretService } from '@/services/interpretService';
import { type RecordStep, useRecordStore } from '@/store/recordStore';

interface SendResult {
  error: string | null;
}

function isRecordStep(value: number): value is RecordStep {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function useRecordSession() {
  const session = useRecordStore((s) => s.session);
  const startSession = useRecordStore((s) => s.startSession);
  const appendMessage = useRecordStore((s) => s.appendMessage);
  const setStep = useRecordStore((s) => s.setStep);
  const complete = useRecordStore((s) => s.complete);

  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const ensureSession = useCallback(() => {
    if (session) return session;
    startSession();
    const fresh = useRecordStore.getState().session;
    if (!fresh) throw new Error('세션을 시작할 수 없어요');
    appendMessage({
      role: 'assistant',
      content: STEP_OPENING_QUESTIONS[1],
    });
    return useRecordStore.getState().session!;
  }, [appendMessage, session, startSession]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const send = useCallback(
    async (text: string): Promise<SendResult> => {
      const trimmed = text.trim();
      if (!trimmed) return { error: null };
      const active = ensureSession();

      appendMessage({ role: 'user', content: trimmed });

      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      setIsStreaming(true);

      try {
        const nextMessages = [
          ...active.messages,
          { role: 'user' as const, content: trimmed },
        ];

        const result = await interpretService.chatTurn({
          sessionId: active.sessionId,
          messages: nextMessages,
          step: active.step,
          signal: controller.signal,
        });

        if (result.text.length > 0) {
          appendMessage({ role: 'assistant', content: result.text });
        }
        if (isRecordStep(result.nextStep)) setStep(result.nextStep);
        if (result.complete) complete();

        return { error: null };
      } catch (err) {
        if (controller.signal.aborted || axios.isCancel(err)) return { error: null };
        const message = err instanceof Error ? err.message : '알 수 없는 오류';
        return { error: message };
      } finally {
        setIsStreaming(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [appendMessage, complete, ensureSession, setStep],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  return {
    session,
    streamingText: '',
    isStreaming,
    ensureSession,
    send,
    cancel,
  };
}
