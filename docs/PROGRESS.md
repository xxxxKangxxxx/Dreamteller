# DreamTeller — 진행 현황 & 다음 작업

> 최종 업데이트: 2026-04-30 (Google OAuth 검증 + dev-client 빌드 전환 + RecordChat end-to-end 검증 + 해몽 로딩 UX 개선 + StarParticleLoader 업그레이드)
> 대상 위치: `dreamteller/app/` (Expo) + `dreamteller/server/` (FastAPI)

---

## 오늘 세션 요약 (2026-04-30)

### 완료
1. **Google OAuth 검증 + 흐름 정상화** ⭐ — 어제 미커밋 상태였던 Google 로그인 코드(`signInWithGoogle`, `expo-web-browser`/`expo-linking`, LoginScreen Google 버튼) 시뮬레이터에서 끝까지 검증
   - Expo Go 환경에서 ASWebAuthenticationSession이 Supabase OAuth 시작 페이지에서 빈 화면으로 멈추는 이슈 발견. iOS 26 시뮬레이터 + `host.exp.Exponent` 환경 + ASWebAuthenticationSession 조합의 알려진 케이스
   - 진단 로그 (`[google-oauth] redirectTo`/`signInWithOAuth`/`webBrowser result`) 임시 추가 → URL/result type 확인. URL 자체는 정상, result는 `cancel`(callback 못 받음) 패턴
   - 일반 Safari로 같은 URL 직접 열어보니 정상 → Supabase/Google/네트워크/시뮬레이터 모두 정상, ASWebAuthenticationSession 자체가 첫 navigation을 못 잡는 것으로 좁혀짐
   - 1차 시도: `preferEphemeralSession: true` 옵션 추가 → 빈 화면 해결됨. 단, 매번 비번/패스키 인증 필요한 부작용 (cookie jar 격리)
   - 2차 시도(정공): **dev-client 빌드 전환**. `expo-dev-client` 설치 + `npx expo run:ios`로 ios/ 네이티브 폴더 생성 + Pod install + 첫 빌드. dev-client에서 `Linking.createURL`이 `dreamteller://auth-callback`을 일관되게 반환하여 Supabase Allowed Redirect URLs와 매칭
   - 이후 `preferEphemeralSession` 제거 → ASWebAuthenticationSession이 Safari 쿠키 공유 → 두 번째 로그인부터 "Google로 계속하기" 한 번 탭으로 자동 통과 (사용자 기대 UX 매치). 진단 로그도 모두 제거
2. **RecordChat → RecordSummary → InterpretDetail end-to-end 재검증** ⭐ — 어제 무료 티어 quota로 step 5에서 막혔던 흐름을 quota 회복 후 한 번에 통과
   - chat step 1~5 모두 200 OK, finish=STOP, block=None
   - step 5 응답에서 `next_step=5 complete=True` 정상 (백엔드의 `[RECORD_COMPLETE]` 토큰 처리 동작 확인)
   - `POST /api/dreams` 201 → `POST /api/interpret/generate` 200 → `GET /api/interpret/{id}` 폴링 12회 404 후 200 OK → InterpretDetail 진입까지 12초 내 완료
   - 폴링 dedup 정상 (12회 generate POST 모두 success로 흡수, INSERT 1회만 일어남)
3. **해몽 로딩 UX 개선** — `useInterpret` queryFn이 두 번째 GET에서 404 받으면 throw → `isError=true` → 화면에 "다시 시도" Card 표시. 2초 후 polling에서 또 404 → 또 isError → 깜빡임
   - **수정**: 첫 GET 404 → `generate()` 호출 후 두 번째 GET이 또 404면 throw 안 하고 `{status: 'processing', dreamId, ...빈 본문}` placeholder 반환. UI는 `isLoading` 분기에서 자연스럽게 별빛 로딩 유지, refetchInterval로 polling 계속 (최대 60초)
4. **StarParticleLoader 화려화** — 정적 깜빡임 8개 → 비처럼 떨어지는 16개 파티클로 업그레이드
   - translateY: -8 → 150 (떨어지는 모션) + drift × sin(2πp) (좌우 흔들림) + scale curve(0.55→1.1)
   - opacity: fade-in (0~18%) → 풀밝기 → fade-out (82%~100%)
   - 색상 3종 mix (`primaryLight` / `textPrimary` / `info`)
   - 컨테이너 180 + `overflow: hidden`로 떨어지는 별이 깔끔하게 사라짐, shadow radius 8 / opacity 0.9로 글로우 강화

### 검증 (시뮬레이터 실측)
- ✅ Google 로그인: 첫 로그인(이메일/비번/패스키/동의) → callback `dreamteller://auth-callback#access_token=...` 수신 → `setSession` → 홈 진입. 로그아웃 후 재로그인 시 한 번 탭으로 자동 통과 확인
- ✅ RecordChat 5단계 + RecordSummary + Interpret 한 번에 통과 (dream id `e1718141-…`)
- ✅ 해몽 로딩 placeholder 동작: "다시 시도" 깜빡임 사라짐, 별빛 로딩 유지
- ⚠️ StarParticleLoader 시각 변경은 사용자 추후 확인 예정

### 환경 변경
- **Expo Go 사용 중단 → dev-client 빌드** 사용. 이후 시뮬레이터 실행은 `cd app && npx expo run:ios --port 8082 --device "iPhone 16e"` (또는 Metro만 띄우려면 `npx expo start --dev-client --port 8082`)
- 8081 포트 Docker Desktop 점유 중. Metro는 8082 사용
- `app/ios/`는 prebuild로 자동 생성, `app/.gitignore`에 `/ios` 등록 (CNG 패턴)

---

## 이전 세션 요약 (2026-04-28)

### 완료
1. **`/api/interpret/chat` SSE → JSON 전환** ⭐ — RN fetch가 `response.body.getReader()`를 지원하지 않아 SSE 첫 chunk부터 throw하던 문제 해결
   - 백엔드: `StreamingResponse(text/event-stream)` → `dict[str, Any]` (success envelope)로 변경. Gemini SDK 스트리밍 chunk를 누적해 `{text, nextStep, complete}`로 한 번에 반환. `[RECORD_COMPLETE]` 토큰은 백엔드에서 감지·제거 후 `complete: true`로 변환
   - 클라이언트: `interpretService.streamChat` + SSE 파서 통째로 제거 → 단순 `chatTurn(payload)` + 일반 `request<>()` 사용. `useRecordSession`에서 토큰 누적/`streamingText`/SSE 이벤트 분기 로직 제거. `streamingText: ''`는 호환성 위해 유지 (`<ChatBubble isStreaming content="" />`로 typing dots 표시)
   - Gemini API 호출 방식·모델·비용 1도 안 변함. 백엔드↔클라이언트 사이의 전송 방식만 변경
2. **백엔드 진단 로그 강화** — `gemini_service._collect_chunks`에 chunks/empty/parts/chars/elapsed/finish_reason/block_reason 로그. `parts=0`일 때 명시적 WARNING. `ServerError`/`ClientError` 분리 로그 (code, attempt, unavailable). `/chat` 라우트에도 enter/done 로그 (session, msgs, last_role, chars, next_step, complete)
   - `app/main.py`에 `logging.basicConfig(level=INFO)` 추가 — 기본 WARNING 레벨이라 INFO 로그가 안 보이던 문제 해결
3. **RecordChat 모달 swipe-dismiss 차단** — `presentation: 'modal'` 화면이 iOS swipe-down 제스처로 우발 dismiss 되어 진행 중 세션이 사라지던 문제. `RootNavigator`의 RecordChat 옵션에 `gestureEnabled: false` 추가. X 버튼(`handleClose`)으로만 종료 가능
4. **진단 결과 — 무료 티어 일 20회 한도 도달** — step 5에서 토스트 에러 발생. 백엔드 로그에 `ClientError 429 RESOURCE_EXHAUSTED` + `generate_content_free_tier_requests, limit: 20` 명확히 찍힘. PT 자정(한국 오후 4~5시)까지 자연 리셋 대기

### 검증 (시뮬레이터 실측)
- ✅ `/api/interpret/chat` step 1→2→3→4까지 정상 응답 (chunks, chars, elapsed 모두 INFO 로그)
- ✅ 단일 sessionId(`sess_moi8p05x`)로 step 1→5까지 끝까지 진행 (msgs 1→11 누적). swipe-dismiss 차단 후 세션 유지 확정
- ⚠️ step 5 응답에서 일일 한도 초과로 429 → 토스트 에러 (재현 가능, 외부 quota 문제)

### 직전 차단점
- Gemini 무료 티어 일 20회 quota — 한국 오후 4~5시(PT 자정) 리셋 후 step 5 / RecordSummary / Interpret generate 흐름 재검증 필요

---

## 이전 세션 요약 (2026-04-27 후반)

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

### [1] Apple 로그인 추가 ⭐
- Supabase 콘솔 → Authentication → Providers → Apple Enable + Apple Developer 등록 정보 입력
- `expo-apple-authentication` 설치 + `app.json` plugin 추가 + dev-client 재빌드
- `signInWithApple()` 구현 — Apple credential → `supabase.auth.signInWithIdToken({provider: 'apple', token: identityToken, nonce})` 흐름. Login/Signup 화면에 Apple 버튼 추가
- 시뮬레이터(또는 실기기)에서 첫 로그인 / 두 번째 로그인 / 로그아웃 후 재로그인 흐름 검증

### [2] (선택) Google 로그인을 native SDK로 마이그레이션 — 사용자 기대 UX 한 단계 더
- 현재는 ASWebAuthenticationSession + Safari 쿠키 공유로 두 번째부터 자동 통과. 첫 한 번은 Google OAuth 웹 페이지 거침
- 한 번 탭 → 디바이스 Google 계정 시트 → ID token 즉시 수신 흐름을 원하면 `@react-native-google-signin/google-signin` + `signInWithIdToken({provider: 'google', token})` 도입 필요
- GCP에 iOS OAuth 클라이언트 별도 발급(Bundle ID `com.dreamteller.app`) + Reversed Client ID URL scheme `app.json`에 추가 + dev-client 재빌드

### [3] Gemini 운영 직전 유료 전환
- CLAUDE.md "실서비스 시작 전 반드시 유료 전환" 규칙 (무료 티어는 일 20회 한도 + Google이 프롬프트 3년간 열람)
- AI Studio Billing 연결 + spending cap 화면 확인 (4/27 cap 0$ 사고 재발 방지)

### [4] Email confirm On 케이스 검증 (선택, 운영 직전)
- Supabase 콘솔에서 confirmation 켜고 새 메일 가입 → "메일 확인 필요" Alert fallback 확인

### [5] Pretendard 폰트 / 에셋
- 폰트 출처 결정 후 `expo-font` + `useFonts`
- 아이콘/스플래시 디자인 결정 후 교체

### [6] 기타
- Husky / Lint-staged (선택)

---

## 오류 및 해결 내역

### [2026-04-30] Expo Go에서 Google OAuth 빈 화면 (ASWebAuthenticationSession 첫 navigation 멈춤)
- **증상**: "Google로 계속하기" 탭 후 브라우저 시트가 떴는데 빈 화면. 주소창은 placeholder만 표시. Metro 로그에 `webBrowser result = {type: 'cancel', url: null}`만 찍힘 (사용자 취소로만 인식)
- **원인 진단**:
  - Supabase OAuth 시작 URL 자체는 정상 — `curl -L`로 GET 시 `accounts.google.com`으로 302 redirect 확인
  - 시뮬레이터의 일반 Safari에 같은 URL을 `xcrun simctl openurl`로 열면 정상으로 Google 로그인 페이지 도달
  - 즉 Supabase/Google/네트워크/시뮬레이터 모두 정상. ASWebAuthenticationSession이 Expo Go 환경(`host.exp.Exponent` bundleId)에서 첫 navigation 자체를 시작 못 하는 케이스. iOS 18+ 시뮬레이터에서 알려진 ASWebAuthenticationSession 동작 불안정 케이스와 일치
- **해결**:
  - 1차(임시): `WebBrowser.openAuthSessionAsync(..., { preferEphemeralSession: true })` 옵션 추가. 빈 화면은 사라졌지만 ephemeral cookie jar라 Safari 세션 공유 안 됨 (매번 비번/패스키)
  - 2차(정공): **dev-client 빌드 전환**. `expo-dev-client` 설치 + `npx expo run:ios`로 ios/ 네이티브 폴더 생성 + 자체 빌드 + 시뮬레이터 install. dev-client에서 `Linking.createURL`이 `dreamteller://auth-callback`을 일관되게 반환하여 Supabase Allowed Redirect URLs와 매칭되고, ASWebAuthenticationSession도 정상 동작
  - 빌드 안정 확인 후 `preferEphemeralSession: true` 옵션 제거 → Safari 쿠키 공유 → 두 번째 로그인부터 한 번 탭으로 자동 통과
- **재발 방지**: 이후 OAuth/딥링크/네이티브 모듈 작업은 Expo Go가 아닌 dev-client 빌드 기반으로 진행. PROGRESS의 "환경 변경" 섹션에 실행 명령 명시. 디버깅 시 진단 로그(redirectTo / signInWithOAuth url / webBrowser result type) 박고 `xcrun simctl openurl`로 일반 Safari와 격리 비교하면 빠르게 좁혀짐

### [2026-04-30] Google 로그인이 매번 비번/패스키 인증 요구
- **증상**: "Google로 계속하기" 누를 때마다 이메일 입력 → 비번 → 패스키까지 처음부터. 사용자 기대는 "계정 선택 → 동의 → 끝"
- **원인**: 빈 화면 fix 시도 때 추가한 `preferEphemeralSession: true`가 ASWebAuthenticationSession에 별도 cookie jar를 강제. Safari에 이미 Google에 로그인되어 있어도 그 세션 공유 안 됨
- **해결**: dev-client 빌드 전환으로 빈 화면 원인이 사라진 후, `preferEphemeralSession: true` 옵션 제거. Safari 쿠키 공유로 두 번째 로그인부터 자동 통과
- **재발 방지**: OAuth UX 옵션은 trade-off가 명확함. ephemeral=true는 격리되지만 매번 인증, 기본값(false)은 세션 공유. Expo Go 호환을 위해 ephemeral을 켜는 식의 우회 fix는 dev-client 빌드로 해결한 후 즉시 원복

### [2026-04-30] 해몽 로딩 화면에서 "다시 시도" Card 깜빡임
- **증상**: 해몽 받기 직후 InterpretScreen에서 별빛 로딩과 "다시 시도" Card가 번갈아 깜빡이며 표시
- **원인**: `useInterpret` queryFn이 `404 → generate() → 두 번째 GET` 시퀀스. 두 번째 GET은 BackgroundTask 진행 중이라 거의 항상 404 → throw → React Query `isError=true`. InterpretScreen은 `interpret.isError && data === undefined`일 때 "다시 시도" Card를 보여줌. refetchInterval이 2초마다 또 polling → 또 404 → 또 isError 반복
- **해결**: queryFn에서 두 번째 GET이 404일 때 throw 안 하고 `{dreamId, status: 'processing', symbolAnalysis: '', psychologicalMeaning: '', unconsciousMessage: ''}` placeholder 반환. InterpretScreen의 `isLoading` 분기에 `data?.status === 'processing'`이 매치되어 별빛 로딩 유지. `refetchInterval`은 `processing` 상태에서 2초마다 polling 계속 (최대 60초)
- **재발 방지**: 비동기 파이프라인을 React Query로 다룰 때 "아직 준비 안 됨"은 에러가 아니라 별도 status로 모델링하는 게 깜빡임/오인 에러를 막음. 404 → throw 패턴은 진짜 영구 에러일 때만

### [2026-04-28] RN fetch가 SSE 스트림 지원 안 함 → 토스트 에러
- **증상**: RecordChat에서 메시지 보내면 즉시 "연결에 실패했어요" 토스트. 백엔드 로그는 200 OK + Gemini 응답 정상(`chars=109, finish=STOP`)
- **원인**: `interpretService.streamChat`의 `response.body?.getReader()`가 React Native fetch에서 `undefined` 반환 → 첫 줄에서 `ApiError('SSE 스트림을 열 수 없어요')` throw. RN fetch는 표준 Web Streams API 미지원
- **해결**: SSE 자체를 제거하고 비-스트리밍 JSON으로 단순화. 백엔드는 Gemini 스트리밍 chunk를 누적해 `{text, nextStep, complete}` 한 번에 반환. 클라이언트도 일반 `request<>()`로 호출. `streamingText` 토큰 누적 로직 제거하고 `<ChatBubble isStreaming content="" />`로 typing dots만 표시
- **재발 방지**: RN의 fetch는 Web 표준 fetch와 동일하지 않음. `getReader()`/`ReadableStream`/SSE 같은 표준 streaming API는 폴리필 없이 동작 안 한다고 가정. 새 streaming 기능 도입 전 사전 확인

### [2026-04-28] RecordChat 모달 swipe-dismiss로 진행 중 세션 유실
- **증상**: step 3~4 진행 중 사용자가 다시 RecordChat 진입하면 새 sessionId로 step 1부터 시작. "앱이 새로고침되는 느낌"으로 인식
- **원인**: `RootNavigator`의 RecordChat 화면이 `presentation: 'modal'`인데, iOS 네이티브 모달은 기본적으로 위→아래 swipe 제스처로 dismiss 가능. swipe-dismiss는 `handleClose` Alert("그만두기" 확인)를 거치지 않지만, modal 닫힘 자체는 일어남. 그 후 사용자가 다시 진입할 때 `recordStore.session`이 어떤 경로에서 null로 변하면서 새 세션으로 시작됨 (정확한 reset 콜사이트는 미확정 — gestureEnabled 차단 후 증상 사라져 추가 추적은 보류)
- **해결**: `RootNavigator`의 RecordChat options에 `gestureEnabled: false` 추가. 단일 sessionId로 step 1→5까지 통과 확인 (재현 후 Metro 로그에서 단일 sessionId 검증)
- **재발 방지**: 진행 중 데이터를 가진 modal/screen은 기본 dismiss 제스처 활성화 여부 점검. 우발 종료 시 데이터 보존 경로(persist)가 없으면 제스처 차단

### [2026-04-28] Gemini 무료 티어 일 20회 한도 초과
- **증상**: step 5 응답에서 토스트 에러. 백엔드 로그에 `google.genai.errors.ClientError: 429 RESOURCE_EXHAUSTED`. 응답 body에 `Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash`
- **원인**: 하루 진단·테스트 누적 호출이 무료 티어 일일 20회 한도 도달
- **해결 옵션**:
  - PT 자정(한국 오후 4~5시) 자연 리셋 대기 — 임시
  - 새 프로젝트 + 새 API key 발급 후 `server/.env` 교체 + 백엔드 재시작 — 임시 (또 금방 초과 가능)
  - **유료 전환** ⭐ — CLAUDE.md 규칙 ("실서비스 시작 전 반드시 유료 전환"). 입력 $0.30 / 출력 $2.50 per 1M 토큰
- **재발 방지**: 백엔드 진단 로그(`gemini ClientError code=429`)로 즉시 식별 가능. 새 키 발급 시 spending cap 화면(`https://ai.studio/spend`) 동시 확인 (4/27 cap 0$ 사고 재발 방지)

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
