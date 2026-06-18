# DreamTeller — API 명세

Base URL: `https://api.dreamteller.io.kr/api` (개발: `http://localhost:8000/api`)

> **백엔드**: FastAPI (Python) · EC2 + systemd 운영 | **AI 모델**: `gemini-2.5-flash`
> **AI 이미지 생성**(`/illustrations`)은 MVP 이후 추가 예정 — 현재 `illustrationUrl`은 항상 `null`

> ⚠️ **이 문서는 실제 백엔드 구현(`server/app/routes/`)을 기준으로 작성됨.**
> 구현된 라우트: `dreams` · `interpret` · `stats` (+ `/health`). 그 외(`auth` · `archive` · `subscriptions`)는 아직 백엔드 미구현 — 아래 "미구현" 표기 참조.

## 공통 규칙

### 인증
- 모든 보호된 엔드포인트는 `Authorization: Bearer {accessToken}` 헤더 필요
- 토큰은 **Supabase Auth가 발급한 JWT** (별도 `/auth/login` 백엔드 엔드포인트 없음)
- 백엔드는 `PyJWKClient`로 Supabase JWKS(`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`)에서 공개키를 fetch해 `ES256`/`RS256`로 검증, `aud="authenticated"`, `sub`를 user_id로 사용
- 로그인/회원가입/OTP 인증은 클라이언트가 **Supabase Auth SDK로 직접** 처리 (`app/src/services/authService.ts`). 이메일 6자리 OTP 방식

### 응답 형식 (envelope)
```json
// 성공
{ "success": true, "data": { ... } }

// 에러
{ "success": false, "error": { "code": "DREAM_NOT_FOUND", "message": "DREAM_NOT_FOUND" } }
```
> 현재 `error.code`와 `error.message`는 동일한 detail 문자열을 사용 (`app/utils/envelope.py`).

### 주요 에러 코드
| 코드 | HTTP | 설명 |
|------|------|------|
| `missing token` / `invalid token` / `missing sub` | 401 | 인증 실패 |
| `DREAM_NOT_FOUND` | 404 | 꿈 리소스 없음 (타인 리소스 포함 — user_id 스코프) |
| `INTERPRETATION_NOT_FOUND` | 404 | 해몽 결과 아직 없음 |
| `EMPTY_PATCH` | 400 | PATCH 본문에 변경 필드 없음 |
| `VALIDATION_ERROR` | 422 | 요청 스키마 검증 실패 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

### Health
`GET /health` (prefix 없음) → `{ "status": "ok" }`

---

## Dreams (`/api/dreams`)

### GET /dreams
꿈 목록 조회 (본인 것만, `recorded_at` 내림차순)
```
Query: page=1&limit=20&emotion=POSITIVE&from=2025-01-01&to=2025-12-31
```
- `page` ≥ 1, `limit` 1~100, `emotion`/`from`/`to` 선택
```json
{
  "success": true,
  "data": {
    "dreams": [
      {
        "id": "uuid",
        "title": "구름 위에서 날다",
        "rawContent": "...",
        "emotion": "POSITIVE",
        "illustrationUrl": null,
        "tags": [],
        "hasInterpretation": true,
        "recordedAt": "2025-06-01T07:30:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 47 }
  }
}
```
> `tags`는 현재 항상 `[]` (태그 테이블 미연동). `hasInterpretation`은 interpretations 테이블 조인으로 계산.

### POST /dreams
꿈 기록 저장 (대화 완료 후 호출). 저장 시 `generate_title`로 제목 자동 생성.
```json
// Request
{
  "rawContent": "어두운 숲 속에서 낯선 사람을 만났고...",
  "chatHistory": [
    { "role": "assistant", "content": "어젯밤 꿈에서 어디에 있었어?" },
    { "role": "user", "content": "숲 속이었어" }
  ],
  "emotion": "NEGATIVE",
  "recordedAt": "2025-06-01T07:30:00Z"
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "어두운 숲의 낯선 만남",   // AI 자동 생성
    "rawContent": "...",
    "tags": []
  }
}
```

### GET /dreams/{dream_id}
꿈 상세 조회 (interpretation 포함)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "rawContent": "...",
    "emotion": "NEGATIVE",
    "illustrationUrl": null,
    "tags": [],
    "hasInterpretation": true,
    "recordedAt": "...",
    "chatHistory": [{ "role": "...", "content": "..." }],
    "interpretation": { /* 아래 GET /interpret 응답 구조와 동일, 없으면 null */ },
    "characters": [],
    "places": []
  }
}
```
> `characters`/`places`는 현재 항상 `[]` (아카이브 백엔드 미구현).

### PATCH /dreams/{dream_id}
꿈 수정 (요약본 편집 시). `rawContent` / `emotion` / `title` 중 보낸 필드만 반영. 빈 본문이면 `400 EMPTY_PATCH`.
```json
// Request
{ "rawContent": "수정된 내용...", "emotion": "MIXED" }
// Response: data = 갱신된 dream summary
```

### DELETE /dreams/{dream_id}
꿈 삭제 → `{ "success": true, "data": { "success": true } }`

---

## Interpret (`/api/interpret`) — AI 해몽

### POST /interpret/chat
대화형 꿈 기록 AI 응답 — **비-스트리밍 JSON** (SSE 아님)
> RN fetch가 Web Streams(SSE)를 지원하지 않아 단일 JSON 응답으로 전환됨. 백엔드는 Gemini 스트리밍 chunk를 누적해 한 번에 반환.
```json
// Request
{
  "sessionId": "sess_...",
  "messages": [
    { "role": "assistant", "content": "어젯밤 꿈에서 어디에 있었어?" },
    { "role": "user", "content": "학교 건물이었어" }
  ],
  "step": 1
}

// Response
{
  "success": true,
  "data": {
    "text": "오, 학교 건물이었구나. 교실이었어, 아니면 복도였어?",
    "nextStep": 2,          // min(step+1, 5)
    "complete": false       // 응답에 [RECORD_COMPLETE] 토큰이 있으면 true (토큰은 text에서 제거)
  }
}
```
> `complete: true`가 오면 클라이언트는 추가 입력 없이 RecordSummary로 이동. 마지막 질문(감정, step 4) 답변 턴에서 바로 완료됨.

### POST /interpret/generate
해몽 생성 요청 (꿈 저장 후 호출). 백엔드 `BackgroundTasks`로 비동기 생성, 멱등 처리.
```json
// Request
{ "dreamId": "uuid" }

// Response
{ "success": true, "data": { "jobId": "uuid", "status": "processing" } }
```
- `jobId`는 `dreamId`와 동일
- 이미 해몽이 있으면 `status: "completed"` 즉시 반환
- 이미 `processing` 중이면 중복 task 추가 없이 `processing` 반환
- 대상 꿈이 없거나 타인 소유면 `404 DREAM_NOT_FOUND`

### GET /interpret/status/{job_id}
해몽 생성 상태 polling → `{ "data": { "status": "processing" | "completed" | "failed" } }`
> 메모리 `_jobs` dict에 없으면 interpretations 테이블 존재 여부로 `completed`/`failed` 판정.

### GET /interpret/{dream_id}
해몽 결과 조회. 구조화 응답 **v2** (`payload` JSONB + 평문 fallback 3컬럼).
```json
{
  "success": true,
  "data": {
    "dreamId": "uuid",
    "status": "completed",
    "symbolAnalysis": {
      "headline": "...",
      "keySymbols": ["숲", "낯선 인물"],
      "detail": "숲은 무의식 세계의 상징입니다..."
    },
    "psychologicalMeaning": {
      "headline": "...",
      "perspective": "융 심리학 관점",
      "detail": "..."
    },
    "unconsciousMessage": {
      "headline": "...",
      "detail": "...",
      "affirmation": "오늘의 나에게 건네는 한마디"
    }
  }
}
```
> 해몽이 아직 없으면 `404 INTERPRETATION_NOT_FOUND`. 클라이언트(`useInterpret`)는 generate 직후 polling 시 404를 에러로 throw하지 않고 `status: 'processing'` placeholder로 처리(별빛 로딩 유지, 최대 60초).
> 직렬화 로직은 `app/utils/interpretation.py`의 `serialize_interpretation` 참조.

---

## Stats (`/api/stats`)

### GET /stats/monthly
월간 통계
```
Query: year=2025&month=6   (필수, month 1~12)
```
```json
{
  "success": true,
  "data": {
    "totalDreams": 18,
    "streak": 5,                       // 오늘부터 역순 연속 기록일
    "emotionDistribution": { "POSITIVE": 8, "NEGATIVE": 5, "NEUTRAL": 3, "MIXED": 2 },
    "dreamTypeDistribution": {},       // ⚠️ 현재 항상 {} (dream_type 미수집)
    "topThemes": []                    // ⚠️ 현재 항상 [] (테마 추출 미구현)
  }
}
```

### GET /stats/usage
플랜 사용량 조회
```json
{
  "success": true,
  "data": {
    "plan": "FREE",                    // profiles.plan, 기본 FREE
    "currentMonth": {
      "dreams": { "used": 12, "limit": 30 },          // FREE 30 / PREMIUM 9999
      "interpretations": { "used": 3, "limit": 5 },   // FREE 5 / PREMIUM 9999
      "illustrations": { "used": 0, "limit": 0 }      // MVP 이후
    }
  }
}
```

---

## 미구현 (클라이언트 stub 또는 향후 계획)

> 아래 엔드포인트는 **백엔드 라우트가 아직 없음**. 호출 시 404. 문서 보존 목적으로 목표 스펙만 기재.

### Archive — `app/src/services/archiveService.ts`는 존재하나 백엔드 라우트 미구현
- `GET /archive/characters` — 등장인물 (이름/관계/등장횟수/최근 꿈)
- `GET /archive/places` — 장소 (이름/등장횟수)
- `GET /archive/themes` — 반복 테마 키워드 (워드클라우드용 label/count/weight)
> 관련 테이블(`dream_characters`/`dream_places`/`dream_tags` 및 link 테이블)은 스키마(ARCHITECTURE.md)에 정의됨. 채우는 파이프라인·조회 라우트는 추후.

### Illustrations (MVP 이후)
- 이미지 생성 API 선정 후 설계. `dreams.illustration_url`은 스키마 유지, 현재 항상 `null`.

### Subscriptions (인앱 결제 — 추후)
- `POST /subscriptions/checkout` — 영수증 검증 + 구독 활성화
- `DELETE /subscriptions` — 구독 취소
