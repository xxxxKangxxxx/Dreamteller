# DreamTeller — 아키텍처 & 기술 스택

## 확정 기술 스택

### 앱 (React Native + Expo)
```
React Native 0.74+
Expo SDK 51+
TypeScript (strict)
React Navigation v6         # 네비게이션
Zustand                     # 글로벌 상태 관리
React Query (TanStack)      # 서버 상태 & 캐싱
Axios                       # HTTP 클라이언트
Expo SecureStore            # 토큰 저장
Expo Notifications          # 푸시 알림
React Native Reanimated 3   # 애니메이션
react-native-svg            # SVG 아이콘/일러스트
expo-image                  # 이미지 최적화
```

### 백엔드 (FastAPI / Python)
```
Python 3.11+
FastAPI
Uvicorn                     # ASGI 서버
google-generativeai         # Gemini SDK (gemini-2.5-flash)
supabase-py                 # Supabase Python Client
python-jose                 # JWT 처리
pydantic                    # 데이터 검증
```

### Supabase (DB + 인증 + 스토리지)
```
Supabase PostgreSQL         # 메인 DB (Supabase Client SDK로 접근, Prisma 미사용)
Supabase Auth               # 소셜 로그인 (Apple, Google) + 자체 JWT 발급
Supabase Storage            # 이미지 파일 저장 (무료 1GB)
```

### 인프라 (권장)
```
Railway 또는 Render         # FastAPI 서버
Supabase                    # DB + Auth + Storage
Vercel                      # 웹앱 (추후)
```

### MVP 이후 추가 예정
```
AI 이미지 생성 API           # DALL-E 3 또는 Imagen (추후 결정)
```

---

## 폴더 구조

### 앱 (`/app`)
```
app/
├── src/
│   ├── screens/
│   │   ├── onboarding/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
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
│   │   ├── api.ts            # Axios 인스턴스 & 인터셉터
│   │   ├── dreamService.ts
│   │   ├── interpretService.ts
│   │   ├── archiveService.ts
│   │   └── authService.ts
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

### 백엔드 (`/server`)
```
server/
├── app/
│   ├── main.py               # FastAPI 앱 진입점
│   ├── routers/
│   │   ├── auth.py
│   │   ├── dreams.py
│   │   ├── interpret.py
│   │   └── archive.py
│   │   # illustrations.py   ← MVP 이후 추가 예정
│   │
│   ├── services/
│   │   ├── gemini_service.py   # gemini-2.5-flash 호출 (해몽/대화/요약)
│   │   └── supabase_service.py # Supabase Storage 업로드
│   │
│   ├── middleware/
│   │   ├── auth.py             # JWT 검증
│   │   └── rate_limit.py       # AI API 호출 제한
│   │
│   ├── models/
│   │   ├── dream.py            # Pydantic 모델
│   │   ├── user.py
│   │   └── interpret.py
│   │
│   └── core/
│       ├── config.py           # 환경변수 설정
│       └── supabase.py         # Supabase 클라이언트 초기화
│
├── requirements.txt
├── .env.example
└── Dockerfile
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
  chat_history    jsonb,            -- [{role, content}] 배열
  emotion         text default 'NEUTRAL',  -- POSITIVE | NEGATIVE | NEUTRAL | MIXED
  illustration_url text,            -- MVP 이후 사용
  is_lucid        boolean default false,
  recorded_at     timestamptz default now(),
  created_at      timestamptz default now()
);

-- interpretations
create table public.interpretations (
  id                    uuid primary key default gen_random_uuid(),
  dream_id              uuid references public.dreams(id) on delete cascade unique,
  symbol_analysis       text,
  psychological_meaning text,
  unconscious_message   text,
  -- soul_type 제거: 자유 해석 방식으로 변경
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

## 환경변수 (.env.example)

```bash
# FastAPI 서버
PORT=8000
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Gemini AI (반드시 gemini-2.5-flash 사용)
GEMINI_API_KEY=...
# ⚠️ 실사용자 서비스 전 반드시 유료 전환 (무료 티어: 일 20회 한도 + 프롬프트 구글 열람 가능)

# Supabase (DB + Auth + Storage)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # 서버에서 RLS 우회용

# MVP 이후 추가 예정
# IMAGE_GEN_API_KEY=...
```
