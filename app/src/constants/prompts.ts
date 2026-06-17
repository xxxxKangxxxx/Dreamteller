import type { RecordStep } from '@/store/recordStore';

export const STEP_OPENING_QUESTIONS: Record<RecordStep, string> = {
  1: '어젯밤 꿈 기억나? 먼저 꿈에서 어디에 있었는지 말해줘',
  2: '거기서 누가 있었어? 아니면 혼자였어?',
  3: '그래서 어떤 일이 있었어? 기억나는 장면이 있으면 얘기해줘',
  4: '그때 어떤 감정이었어? 무서웠어, 신기했어, 아니면 다른 감정이었어?',
  5: '마지막으로, 꿈에서 깨기 직전에 무슨 일이 있었어? 기억 안 나면 괜찮아',
};

export const RECORD_COMPLETE_SIGNAL = '[RECORD_COMPLETE]';

export const FALLBACK_MESSAGES = {
  chatError: '연결에 실패했어요',
  interpretError:
    '지금 꿈을 해석하는 데 시간이 좀 걸리고 있어요. 잠시 후 다시 시도해주세요',
  illustrationError: '그림을 그리다가 잠이 들었나봐요. 나중에 다시 시도해볼게요',
  sessionExpired:
    '30분 동안 움직임이 없어서 꿈나라에 다녀왔어요. 다시 시작해볼까요?',
} as const;
