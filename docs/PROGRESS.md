# DreamTeller — 진행 현황 & 다음 작업

> 최종 업데이트: 2026-04-23 (세션 마무리)
> 대상 위치: `dreamteller/app/` (Expo 프로젝트)

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
- UI/애니메이션: react-native-reanimated v4, react-native-svg, @expo/vector-icons

### 2. 구성
- `tsconfig.json` strict + `noUncheckedIndexedAccess` + `@/*` path alias
- `babel.config.js` (`babel-preset-expo`)
- `.env.example` + `.gitignore`에 `.env` 제외
- `app.json` 다크모드 기본, splash `#0D0D1A`, bundleId `com.dreamteller.app`, plugins(expo-secure-store, expo-notifications)

### 3. 디자인 토큰 (DESIGN_SYSTEM.md 기반)
- `constants/colors.ts` / `typography.ts` / `spacing.ts` / `config.ts` / `prompts.ts`

### 4. 타입
- `types/dream.ts`, `types/user.ts`, `types/api.ts`

### 5. Services
- `services/api.ts` — axios + SecureStore 자동 Authorization, `ApiError` 클래스, `request<T>` envelope 언래퍼, 401 시 `/auth/refresh` 자동 재시도(동시 요청은 단일 리프레시 공유), `setUnauthorizedHandler`
- `authService.ts`, `dreamService.ts`, `interpretService.ts`(fetch+SSE+AbortSignal), `archiveService.ts`, `statsService.ts`

### 6. Stores (Zustand)
- `authStore` — status/user + hydrate/login/logout/updateUser
- `recordStore` — RecordSession(step 1~5, summary, emotion, 타임스탬프) + appendMessage/setStep/setSummary/setEmotion/complete/reset/touch
- `uiStore` — colorScheme / isNetworkOnline / toasts 큐

### 7. 공통 컴포넌트
- `layout/` — ScreenWrapper, Placeholder
- `ui/` — Button(4 variant × 3 size), Card(default/glass/dream), Badge(5 variant), Avatar(expo-image fallback), Skeleton(Reanimated pulse)
- `dream/` — TagChip, ChatBubble(타이핑 3-dot), DreamCard, InterpretCard

### 8. 네비게이션
- `navigation/types.ts` — RootStackParamList + TabParamList + 전역 RootParamList 병합
- `TabNavigator` — 5탭(홈/기록/해몽/아카이브/분석), Record 탭은 `tabPress` 가로채서 RecordChat 모달
- `RootNavigator` — Tabs + 11 스크린, RecordChat은 `slide_from_bottom` 모달

### 9. Screens (11개)
- onboarding/ — Welcome, Onboarding (stub)
- auth/ — Login, Signup (stub)
- home/ — HomeScreen (다크 테마 + 샘플 CTA + DreamCard 2개)
- record/ — **RecordChatScreen (실 구현: 헤더+FlatList+입력창+KeyboardAvoidingView+AppState 저장+30분 idle Alert+complete→RecordSummary)**, RecordSummaryScreen (stub)
- interpret/ — Interpret, DreamCard (stub)
- archive/ — Archive, CharacterDetail (stub)
- insights/ — Insights (stub)
- settings/ — Settings (stub)

### 10. Hooks / Utils
- `hooks/useRecordSession.ts` — recordStore + `interpretService.streamChat` 연결. ensureSession/send/cancel. 토큰 버퍼 누적 `streamingText`, `[RECORD_COMPLETE]` 감지 → complete, step 이벤트 반영, AbortController로 스트림 취소
- `utils/sessionStorage.ts` — SecureStore 기반 RecordSession save/load/clear
- `utils/summary.ts` — chatHistory에서 user 메시지 모아 요약 초안 생성

### 11. App 엔트리
- `App.tsx` — QueryClientProvider + SafeAreaProvider + NavigationContainer(다크), 마운트 시 `authStore.hydrate()` + `setUnauthorizedHandler` 등록

### 검증
- `npx tsc --noEmit` 통과

---

## 다음 작업 (우선순위 순)

### [1] RecordSummaryScreen 실 구현 ⭐ (중단 지점)
- chatHistory 기반 초안 요약 (`draftSummaryFromChat`) → 편집 가능 TextInput
- 감정 태그 4종 선택 (😊 POSITIVE / 😰 NEGATIVE / 😐 NEUTRAL / 🌀 MIXED)
- "해몽 받기" → `dreamService.create` → `interpretService.generate(id)` → `InterpretDetail` navigate
- "그냥 저장" → `dreamService.create` → `recordStore.reset` + `sessionStorage.clear` + Tabs/Home으로 reset
- 에러: `FALLBACK_MESSAGES.chatError` 토스트

### [2] React Query 훅
- `useDreams` / `useDreamDetail` / `useInterpret`(+generate 후 polling) / `useMonthlyStats` / `useUsage`
- `constants/queryKeys.ts` 권장
- `recordStore.reset()` 시 dreams 쿼리 invalidate

### [3] InterpretScreen 실 구현 ⭐
- 해몽 로딩 중: 별빛 파티클 (스피너 금지) + "꿈을 해석하는 중..."
- 3파트 카드 (`InterpretCard` 준비됨: symbol/psychological/unconscious)
- FREE 플랜 월 5회 초과 시 프리미엄 업그레이드 모달
- "해몽 카드로 저장" → DreamCardScreen

### [4] 인증 플로우 분기
- `RootNavigator`를 `authStore.status` 기반 분기 (loading 스플래시 / unauthenticated Welcome·Login / authenticated Tabs)
- Supabase Auth JS SDK, Apple/Google ID 토큰을 `/auth/login`에 전달

### [5] 세션 자동 재개
- 앱 시작 시 `sessionStorage.load()` → 있으면 재개 제안 Alert

### [6] 시뮬레이터 확인
- `npm run ios` — 키보드, SSE 스트리밍, 다크 테마 체감

### [7] Archive / Insights / Settings 실 구현

### [8] `/server` FastAPI 프로젝트 초기화

### [9] 기타
- Pretendard 폰트 로딩 (`expo-font` + `useFonts`)
- 아이콘/스플래시 에셋 제작 교체
- Husky/Lint-staged (선택)

---

## 오류 및 해결 내역

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
