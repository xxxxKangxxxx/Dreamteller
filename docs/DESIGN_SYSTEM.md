# DreamTeller — 디자인 시스템

> 모든 색상, 타이포그래피, 컴포넌트는 이 파일을 기준으로 구현합니다.
> 직접 hex 값 사용 금지 — 반드시 토큰 변수명 사용.

---

## 컬러 토큰

`src/constants/colors.ts`

```typescript
export const colors = {
  // ── Brand ──────────────────────────────────────────
  primary:        '#6B3FA0',  // Deep Purple — CTA, 강조, 브랜드
  primaryLight:   '#9575CD',  // Stardust Lavender — 아이콘, 구분선
  primarySurface: '#2D1B69',  // 카드 배경, 컴포넌트 베이스

  // ── Background ─────────────────────────────────────
  bgBase:         '#0D0D1A',  // 앱 최하단 배경 (거의 검정)
  bgSurface:      '#16213E',  // 카드, 시트 배경
  bgElevated:     '#1E2A4A',  // 모달, 드롭다운

  // ── Text ───────────────────────────────────────────
  textPrimary:    '#E8E8F0',  // 기본 텍스트
  textSecondary:  '#A0A0C0',  // 서브 텍스트, 날짜
  textMuted:      '#606080',  // 비활성, 플레이스홀더
  textInverse:    '#FFFFFF',  // 어두운 배경 위 흰색

  // ── Semantic ───────────────────────────────────────
  success:        '#4CAF80',
  warning:        '#FFB74D',
  error:          '#E57373',
  info:           '#64B5F6',

  // ── Emotion ────────────────────────────────────────
  emotionPositive: '#81C784',  // 긍정 꿈
  emotionNegative: '#E57373',  // 부정 꿈
  emotionNeutral:  '#90A4AE',  // 중립 꿈
  emotionMixed:    '#CE93D8',  // 복합 꿈

  // ── UI Elements ────────────────────────────────────
  border:         '#2A2A4A',
  borderLight:    '#3A3A60',
  overlay:        'rgba(0, 0, 0, 0.6)',
  glassBackground:'rgba(107, 63, 160, 0.15)', // 글래스모피즘
  glassBorder:    'rgba(149, 117, 205, 0.3)',
} as const
```

---

## 타이포그래피 토큰

`src/constants/typography.ts`

```typescript
export const typography = {
  fonts: {
    regular:    'Pretendard-Regular',
    medium:     'Pretendard-Medium',
    semibold:   'Pretendard-SemiBold',
    bold:       'Pretendard-Bold',
  },

  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl': 28,
    '3xl': 34,
  },

  lineHeights: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },
} as const

// 자주 쓰는 텍스트 스타일 프리셋
export const textStyles = {
  heading1: { fontFamily: typography.fonts.bold,    fontSize: typography.sizes['3xl'], lineHeight: typography.sizes['3xl'] * 1.2 },
  heading2: { fontFamily: typography.fonts.bold,    fontSize: typography.sizes['2xl'], lineHeight: typography.sizes['2xl'] * 1.2 },
  heading3: { fontFamily: typography.fonts.semibold, fontSize: typography.sizes.xl,    lineHeight: typography.sizes.xl * 1.3 },
  body:     { fontFamily: typography.fonts.regular,  fontSize: typography.sizes.base,  lineHeight: typography.sizes.base * 1.6 },
  bodyMd:   { fontFamily: typography.fonts.medium,   fontSize: typography.sizes.base,  lineHeight: typography.sizes.base * 1.6 },
  caption:  { fontFamily: typography.fonts.regular,  fontSize: typography.sizes.sm,    lineHeight: typography.sizes.sm * 1.5 },
  label:    { fontFamily: typography.fonts.semibold, fontSize: typography.sizes.sm,    lineHeight: typography.sizes.sm * 1.4 },
} as const
```

---

## 스페이싱 & 반경

```typescript
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
} as const

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const
```

---

## 공통 컴포넌트 명세

### Button

```tsx
// src/components/ui/Button.tsx
interface ButtonProps {
  label: string
  onPress: () => void
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'   // default: 'md'
  loading?: boolean
  disabled?: boolean
  leftIcon?: ReactNode
}
```

**스타일 규칙**
| variant | 배경 | 텍스트 | 테두리 |
|---------|------|--------|--------|
| primary | `colors.primary` | `colors.textInverse` | 없음 |
| secondary | `colors.primarySurface` | `colors.primaryLight` | `colors.glassBorder` |
| ghost | 투명 | `colors.primaryLight` | 없음 |
| danger | `colors.error` (20% opacity) | `colors.error` | `colors.error` |

**크기**
| size | height | paddingH | fontSize |
|------|--------|----------|----------|
| sm | 36 | 14 | sm |
| md | 48 | 20 | base |
| lg | 56 | 28 | md |

---

### Card

```tsx
interface CardProps {
  children: ReactNode
  variant?: 'default' | 'glass' | 'dream'
  onPress?: () => void
  padding?: keyof typeof spacing
}
```

**variant 스타일**
- `default`: `bgSurface` 배경, `radius.lg`, 그림자 없음
- `glass`: `glassBackground` 배경, `glassBorder` 테두리 1px, blur effect
- `dream`: `primarySurface` 배경, `primary` 테두리 1px (특별 강조용)

---

### DreamCard

꿈 목록에서 사용되는 카드 컴포넌트

```tsx
interface DreamCardProps {
  dream: {
    id: string
    title: string
    rawContent: string
    emotion: Emotion
    dreamType?: DreamType
    illustrationUrl?: string
    recordedAt: string
    hasInterpretation: boolean
  }
  onPress: (id: string) => void
}
```

**레이아웃**
- 좌측: 일러스트 썸네일 (60×60, 없으면 감정 이모지 placeholder)
- 우측: 제목, 날짜, 감정 배지
- 하단 우측: 해몽 완료 여부 배지 (✨ / 없음)

---

### ChatBubble

```tsx
interface ChatBubbleProps {
  message: string
  role: 'assistant' | 'user'
  isStreaming?: boolean   // AI 타이핑 효과
}
```

**스타일**
- `assistant`: 왼쪽 정렬, `primarySurface` 배경, `primaryLight` 텍스트, 좌하단 꼬리
- `user`: 오른쪽 정렬, `bgElevated` 배경, `textPrimary` 텍스트, 우하단 꼬리

**타이핑 효과** (`isStreaming=true`)
- 텍스트가 한 글자씩 나타나는 효과 구현 (Reanimated 사용)
- 로딩 중: 점 3개 애니메이션 (`...`)

---

### Badge

```tsx
interface BadgeProps {
  label: string
  variant?: 'emotion' | 'dreamType' | 'soulType' | 'count' | 'premium'
  emotion?: Emotion  // variant='emotion'일 때 자동 컬러 적용
}
```

**이모지 매핑 (DreamType)**
```typescript
const DREAM_TYPE_EMOJI: Record<DreamType, string> = {
  PREDICTION:       '🔮',
  EMOTIONAL_RELEASE:'💜',
  DAILY:            '☁️',
  NIGHTMARE:        '🌑',
  LUCID:            '✨',
  SYMBOLIC:         '🌀',
}
```

---

### ScreenWrapper

```tsx
interface ScreenWrapperProps {
  children: ReactNode
  scrollable?: boolean     // default: false
  safeArea?: boolean       // default: true
  bgColor?: string         // default: colors.bgBase
  hasTabBar?: boolean      // 하단 탭 높이만큼 패딩
}
```

---

## 글래스모피즘 스타일 (공통)

```typescript
export const glassStyle = {
  backgroundColor: colors.glassBackground,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  // iOS blur: BlurView 컴포넌트 사용
  // Android: backgroundColor opacity만 적용 (BlurView 미지원)
}
```

---

## 애니메이션 프리셋

```typescript
// src/utils/animations.ts
export const animations = {
  // 화면 진입 (카드 스태거)
  fadeInUp: (delay = 0) => ({
    from: { opacity: 0, translateY: 20 },
    to:   { opacity: 1, translateY: 0 },
    delay,
    duration: 400,
    easing: Easing.out(Easing.cubic),
  }),

  // 별빛 파티클 (AI 로딩)
  starPulse: {
    from: { opacity: 0.2, scale: 0.8 },
    to:   { opacity: 1,   scale: 1.2 },
    duration: 1200,
    loop: true,
    reverse: true,
  },

  // 탭 전환
  tabFade: {
    duration: 200,
    easing: Easing.inOut(Easing.ease),
  }
} as const
```

---

## 아이콘 규칙

- 라이브러리: `@expo/vector-icons` (Ionicons 기본)
- 크기: 24(기본) / 20(소) / 28(대)
- 색상: 반드시 토큰 사용 (`colors.primaryLight`, `colors.textSecondary` 등)
- 탭바 아이콘:
  - 홈: `moon` / `moon-outline`
  - 기록: `add-circle` / `add-circle-outline`
  - 해몽: `sparkles` / `sparkles-outline`
  - 아카이브: `library` / `library-outline`
  - 분석: `bar-chart` / `bar-chart-outline`
