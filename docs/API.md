# DreamTeller — API 명세

Base URL: `https://api.dreamteller.app/api` (개발: `http://localhost:8000/api`)

> **백엔드**: FastAPI (Python) | **AI 모델**: `gemini-2.5-flash`

> **MVP AI 모델**: Google Gemini API (`gemini-2.5-flash`)
> AI 이미지 생성 관련 엔드포인트(`/illustrations`)는 MVP 이후 추가 예정

## 공통 규칙

### 인증
모든 보호된 엔드포인트는 `Authorization: Bearer {accessToken}` 헤더 필요

### 응답 형식
```json
// 성공
{ "success": true, "data": { ... } }

// 에러
{ "success": false, "error": { "code": "DREAM_NOT_FOUND", "message": "꿈 기록을 찾을 수 없어요" } }
```

### 에러 코드
| 코드 | HTTP | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 (타인 리소스) |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `PLAN_LIMIT_EXCEEDED` | 429 | 플랜 사용량 초과 |
| `AI_SERVICE_ERROR` | 503 | AI API 오류 |

---

## Auth

### POST /auth/login
소셜 로그인 (Apple / Google)
```json
// Request
{ "provider": "apple", "idToken": "..." }

// Response
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "clx...",
    "name": "이영모",
    "email": "...",
    "plan": "FREE"
  }
}
```

### POST /auth/refresh
```json
// Request
{ "refreshToken": "eyJ..." }
// Response
{ "accessToken": "eyJ..." }
```

### DELETE /auth/logout
```json
// Response
{ "success": true }
```

---

## Dreams

### GET /dreams
꿈 목록 조회
```
Query: page=1&limit=20&emotion=POSITIVE&from=2025-01-01&to=2025-12-31
```
```json
// Response
{
  "data": {
    "dreams": [
      {
        "id": "clx...",
        "title": "구름 위에서 날다",
        "rawContent": "...",
        "emotion": "POSITIVE",
        "dreamType": "LUCID",
        "illustrationUrl": "https://s3.../...",
        "tags": [{ "label": "비행" }, { "label": "구름" }],
        "hasInterpretation": true,
        "recordedAt": "2025-06-01T07:30:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 47 }
  }
}
```

### POST /dreams
꿈 기록 저장 (대화 완료 후 호출)
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
  "data": {
    "id": "clx...",
    "title": "어두운 숲의 낯선 만남",   // AI가 자동 생성
    "rawContent": "...",
    "tags": [{ "label": "숲" }, { "label": "낯선인" }]
  }
}
```

### GET /dreams/:id
꿈 상세 조회 (interpretation, characters, places 포함)
```json
// Response
{
  "data": {
    "id": "clx...",
    "title": "...",
    "rawContent": "...",
    "chatHistory": [...],
    "emotion": "NEGATIVE",
    "dreamType": "SYMBOLIC",
    "illustrationUrl": "...",
    "interpretation": {
      "symbolAnalysis": "...",
      "psychologicalMeaning": "...",
      "unconsciousMessage": "...",
      "soulType": "내면 탐구형"
    },
    "characters": [{ "id": "...", "name": "낯선 남성", "relation": "낯선인" }],
    "places": [{ "id": "...", "name": "어두운 숲" }],
    "tags": [...]
  }
}
```

### PATCH /dreams/:id
꿈 내용 수정 (요약본 편집 시)
```json
// Request
{ "rawContent": "수정된 내용...", "emotion": "MIXED" }
```

### DELETE /dreams/:id
꿈 삭제

---

## Interpret (AI 해몽)

### POST /interpret/chat
대화형 꿈 기록 AI 응답 — **SSE (Server-Sent Events)**
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

// Response (SSE stream)
// Content-Type: text/event-stream
data: {"type":"text","content":"오, 학교 건물이었구나"}
data: {"type":"text","content":"! 교실이었어, 아니면"}
data: {"type":"text","content":" 복도나 다른 곳?"}
data: {"type":"step","nextStep":2}
data: {"type":"done"}
```

### POST /interpret/generate
해몽 생성 요청 (꿈 저장 후 호출)
```json
// Request
{ "dreamId": "clx..." }

// Response (비동기 — 생성 후 WebSocket 또는 polling)
{ "data": { "jobId": "job_...", "status": "processing" } }
```

### GET /interpret/:dreamId
해몽 결과 조회
```json
// Response
{
  "data": {
    "dreamId": "clx...",
    "symbolAnalysis": "숲은 무의식 세계의 상징입니다...",
    "psychologicalMeaning": "낯선 인물과의 만남은 내면의 그림자를...",
    "unconsciousMessage": "지금 당신은 아직 통합하지 못한 감정과 마주할 준비가...",
    "status": "completed"
    // soulType 미사용 — 자유 해석 방식
  }
}
```

### GET /interpret/status/:jobId
해몽 생성 상태 polling
```json
// Response
{ "data": { "status": "processing" | "completed" | "failed" } }
```

---

## Illustrations (AI 일러스트) — MVP 이후 추가 예정

> 이미지 생성 API 선정 후 엔드포인트를 설계합니다.
> Dream 모델의 `illustrationUrl` 필드는 스키마에 유지하되, MVP에서는 항상 `null`입니다.

---

## Archive

### GET /archive/characters
```json
// Response
{
  "data": [
    {
      "id": "clx...",
      "name": "낯선 남성",
      "relation": "낯선인",
      "appearCount": 7,
      "lastSeenAt": "2025-06-01T...",
      "recentDreams": [{ "id": "...", "title": "..." }]
    }
  ]
}
```

### GET /archive/places
```json
// Response
{
  "data": [
    { "id": "clx...", "name": "학교", "appearCount": 12 }
  ]
}
```

### GET /archive/themes
반복 테마 키워드 (워드클라우드용)
```json
// Response
{
  "data": [
    { "label": "비행", "count": 8, "weight": 0.9 },
    { "label": "물", "count": 5, "weight": 0.6 }
  ]
}
```

---

## Stats

### GET /stats/monthly
월간 통계
```
Query: year=2025&month=6
```
```json
// Response
{
  "data": {
    "totalDreams": 18,
    "streak": 5,
    "emotionDistribution": {
      "POSITIVE": 8,
      "NEGATIVE": 5,
      "NEUTRAL": 3,
      "MIXED": 2
    },
    "dreamTypeDistribution": {
      "DAILY": 10,
      "NIGHTMARE": 3,
      "SYMBOLIC": 4,
      "LUCID": 1
    },
    "topThemes": ["비행", "학교", "물", "가족"]
  }
}
```

### GET /stats/usage
플랜 사용량 조회 (FREE 플랜 제한 체크)
```json
// Response
{
  "data": {
    "plan": "FREE",
    "currentMonth": {
      "dreams": { "used": 12, "limit": 30 },
      "interpretations": { "used": 3, "limit": 10 },
      "illustrations": { "used": 2, "limit": 3 }
    }
  }
}
```

---

## Subscriptions

### POST /subscriptions/checkout
인앱 결제 영수증 검증 및 구독 활성화
```json
// Request
{ "platform": "ios", "receiptData": "..." }
// Response
{ "data": { "plan": "PREMIUM", "expiresAt": "2026-06-01T..." } }
```

### DELETE /subscriptions
구독 취소
