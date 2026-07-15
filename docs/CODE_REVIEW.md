# DreamTeller — 코드 리뷰: 보안·비효율·중복 정리

> 작성일: 2026-07-12. 서버(`server/app/`) 전체 + 앱(`app/src/`) 서비스/스토어/훅 레이어 전수 검토 결과.
> 우선순위 항목은 `IMPROVEMENTS.md`와 함께 관리. 심각도: 🔴 조치 필요 / 🟠 출시 초기에 처리 / 🟡 여유 있을 때.

**전반 평가**: 코드베이스는 규모 대비 깨끗한 편. RLS 정책 완비, 시크릿 커밋 없음(.env.example만), `any` 2건, JWT 검증(JWKS+audience) 정상, Apple nonce 처리 정석. 아래는 그럼에도 발견된 실제 리스크들.

---

## 1. 보안 🔒

### S1. 🔴 500 에러가 내부 예외 메시지를 클라이언트에 그대로 노출 — ✅ 코드 완료(`296351c`, 07-15) + 배포 완료(07-15)
`server/app/main.py:42-47` — generic exception handler가 `error(detail, str(exc))`로 응답.
- **위험**: Supabase/Gemini SDK 예외 메시지에 내부 URL·테이블명·설정 상태가 담겨 외부로 나감. 정보 수집(reconnaissance) 표면.
- **부수 버그**: 이 핸들러가 예외를 삼키면서 `logger.exception`도 안 해서 **500의 원인이 서버 로그에 안 남음** (커스텀 핸들러 등록 시 FastAPI 기본 traceback 로깅이 비활성화됨).
- **수정**: `logger.exception(...)` 추가 + 클라이언트엔 고정 메시지(`"INTERNAL_ERROR", "일시적인 오류가 발생했어요"`)만 반환.

### S2. 🔴 사용량 한도가 서버에서 전혀 강제되지 않음 (Gemini 비용 방어 부재) — ✅ 코드 완료(`485885b`, 07-15) + 배포 완료(07-15). utils/usage.py로 강제(꿈 30/해몽 5/chat 일 100회, created_at 기준). nginx limit_req는 별도 보류
`/stats/usage`(stats.py:107)는 FREE 30꿈/5해몽 한도를 **표시만** 하고, 실제로는:
- `POST /api/dreams`(dreams.py:30) — 꿈 생성마다 Gemini title 호출, 한도 체크 없음
- `POST /api/interpret/generate`(interpret.py:95) — 해몽 생성, 한도 체크 없음
- `POST /api/interpret/chat`(interpret.py:34) — **아예 카운트조차 안 됨**. 호출당 Gemini 왕복
- **위험**: 익명(게스트) 로그인이 열려 있으므로, 앱 없이도 `signInAnonymously` → JWT 발급 → 스크립트로 `/interpret/chat` 무한 호출 가능 = **선불 Gemini 잔액 소진 → 전면 장애** (IMPROVEMENTS 1-1/1-2와 직결). captcha는 가입 시점 방어일 뿐, 발급된 토큰의 호출량은 서버가 막아야 함.
- **수정**: ① 라우트에서 월 사용량 조회 후 한도 초과 시 429/403 반환(usage 쿼리 재사용) ② chat은 세션당 턴 수 제한(예: 30턴) ③ nginx `limit_req` 또는 slowapi로 IP/유저 rate limit.

### S3. 🟠 `/interpret/chat` 입력 크기 무제한 — ✅ 코드 완료(`485885b`, 07-15) + 배포 완료(07-15). content 4000자·messages 1~30·raw_content 5000자·title 200자
`ChatPayload`(interpret.py:21-24) — `messages` 개수·`content` 길이에 제약 없음. `CreateDreamPayload.raw_content`도 동일.
- **위험**: 한 요청에 수백 KB 프롬프트를 실어 토큰 비용 증폭 가능. S2와 결합 시 비용 공격 배가.
- **수정**: Pydantic 제약 — `content: str = Field(max_length=2000)`, `messages: list[...] = Field(max_length=30)`, `raw_content` max_length 등.

### S4. 🟡 `/interpret/status/{job_id}` 소유권 검증 없음
interpret.py:132-148 — 인증만 통과하면 **다른 유저의 dream_id**로 처리 상태·존재 여부 조회 가능. 꿈 내용 자체는 안 나가므로 영향 낮음. dreams 소유권 체크(다른 라우트와 동일 패턴) 추가 권장.

### S5. 🟡 Supabase 세션(refresh token)이 AsyncStorage 평문 저장
`app/src/services/supabase.ts:17` — 미러 토큰은 SecureStore(`api.ts`)인데 **원본 장기 자격증명은 평문 AsyncStorage**로, 보호 수준이 뒤집혀 있음. iOS 샌드박스 안이라 실위험은 낮지만, 기기 백업·포렌식 시 노출. A1 정리와 묶어 SecureStore 어댑터 적용 검토(항목당 2048byte 제한 주의 — 대형 세션은 AES 키만 SecureStore에 두는 하이브리드 패턴).

### S6. 🟡 CORS `allow_origins=["*"]`
`main.py:19-25` — 모바일 전용 API라 실해는 제한적이나, 열어둘 이유도 없음. 웹 클라이언트 계획 없으면 CORS 미들웨어 제거 또는 도메인 화이트리스트.

### S7. 🟡 계정 삭제가 토큰 하나로 즉시 영구 파괴
`account.py:16` — 2단계 확인은 클라이언트 UI뿐, 서버는 JWT만으로 cascade 삭제. 업계 통상 수준이긴 하나, 추후 이메일 재확인 or 소프트 삭제(유예 기간) 검토 여지.

---

## 2. 구조적 버그 (동작에 영향) 🐛

### A1. 🔴 존재하지 않는 `/auth/refresh` 호출 + 토큰 이중 관리
가장 중요한 클라이언트 이슈. 현재 토큰이 **두 곳**에서 관리됨:
- **원본**: Supabase SDK 세션(AsyncStorage, `autoRefreshToken: true`)
- **미러**: `tokenStorage`(SecureStore) — `authStore.ts:27-39`의 `onAuthStateChange`로 복사, axios 인터셉터가 이걸 사용

문제 연쇄 (`app/src/services/api.ts:55-72`):
1. 미러가 stale해지는 창이 존재 — 장시간 백그라운드 후 복귀 시 Supabase 갱신 타이머보다 화면의 API 호출이 먼저 나가면 만료 토큰으로 요청 → 401
2. 401 시 `refreshAccessToken()`이 `POST /auth/refresh`를 호출하는데 **백엔드에 `/auth/*` 라우트가 없음** (main.py 라우터 4개뿐) → 항상 실패
3. → `tokenStorage.clear()` + `onUnauthorized()` = **Supabase 세션은 멀쩡한데 강제 로그아웃**. 게다가 Supabase 세션은 안 지워져서 다음 콜드스타트에 hydrate가 다시 로그인시킴 — 상태 불일치

**수정 방향**: 미러 제거. axios 요청 인터셉터에서 `supabase.auth.getSession()`으로 토큰 획득(만료 시 SDK가 자동 갱신) → 401 재시도도 `refreshSession()` 기반으로. `tokenStorage`·`refreshAccessToken()` 삭제.

### A2. 🔴 죽은 코드 — `authService.login / refresh / logout`
`authService.ts:254-277` — `/auth/login`·`/auth/refresh`·`/auth/logout` 백엔드 미존재(인증은 전부 Supabase 직접). 실사용은 `deleteAccount()`뿐. 나머지는 삭제 (A1과 한 번에).

### A3. 🟠 `_jobs` 인메모리 잡 스토어 — 누수 + 재시작 취약 — ✅ 코드 완료(`dc958f1`, 07-15) + 배포 완료(07-15) (누수만 해소, 재시작 소실·멀티워커는 잔존 한계로 수용)
`interpret.py:18` `_jobs: dict[str, str]`:
- **메모리 누수**: completed/failed 엔트리를 영원히 삭제 안 함 — 해몽 1건당 1엔트리 무한 누적
- **재시작 소실**: 처리 중 재시작하면 클라이언트 폴링이 `"failed"`를 받음 (완료분은 DB 폴백으로 커버됨 — status/{job_id}가 interpretations 존재를 확인하므로)
- **확장 불가**: 멀티 워커/멀티 인스턴스 전환 시 즉시 깨짐
- **수정**: 완료·실패 시 `_jobs.pop(dream_id)` (DB 폴백이 이미 진실 소스) — 3줄 수정으로 누수·확장 문제 대부분 해소. 상태는 "processing" 마킹용으로만 유지.

---

## 3. 비효율 ⚡

### E1. 🟠 목록 조회가 `select("*")`로 chat_history 전문까지 로드 — ✅ 코드 완료(`b8df187`, 07-15) + 배포 완료(07-15)
`dreams.py:66-68` — 홈/목록 화면용 `GET /dreams`가 대화 전체(`chat_history` JSONB, 꿈당 수 KB)를 매번 DB에서 읽고 버림(`_to_summary`는 안 씀). 꿈 30개면 매 요청 수십~수백 KB 낭비.
**수정**: `select("id, title, raw_content, emotion, illustration_url, recorded_at", count="exact")`.

### E2. 🟠 꿈 저장이 Gemini 제목 생성을 동기 대기
`dreams.py:33` — `POST /dreams`가 `generate_title()`(Gemini 왕복, 재시도 포함 최대 ~5초+)을 기다린 후 응답 → "저장" 버튼 체감 지연. Gemini 장애 시 저장까지 느려짐(fallback 존재).
**수정**: 즉시 fallback 제목으로 insert 후 `BackgroundTasks`로 title 갱신 (클라이언트는 목록 refetch 때 자연 반영) — 해몽 생성과 동일한 기존 패턴.

### E3. 🟡 SSE 잔재 — 가짜 스트리밍 이중 구조
`gemini_service.py:321 stream_chat`(generator) → 내부 `_collect_chunks`가 이미 리스트로 전부 수집 → 라우트(interpret.py:46)에서 다시 `list(...)`로 감쌈. 스트리밍이 아닌데 3겹 구조라 오독 유발 + generator라 재시도 로직이 첫 소비 시점에야 실행되는 함정. 비스트리밍 확정이면 `def chat_reply(messages, step) -> str` 단일 함수로 평탄화.

### E4. 🟡 streak 계산이 365행 fetch 후 파이썬 루프
`stats.py:44-61` — 유저당 최대 365행을 매 조회마다 읽음. 현 규모에선 무해, 사용자 늘면 SQL(윈도우 함수/RPC)로 이전.

---

## 4. 중복·일관성 🧹

- **C1.** `supabaseAuth`의 8개 메서드가 동일한 `{ user: mapSupabaseUser(...), accessToken, refreshToken }` 변환을 반복 (`authService.ts` 전반) — `toSessionResult(data)` 헬퍼 하나로 축약 가능. A1에서 토큰 미러를 없애면 반환형 자체가 `User`만으로 단순해짐
- **C2.** 소유권 체크 쿼리 패턴(`dreams.select("id").eq("id",...).eq("user_id",...)`)이 interpret.py·dreams.py에 4회 반복 — `ensure_dream_owned(sb, dream_id, user_id)` deps 함수로 추출하면 S4도 자연 해결
- **C3.** 월 경계 계산(`date(year+1,1,1) if month==12 else ...`)이 stats.py에 2회 중복 — 유틸 추출 — ✅ S2 작업에서 `utils/usage.py month_range()`로 해소(`485885b`)
- **C4.** duplicate-key 감지가 문자열 매칭(`"duplicate key" not in str(exc)`, interpret.py:87) — Postgres 에러코드(23505) 기반 or upsert(`on_conflict`)로 교체가 견고
- **C5.** OnboardingScreen.tsx:150 그라데이션 hex 4개 하드코딩 — 디자인 토큰 규칙(CLAUDE.md 규칙 1) 위반. Google 브랜드색(LoginScreen/GoogleLogo)은 주석 표기된 의도적 예외로 OK

---

## 권장 처리 순서

| 순서 | 항목 | 규모 | 비고 |
|---|---|---|---|
| 1 | S1 에러 노출 차단 + 로깅 | ~10줄 | 서버만, 빌드 불필요, 즉시 배포 가능 |
| 2 | S2+S3 사용량 강제 + 입력 제한 | 중 | 출시 직후 최우선 — Gemini 비용 방어의 실질 수단 |
| 3 | A3 `_jobs` pop 정리 | 3줄 | 서버만 |
| 4 | E1 select 컬럼 축소 | 1줄 | 서버만 |
| 5 | A1+A2+C1 토큰 관리 단일화 + 죽은 코드 제거 | 대 | **앱 빌드 필요** — 다음 빌드 사이클에 묶기, 인증 회귀 테스트 필수 |
| 6 | E2 title 백그라운드화, S4/C2, E3 | 중 | 여유 시 |
| 7 | S5~S7, C3~C5, E4 | 소 | 백로그 |

> ⚠️ 심사 대기 중이므로 **앱(클라이언트) 변경은 심사 결과 확인 후** 다음 빌드 사이클에. 서버 항목(1~4)은 앱과 독립적으로 배포 가능.
