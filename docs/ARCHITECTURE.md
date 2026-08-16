# DreamTeller — 아키텍처 & 기술 스택

> 실제 의존성(`app/package.json`, `server/requirements.txt`)과 운영 인프라 기준. 최종 갱신 2026-06-18.

## 확정 기술 스택

### 앱 (React Native + Expo) — 실제 설치 버전
```
React Native 0.81.x
Expo SDK 54                 # babel-preset-expo ~54
TypeScript (strict)
@react-navigation/native v7 # 네비게이션
Zustand v5                  # 글로벌 상태 관리
@tanstack/react-query v5    # 서버 상태 & 캐싱
@supabase/supabase-js v2    # Supabase Auth (이메일 OTP) SDK
fetch (커스텀 request 래퍼)  # HTTP 클라이언트 (Axios 미사용, src/services/api.ts)
Expo SecureStore            # 토큰 저장
react-native-reanimated v4 + react-native-worklets 0.5.x  # 애니메이션 (worklets 별도 패키지 필수)
expo-image                  # 이미지 최적화
react-native-view-shot + expo-media-library + expo-sharing # 해몽 카드 캡처/저장/공유
```
> ⚠️ Reanimated v4는 `react-native-worklets`를 별도 의존성으로 요구. 환경 재구축 시 `babel-preset-expo`와 함께 명시적 설치 필요.

### 백엔드 (FastAPI / Python) — 실제 requirements
```
Python 3.13 (venv)
fastapi >= 0.115
uvicorn[standard] >= 0.34   # ASGI 서버
google-genai >= 1.0         # Gemini SDK (gemini-2.5-flash) — 신 google-genai 패키지
supabase >= 2.10            # Supabase Python Client
PyJWT >= 2.10               # JWT 검증 (PyJWKClient로 Supabase JWKS fetch, jose 미사용)
pydantic-settings >= 2.7    # 환경변수 설정 (app/config.py)
```

### Supabase (DB + 인증 + 스토리지)
```
Supabase PostgreSQL         # 메인 DB (Supabase Client SDK로 접근, Prisma 미사용)
Supabase Auth               # 이메일 6자리 OTP 인증 (Apple/Google 소셜은 코드 존재, 현재 OTP 주경로)
                            # JWT는 ECC(P-256, ES256) 비대칭키 — 백엔드는 JWKS로 검증
Supabase Storage            # 이미지 파일 저장 (MVP 이후 일러스트용)
```

### 인프라 (실제 운영)
```
AWS EC2 + systemd           # FastAPI 서버 (api.dreamteller.io.kr)
AWS SES (Seoul) + Custom SMTP # Supabase 인증 메일 발송 (noreply@dreamteller.io.kr)
AWS Amplify Hosting (Seoul) # 정적 웹 (랜딩/약관/방침 — dreamteller.io.kr, web/)
AWS Route 53                # DNS (dreamteller.io.kr)
Supabase                    # DB + Auth (ap-northeast-2)
```

### MVP 이후 추가 예정
```
AI 이미지 생성 API           # 모델 선정 추후
```

---

## 폴더 구조

### 앱 (`/app`)
```
app/
├── src/
│   ├── SplashScreen.tsx                  # 진입 스플래시
│   ├── screens/
│   │   ├── onboarding/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── OtpVerifyScreen.tsx        # 이메일 6자리 OTP 인증
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── record/
│   │   │   ├── RecordChatScreen.tsx      # 대화형 AI 기록 메인
│   │   │   └── RecordSummaryScreen.tsx   # 기록 완료 요약 확인
│   │   ├── interpret/
│   │   │   ├── InterpretScreen.tsx       # 해몽 결과
│   │   │   └── DreamCardScreen.tsx       # 해몽 카드 상세/공유
│   │   ├── archive/
│   │   │   ├── ArchiveScreen.tsx
│   │   │   └── CharacterDetailScreen.tsx
│   │   ├── insights/
│   │   │   └── InsightsScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── dream/
│   │   │   ├── DreamCard.tsx
│   │   │   ├── InterpretCard.tsx
│   │   │   ├── EmotionTag.tsx          # 컬러 dot + 라벨 (이모지 없음)
│   │   │   ├── StarParticleLoader.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   └── TagChip.tsx
│   │   └── layout/
│   │       ├── BottomTabBar.tsx
│   │       └── ScreenWrapper.tsx
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── types.ts
│   │
│   ├── services/             # API 호출 레이어 (컴포넌트에서 직접 호출 금지)
│   │   ├── api.ts            # fetch 기반 request 래퍼 + 토큰 주입
│   │   ├── supabase.ts       # Supabase 클라이언트
│   │   ├── authService.ts    # Supabase Auth (이메일 OTP) 래퍼
│   │   ├── dreamService.ts
│   │   ├── interpretService.ts
│   │   ├── statsService.ts
│   │   └── archiveService.ts # ⚠️ /archive 호출하나 백엔드 라우트 미구현
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── recordStore.ts    # 진행 중인 기록 세션 상태
│   │   └── uiStore.ts
│   │
│   ├── hooks/
│   │   ├── useDreams.ts
│   │   ├── useRecordSession.ts
│   │   └── useInterpret.ts
│   │
│   ├── constants/
│   │   ├── colors.ts         # DESIGN_SYSTEM.md 기준 토큰
│   │   ├── typography.ts
│   │   └── config.ts
│   │
│   ├── types/
│   │   ├── dream.ts
│   │   ├── user.ts
│   │   └── api.ts
│   │
│   └── utils/
│       ├── date.ts
│       ├── storage.ts
│       └── haptics.ts
│
├── assets/
├── app.json
├── tsconfig.json
└── package.json
```

### 백엔드 (`/server`) — 실제 구조
```
server/
├── app/
│   ├── main.py                 # FastAPI 진입점 (라우터 등록, CORS, 예외 핸들러, /health)
│   ├── config.py               # pydantic-settings 환경변수 (.env)
│   ├── routes/                 # APIRouter 모음 (main.py에서 prefix와 함께 include)
│   │   ├── dreams.py           #   /api/dreams
│   │   ├── interpret.py        #   /api/interpret (chat/generate/status/{dream_id})
│   │   └── stats.py            #   /api/stats (monthly/usage)
│   │                           #   ※ auth/archive 라우트는 미구현 (auth는 Supabase, archive는 추후)
│   ├── deps/
│   │   └── auth.py             # get_current_user_id — PyJWKClient로 Supabase JWT 검증
│   ├── schemas/
│   │   └── dream.py            # Pydantic 모델 (ChatMessage, Create/UpdateDreamPayload 등)
│   ├── services/
│   │   ├── gemini_service.py   # gemini-2.5-flash 호출 (대화/해몽/제목), 503 retry
│   │   └── supabase_client.py  # Supabase 클라이언트 (service_role)
│   └── utils/
│       ├── envelope.py         # success()/error() 응답 래퍼
│       └── interpretation.py   # serialize_interpretation (payload v2 직렬화)
│
├── requirements.txt
└── venv/
```

---

## 데이터 모델 (Supabase PostgreSQL)

> Prisma 미사용. Supabase Client SDK + SQL Migration으로 관리.

```sql
-- users (Supabase Auth가 auth.users 자동 생성, 아래는 public 확장 테이블)
create table public.profiles (
  id          uuid references auth.users primary key,
  name        text,
  avatar_url  text,
  plan        text default 'FREE',  -- 'FREE' | 'PREMIUM'
  created_at  timestamptz default now()
);

-- dreams
create table public.dreams (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade,
  title           text,
  raw_content     text not null,
  summary         text,             -- AI 줄거리 (S-2, 2026-08-16 추가). 미생성이면 null
  chat_history    jsonb,            -- [{role, content}] 배열
  emotion         text default 'NEUTRAL',  -- POSITIVE | NEGATIVE | NEUTRAL | MIXED
  illustration_url text,            -- MVP 이후 사용
  is_lucid        boolean default false,
  recorded_at     timestamptz default now(),
  created_at      timestamptz default now()
);

-- interpretations (v2: payload JSONB로 구조화. 평문 3개 컬럼은 호환용 fallback 유지)
create table public.interpretations (
  id                    uuid primary key default gen_random_uuid(),
  dream_id              uuid references public.dreams(id) on delete cascade unique,
  symbol_analysis       text,                 -- legacy fallback (payload.symbolAnalysis.detail와 동일)
  psychological_meaning text,                 -- legacy fallback
  unconscious_message   text,                 -- legacy fallback
  payload               jsonb,                -- v2: { symbolAnalysis:{headline,keySymbols[],detail},
                                              --       psychologicalMeaning:{headline,perspective,detail},
                                              --       unconsciousMessage:{headline,detail,affirmation} }
  created_at            timestamptz default now()
);

-- dream_characters
create table public.dream_characters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  name         text not null,
  relation     text,
  appear_count int default 1
);

-- dream_character_links (꿈 ↔ 캐릭터 연결)
create table public.dream_character_links (
  dream_id     uuid references public.dreams(id) on delete cascade,
  character_id uuid references public.dream_characters(id) on delete cascade,
  primary key (dream_id, character_id)
);

-- dream_places
create table public.dream_places (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  name         text not null,
  appear_count int default 1
);

-- dream_place_links
create table public.dream_place_links (
  dream_id uuid references public.dreams(id) on delete cascade,
  place_id uuid references public.dream_places(id) on delete cascade,
  primary key (dream_id, place_id)
);

-- dream_tags
create table public.dream_tags (
  id       uuid primary key default gen_random_uuid(),
  dream_id uuid references public.dreams(id) on delete cascade,
  label    text not null
);
```

---

## 환경변수

### 백엔드 `server/.env` (config.py가 읽는 항목)
```bash
PORT=8000

# Gemini AI (반드시 gemini-2.5-flash 사용)
GEMINI_API_KEY=...
# ⚠️ 실사용자 서비스 전 반드시 유료 전환 (무료 티어: 일 20회 한도 + 프롬프트 구글 3년 열람 가능)

# Supabase
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # 서버에서 RLS 우회용
# ※ JWT 검증은 SUPABASE_URL의 JWKS 엔드포인트로 처리 → JWT_SECRET 불필요
```
> `config.py`의 `Settings`는 `port` / `supabase_url` / `supabase_service_role_key` / `gemini_api_key`만 사용. extra는 무시(`extra="ignore"`).

### 앱 EAS env (production 빌드용)
```
API_BASE_URL            # https://api.dreamteller.io.kr/api
SUPABASE_URL
SUPABASE_ANON_KEY
```

### MVP 이후 추가 예정
```bash
# IMAGE_GEN_API_KEY=...
```
