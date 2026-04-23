import { useCallback, useEffect, useRef, useState } from 'react';

import { RECORD_COMPLETE_SIGNAL, STEP_OPENING_QUESTIONS } from '@/constants/prompts';
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

  const [streamingText, setStreamingText] = useState('');
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

      setStreamingText('');
      setIsStreaming(true);

      let buffer = '';
      let nextStep: RecordStep | null = null;
      let finishedWithCompleteSignal = false;

      try {
        const nextMessages = [
          ...active.messages,
          { role: 'user' as const, content: trimmed },
        ];

        await interpretService.streamChat({
          sessionId: active.sessionId,
          messages: nextMessages,
          step: active.step,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === 'text') {
              buffer += event.content;
              if (buffer.includes(RECORD_COMPLETE_SIGNAL)) {
                finishedWithCompleteSignal = true;
                buffer = buffer.replace(RECORD_COMPLETE_SIGNAL, '').trim();
              }
              setStreamingText(buffer);
            } else if (event.type === 'step' && isRecordStep(event.nextStep)) {
              nextStep = event.nextStep;
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          },
        });

        if (buffer.length > 0) {
          appendMessage({ role: 'assistant', content: buffer });
        }
        if (nextStep) setStep(nextStep);
        if (finishedWithCompleteSignal) complete();

        return { error: null };
      } catch (err) {
        if (controller.signal.aborted) return { error: null };
        const message = err instanceof Error ? err.message : '알 수 없는 오류';
        return { error: message };
      } finally {
        setIsStreaming(false);
        setStreamingText('');
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [appendMessage, complete, ensureSession, setStep],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setStreamingText('');
  }, []);

  return {
    session,
    streamingText,
    isStreaming,
    ensureSession,
    send,
    cancel,
  };
}
