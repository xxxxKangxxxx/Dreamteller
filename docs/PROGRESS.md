# DreamTeller — 진행 현황 & 다음 작업

> 최종 업데이트: 2026-04-26 (세션 종료)
> 대상 위치: `dreamteller/app/` (Expo 프로젝트)

---

## 오늘 세션 요약 (2026-04-26)

### 완료
1. **RecordSummaryScreen 실 구현** — 초안 요약 편집 + 감정 4종 + 해몽/저장 분기 + Tabs reset, 저장 후 dreams 쿼리 invalidate
2. **React Query 훅 세트** — `useDreams` / `useInvalidateDreams` / `useDreamDetail` / `useInterpret`(404 시 자동 generate + processing 폴링) / `useGenerateInterpret` / `useMonthlyStats` / `useUsage`, `constants/queryKeys.ts`
3. **InterpretScreen 실 구현** — 별빛 파티클 로딩(`StarParticleLoader`), 3파트 카드, FREE 한도 초과 시 프리미엄 모달, Share API, Tab 진입 시 최근 dream fallback
4. **인증 플로우 분기** — `RootNavigator`를 `authStore.status` 기반 3-stack(Splash/Auth/App)으로 분기, `SplashScreen` 신설, `WelcomeScreen` 실 구현
5. **세션 자동 재개** — `recordStore.hydrate(session)` + `utils/sessionResume.ts` (24h 이내 미완료 세션 재개 Alert), HomeScreen mount 시 호출 + "기록 시작" CTA 와이어업
6. **중복 제거 / 통합** — `constants/emotion.ts`(EMOTION_META: label/emoji/color, EMOTION_ORDER) + `utils/date.ts`(formatDateDot/formatDateKoShort)로 4곳 emotion 매핑 / 2곳 formatDate 통합
7. **시뮬레이터 첫 부팅** — 누락 의존성 2개(babel-preset-expo, react-native-worklets) 추가 후 정상 부팅 확인 (HomeScreen 렌더 + 통합 모듈 동작 검증)
8. **개발 보조** — LoginScreen에 `__DEV__` 가드 임시 로그인 버튼 (시뮬레이터 흐름 체감용)

### 다음 세션 시작 시 권장
- (a) 시뮬레이터에서 추가 흐름 체감 (Tab 전환·RecordChat 모달·키보드)
- (b) Supabase Auth 실 통합으로 dev 우회 제거
- (c) Archive/Insights/Settings 실 구현
- 별도: HomeScreen 그리팅 시간대 분기(현재 "좋은 아침"으로 하드코딩) — 작은 백로그

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
- `authService.ts`, `dreamService.ts`, `interpretService.ts`(fetch+SSE+AbortSignal), `archiveService.ts`, `statsService.ts`

### 6. Stores (Zustand)
- `authStore` — status/user + hydrate/login/logout/updateUser
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
- auth/ — Login, Signup (stub)
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

### [1] 시뮬레이터 확인 ⭐ (중단 지점)
- `npm run ios` — 키보드, SSE 스트리밍, 다크 테마 체감

### [2] Supabase Auth 실 통합 (인증 플로우 stub 채우기)
- 현재 RootNavigator는 status 분기만 완료. 실제 로그인 기능은 미구현
- Supabase Auth JS SDK 설치, Apple/Google ID 토큰을 `/auth/login`에 전달
- Login/Signup 화면 stub → 실 구현

### [3] Archive / Insights / Settings 실 구현

### [4] `/server` FastAPI 프로젝트 초기화

### [5] 기타
- Pretendard 폰트 로딩 (`expo-font` + `useFonts`)
- 아이콘/스플래시 에셋 제작 교체
- Husky/Lint-staged (선택)

---

## 오류 및 해결 내역

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
