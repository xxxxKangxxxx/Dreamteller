# DreamTeller — 진행 현황 & 다음 작업

> 최종 업데이트: 2026-04-27 (백엔드 FastAPI 골격 + dreams/stats/interpret 라우트 + DB 스키마 적용)
> 대상 위치: `dreamteller/app/` (Expo) + `dreamteller/server/` (FastAPI)

---

## 오늘 세션 요약 (2026-04-27 후반)

### 완료 (트랙 C — 운영 디테일)
1. **HomeScreen 그리팅 시간대 분기** — `utils/date.ts:getGreeting()` 추가, 시간대별 인사말+이모지 (☀️/🌤️/🌆/🌙)
2. **`__DEV__` 우회 로그인 버튼 제거** — Supabase Auth 검증 끝나서 LoginScreen 정리
3. **Toast 시스템** — 발견: `useUIStore`에 `showToast`/`toasts`는 있었지만 **렌더러가 없어서 사용자 피드백이 안 보였음** (PROGRESS의 "uiStore — toasts 큐"는 큐만 구현되어 있던 상태). `components/ui/Toast.tsx` 신설 + `App.tsx`/`RecordChatScreen`에 `<ToastContainer>` 박음. 자동 dismiss 3.5s, 탭하면 즉시 dismiss, RecordChat 모달용 `topOffset` prop 지원
4. **chatError 폴백 메시지 단순화** — "잠깐 꿈나라로..." → "연결에 실패했어요"

### 완료 (트랙 A-1, A-2 — 화면 채우기 + 핵심 플로우 스모크)
5. **ArchiveScreen 실 구현** — `useDreams` 훅 연결, 4상태 UI (loading/error/empty/list), DreamCard 탭 시 InterpretDetail 진입
6. **InsightsScreen 실 구현** — `useMonthlyStats` 훅 연결, 메트릭 카드 (총 기록/스트릭) + 감정 분포 가로 막대 (4종, % 표시) + 주요 테마 칩
7. **RecordChat 스모크 테스트** — UI/키보드/Alert/모달 동작 확인. 메시지 전송 → 백엔드 미구현이라 토스트 에러로 fail-open 확인

### 완료 (트랙 B — 백엔드)
8. **Supabase DB 스키마 적용** — `server/migrations/001_initial.sql` 작성·실행. 8개 테이블 + 인덱스 4개 + auth.users → profiles 자동 trigger + RLS 전체 정책. Idempotent 작성 (`if not exists`/`drop policy if exists`)
9. **FastAPI 프로젝트 부트스트랩** — `dreamteller/server/`에 venv + requirements + app/ 골격 + `/health` 엔드포인트
10. **JWT 검증 미들웨어 (ECC/JWKS)** — Supabase가 ECC P-256(ES256)으로 전환된 신규 JWT 시스템 채택. `PyJWKClient`로 `/auth/v1/.well-known/jwks.json` 공개키 캐싱·자동 검증. `SUPABASE_JWT_SECRET` env 불필요
11. **`/api/dreams` CRUD** — list/get/create/update/delete. `success/error` envelope 변환, RLS 우회용 service_role + 코드 레벨 `user_id` 필터
12. **`/api/stats/monthly` + `/api/stats/usage`** — 이번 달 dreams 카운트 + 감정 분포 + streak (오늘부터 거꾸로 연속 일자) / Plan별 사용량
13. **`/api/interpret/chat` SSE** — `google-genai` SDK (deprecated `google-generativeai`에서 마이그레이션) + `gemini-2.5-flash` + Luna 시스템 프롬프트 (PROMPT_GUIDE.md 기반) + step별 시스템 변형 + 5단계에서 `[RECORD_COMPLETE]` 강제. 503 UNAVAILABLE 자동 retry (max 3, 지수 백오프). chunk-collect-then-yield 패턴으로 partial-yield 중복 방지
14. **`/api/interpret/generate` + `/status/{jobId}` + `/{dreamId}`** — BackgroundTasks + 메모리 `_jobs` dict로 비동기 해몽 파이프라인. 동일 dreamId 중복 generate 호출 dedup. duplicate-key INSERT는 success로 흡수

### 검증 결과 (시뮬레이터 end-to-end)
- ✅ `/api/dreams` GET 200 (빈 → 시드 후 3건 → ArchiveScreen 실 데이터 표시)
- ✅ `/api/stats/monthly` GET 200 (InsightsScreen 빈 상태 + 시드 후 통계 표시)
- ✅ `/api/interpret/{dreamId}` GET 200 (3파트 해몽 카드 화면 정상 표시)
- ⚠️ `/api/interpret/chat` SSE — 호출은 200 OK 왔지만 시뮬레이터에서 Luna 응답이 일관되게 표시되지 않는 케이스 존재. Gemini 503 + 클라이언트 SSE 파싱 + RN fetch streaming 한계 등이 복합. 다음 세션 우선 디버깅 대상

### 다음 세션 시작 시 권장
- (a) `/api/interpret/chat` 안정화 — 클라이언트 SSE 파싱 동작 검증 (개발자 로그로 raw response 확인) + 필요 시 백엔드를 non-streaming JSON으로 단순화 (RN fetch streaming 의존 제거)
- (b) RecordChat → RecordSummary → InterpretDetail end-to-end 통과 (Auth + Gemini 안정성 확보 후)
- (c) Apple/Google 소셜 로그인
- (d) Pretendard 폰트 / 아이콘·스플래시 에셋 (디자인 결정 후)

### 다음 세션 시작 시 권장
- (a) Apple/Google 소셜 로그인 추가 (`docs/PROGRESS.md` 다음 작업 [2])
- (b) Archive/Insights 실 구현 (Settings 완료, 남은 stub 화면)
- (c) `__DEV__` 우회 로그인 버튼 제거 시점 결정 (현재 LoginScreen에 남아있음)
- 별도 백로그: HomeScreen 그리팅 시간대 분기 / Email confirm On 케이스 검증

---

## 이전 세션 요약 (2026-04-27 전반: Auth 검증 + Settings)

### 완료
- Supabase Auth 흐름 시뮬레이터 검증 (회원가입 → 자동 로그인 → 세션 자동 복원)
- WelcomeScreen 실 구현 (stub 함정 발견·수정)
- App.tsx `DEBUG_BYPASS_NAV` 제거
- SettingsScreen 실 구현 + HomeScreen 우상단 설정 진입점

---

## 이전 세션 요약 (2026-04-26)

### 완료
1. **RecordSummaryScreen 실 구현** — 초안 요약 편집 + 감정 4종 + 해몽/저장 분기 + Tabs reset, 저장 후 dreams 쿼리 invalidate
2. **React Query 훅 세트** — `useDreams` / `useInvalidateDreams` / `useDreamDetail` / `useInterpret`(404 시 자동 generate + processing 폴링) / `useGenerateInterpret` / `useMonthlyStats` / `useUsage`, `constants/queryKeys.ts`
3. **InterpretScreen 실 구현** — 별빛 파티클 로딩(`StarParticleLoader`), 3파트 카드, FREE 한도 초과 시 프리미엄 모달, Share API, Tab 진입 시 최근 dream fallback
4. **인증 플로우 분기** — `RootNavigator`를 `authStore.status` 기반 3-stack(Splash/Auth/App)으로 분기, `SplashScreen` 신설, `WelcomeScreen` 실 구현
5. **세션 자동 재개** — `recordStore.hydrate(session)` + `utils/sessionResume.ts` (24h 이내 미완료 세션 재개 Alert), HomeScreen mount 시 호출 + "기록 시작" CTA 와이어업
6. **중복 제거 / 통합** — `constants/emotion.ts`(EMOTION_META: label/emoji/color, EMOTION_ORDER) + `utils/date.ts`(formatDateDot/formatDateKoShort)로 4곳 emotion 매핑 / 2곳 formatDate 통합
7. **시뮬레이터 첫 부팅** — 누락 의존성 2개(babel-preset-expo, react-native-worklets) 추가 후 정상 부팅 확인 (HomeScreen 렌더 + 통합 모듈 동작 검증)
8. **개발 보조** — LoginScreen에 `__DEV__` 가드 임시 로그인 버튼 (시뮬레이터 흐름 체감용)

---

## 현재 Phase
**Phase 1 (MVP)** — 대화형 AI 꿈 기록 + AI 해몽 + 기본 아카이브
- AI 일러스트 생성, 음성 입력은 MVP 이후 별도 Phase (구현 금지)

---

## 완료된 작업 (누적)

### 1. Expo 프로젝트 + 의존성
- `dreamteller/app/` — Expo SDK 54, RN 0.81, React 19.1, TypeScript 5.9
- 네비게이션: `@react-navigation/native` v7, native-stack, bottom-tabs, screens, safe-area-context
- 상태/서버: zustand v5, @tanstack/react-query v5, axios
- 인증/DB: @supabase/supabase-js v2 + @react-native-async-storage/async-storage
- Expo 모듈: expo-secure-store, expo-notifications, expo-image
- UI/애니메이션: react-native-reanimated v4 (+ react-native-worklets v0.5), react-native-svg, @expo/vector-icons
- 빌드 도구: babel-preset-expo ~54.0.10 (devDependencies)

### 2. 구성
- `tsconfig.json` strict + `noUncheckedIndexedAccess` + `@/*` path alias
- `babel.config.js` (`babel-preset-expo`)
- `.env.example` + `.gitignore`에 `.env` 제외
- `app.json` 다크모드 기본, splash `#0D0D1A`, bundleId `com.dreamteller.app`, plugins(expo-secure-store, expo-notifications)

### 3. 디자인 토큰 (DESIGN_SYSTEM.md 기반)
- `constants/colors.ts` / `typography.ts` / `spacing.ts` / `config.ts` / `prompts.ts` / **`emotion.ts` (EMOTION_META: label+emoji+color, EMOTION_ORDER) — Badge/DreamCard/RecordSummary/Interpret 단일 source**

### 4. 타입
- `types/dream.ts`, `types/user.ts`, `types/api.ts`

### 5. Services
- `services/api.ts` — axios + SecureStore 자동 Authorization, `ApiError` 클래스, `request<T>` envelope 언래퍼, 401 시 `/auth/refresh` 자동 재시도(동시 요청은 단일 리프레시 공유), `setUnauthorizedHandler`
- `services/supabase.ts` — `createClient`(AsyncStorage 어댑터, autoRefresh, persistSession), `mapSupabaseUser`(supabase user → 앱 User)
- `authService.ts` — 백엔드 wrappers + **`supabaseAuth`** (signInWithEmail/signUpWithEmail/signOut/restoreSession)
- `dreamService.ts`, `interpretService.ts`(fetch+SSE+AbortSignal), `archiveService.ts`, `statsService.ts`

### 6. Stores (Zustand)
- `authStore` — status/user + hydrate(Supabase 세션 복원)/login/logout(supabase.signOut+토큰 클리어)/updateUser. **`supabase.auth.onAuthStateChange` 구독으로 세션 갱신 시 SecureStore 자동 동기화**
- `recordStore` — RecordSession(step 1~5, summary, emotion, 타임스탬프) + startSession/**hydrate**/appendMessage/setStep/setSummary/setEmotion/complete/reset/touch
- `uiStore` — colorScheme / isNetworkOnline / toasts 큐

### 7. 공통 컴포넌트
- `layout/` — ScreenWrapper, Placeholder
- `ui/` — Button(4 variant × 3 size), Card(default/glass/dream), Badge(5 variant), Avatar(expo-image fallback), Skeleton(Reanimated pulse)
- `dream/` — TagChip, ChatBubble(타이핑 3-dot), DreamCard, InterpretCard, **StarParticleLoader** (Reanimated 별빛 파티클 8개)

### 8. 네비게이션
- `navigation/types.ts` — RootStackParamList(+Splash) + TabParamList + 전역 RootParamList 병합
- `TabNavigator` — 5탭(홈/기록/해몽/아카이브/분석), Record 탭은 `tabPress` 가로채서 RecordChat 모달
- **`RootNavigator` — `authStore.status` 기반 3-stack 분기**
  - `idle`/`loading` → SplashScreen
  - `authenticated` → Tabs + RecordChat(modal) / RecordSummary / InterpretDetail / DreamCard / CharacterDetail / Settings
  - `unauthenticated` → Welcome → Onboarding / Login / Signup

### 9. Screens (11개)
- onboarding/ — **WelcomeScreen (실 구현: 로고+태그라인+"시작하기"→Login / "앱 소개 보기"→Onboarding)**, Onboarding (stub)
- SplashScreen (신규: 로딩 indicator)
- auth/ — **LoginScreen (실 구현: 이메일/비번 입력+`supabaseAuth.signInWithEmail`+`__DEV__` 우회 버튼+키보드 대응+에러 토스트)**, **SignupScreen (실 구현: 이름/이메일/비번+`supabaseAuth.signUpWithEmail`, 메일 확인 필요 케이스 Alert fallback)**
- home/ — HomeScreen (다크 테마 + 샘플 CTA + DreamCard 2개, **mount 시 `maybePromptResume`로 세션 재개 Alert + "기록 시작" CTA → RecordChat**)
- record/ — **RecordChatScreen (실 구현: 헤더+FlatList+입력창+KeyboardAvoidingView+AppState 저장+30분 idle Alert+complete→RecordSummary)**, **RecordSummaryScreen (실 구현: 초안 요약 편집+감정 4종 선택+해몽 받기/그냥 저장 분기, dreamService.create→interpretService.generate→InterpretDetail reset, 에러 시 chatError 토스트)**
- interpret/ — **InterpretScreen (실 구현: 헤더+꿈 제목/날짜/감정 배지+별빛 파티클 로딩+3파트 InterpretCard+해몽 카드/공유 CTA, FREE 한도 초과 시 프리미엄 모달, Tab 진입 시 최근 dream으로 fallback, processing 상태 자동 polling)**, DreamCard (stub)
- archive/ — Archive, CharacterDetail (stub)
- insights/ — Insights (stub)
- settings/ — Settings (stub)

### 10. Hooks / Utils
- `hooks/useRecordSession.ts` — recordStore + `interpretService.streamChat` 연결. ensureSession/send/cancel. 토큰 버퍼 누적 `streamingText`, `[RECORD_COMPLETE]` 감지 → complete, step 이벤트 반영, AbortController로 스트림 취소
- `hooks/queries/` — React Query 훅:
  - `useDreams(filter)` + `useInvalidateDreams()` (RecordSummary 저장 후 호출)
  - `useDreamDetail(dreamId)`
  - `useInterpret(dreamId)` — 404 시 자동 generate, `processing` 상태에서 2초 폴링 (최대 60초)
  - `useGenerateInterpret()` (mutation)
  - `useMonthlyStats(year, month)`, `useUsage()`
- `constants/queryKeys.ts` — 중앙 쿼리 키 (dreams/interpret/stats/archive)
- `utils/sessionStorage.ts` — SecureStore 기반 RecordSession save/load/clear
- `utils/summary.ts` — chatHistory에서 user 메시지 모아 요약 초안 생성
- `utils/date.ts` — `formatDateDot` (YYYY.MM.DD), `formatDateKoShort` (M월 D일)
- `utils/sessionResume.ts` — 앱 첫 진입 시 `sessionStorage.load()` → 미완료 + 24시간 이내 세션이면 Alert로 "이어하기/버리기" 제안. 모듈 가드로 1회만. "이어하기" 시 `recordStore.hydrate(saved)` + RecordChat navigate

### 11. App 엔트리
- `App.tsx` — QueryClientProvider + SafeAreaProvider + NavigationContainer(다크), 마운트 시 `authStore.hydrate()` + `setUnauthorizedHandler` 등록

### 검증
- `npx tsc --noEmit` 통과

---

## 다음 작업 (우선순위 순)

### [1] `/api/interpret/chat` SSE 안정화 ⭐
- 시뮬레이터에서 메시지 보내도 Luna 응답이 화면에 안 뜨는 케이스 발견
- 백엔드 로그는 200 OK + 정상 종료 → 클라이언트 SSE 파싱 또는 RN fetch streaming 한계 의심
- 디버깅 순서:
  - (a) 클라이언트 `interpretService.streamChat` 안에 `console.log(line)` 박아서 raw SSE 도달 여부 확인
  - (b) RN fetch가 `response.body.getReader()` 지원 안 하면 → 백엔드를 비-스트리밍 JSON으로 단순화 (`{ text, nextStep, complete }`) + 앱 호출부도 일반 POST로 교체
  - (c) 또는 `react-native-sse` 폴리필 도입

### [2] Apple / Google 로그인 추가
- Supabase 콘솔 Provider 설정 + Apple/GCP OAuth 클라이언트
- `expo-apple-authentication` / Google Sign-In 통합 + `supabase.auth.signInWithIdToken`

### [3] Email confirm On 케이스 검증 (선택, 운영 직전)
- Supabase 콘솔에서 confirmation 켜고 새 메일 가입 → "메일 확인 필요" Alert fallback 확인

### [4] Pretendard 폰트 / 에셋
- 폰트 출처 결정 후 `expo-font` + `useFonts`
- 아이콘/스플래시 디자인 결정 후 교체

### [5] 기타
- `/api/interpret/chat` 흐름 안정화되면 RecordSummary 저장 흐름 검증 (`POST /api/dreams` 통과)
- Husky / Lint-staged (선택)

---

## 오류 및 해결 내역

### [2026-04-27] Toast 시스템에 렌더러 누락
- **증상**: LoginScreen 로그인 실패 / RecordChat 메시지 전송 실패 등에서 `showToast(...)` 호출은 일어나지만 화면에 토스트가 안 보임. 사용자에겐 무반응으로 인식됨
- **원인**: `useUIStore`에 `toasts` 큐 + `showToast`/`dismissToast` 액션은 있었지만, 그 큐를 구독해서 화면에 그리는 컴포넌트가 어디에도 없었음. PROGRESS.md엔 "uiStore — toasts 큐"로만 표기되어 누락이 안 잡혀 있었음
- **해결**: `components/ui/Toast.tsx` 신설 (variant별 색상, 자동 dismiss 3.5s, 탭하면 즉시 dismiss). `App.tsx`의 `NavigationContainer` 자식으로 `<ToastContainer />` 추가. iOS native modal 위로는 못 올라가서 `RecordChatScreen`에도 별도 `<ToastContainer topOffset={48} />` 박음
- **재발 방지**: store에 큐가 있다고 자동으로 UI에 보이는 게 아님. store + 렌더러 둘 다 있어야 시스템 완성. PROGRESS.md "실 구현" 표기 시 렌더러 포함 여부도 점검

### [2026-04-27] Gemini 429 RESOURCE_EXHAUSTED — 첫 호출부터 차단
- **증상**: `/api/interpret/chat` 첫 호출에서 `429 RESOURCE_EXHAUSTED. Your project has exceeded its monthly spending cap` 에러. 사용량은 사실상 0
- **원인**: AI Studio에서 별도로 cap을 안 걸었어도 결제 정보가 연결된 프로젝트는 default cap이 $0으로 잡힐 수 있음. 첫 호출도 cap에 걸려 차단됨
- **해결**: AI Studio에서 **새 프로젝트 + 새 API key 발급** → `server/.env`의 `GEMINI_API_KEY` 교체 → 백엔드 재시작 (`--reload`는 .env 변경 감지 안 함, 프로세스 kill 후 재실행)
- **재발 방지**: 새 키 발급 시 spending cap 화면(`https://ai.studio/spend`)도 같이 확인

### [2026-04-27] Gemini 503 UNAVAILABLE — 모델 과부하
- **증상**: `gemini-2.5-flash`가 일시적으로 `503 UNAVAILABLE. This model is currently experiencing high demand` 응답. 단발성이 아니라 수십 분 이어짐
- **해결**: 백엔드 `gemini_service.py`에 자동 retry 로직 추가 (최대 3회, 지수 백오프 1.5s/3s/6s, `UNAVAILABLE` 키워드 매칭). chunk-collect-then-yield 패턴으로 partial-yield 중복 방지. 그래도 회복 안 되는 경우 사용자가 잠시 후 재시도
- **재발 방지**: 운영 시 paid tier로 가면 우선순위 높아져 503 빈도 줄어듦. CLAUDE.md "실서비스 시작 전 유료 전환" 규칙과 일치

### [2026-04-27] Supabase JWT 시스템 변경 (HS256 → ECC P-256)
- **증상**: Supabase 콘솔의 `Settings → JWT Keys`에서 Current key가 ECC (P-256)로, Previous key가 Legacy HS256으로 표시됨. 백엔드 코드를 HS256+`SUPABASE_JWT_SECRET`로 짰을 경우 새 토큰 검증 실패
- **해결**: 백엔드 `app/deps/auth.py`를 `PyJWKClient`로 변경 (`/auth/v1/.well-known/jwks.json`에서 공개키 자동 fetch + 캐싱). `algorithms=["ES256", "RS256"]` 명시. `SUPABASE_JWT_SECRET` env 제거
- **재발 방지**: Supabase가 새 표준으로 옮긴 추세. 처음부터 비대칭키로 가는 게 미래 안전

### [2026-04-27] 해몽 generate 중복 호출 → duplicate key
- **증상**: useInterpret이 2초마다 폴링하면서 `queryFn` 안에서 매번 `generate(dreamId)` 호출 → 백엔드 BackgroundTasks가 N개 동시 실행 → 첫 INSERT 성공 후 나머지가 `duplicate key value violates unique constraint "interpretations_dream_id_key"` 에러
- **원인**: `interpretations.dream_id`에 unique constraint. 클라이언트 폴링은 정당한 동작이지만 백엔드가 dedup을 안 했음
- **해결**: (1) `_jobs[dreamId] == "processing"`이면 새 BackgroundTask 추가하지 않고 즉시 processing 반환 (2) `_run_interpretation` 내부 INSERT가 duplicate key 에러를 만나면 success로 흡수 (이미 다른 워커가 INSERT 완료한 의미)
- **재발 방지**: 외부 워커/폴링이 있는 비동기 파이프라인은 항상 멱등성(idempotency) 검증

### [2026-04-27] WelcomeScreen 클릭 안 됨 + `useNavigation` 에러
- **증상 1**: Welcome 화면의 "시작하기" 버튼이 눌리지 않음 — WelcomeScreen이 stub 상태(`View` + `fakeBtn`)로 `Pressable`도 onPress도 없었음. PROGRESS.md엔 "실 구현"으로 기재되어 있어 혼선
- **증상 2**: WelcomeScreen을 `Button`+`useNavigation`으로 바꾸자 `[Error: Couldn't find a navigation object. Is your component inside NavigationContainer?]`
- **원인**: `App.tsx`에 `DEBUG_BYPASS_NAV = true` 디버그 분기가 남아있어 `NavigationContainer`/`QueryClientProvider`를 통째로 우회하고 `<WelcomeScreen />` 만 단독 렌더 중이었음
- **해결**: `DEBUG_BYPASS_NAV` 분기와 직접 import 제거 → 항상 정상 트리(`QueryClientProvider > SafeAreaProvider > NavigationContainer > RootNavigator`)로 렌더
- **재발 방지**: PROGRESS.md "실 구현" 표기는 그대로 믿지 말고 실제 파일 한 번 더 확인. App.tsx 같은 루트 파일에 디버그 우회 플래그 두지 말 것

### [2026-04-26] 시뮬레이터 첫 부팅 시 NativeWorklets / babel-preset 오류
- **증상 1**: `index.ts: Cannot find module 'babel-preset-expo'` — Metro 부팅 즉시 빨간 화면
- **증상 2**: 위 해결 후에도 `[runtime not ready]: Error: Exception in HostFunction: <unknown>` (스택 첫 프레임 NativeWorklets)
- **원인**: 4/23 재구축 시 두 의존성이 누락되어 있었음
  1. `babel-preset-expo` (babel.config.js가 직접 참조) — `~54.0.10` 필요
  2. `react-native-worklets` (Reanimated v4 분리 패키지) — `0.5.1` 필요
- **해결**: `npx expo install babel-preset-expo react-native-worklets` 후 `expo start --clear`
- **재발 방지**: 의존성 재설치 시 babel preset과 worklets는 expo install 자동 추천 목록에 포함되지 않을 수 있음. 신규 환경 셋업 시 위 두 패키지 명시적 점검

### [2026-04-23] ⚠️ 프로젝트 전체 삭제 사고
- **증상**: 잘못된 경로로 만들어진 파일 하나(`/Users/kang-yeongmo/dreamteller/app/src/utils/summary.ts`) 정리하려고 `rm -rf /Users/kang-yeongmo/dreamteller` 실행 → bash cwd 무효화, 이후 모든 명령 실패
- **원인**: macOS APFS가 기본 case-insensitive. `dreamteller`(소문자)로 지운 명령이 실제로는 `/Users/kang-yeongmo/DreamTeller` 전체 프로젝트 디렉토리를 삭제
- **영향**: app/ 전체 + docs/ 6개 문서 + `dreamteller_docs_v3.zip` 모두 소실. `.git`도 없어서 로컬 복구 불가
- **해결**:
  1. 사용자가 `CLAUDE.md` + `docs/` 5개 문서 재제공
  2. 동일 세션 대화 스크롤백에서 작성해둔 모든 코드를 Write 도구로 재작성
  3. `npx create-expo-app` + `expo install`로 의존성 재설치 (동일 버전)
  4. `npx tsc --noEmit` 통과 확인
- **재발 방지**:
  - `rm -rf` 등 파괴적 명령은 사용자 확인 없이 실행 금지 (메모리에 저장)
  - 잘못 만든 파일은 Write 덮어쓰기 또는 방치로 해결
  - 경로 오타 의심 시 `ls` 먼저 — case-insensitive 특성 염두

### [2026-04-22] Avatar 컴포넌트 ImageStyle vs ViewStyle 충돌
- **증상**: `tsc` 에러 — `Type 'ViewStyle' is not assignable to type 'ImageStyle'`. expo-image의 `style` prop이 `ImageStyle`인데 외부에서 받은 `ViewStyle`을 머지하려다 `overflow: 'scroll'` 호환 안 됨
- **해결**: expo-image를 View로 감싸고 `StyleSheet.absoluteFillObject`로 내부 채움. 외부 스타일은 래퍼 View에 적용

### [2026-04-22] statsService의 Plan 타입 임포트 경로
- **증상**: `Plan` 타입을 `@/types/dream`에서 임포트했는데 실제 정의는 `@/types/user`에 있어 에러
- **해결**: 임포트 경로 분리 (`DreamType, Emotion`은 dream, `Plan`은 user)

### [2026-04-22] TabNavigator RecordTab 리렌더 루프 가능성
- **증상**: 초기 구현에서 `RecordTabButton` 컴포넌트 본문에 `useNavigation().navigate('RecordChat')`을 직접 호출 — 매 렌더마다 navigate 트리거 위험
- **해결**: 탭 컴포넌트는 빈 `EmptyTab`만 렌더, 네비게이션은 `tabPress` 리스너에서 `preventDefault` 후 `navigation.getParent()?.navigate('RecordChat')`로 처리

---

## 개발 시 반드시 지킬 규칙 (CLAUDE.md 재확인)

1. 컬러는 반드시 `DESIGN_SYSTEM.md` 토큰 사용 — hex 하드코딩 금지
2. API 호출은 `src/services/` 레이어를 통해서만
3. AI 프롬프트는 `docs/PROMPT_GUIDE.md` 기준, 하드코딩 금지
4. 스크린 → `src/screens/`, 공통 컴포넌트 → `src/components/`
5. TypeScript strict, `any` 금지
6. 환경변수 `.env` 사용, 키값 하드코딩 금지
7. Gemini는 `gemini-2.5-flash` 고정

### ⚠️ Gemini API 운영 주의사항
- 개발/테스트: 무료 티어 (일 20회 한도)
- **실서비스 시작 전 반드시 유료 전환** (무료 티어 프롬프트 3년간 Google 열람 가능 → 꿈 데이터 노출 위험)
