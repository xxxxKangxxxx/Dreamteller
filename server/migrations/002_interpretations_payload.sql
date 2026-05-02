-- 002_interpretations_payload.sql
-- 해몽을 구조화된 JSON(payload)으로 저장하기 위한 마이그레이션.
-- 기존 평문 3개 컬럼(symbol_analysis/psychological_meaning/unconscious_message)은
-- 과거 데이터 호환을 위해 유지하고, 새 데이터는 payload에 함께 기록한다.

alter table public.interpretations
  add column if not exists payload jsonb;

-- payload 구조 (참고용 주석):
-- {
--   "symbolAnalysis": {
--     "headline": "한 줄 요약",
--     "keySymbols": [{"symbol":"물","meaning":"감정의 흐름"}, ...],
--     "detail": "본문 200자"
--   },
--   "psychologicalMeaning": {
--     "headline": "...",
--     "perspective": "융 심리학",
--     "detail": "..."
--   },
--   "unconsciousMessage": {
--     "headline": "...",
--     "detail": "...",
--     "affirmation": "한 줄 메시지"
--   }
-- }
