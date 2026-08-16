/**
 * 대화 첫 질문 — 개방형.
 *
 * 이전에는 단계별 질문 5개를 두고 1번(장소)만 던졌는데, 그 질문이 사용자를
 * 단답으로 유도했다. 지금은 서버가 슬롯 채우기로 진행을 판정하므로
 * (docs/PROMPT_GUIDE.md §1), 한 번에 다 쏟아내는 것이 최선 경로다.
 * 그래서 첫 질문도 그것을 막지 않고 유도하는 형태여야 한다.
 */
export const OPENING_QUESTION = '어젯밤 어떤 꿈을 꿨어? 기억나는 대로 편하게 말해줘';

export const FALLBACK_MESSAGES = {
  chatError: '연결에 실패했어요',
  interpretError:
    '지금 꿈을 해석하는 데 시간이 좀 걸리고 있어요. 잠시 후 다시 시도해주세요',
  illustrationError: '그림을 그리다가 잠이 들었나봐요. 나중에 다시 시도해볼게요',
  sessionExpired:
    '30분 동안 움직임이 없어서 꿈나라에 다녀왔어요. 다시 시작해볼까요?',
} as const;
