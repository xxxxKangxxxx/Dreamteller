# DreamTeller — 기능 명세 (SPEC)

> Claude Code 참조용. 각 화면의 기능, 컴포넌트, 상태, API 연결을 정의합니다.

---

## 플랜별 기능 제한

| 기능 | FREE | PREMIUM |
|------|------|---------|
| 꿈 기록 | 월 30건 | 무제한 |
| AI 해몽 | 월 10회 | 무제한 |
| AI 일러스트 생성 | ✕ (MVP 이후) | ✕ (MVP 이후) |
| 드림 아카이브 태그 | 10개 | 무제한 |
| 통계 & 분석 | 기본 | 심층 |
| 소울 타입 콘텐츠 | ✕ | ✓ |
| 해몽 카드 공유 | ✓ (워터마크) | ✓ (워터마크 없음) |

---

## 화면별 기능 명세

### 1. 온보딩 / 인증

#### WelcomeScreen
- 드림텔러 브랜딩 애니메이션 (별빛 파티클 + 로고)
- CTA: "시작하기" → OnboardingScreen
- 이미 로그인된 경우 HomeScreen으로 redirect

#### OnboardingScreen
- 3단계 슬라이드 (앱 핵심 가치 소개)
  - Slide 1: "꿈을 잊기 전에, AI가 먼저 물어볼게요"
  - Slide 2: "당신의 꿈에 숨겨진 이야기를 해석해드려요"
  - Slide 3: "나만의 꿈 세계관을 아카이브로 쌓아가요"
- 하단 "로그인 / 회원가입" 버튼

#### LoginScreen
- Apple 로그인 (iOS 필수)
- Google 로그인
- 이메일 로그인 (선택)
- 약관 동의 체크 (첫 로그인 시)

---

### 2. 홈 (HomeScreen)

**레이아웃**
- 상단: 인사 메시지 (`"좋은 아침이에요, {name} 🌙"`)
- 기록 유도 CTA 카드 (오늘 기록이 없으면 강조, 있으면 약하게 표시)
- 최근 꿈 기록 피드 (카드 리스트, 최신 10건)
- 하단: 이번 달 기록 수 + 스트릭 배지

**상태**
```typescript
// useQuery로 관리
const { data: recentDreams } = useDreams({ limit: 10 })
const { data: stats } = useMonthlyStats()
```

**동작**
- CTA 카드 탭 → RecordChatScreen
- 꿈 카드 탭 → InterpretScreen (해당 dreamId)
- 당겨서 새로고침 지원

---

### 3. 대화형 꿈 기록

#### RecordChatScreen ⭐ 핵심 화면

**UI 구조**
- 채팅 UI (하단 입력창 + 상단 스크롤 가능 메시지 목록)
- AI 말풍선: 왼쪽 정렬, 보라색 배경
- 사용자 말풍선: 오른쪽 정렬, 어두운 배경
- 상단: "X" 닫기 + 진행 단계 표시 (예: "2/5단계")
- 하단 입력창: 텍스트 입력 + 전송 버튼

**AI 대화 흐름 (단계별)**
```
Step 1 (장소): "어젯밤 꿈에서 어디에 있었어? 🌙"
Step 2 (인물): "거기서 누가 있었어? 아니면 혼자였어?"
Step 3 (사건): "무슨 일이 있었어? 기억나는 장면이 있어?"
Step 4 (감정): "그때 어떤 감정이었어? 무서웠어, 신기했어, 아니면 다른 감정?"
Step 5 (마무리): "이 정도면 충분해! 꿈을 정리해볼게 ✨"
       → AI가 요약본 생성 후 RecordSummaryScreen으로 이동
```

**상태 (recordStore)**
```typescript
interface RecordSession {
  sessionId: string
  messages: ChatMessage[]     // 전체 대화 내역
  step: number                // 현재 단계 (1~5)
  isCompleted: boolean
}
```

**API 연결**
- 사용자 메시지 전송 시: `POST /api/interpret/chat` 호출
- AI 응답 스트리밍 지원 (SSE)

**특이사항**
- 키보드 올라올 때 메시지 목록 자동 스크롤
- 앱 백그라운드 진입 시 세션 임시 저장 (SecureStore)
- 30분 이상 비활성 시 세션 만료 안내

#### RecordSummaryScreen
- AI가 생성한 꿈 요약본 텍스트 표시
- "이 내용이 맞아?" 확인 + 수정 가능 (텍스트에디터)
- 감정 태그 선택 (😊 긍정 / 😰 부정 / 😐 중립 / 🌀 복합)
- "해몽 받기" 버튼 → 저장 후 InterpretScreen
- "그냥 저장" 버튼 → 해몽 없이 저장 후 Home

---

### 4. 해몽 결과

#### InterpretScreen ⭐ 핵심 화면

**레이아웃 (스크롤)**
1. ~~드림 일러스트 이미지~~ → **MVP 이후 추가 예정** (현재는 감정/유형 기반 추상 그래픽으로 대체)
2. 꿈 제목 + 날짜 + 감정 태그(`EmotionTag` — 컬러 dot + 라벨)
3. 해몽 3파트 카드 (구조화 응답 v2):
   - 01 SYMBOL · 상징 분석 — headline + keySymbols 칩 + detail(단락 분리)
   - 02 PSYCHOLOGY · 심리적 의미 — headline + perspective pill + detail
   - 03 UNCONSCIOUS · 무의식 메시지 — headline + detail + `NOTE TO SELF` affirmation 박스
4. "해몽 카드로 저장" 버튼 → DreamCardScreen
5. "공유하기" 버튼 → 시스템 Share (텍스트)

**상태**
```typescript
// 해몽이 없는 경우 자동 요청
const { data: interpretation, isLoading } = useInterpret(dreamId)
// 일러스트는 MVP 이후 추가 예정
// const { data: illustration } = useIllustration(dreamId)
```

**동작**
- 해몽 로딩 중: 별빛 파티클 애니메이션 + "꿈을 해석하는 중..." 텍스트
- FREE 플랜 월 5회 초과 시: 프리미엄 업그레이드 모달

#### DreamCardScreen
- 해몽 내용을 감성 카드 이미지로 렌더링 (캡처 후 저장/공유)
- 카드 스타일: **Galaxy 단일** (보라/딥블루 그라데이션). Mist/Neon 후보는 검토 후 제거 — 단일 톤이 브랜드 일관성에 맞음
- 캡처 영역: 날짜 / 꿈 제목 / 감정 태그 / 해몽 3섹션(인덱스 라벨 + 헤드라인 + 본문) / `NOTE TO SELF` affirmation 박스 / `DREAMTELLER` 워터마크(FREE 플랜은 `FREE` 라벨 동반)
- `react-native-view-shot`으로 PNG 캡처 → `expo-media-library`로 사진 앱 저장 / `expo-sharing`으로 iOS Share Sheet 공유
- 사진 앱 저장 시 `MediaLibrary.requestPermissionsAsync()` 권한 흐름

---

### 5. 드림 아카이브

#### ArchiveScreen
- 탭 3개: 등장인물 | 장소 | 테마
- **등장인물 탭**: 캐릭터 카드 그리드 (이름 + 등장 횟수 + 최근 꿈)
- **장소 탭**: 장소 타일 그리드
- **테마 탭**: 반복 키워드 워드클라우드 (react-native-svg 기반)

#### CharacterDetailScreen
- 캐릭터 이름, 관계, 등장한 꿈 목록
- 연관 꿈 카드 스크롤

---

### 6. 인사이트 (InsightsScreen)

**FREE 플랜**
- 이번 달 기록 수 / 연속 기록 스트릭
- 감정 분포 파이차트 (최근 30일)

**PREMIUM 플랜 추가**
- 월별 기록 추이 라인차트
- 반복 테마 TOP 5
- 꿈 유형 분포 (악몽/일상/예지/루시드 등)
- 감정 캘린더 히트맵

---

### 7. 설정 (SettingsScreen)

- 프로필 편집
- 알림 설정 (기상 알람 연동 — 기상 후 N분 후 알림)
- 구독 관리 (FREE → PREMIUM 업그레이드)
- 데이터 내보내기 (JSON)
- 계정 삭제
- 개인정보처리방침 / 이용약관

---

## 전역 UX 규칙

### 로딩 상태
- AI 응답 대기 시: 별빛 파티클 애니메이션 필수 (스피너 사용 금지)
- 일반 데이터 로딩: Skeleton 컴포넌트 사용

### 에러 처리
- AI API 실패: "꿈 해석에 잠깐 문제가 생겼어요 🌙 다시 시도해볼게요" 토스트
- 네트워크 오류: 하단 배너로 표시 (빨간 배경 아님 — 소프트하게)

### 애니메이션
- 화면 전환: `slide from bottom` (모달형) 또는 `fade` (탭 전환)
- 카드 등장: 아래에서 올라오는 fade-in (stagger 100ms)
- AI 메시지 등장: 타이핑 효과 (문자 단위 렌더링)

### 접근성
- 모든 터치 영역 최소 44pt
- 다크 모드 기본 (라이트 모드는 추후 지원)
