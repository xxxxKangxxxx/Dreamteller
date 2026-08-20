# DreamTeller — 영어 지원(i18n) 실행 계획

> **작성 2026-08-20.** 조사·검증·설계 결정 완료. **코드는 아직 변경되지 않았다.**
> 착수는 추후. **이 문서만 보고 바로 실행할 수 있도록** 작성했다.
> 목표 릴리즈: **1.2.0** (Phase 1~8 완료 후 단일 빌드·단일 심사)

**읽는 순서**: §0 스냅샷 → §1 결정 → §2 제약 → §3 검증된 사실 → §5 Phase 실행. 부록 §11~§13은 실제 작업 시 참조.

관련 문서: `PROMPT_GUIDE.md` · `API.md` · `SPEC.md` · `ARCHITECTURE.md` · `DESIGN_SYSTEM.md` · `appstore/REVIEW_PLAYBOOK.md`

---

## 0. 착수 시점 스냅샷 (2026-08-20 기준)

이 계획이 전제한 상태. **착수 시점에 달라졌으면 §11의 재조사 명령을 먼저 돌려라.**

| 항목 | 값 |
|------|-----|
| 앱 버전 | `app/app.json` `version: 1.1.0` (App Store 라이브) |
| Expo SDK | 54.0.33 |
| React Native | 0.81.5 (New Architecture 활성) |
| JS 엔진 | Hermes (`app/ios/Podfile.properties.json`) |
| i18n 라이브러리 | **없음** |
| `expo-localization` | **미설치** |
| 앱 UI 한글 문자열 | **27개 파일 / 249줄** (주석 제외. 이 중 1줄은 오탐 — `StarParticleLoader.tsx:140` 코드 끝 주석) |
| 서버 프롬프트 | `server/app/services/gemini_service.py` 612줄, 프롬프트 7종 전부 한국어 고정 |
| 서버 사용자 노출 문자열 | `server/app/main.py:57` **단 1줄** |
| DB 마이그레이션 | `001_initial.sql`, `002_interpretations_payload.sql` (다음 번호 = **003**) |
| 웹 | `web/index.html` · `privacy.html` · `terms.html` 전부 `<html lang="ko">` |
| 스토어 | 기본 언어 한국어 단일 로케일 |

⚠️ **이 문서의 모든 `파일:줄번호`는 2026-08-20 기준이다. 코드가 바뀌면 밀린다. §11의 명령으로 재확인할 것.**

---

## 1. 확정된 설계 결정

사용자와 논의를 거쳐 확정. 임의 변경 금지 — 바꾸려면 근거와 함께 이 표를 갱신한다.

| # | 항목 | 결정 | 근거 |
|---|------|------|------|
| ① | 범위 | **UI + AI 생성 콘텐츠 전부** | UI만 하면 버튼은 영어인데 해몽은 한국어인 반쪽 제품이 된다 |
| ② | 해몽 정체성 | **한국 전통 해몽 유지** | 영어권은 융/프로이트 기반이 포화. 한국 전통 상징 체계가 대체 불가 차별점 |
| ③ | 언어 선택 | **자동 감지 + 수동 오버라이드.** `시스템 / 한국어 / English` **3지** | iOS 관례. 기기 언어를 따라가면서도 고정 가능 |
| ④ | 기록 언어 정책 | **기록의 언어를 따른다.** `dreams.language`가 진실 소스 | 한국어 원문에 영어 해몽을 붙이면 뉘앙스가 한 번 손실된 뒤 해석돼 품질이 무너진다 |
| ⑤ | 문화 맥락 전달 | **`keySymbols.meaning` 안에 인라인.** 별도 필드 신설 없음 | `interpretations.payload`(JSONB) 구조 불변 + 한국어판 빈 필드 비대칭 회피 |
| ⑥ | 영어 출력 길이 | **한국어 카드와 같은 분량.** 한글:영어 ≈ 1:2.5 환산 (§6-2) | 카드 높이와 공유 이미지 캡처 레이아웃을 언어 무관하게 고정 |
| ⑦ | 카드 라벨 | **2단 구조 유지.** 1단=키워드(공통), 2단=설명(로케일) | 카드 높이 불변 + 코드 변경이 리네이밍 수준 |
| ⑧ | Luna 영어 톤 | **친구 톤 유지.** 축약형·구어체로 반말 톤의 친밀감 재현 | 한국어판과 제품 성격을 일치시킨다 |
| ⑨ | 출시 단위 | **1.2.0 한 번에.** EAS 빌드 1회 + 심사 1회 | 빌드 한도·심사 리스크 최소화. 반쪽 영어 구간이 노출되지 않는다 |
| ⑩ | 약관 영문화 | **초안 작성 → 사용자 검토 → 반영** | 법적 효력 문구를 임의 확정하지 않는다 |

---

## 2. 반드시 지킬 제약

1. **스토어 라이브 앱 하위 호환** (`PROMPT_GUIDE.md §하위 호환`)
   구버전 앱은 `Accept-Language`를 **보내지 않는다.** 서버는 헤더 부재 시 **무조건 `ko` 폴백.**
   이 원칙만 지키면 **서버를 앱보다 먼저 배포해도 안전하다.**
   `POST /interpret/chat`의 `text` / `nextStep` / `complete` 필드도 계속 유지해야 한다.
2. **EAS 무료 티어 월 iOS 15빌드** — 네이티브 변경은 Phase 7까지 모아서 **빌드 1회.**
3. **Gemini 월 지출 하드캡 ₩15,000** — 영어는 같은 내용에 토큰을 더 쓴다. Phase 5 직후 실측 (§8).
4. **`gemini-2.5-flash` 고정** (CLAUDE.md 규칙 7)
5. **프롬프트 하드코딩 금지** (CLAUDE.md 규칙 3) — 영어 프롬프트도 `PROMPT_GUIDE.md`에 먼저 기재 후 구현. 전문 초안은 §12.
6. **컬러/타이포는 토큰 사용** (CLAUDE.md 규칙 1) — 라벨 스타일 손댈 때 hex 금지.
7. **인프라 콘솔 작업은 사용자가 직접** — Supabase 마이그레이션 실행, ASC 로케일 추가는 가이드만 제공.

---

## 3. 사전 검증된 기술 사실

착수 전 실제로 측정한 값. 추측 아님.

### 3-1. Hermes의 Intl은 "부분 지원" ⚠️
`app/ios/Pods/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework/ios-arm64/hermes.framework/hermes`
바이너리 심볼 조사 결과:

| API | 존재 |
|-----|------|
| `Intl.Collator` / `Intl.DateTimeFormat` / `Intl.NumberFormat` | ✅ |
| **`Intl.PluralRules`** | ❌ **없음** |
| `Intl.RelativeTimeFormat` / `ListFormat` / `Segmenter` / `DisplayNames` | ❌ 없음 |

**함의 2가지:**
- 날짜·숫자 포맷은 `Intl.DateTimeFormat` / `NumberFormat`으로 그대로 된다 → Phase 4 부담 감소
- **i18next v23+ 는 복수형 판정에 `Intl.PluralRules`를 쓴다.** 폴리필 없으면 `"1 dreams"` 버그가 난다.
  → **`@formatjs/intl-pluralrules` 필수.** i18next 초기화보다 **먼저** import (Phase 2)

재확인 명령은 §11-4.

### 3-2. `expo-localization` 미설치
Expo SDK 54.0.33 / RN 0.81.5 → 반드시 `npx expo install expo-localization`로 설치.
`npm i`로 넣으면 SDK와 어긋난 버전이 들어올 수 있다.

### 3-3. 작업이 예상보다 적은 영역 (좋은 소식)
- **서버 에러 i18n은 거의 공짜** — 사용자 노출 문자열이 `main.py:57` 단 1줄.
  나머지 `HTTPException detail`은 전부 `DREAM_NOT_FOUND` 같은 **영문 코드**라 앱에서 매핑하면 된다.
- **`constants/emotion.ts`** — 키가 `POSITIVE/NEGATIVE/NEUTRAL/MIXED` enum → **DB 스키마 변경 불필요.** 라벨만 `t()`.
- **`utils/text.ts` `splitIntoParagraphs()`** — 정규식이 `.!?。！？` 전부 커버 → **영문 그대로 동작. 수정 불필요.**
- **`SUMMARY_USER_TEMPLATE`** — 분량 제한이 원래 없음(`분량 제한은 없다`) → **길이 환산 불필요.** 지시문만 번역.
- **`utils/date.ts` `formatDateDot()`** — `2026.08.20` 숫자 포맷 → **로케일 무관. 수정 불필요.**

### 3-4. 번역하면 깨지는 로직 3곳 ⚠️
한글 문자열을 **값으로 비교**하는 코드. 번역 전에 반드시 리팩터해야 한다.

```
app/src/screens/settings/SettingsScreen.tsx:120   if (message !== '로그인을 취소했어요')
app/src/screens/auth/LoginScreen.tsx:77           if (message !== '로그인을 취소했어요')
app/src/screens/auth/LoginScreen.tsx:92           if (message !== '로그인을 취소했어요')
```
출처: `app/src/services/authService.ts:116`(Google), `:179`(Apple)의 `throw new Error('로그인을 취소했어요')`.
→ **Phase 1에서 선행 리팩터.** 서버에는 동일 패턴 없음(확인 완료).

### 3-5. 문장 조립(concatenation) 함정 ⚠️
한국어는 조사가 뒤에 붙어 `{변수} + 고정문구` 조립이 자연스럽지만, **영어는 어순이 달라 그대로 깨진다.**
아래 5곳이 JSX 조각/템플릿 결합으로 문장을 만든다.

| 위치 | 현재 조립 | 문제 |
|------|----------|------|
| `OtpVerifyScreen.tsx:105~108` | `{email}` + `\n로 보낸 6자리 코드를 입력해주세요` | 영어는 `Enter the 6-digit code we sent to {{email}}` — **변수가 뒤로 간다** |
| `InterpretScreen.tsx:269~271` | `상징·심리·무의식…` + `\n` + `이번 달 {n}번 더` + `받을 수 있어요.` | 3조각 결합 |
| `InterpretScreen.tsx:353~357` | `해몽은 한 달에` + `{' '}` + `{n}번` + `까지 받을 수` + `있어요.` | 5조각 결합. **가장 심함** |
| `InsightsScreen.tsx:27` | `{year}` + `년 ` + `{month}` + `월` | 영어는 `August 2026` — **순서가 반대** |
| `RecordChatScreen.tsx:181` | `{filled}` + `/` + `{total}` + ` 담김` | 상대적으로 경미 |

**규칙: 번역 키는 문장 단위. JSX 조각 결합으로 문장을 만들지 않는다.**

### 3-6. 12시간제 표기 ⚠️
`SettingsScreen.tsx:52` — `const period = h < 12 ? '오전' : '오후'`
한국어는 `오전 8:00`(접두), 영어는 `8:00 AM`(접미). **문자열 치환으로는 안 되고 포맷 자체가 뒤집힌다.**
→ `Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })`로 통일하는 편이 안전 (§3-1에서 사용 가능 확인됨).

---

## 4. 번역 키 규약

### 4-1. 네임스페이스
| ns | 범위 |
|----|------|
| `common` | 버튼·공통 액션 (`cancel` `confirm` `retry` `close` `back` `delete` `save` `share` `next` `skip`) |
| `auth` | 로그인/회원가입/OTP + 인증 에러 |
| `onboarding` | Welcome + Onboarding 3스텝 |
| `home` | 홈 |
| `record` | 대화 기록 + 요약 확인 |
| `interpret` | 해몽 화면 + 해몽 카드 |
| `archive` | 아카이브 + 캐릭터 상세 |
| `insights` | 인사이트 |
| `settings` | 설정 |
| `notification` | 로컬 알림 문구 |
| `errors` | 서버 에러 코드 → 사용자 문구 매핑 |

### 4-2. 키 네이밍 규칙
- `{ns}.{section}.{element}` — 예: `settings.account.deleteConfirmTitle`
- 복수형은 i18next 규약: `insights.streak_one` / `insights.streak_other`
- 보간 변수는 의미 있는 이름: `{{count}}` `{{year}}` `{{email}}` `{{cooldown}}`. **`{{0}}` 금지**
- **한글을 키로 쓰지 않는다** (키가 곧 원문이면 문구 수정 시 전 파일이 흔들린다)
- **문장은 통째로 한 키에** (§3-5)
- 접근성 라벨은 `a11y` 섹션으로: `record.a11y.closeButton`

### 4-3. 서버 에러 코드 전량 (`errors` ns)
| 코드 | 출처 |
|------|------|
| `INSERT_FAILED` | `dreams.py:46` |
| `DREAM_NOT_FOUND` | `dreams.py:112`, `:151`, `:191`, `:206` / `interpret.py:122`, `:177` |
| `SUMMARY_GENERATION_FAILED` | `dreams.py:161` |
| `EMPTY_PATCH` | `dreams.py:181` |
| `DELETE_ACCOUNT_FAILED` | `account.py:31` |
| `INTERPRETATION_NOT_FOUND` | `interpret.py:187` |
| `INTERNAL_ERROR` | `main.py:57` — **서버가 문구까지 내려주는 유일한 케이스** |
| `NETWORK_ERROR` | 앱 `api.ts` 자체 생성 |
| `missing token` / `invalid token` / `missing sub` | `deps/auth.py:18`, `:29`, `:32` (401) |

---

## 5. Phase별 실행 계획

각 Phase = 1개 이상의 커밋. 순서대로 진행. **앞 Phase 미완료 상태로 다음으로 넘어가지 않는다.**

```
Phase 1  선행 리팩터        ← 단독 배포 가능, 부담 없이 먼저
Phase 2  i18n 기반 구축
Phase 3  앱 UI 문자열 추출  (커밋 4개)
Phase 4  날짜·숫자·복수형
Phase 5  서버 언어 전파     ← 핵심. 서버 단독 선배포 가능
Phase 6  데이터 언어 태깅   (migration 003)
Phase 7  앱 외부 자산       ← 여기서 EAS 빌드 1회
Phase 8  웹 & 스토어
```

---

### Phase 1 — 선행 리팩터 (i18n 무관, 단독 배포 가능)
> 커밋: `refactor: 인증 취소를 문자열 비교 대신 에러 코드로 판별`

한글 에러 메시지를 값으로 비교하는 코드(§3-4)를 없앤다. **i18n과 무관하게 그 자체로 옳은 수정**이라
먼저 넣고 검증해두면 이후 Phase의 변수를 하나 줄인다.

- [ ] `app/src/services/authService.ts`
  ```ts
  // 사용자가 OAuth 시트를 닫은 것은 '실패'가 아니다. 호출부가 문구가 아니라
  // 타입으로 구분할 수 있어야 번역해도 분기가 깨지지 않는다.
  export class AuthCancelledError extends Error {
    constructor() {
      super('AUTH_CANCELLED');
      this.name = 'AuthCancelledError';
    }
  }
  ```
  - `:116` (Google), `:179` (Apple)의 `throw new Error('로그인을 취소했어요')` → `throw new AuthCancelledError()`
- [ ] 호출부 3곳을 `err instanceof AuthCancelledError`로 교체
  - `app/src/screens/settings/SettingsScreen.tsx:120`
  - `app/src/screens/auth/LoginScreen.tsx:77`, `:92`
- [ ] **검증**: Google 로그인 시트를 띄웠다 취소 → 에러 토스트가 뜨지 **않아야** 한다. Apple도 동일

---

### Phase 2 — i18n 기반 구축
> 커밋: `feat: i18n 기반 구축 (i18next + localeStore)`

- [ ] 의존성
  ```bash
  cd app
  npx expo install expo-localization          # SDK 정합성 위해 반드시 expo install
  npm i i18next react-i18next @formatjs/intl-pluralrules
  ```

- [ ] `app/src/i18n/index.ts` (신규)
  ```ts
  // ⚠️ Hermes에는 Intl.PluralRules가 없다(I18N_PLAN §3-1). i18next는 복수형 판정에
  //    이걸 쓰므로, 폴리필을 i18next 초기화보다 먼저 로드하지 않으면 "1 dreams"가 된다.
  import '@formatjs/intl-pluralrules/polyfill';
  import '@formatjs/intl-pluralrules/locale-data/en';
  import '@formatjs/intl-pluralrules/locale-data/ko';

  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';

  import en from './locales/en';
  import ko from './locales/ko';

  export const SUPPORTED_LOCALES = ['ko', 'en'] as const;
  export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

  void i18n.use(initReactI18next).init({
    resources: { ko: ko, en: en },
    lng: 'ko',              // localeStore.hydrate()가 곧바로 덮어쓴다
    fallbackLng: 'en',      // 지원하지 않는 언어는 영어로 (결정 ③)
    defaultNS: 'common',
    interpolation: { escapeValue: false },  // RN은 XSS 이스케이프가 불필요
    returnNull: false,
  });

  export default i18n;
  ```

- [ ] `app/src/i18n/locales/ko.ts` / `en.ts` (신규) — §4-1 네임스페이스 구조. 값은 §13 인벤토리 참조

- [ ] `app/src/store/localeStore.ts` (신규) — **기존 `settingsStore.ts` 패턴을 그대로 따른다**
  ```ts
  // 저장 키: '@dreamteller/locale'
  // preference: 'system' | 'ko' | 'en'   (기본 'system')
  // resolved:   'ko' | 'en'              (파생값 — 실제 적용 언어)
  //
  // 'system'일 때 expo-localization의 기기 언어를 읽어 ko면 ko, 그 외 전부 en (결정 ③).
  // setPreference()는 (1) persist (2) i18n.changeLanguage() (3) 알림 재예약(Phase 7)을 모두 한다.
  ```
  - `hydrate()` — `settingsStore.hydrate()`와 동일하게 손상된 값이면 기본값 유지
  - ⚠️ **`setPreference()`의 알림 재예약은 Phase 7에서 추가**한다. 여기서는 TODO 주석만 남긴다

- [ ] `app/App.tsx` — 폰트 로딩(`useFonts`, `:72`)과 **같은 게이트**에서 `localeStore.hydrate()` 완료 후 렌더.
      먼저 렌더되면 첫 프레임이 한국어로 깜빡인다

- [ ] **검증**: 기기 언어를 ko / en / ja로 각각 바꿔 첫 실행 → ja가 en으로 뜨는지

---

### Phase 3 — 앱 UI 문자열 추출 (249줄 / 27파일)
> 커밋 4개로 분할. 한 커밋에 몰면 리뷰가 불가능하다.

문자열 원문과 영어 대응은 **§13 전체 인벤토리** 참조.

**커밋 3-1** `feat(i18n): 공통·네비게이션·인증 문자열 추출`

| 파일 | 줄 |
|------|-----|
| `services/authService.ts` | 15 |
| `screens/auth/LoginScreen.tsx` | 16 |
| `screens/auth/OtpVerifyScreen.tsx` | 10 |
| `screens/auth/SignupScreen.tsx` | 8 |
| `navigation/TabNavigator.tsx` | 5 |
| `services/api.ts` `services/supabase.ts` `components/ui/Toast.tsx` | 4 |

- ⚠️ `OtpVerifyScreen.tsx:105~108`은 §3-5 문장 조립 함정 — 문장 전체를 한 키로
- ⚠️ `supabase.ts:41`의 `'게스트'` / `'사용자'`는 **프로필에 표시되는 사용자 이름 폴백**이다. 주석 아님, 번역 대상

**커밋 3-2** `feat(i18n): 온보딩·홈·아카이브 문자열 추출`

| 파일 | 줄 |
|------|-----|
| `screens/onboarding/OnboardingScreen.tsx` | 17 |
| `screens/onboarding/WelcomeScreen.tsx` | 5 |
| `screens/home/HomeScreen.tsx` | 8 |
| `screens/archive/ArchiveScreen.tsx` | 7 |
| `screens/archive/CharacterDetailScreen.tsx` | 2 |

- ⚠️ 온보딩 3스텝은 **마케팅 카피**다. 직역하면 어색하다. §13-3의 영문 카피를 쓸 것

**커밋 3-3** `feat(i18n): 기록·인사이트 문자열 추출`

| 파일 | 줄 |
|------|-----|
| `screens/record/RecordChatScreen.tsx` | 10 |
| `screens/record/RecordSummaryScreen.tsx` | 10 |
| `screens/insights/InsightsScreen.tsx` | 12 |
| `hooks/useRecordSession.ts` `utils/sessionResume.ts` `constants/prompts.ts` | 11 |
| `constants/emotion.ts` | 4 |

**커밋 3-4** `feat(i18n): 해몽·설정 문자열 추출 + 언어 선택 UI`

| 파일 | 줄 |
|------|-----|
| `screens/interpret/InterpretScreen.tsx` | 37 |
| `screens/interpret/DreamCardScreen.tsx` | 17 |
| `screens/settings/SettingsScreen.tsx` | 39 |
| `components/dream/InterpretCard.tsx` `DreamCard.tsx` | 4 |

**이 커밋에 포함되는 신규 작업 3건:**

- [ ] **설정 언어 섹션 신설** — `SettingsScreen`의 `프로필` 섹션 아래, `알림` 섹션 위.
      기존 `LinkRow` 패턴 재사용. `시스템 설정 따름 / 한국어 / English` 3지 (결정 ③)
- [ ] **카드 2단 라벨 리네이밍** (결정 ⑦)
  - `components/dream/InterpretCard.tsx:20` `KIND_META`의 `{ index, en, ko }` → `{ index, keyword, subKey }`
  - `screens/interpret/DreamCardScreen.tsx:260~261` prop `labelEn` / `labelKo` → `labelKeyword` / `labelSub`
  - **`keyword`(SYMBOL/PSYCHOLOGY/UNCONSCIOUS)는 양 언어 공통** → 카드 높이·공유 이미지 레이아웃 불변
  - `sub`만 `t()`로 분기. 매핑은 §7-2
  - 스타일명 `labelEn`/`labelKo`(`InterpretCard.tsx:151,156`) → `labelKeyword`/`labelSub`도 함께
- [ ] **`InterpretScreen.tsx:116~122` 공유 텍스트 포맷** — `[상징 분석] {headline}` 형태의 대괄호 라벨.
      §7-2의 `sub` 문구를 재사용해 `[What it represents] {headline}`로

---

### Phase 4 — 날짜·숫자·복수형
> 커밋: `feat: 날짜/숫자/복수형 로케일 대응`

- [ ] `app/src/utils/date.ts`
  - `formatDateKoShort()` → `formatDateShort(iso, locale)` — `8월 20일` ↔ `Aug 20`
    (`Intl.DateTimeFormat` 사용 가능, §3-1)
  - `getGreeting()` — 시간대 4구간 인사말 로케일 분기 (§7-3)
  - `formatDateDot()`는 **수정 불필요** (§3-3)
- [ ] `screens/insights/InsightsScreen.tsx:27` — `{year}년 {month}월` → `August 2026`
      ⚠️ §3-5 어순 함정. `Intl.DateTimeFormat(locale, { year:'numeric', month:'long' })` 권장
- [ ] `screens/settings/SettingsScreen.tsx:52` — 12시간제 (§3-6).
      `오전 8:00` ↔ `8:00 AM`. `Intl.DateTimeFormat`으로 통일
- [ ] 복수형 처리 지점 (영어만 해당 — 한국어는 단복수 구분 없음)

  | 위치 | 현재 | 영어 키 |
  |------|------|--------|
  | `InsightsScreen.tsx:64` | `{streak}일` | `insights.streak_one` / `_other` → `{{count}} day(s)` |
  | `InterpretScreen.tsx:270` | `이번 달 {n}번 더` | `interpret.cta.remaining_one` / `_other` |
  | `InterpretScreen.tsx:354` | `한 달에 {n}번까지` | `interpret.limitModal.body_one` / `_other` |
  | `RecordChatScreen.tsx:181` | `{filled}/{total} 담김` | `record.progress` (보간만) |
  | `RecordChatScreen.tsx:173` | 접근성 `꿈 정보 N개 담김` | `record.a11y.progress` |
  | `OtpVerifyScreen.tsx:170` | `재발송하기 ({cooldown}s)` | `auth.otp.resendCooldown` (보간만) |

- [ ] ⚠️ **실기기에서 `Intl.PluralRules` 폴리필 동작 검증** (`1 day` vs `2 days`). 시뮬레이터만으로 판단 금지

---

### Phase 5 — 서버 언어 전파 (핵심)
> 커밋 2개: `(5-1) feat(server): Accept-Language 로케일 분기` / `(5-2) feat(server): 영어 프롬프트 추가`

**5-1. 언어 전달 경로**

- [ ] 앱 `app/src/services/api.ts` — 기존 `Authorization` 인터셉터(`:88`)와 **같은 자리**에 첨부.
      한 곳만 고치면 전 엔드포인트가 커버된다
  ```ts
  api.interceptors.request.use(async (request) => {
    const token = await tokenStorage.getAccessToken();
    if (token) request.headers.Authorization = `Bearer ${token}`;
    request.headers['Accept-Language'] = useLocaleStore.getState().resolved;
    return request;
  });
  ```
- [ ] 서버 `server/app/deps/locale.py` (신규)
  ```python
  from typing import Literal
  from fastapi import Header

  Locale = Literal["ko", "en"]

  def get_locale(accept_language: str | None = Header(default=None)) -> Locale:
      """스토어 라이브 구버전 앱은 이 헤더를 보내지 않는다.
      헤더가 없거나 해석 불가하면 반드시 'ko'로 폴백해야 기존 사용자가 깨지지 않는다.
      (I18N_PLAN §2-1, PROMPT_GUIDE §하위 호환)
      """
      if not accept_language:
          return "ko"
      return "en" if accept_language.strip().lower().startswith("en") else "ko"
  ```
- [ ] `routes/interpret.py`, `routes/dreams.py`에 `locale: Locale = Depends(get_locale)` 주입
- [ ] `docs/API.md` — 공통 요청 헤더 섹션에 `Accept-Language` 추가. **기본값 `ko` 명시**

**5-2. 프롬프트 이중화** — `server/app/services/gemini_service.py` (현재 612줄)

- [ ] **선행: `server/app/services/prompts.py`로 프롬프트 텍스트를 분리한다.**
      프롬프트가 2배로 늘어나므로 분리 없이는 파일이 관리 불가능해진다.
      `gemini_service.py`에는 호출 로직만 남긴다
- [ ] 각 프롬프트를 `dict[Locale, str]`로 전환. **영어 전문은 §12**

  | 대상 | 현재 위치 |
  |------|----------|
  | `LUNA_SYSTEM_PROMPT` | `:81` |
  | `FINAL_TURN_INSTRUCTION` | `:118` |
  | `INTERPRET_SYSTEM_PROMPT` | `:211` |
  | `INTERPRET_USER_TEMPLATE` | `:223` |
  | `TITLE_SYSTEM_PROMPT` + 유저 프롬프트 | `:315`, `:341` |
  | `SUMMARY_SYSTEM_PROMPT` | `:375` |
  | `SUMMARY_USER_TEMPLATE` | `:381` |

- [ ] **한국어 고정 상수도 이중화** — 프롬프트만 보고 지나치기 쉽다

  | 상수 | 위치 | 사용처 | 영어 |
  |------|------|--------|------|
  | `UNKNOWN_SLOT_VALUE` | `:70` | `:600` | `don't remember` |
  | `SLOT_FALLBACK_QUESTIONS` (4개) | `:73` | `:610` | §7-4 |
  | `COMPLETE_FALLBACK_REPLY` | `:79` | `:607` | §7-4 |
  | `generate_title` 폴백 `"제목 없는 꿈"` | `:328` | — | `Untitled dream` |
  | 앱 `OPENING_QUESTION` | `app/src/constants/prompts.ts:9` | — | §7-4 |

- [ ] 함수 시그니처에 `locale` 인자 추가
  - `_system_for_turn()` `:128`
  - `generate_title()` `:325`
  - `generate_summary()` `:434`
  - `generate_interpretation()` `:502`
  - `chat_turn()` `:546`
- [ ] **`docs/PROMPT_GUIDE.md`에 영어 프롬프트 전문을 이관 기재** (CLAUDE.md 규칙 3)

**5-3. 서버 에러 메시지**
- [ ] `server/app/main.py:57` `INTERNAL_ERROR` 문구만 로케일 분기 (§4-3)
- [ ] 나머지는 앱 `errors` 네임스페이스에서 코드→문구 매핑

**5-4. 배포**
- [ ] 서버를 **앱보다 먼저** 배포해도 안전 (§2-1)
- [ ] 배포 직후 **구버전 앱(스토어 라이브)으로 한국어 응답 회귀 확인** — 이게 하위 호환의 실증이다
- [ ] **Gemini 영어 토큰 사용량 실측** → 월 예상 비용이 ₩15,000 캡 내인지 (§2-3)

---

### Phase 6 — 데이터 언어 태깅
> 커밋: `feat: 꿈 기록에 생성 언어 태깅 (migration 003)`

**문제**: `dreams.title` / `raw_content` / `interpretations.*`는 생성 시점 언어로 DB에 고정된다.
언어를 바꿔도 과거 기록은 원래 언어 그대로다.

**방침** (결정 ④): 사용자 원문이므로 **소급 번역하지 않는다.** 대신 언어를 기록해 일관성을 지킨다.

- [ ] `server/migrations/003_dream_language.sql` (신규)
  ```sql
  -- DreamTeller — dreams에 생성 언어 태깅
  -- Apply via Supabase Dashboard → SQL Editor → New query → paste → Run.
  -- Idempotent: safe to re-run.
  --
  -- 기존 행은 전부 한국어로 생성됐다 → default 'ko'가 정확한 소급 처리다.
  alter table public.dreams
    add column if not exists language text not null default 'ko'
    check (language in ('ko', 'en'));
  ```
- [ ] `POST /dreams` (`routes/dreams.py:31`) — 요청 로케일을 `language`에 저장
- [ ] ⚠️ **생성 계열 API는 요청 헤더가 아니라 해당 `dream.language`를 따른다** (결정 ④)
  - `POST /interpret/generate` (`interpret.py:106`)
  - `POST /dreams/{id}/summary` (`dreams.py:131`)
  - 제목 생성
  - 한국어 원문에 영어 해몽을 붙이면 품질이 무너진다
  - **예외**: `POST /interpret/chat`은 새 기록을 만드는 중이므로 **요청 헤더**를 따른다
- [ ] `GET /dreams`·`GET /dreams/{id}` 응답에 `language` 포함
- [ ] 앱: 현재 UI 언어와 다른 기록에 작은 언어 배지 표시
  - `screens/archive/ArchiveScreen.tsx` 목록
  - `screens/home/HomeScreen.tsx` 최근 꿈
- [ ] `docs/ARCHITECTURE.md` 데이터 모델 + `docs/API.md` 응답 스키마 갱신
- [ ] ⚠️ **마이그레이션은 사용자가 Supabase Dashboard에서 직접 실행** (§2-7)

---

### Phase 7 — 앱 외부 자산 (네이티브 빌드 필요)
> 커밋: `feat: 알림/권한 문구 로케일 대응 + 1.2.0`

- [ ] **로컬 알림 재예약** `app/src/services/notificationService.ts`
      ⚠️ `expo-notifications` 예약은 **예약 시점의 문구가 OS에 박힌다.**
      언어를 바꿔도 이미 예약된 알림은 옛 언어로 뜬다.
      → `localeStore.setPreference()`에서 `settingsStore`의 `{enabled, hour, minute}`을 읽어
        `enabled`면 `scheduleDailyReminder()`를 **재호출**한다. (Phase 2에서 남긴 TODO를 여기서 해소)

  | 상수 | 위치 | 한국어 | 영어 |
  |------|------|--------|------|
  | `REMINDER_TITLE` | `:12` | 간밤의 꿈, 기억나세요? | Remember last night's dream? |
  | `REMINDER_BODY` | `:13` | 사라지기 전에 지금 기록해보세요 | Write it down before it fades. |
  | 채널명 | `:34` | 아침 꿈 알림 | Morning dream reminder |

- [ ] **iOS 권한 문구** — `app/app.json`의 `expo-media-library` 플러그인
      (`photosPermission` / `savePhotosPermission`, 현재 한국어 하드코딩)
      → Expo `expo.locales` 필드로 `InfoPlist.strings` 로컬라이제이션
  ```jsonc
  "locales": { "ko": "./locales/ko.json", "en": "./locales/en.json" }
  ```
- [ ] **`CFBundleLocalizations`** — 앱이 영어 지원으로 인식되도록 `app.json`에서 설정
      ⚠️ `app/ios/DreamTeller.xcodeproj`(현재 `knownRegions = (en, Base)`)는 `app/.gitignore:42`로 제외된
      **prebuild 생성물이라 직접 수정은 무의미하다.** 반드시 `app.json`으로 잡을 것
- [ ] `app/app.json` `version` → `1.2.0`
- [ ] **EAS 빌드 1회** (§2-2 — 여기까지 모아서 한 번에)

---

### Phase 8 — 웹 & 스토어
> 커밋: `docs/web: 영어 랜딩 + 스토어 영문 메타데이터`

- [ ] `web/index.html` — 영문 랜딩. 현재 `<html lang="ko">`
      → `/en/index.html` 분리 + 상호 링크. **한 파일에 몰지 말고 컴포넌트화 기준 유지**
- [ ] `web/privacy.html` / `terms.html` — **영문 초안 작성 → 사용자 검토 → 반영** (결정 ⑩)
      ⚠️ 법적 효력 문구를 임의 확정하지 않는다.
      **스토어 영어 로케일 추가 전에 완료되어야 하는 선행 조건**
- [ ] `app-store/screenshots/*.html` — 캡션만 영문 교체 후 `build.sh` / `build-ipad.sh` 재실행
      (템플릿이 HTML 기반이라 재활용 가능)
- [ ] `docs/appstore/METADATA.md` 갱신
      ⚠️ `:13` 기본 언어 한국어, **`:140` "This app is a Korean-language service." — 반드시 수정.**
      심사 답변에 그대로 재사용되면 모순이 된다
- [ ] App Store Connect 영어(U.S.) 로케일 추가 — 이름/부제/설명/키워드/스크린샷 별도 세트
      ⚠️ **ASC 콘솔 작업은 사용자가 직접.** 문서는 입력값만 제공 (§2-7)
- [ ] ⚠️ **제출 전 `docs/appstore/REVIEW_PLAYBOOK.md` 정독** — 반려 이력 기반 사전 점검

---

## 6. 영어 프롬프트 사양

### 6-1. Luna 톤 (결정 ⑧)
한국어 Luna는 **의도적 반말 친구 톤**이다. 영어엔 존댓말/반말 축이 없으므로 다음으로 재현한다.

**해야 할 것**
- 축약형 (`What'd` `don't` `that's` `we've`)
- 구어체 반응어 (`Ooh` `Got it` `That's okay`)
- 짧은 문장. 한 턴에 질문 하나

**하지 말 것**
- 격식체: `Would you like to…` / `perfectly alright` / `Please share…` / `I would be happy to…`
- 이모지 (한국어판과 동일 규칙)
- 상담사/치료사 말투

**목표 감각**: *처음 만난 상담사가 아니라, 아침에 옆에서 커피 마시는 친구*

```
Luna: What'd you dream about last night?
      Just tell me whatever you remember.
User: I was in some kind of old house
Luna: Ooh, an old house. Who else was there with you?
User: I don't remember
Luna: That's okay. How did it make you feel?
```

### 6-2. 출력 길이 환산표 (결정 ⑥)
**한글 1자 ≈ 영어 2.5자**로 환산. 그대로 번역하면 영어판 결과물이 반토막 나 카드가 비어 보인다.

| 필드 | 한국어 (현재) | 영어 (신규 기준) |
|------|--------------|-----------------|
| 제목 | 5~15자 | **3~7 words (≤40 chars)** |
| `headline` | 20~40자 | **8~16 words (50~100 chars)** |
| `keySymbols.symbol` | 2~6자 | **1~3 words** |
| `keySymbols.meaning` | 15~30자 | **50~95 chars** (문화 맥락 포함분 반영, §6-3) |
| `detail` | 180~260자 | **450~650 chars** |
| `affirmation` | 20~40자 | **50~100 chars** |
| `perspective` 라벨 | `융 심리학` 등 | `Jungian psychology` / `Modern therapy` / `Inner exploration` |
| `summary` (줄거리) | **제한 없음** | **제한 없음** — 지시문만 번역 (§3-3) |

⚠️ 이 수치는 추정 환산값이다. **Phase 5 완료 후 실제 출력을 재서 조정**한다 (§8).

### 6-3. 한국 전통 해몽의 문화 맥락 (결정 ②⑤)
영어 `INTERPRET_USER_TEMPLATE`에 다음 지시를 넣는다:

> When a symbol carries meaning specific to Korean dream tradition, name that tradition inline
> within `meaning` — e.g. *"A pig — in Korean dream tradition, a sign of incoming wealth."*
> Never present a culture-specific reading as a universal fact.

- **필드 신설 없음.** `keySymbols.meaning` 안에서 처리 → `interpretations.payload`(JSONB) 구조 불변
- 한국어판은 기존과 동일 (한국 사용자에겐 설명이 불필요)
- **이유**: 설명 없이 `"A pig means wealth"`만 나오면 영어권 사용자에게 근거 없는 단정으로 읽혀
  차별화 의도가 죽는다. 출처를 밝히면 같은 문장이 **문화적 통찰**이 된다

---

## 7. 주요 문자열 대응표

번역 시 판단이 갈릴 만한 것만 미리 확정. 전체 인벤토리는 §13.

### 7-1. 탭 라벨 (`navigation/TabNavigator.tsx:52~66`)
| 한국어 | 영어 | 대체안 (잘릴 경우) |
|--------|------|------------------|
| 홈 | Home | — |
| 기록 | Record | — |
| 해몽 | Interpret | Meaning |
| 아카이브 | Archive | Dreams |
| 분석 | Insights | Stats |

⚠️ 한국어 2~3자 → 영어 6~9자. **iPhone SE(375pt) 5탭에서 잘림 검증 필수** (§8).

### 7-2. 해몽 카드 2단 라벨 (결정 ⑦)
| index | keyword (**양 언어 공통**) | ko sub | en sub |
|-------|--------------------------|--------|--------|
| 01 | `SYMBOL` | 상징 분석 | What it represents |
| 02 | `PSYCHOLOGY` | 심리적 의미 | Your inner world |
| 03 | `UNCONSCIOUS` | 무의식 메시지 | The message beneath |

적용처: `components/dream/InterpretCard.tsx:20` (`KIND_META`),
`screens/interpret/DreamCardScreen.tsx:178~199` (`CaptureSection`),
`screens/interpret/InterpretScreen.tsx:116~122` (공유 텍스트 `[라벨] headline`)

### 7-3. 시간대 인사말 (`utils/date.ts:20` `getGreeting()`)
| 구간 | 한국어 | 영어 | emoji |
|------|--------|------|-------|
| 05–12 | 좋은 아침이에요 | Good morning | ☀️ |
| 12–18 | 좋은 오후예요 | Good afternoon | 🌤️ |
| 18–22 | 좋은 저녁이에요 | Good evening | 🌆 |
| 22–05 | 좋은 밤이에요 | Good night | 🌙 |

### 7-4. Luna 대화 고정 문구
| 대상 | 위치 | 한국어 | 영어 |
|------|------|--------|------|
| `OPENING_QUESTION` | `app/src/constants/prompts.ts:9` | 어젯밤 어떤 꿈을 꿨어? 기억나는 대로 편하게 말해줘 | What'd you dream about last night? Just tell me whatever you remember. |
| `place` | `gemini_service.py:74` | 그 꿈은 어디에서 일어났어? | Where did the dream take place? |
| `people` | `:75` | 그 자리에 누가 있었어? 혼자였다면 혼자라고 말해줘도 괜찮아 | Who else was there? It's fine to say you were alone. |
| `event` | `:76` | 거기서 어떤 일이 있었어? | What happened there? |
| `emotion` | `:77` | 그때 기분은 어땠어? | How did it make you feel? |
| `COMPLETE_FALLBACK_REPLY` | `:79` | 이 정도면 꿈을 잘 담은 것 같아. 정리해볼게 | I think we've got your dream. Let me put it together. |
| `UNKNOWN_SLOT_VALUE` | `:70` | 기억나지 않음 | don't remember |

### 7-5. 감정 라벨 (`constants/emotion.ts`)
키가 enum이라 DB 변경 불필요 (§3-3). emoji·color는 그대로.

| 키 | 한국어 | 영어 |
|----|--------|------|
| `POSITIVE` | 긍정 | Positive |
| `NEGATIVE` | 부정 | Negative |
| `NEUTRAL` | 중립 | Neutral |
| `MIXED` | 복합 | Mixed |

---

## 8. QA 체크리스트

**기반**
- [ ] 기기 언어 ko / en / ja 각각 첫 실행 → **ja는 en 폴백**
- [ ] 설정에서 `시스템 / 한국어 / English` 전환 즉시 반영
- [ ] 앱 재시작 후 선택 유지
- [ ] `시스템` 선택 상태에서 기기 언어를 바꾸면 앱이 따라오는지

**레이아웃**
- [ ] ⚠️ **탭바 5개 라벨 잘림** — iPhone SE(375pt) **실기기** (§7-1). 잘리면 대체안 적용
- [ ] 버튼 라벨 줄바꿈 — `로그인 / 회원가입` → `Log in / Sign up`, `로그인 없이 둘러보기` → `Continue as guest`
- [ ] 해몽 카드 `headline` 2줄 초과 여부
- [ ] **DreamCard 공유 이미지** (고정 비율 `react-native-view-shot` 캡처) 텍스트 넘침
- [ ] 온보딩 3스텝 `points` 리스트 줄바꿈
- [ ] 설정 화면 `LinkRow` 라벨 (`개인정보처리방침` → `Privacy Policy`)

**기능**
- [ ] **Phase 1 회귀**: Google / Apple 로그인 취소 시 에러 토스트 안 뜸 (양쪽 언어)
- [ ] `Intl.PluralRules` 폴리필 실기기 동작 (`1 day` vs `2 days`)
- [ ] **언어 변경 후 아침 알림이 새 언어로 재예약** (실기기. 알림 시각을 임시로 몇 분 뒤로 바꿔 확인)
- [ ] **한국어로 기록한 과거 꿈 → 영어 UI에서 해몽 받기 → 한국어 해몽이 나오는가** (결정 ④)
- [ ] 영어로 기록한 꿈 → 한국어 UI 조회 → 영어 원문 유지 + 언어 배지 표시
- [ ] 사진 저장 권한 다이얼로그가 영어로 뜨는지 (Phase 7, 실기기 최초 1회만 확인 가능)

**하위 호환** ⚠️
- [ ] **스토어 라이브 구버전 앱이 새 서버에서 정상 동작** — `Accept-Language` 미전송 시 한국어 응답
- [ ] `POST /interpret/chat`의 `text` / `nextStep` / `complete` 필드 유지 확인

**AI 품질**
- [ ] 영어 해몽에 한국 전통 상징의 **문화 맥락이 인라인으로** 붙는가 (§6-3)
- [ ] 영어 Luna가 격식체로 흐르지 않는가 (§6-1 금지 목록)
- [ ] 영어 출력 길이가 §6-2 기준 내인가 → **실측 후 프롬프트 조정**
- [ ] 영어 대화에서 슬롯이 정상적으로 채워지고 5턴 안에 종료되는가
- [ ] **Gemini 토큰 사용량 실측** → 영어 요청 기준 월 예상 비용이 **₩15,000 캡** 내인지

---

## 9. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| `Intl.PluralRules` 부재 | 영어 복수형 깨짐 | 폴리필 필수 (§3-1, Phase 2) |
| 알림 재예약 누락 | 언어 바꿔도 옛 언어 알림 | Phase 7 첫 항목 |
| 문장 조립 어순 | 영어 문장이 뒤죽박죽 | §3-5 — 문장 단위 키 규칙 |
| 탭 라벨 잘림 | 5탭 UI 붕괴 | §7-1 대체안 준비 |
| 영어 출력 길이 미스매치 | 카드 레이아웃 붕괴 | §6-2 기준 + QA 실측 조정 |
| 문화 맥락 누락 | 근거 없는 해석으로 읽힘 | §6-3 프롬프트 지시 |
| 구버전 앱 파손 | **라이브 사용자 장애** | 헤더 부재 시 `ko` 폴백 (§2-1) + Phase 5-4 회귀 확인 |
| Gemini 비용 초과 | 서비스 중단 | Phase 5 후 실측 + 예산 알림 설정 |
| EAS 빌드 한도 | 배포 지연 | 네이티브 변경 모아서 1회 (§2-2) |
| 영문 약관 미비 | 심사 5.1.1 지적 | Phase 8 선행 조건 (결정 ⑩) |
| `METADATA.md:140` 문구 잔존 | 심사 답변 모순 | Phase 8에서 반드시 수정 |
| `gemini_service.py` 비대화 | 유지보수 불가 | Phase 5-2 `prompts.py` 선행 분리 |

---

## 10. 완료 기준 (DoD)

1. 기기 언어가 영어인 신규 사용자가 **설치부터 해몽 카드 공유까지 한국어를 한 글자도 보지 않는다**
2. 설정에서 언어를 바꾸면 **UI · AI 응답 · 로컬 알림**이 모두 따라온다
3. 기존 한국어 사용자의 경험과 데이터가 **전혀 변하지 않는다**
4. 스토어 라이브 구버전 앱이 **정상 동작한다**
5. 한국어로 기록한 꿈은 UI 언어와 무관하게 **한국어 해몽을 받는다**
6. 영어 해몽에 **한국 전통 해몽의 문화적 출처가 명시**된다
7. 영어 요청 기준 Gemini 월 예상 비용이 **₩15,000 캡 내**임이 실측으로 확인된다

---
---

# 부록

## 11. 재조사 명령 모음

**이 문서의 줄번호는 2026-08-20 기준이다.** 착수 시 아래를 돌려 현재 상태를 다시 확인한다.
(모든 명령은 `dreamteller/` 기준)

### 11-1. 앱 UI 한글 문자열 전수 (주석 제외)
```bash
cd app/src
# 총 개수
grep -rnP "[가-힣]" . --include="*.ts" --include="*.tsx" \
  | grep -vP ':\s*(//|\*|/\*)' | wc -l

# 파일별 개수 (많은 순)
for f in $(grep -rlP "[가-힣]" . --include="*.ts" --include="*.tsx"); do
  n=$(grep -nP "[가-힣]" "$f" | grep -vP ':\s*(//|\*|/\*)' | wc -l | tr -d ' ')
  [ "$n" != "0" ] && echo "$n $f"
done | sort -rn
```
2026-08-20 기준 결과: **249줄 / 27파일**

### 11-2. 번역하면 깨지는 로직 (§3-4) 재확인
```bash
# 앱 — 한글 문자열을 값으로 비교하는 곳
cd app/src && grep -rnP "(===|!==|\.includes\(|\.startsWith\(|== )\s*['\"\`][^'\"\`]*[가-힣]" \
  . --include="*.ts" --include="*.tsx" | grep -vP ':\s*(//|\*)'

# 서버 — 동일 패턴 (2026-08-20 기준 0건)
cd server && grep -rnP "(==|!=|\.startswith\()\s*[\"'][^\"']*[가-힣]" app --include="*.py" | grep -vP ':\s*#'
```

### 11-3. 문장 조립 함정 (§3-5) 재확인
```bash
cd app/src && grep -rnP '\$\{[^}]*\}[^`]*[가-힣]|[가-힣][^`]*\$\{' \
  . --include="*.ts" --include="*.tsx" | grep -vP ':\s*(//|\*)'
```

### 11-4. Hermes Intl 지원 범위 (§3-1) 재확인
```bash
F=$(find app/ios/Pods/hermes-engine -path "*ios-arm64/hermes.framework/hermes" -type f | head -1)
for s in PluralRules RelativeTimeFormat ListFormat Segmenter DisplayNames \
         Collator DateTimeFormat NumberFormat; do
  echo "$s: $(strings "$F" | grep -c "$s")"
done
```
2026-08-20 기준: `PluralRules: 0` ← **폴리필 필요 근거**

### 11-5. 서버 프롬프트 / 한국어 고정 상수 위치
```bash
cd server
grep -nE "^[A-Z_]+ *(:.*)?= *\"\"\"|^[A-Z_]+ *= *\{|^[A-Z_]+ *= *\"" app/services/gemini_service.py
grep -nP "한국어|응답 언어|언어:" app/services/gemini_service.py
```

### 11-6. 서버 사용자 노출 문자열 (§4-3)
```bash
cd server
grep -rnP "[가-힣]" app --include="*.py" | grep -vP ':\s*#'   # 주석 외에 남는 것이 번역 대상
grep -rn "detail=" app/routes app/deps                        # 영문 코드 목록
```

### 11-7. 웹 / 스토어
```bash
grep -rn "lang=" web --include="*.html"
grep -rniE "언어|language|Korean" docs/appstore/METADATA.md
```

---

## 12. 영어 프롬프트 전문 (초안)

**Phase 5-2에서 `docs/PROMPT_GUIDE.md`로 이관**한 뒤 구현한다 (CLAUDE.md 규칙 3).
한국어 원문의 구조·규칙 번호를 그대로 유지해 대조가 쉽도록 했다.
길이 기준은 §6-2, 톤 기준은 §6-1, 문화 맥락 규칙은 §6-3에서 온 것이다.

### 12-1. `LUNA_SYSTEM_PROMPT["en"]`
```
You are 'Luna', DreamTeller's dream journaling companion.

Your role:
- Help the user talk through the dream they remember this morning, in a relaxed conversation.
- Speak like a close friend, not a professional. Use contractions and everyday words.
  Never sound like a therapist or a customer service agent.
- Do not use emoji or emoticons. Keep the sentences plain and clean.

Information to collect (slots) — the conversation ends when all four are filled:
- place: where the dream took place
- people: who appeared ('alone' is a valid answer)
- event: the central thing that happened
- emotion: how the dream felt

Conversation rules:
1. On every turn, re-read the whole conversation and judge whether each slot is already filled.
   If the user filled several slots in one answer, accept all of them.
2. Never ask again about a slot that is already filled.
   Asking the user to repeat what they just said is the worst possible experience.
3. Pick exactly one empty slot and ask about it. One question per turn.
4. If the user says "I don't remember" or "I'm not sure", treat that slot as filled
   with "don't remember" and do not ask again.
5. When every slot is filled, close warmly and briefly without asking anything new.

Response language: English

Respond only in the following JSON format:
{
  "reply": "the sentence shown to the user (one question about an empty slot, or a closing line)",
  "slots": {
    "place": "a short summary if filled, null if not",
    "people": "a short summary if filled, null if not",
    "event": "a short summary if filled, null if not",
    "emotion": "a short summary if filled, null if not"
  },
  "complete": false
}
```

### 12-2. `FINAL_TURN_INSTRUCTION["en"]`
```
[IMPORTANT] This is the final turn. Do not ask anything else even if slots remain empty.
Fill any empty slot with "don't remember", set complete to true,
and close warmly and briefly.
```

### 12-3. `INTERPRET_SYSTEM_PROMPT["en"]`
```
You are a dream interpretation specialist.
Interpret dreams by combining Korean traditional dream reading (haemong),
Jungian psychology, and modern psychotherapy.

Principles:
- Never be absolute, and never induce anxiety.
- Read even negative dreams as signals of growth and inner exploration.
- Explain technical terms in plain, everyday language.
- Write in a warm second person, speaking directly to the reader as "you".
- When a symbol carries meaning specific to Korean dream tradition, name that
  tradition inline rather than stating it as a universal fact.

Language: English
```

### 12-4. `INTERPRET_USER_TEMPLATE["en"]`
```
Interpret the following dream from three perspectives:

Dream:
{dream_content}

Respond in JSON. All text in English. Follow the format exactly.
{{
  "symbolAnalysis": {{
    "headline": "one-line summary (8~16 words). Used as the card headline.",
    "keySymbols": [
      {{"symbol": "a key symbol from the dream (1~3 words)",
        "meaning": "what it means (50~95 characters)"}}
    ],
    "detail": "the symbolic meaning of the places, people and objects in the dream,
               written gently (450~650 characters, warm second person)."
  }},
  "psychologicalMeaning": {{
    "headline": "one-line summary (8~16 words).",
    "perspective": "one perspective label (e.g. 'Jungian psychology', 'Modern therapy',
                    'Inner exploration' — whichever fits).",
    "detail": "interpretation from Jungian psychology / modern psychotherapy
               (450~650 characters; explain concepts like the unconscious, the shadow,
               and the Self in plain words)."
  }},
  "unconsciousMessage": {{
    "headline": "one-line summary (8~16 words).",
    "detail": "the message this dream carries for you (450~650 characters,
               connected warmly to your current situation and feelings).",
    "affirmation": "one sentence to hold on to today (50~100 characters, encouraging)."
  }}
}}

Requirements:
- keySymbols must contain 2~4 entries. Neither symbol nor meaning may be an empty string.
- When a symbol's reading comes from Korean dream tradition, say so inline —
  e.g. "A pig — in Korean dream tradition, a sign of incoming wealth."
  Never present a culture-specific reading as a universal fact.
- headline and affirmation do not need to end with a period. Do not use emoji.
- detail must be one natural paragraph with no line breaks.
```

### 12-5. `TITLE_SYSTEM_PROMPT["en"]` + 유저 프롬프트
```
You name dream journal entries with a short title.

Rules:
- English, 3~7 words, mostly a noun phrase.
- No periods, question marks, exclamation marks, emoji, quotes, or prefixes.
- Output one line only (no explanation).

Good examples: "The lake in the dark forest", "Flying above the clouds",
"A meeting on an unfamiliar street", "The lost key".
```
유저 프롬프트 (`gemini_service.py:341` 대응):
```
Give this dream a short English title of 3~7 words.

{snippet}

Title only, one line.
```
폴백 (`:328`): `"Untitled dream"`

### 12-6. `SUMMARY_SYSTEM_PROMPT["en"]`
```
You are an editor who tidies up dream journals.
Read the conversation the user had and write the dream up as natural English prose.

Language: English
```

### 12-7. `SUMMARY_USER_TEMPLATE["en"]`
```
Below is a conversation in which the user recorded a dream.
Based on it, write the dream journal entry as natural English prose.

Requirements:
- First person ("I was ...")
- Tense: past
- Include every place, person, event and emotion mentioned in the conversation
- Do not add or invent anything that was not mentioned
- If the user said they don't remember something, pass over it naturally
  rather than pointing it out
- Exclude the assistant's questions. Use only what the user said about the dream
- There is no length requirement. Short dreams stay short, long dreams run long —
  write only as much as the conversation holds.
  Inventing content to hit a length is the worst possible outcome.
- Start a new paragraph when the scene changes or time moves. Separate paragraphs
  with a single blank line. Do not force a paragraph count — a short dream is
  naturally a single paragraph.

Conversation:
{chat_history}

Respond in JSON:
{{
  "summary": "the dream narrative text"
}}
```

---

## 13. 앱 UI 문자열 전체 인벤토리

2026-08-20 기준 **27파일 / 249줄** 전수. 영어는 초안이며 구현 중 UI 맥락을 보고 다듬어도 된다.
줄번호는 §11-1로 재확인할 것.

**톤 원칙**: 한국어판은 `~어요/~해요` 체의 부드러운 존댓말이다.
영어는 존댓말 축이 없으므로 **간결하고 따뜻한 평서문**으로 옮긴다.
사과조 남발(`Sorry, we couldn't…`) 금지 — `Couldn't …` 정도로 담백하게.

### 13-1. `common` — 공통 액션
| 한국어 | 영어 | 등장 위치 |
|--------|------|----------|
| 취소 | Cancel | `SettingsScreen:65,94,133,140` |
| 확인 | OK | `RecordChatScreen:93`, `InterpretScreen:361` |
| 다시 시도 | Try again | `ArchiveScreen:38`, `InsightsScreen:42`, `InterpretScreen:235,286` |
| 뒤로 (a11y) | Back | `SettingsScreen:170`, `DreamCardScreen:130`, `InterpretScreen:161`, `RecordSummaryScreen:143` |
| 삭제 | Delete | `SettingsScreen:135` |
| 다음 | Next | `OnboardingScreen:219` |
| 건너뛰기 | Skip | `OnboardingScreen:167,169` |
| 공유하기 | Share | `InterpretScreen:332`, `DreamCardScreen:243` |
| 로그아웃 | Log out | `SettingsScreen:93,96,269` |

### 13-2. `auth` — 인증
**`LoginScreen.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 63 | 로그인에 실패했어요 | Couldn't log you in |
| 76 | Google 로그인에 실패했어요 | Google sign-in failed |
| 91 | Apple 로그인에 실패했어요 | Apple sign-in failed |
| 105 | 게스트로 시작하지 못했어요 | Couldn't start as a guest |
| 119 | 로그인 | Log in |
| 120 | 이메일로 시작해요 | Start with your email |
| 128 | 이메일 | Email |
| 139 | 비밀번호 (6자 이상) | Password (6+ characters) |
| 150 | 로그인 | Log in |
| 162 | 또는 | or |
| 196 | Google로 계속하기 | Continue with Google |
| 202 | 회원가입 | Sign up |
| 210 | 로그인 없이 둘러보기 | Continue as guest |

**`SignupScreen.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 56 | 회원가입에 실패했어요 | Couldn't create your account |
| 71 | 회원가입 | Sign up |
| 72 | 꿈을 함께 풀어가요 | Let's unravel your dreams together |
| 80 | 이름 | Name |
| 89 | 이메일 | Email |
| 100 | 비밀번호 (6자 이상) | Password (6+ characters) |
| 111 | 가입하기 | Create account |
| 121 | 이미 계정이 있어요 | I already have an account |

**`OtpVerifyScreen.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 68 | 인증에 실패했어요 | Verification failed |
| 81 | 인증 코드를 다시 보냈어요 | We sent a new code |
| 84 | 재발송에 실패했어요 | Couldn't resend the code |
| 105 | 이메일 인증 | Verify your email |
| 108 ⚠️ | `{email}`\n로 보낸 6자리 코드를 입력해주세요 | Enter the 6-digit code we sent to **{{email}}** — §3-5 **문장 통째로 한 키** |
| 115 | 인증하고 있어요... | Verifying… |
| 158 | 인증하기 | Verify |
| 170 | 재발송하기 (`{cooldown}`s) / 재발송 중... | Resend ({{cooldown}}s) / Resending… |
| 174 | 인증 코드 다시 받기 | Send a new code |
| 184 | 이메일 다시 입력하기 | Use a different email |

**`services/authService.ts`** — 전부 `throw new Error()` 메시지
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 41 | 로그인에 실패했어요 | Couldn't log you in |
| 61 | 회원가입에 실패했어요 | Couldn't create your account |
| 80 | 인증 코드가 올바르지 않아요 | That code isn't right |
| 92 | 인증 코드 재발송에 실패했어요 | Couldn't resend the code |
| 111 | Google 로그인 URL을 받지 못했어요 | Couldn't get the Google sign-in link |
| **116** | 로그인을 취소했어요 | **Phase 1에서 `AuthCancelledError`로 대체 → 문자열 자체가 사라진다** |
| 119 | Google 로그인에 실패했어요 | Google sign-in failed |
| 132 | Google 로그인 토큰을 받지 못했어요 | Couldn't get the Google sign-in token |
| 140 | Google 세션을 저장하지 못했어요 | Couldn't save your Google session |
| **179** | 로그인을 취소했어요 | **Phase 1에서 대체** |
| 181, 200 | Apple 로그인에 실패했어요 | Apple sign-in failed |
| 185 | Apple 인증 토큰을 받지 못했어요 | Couldn't get the Apple identity token |
| 219 | 게스트로 시작하지 못했어요 | Couldn't start as a guest |
| 230 | 로그아웃에 실패했어요 | Couldn't log you out |

### 13-3. `onboarding` — ⚠️ 마케팅 카피 (직역 금지)
**`WelcomeScreen.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 28 | 게스트로 시작하지 못했어요 | Couldn't start as a guest |
| 39 | 대화하며 기록하는 꿈 | Dreams, remembered through conversation |
| 44 | 둘러보기 | Look around |
| 53 | 로그인 / 회원가입 | Log in / Sign up |
| 60 | 앱 소개 보기 | See how it works |

**`OnboardingScreen.tsx`** — 3스텝
| 줄 | 필드 | 한국어 | 영어 |
|----|------|--------|------|
| 42 | kicker | STEP 01 · 기록 | STEP 01 · RECORD |
| 43 | title | 대화하듯, 꿈을 기록해요 | Record your dream like a conversation |
| 44 | body | 빈 화면에 막막하게 적지 않아도 돼요. AI가 건네는 질문에 답하다 보면 흐릿했던 꿈이 한 편의 이야기로 정리돼요. | You don't have to face a blank page. Answer a few questions and the blurry dream turns into a story. |
| 45 | points | 짧은 5단계 대화로 진행 / 떠오르는 대로 편하게 답하기 / 어젯밤 꿈이 또렷한 기록으로 | A short five-step conversation / Answer however it comes to you / Last night's dream, clearly written down |
| 48 | kicker | STEP 02 · 해몽 | STEP 02 · INTERPRET |
| 49 | title | 꿈에 숨은 의미를 풀어드려요 | Unfold the meaning hidden in your dream |
| 50 | body | 기록한 꿈을 세 가지 관점으로 깊이 있게 해석해, 단순한 꿈풀이를 넘어 오늘의 나를 돌아보게 해요. | Three perspectives read your dream in depth — not just what it means, but what it says about you today. |
| 51 | points | 상징 분석 / 심리학적 의미 / 무의식의 메시지 | Symbol analysis / Psychological meaning / The unconscious message |
| 54 | kicker | STEP 03 · 아카이브 | STEP 03 · ARCHIVE |
| 55 | title | 나만의 꿈 세계관을 쌓아가요 | Build a world out of your dreams |
| 56 | body | 기록이 쌓일수록 감정의 흐름과 자주 나타나는 테마가 한눈에 보여요. 마음에 든 해몽은 꿈 카드로 간직하고 공유할 수도 있어요. | As entries pile up, emotional patterns and recurring themes come into view. Keep the readings you love as dream cards and share them. |
| 57 | points | 감정 분포 인사이트 / 반복되는 테마 발견 / 감성 꿈 카드 저장·공유 | Emotion insights / Recurring themes / Save and share dream cards |
| 210 | | 로그인 | Log in |
| 212 | | 회원가입 | Sign up |

### 13-4. `home` — `HomeScreen.tsx`
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 49 | 설정 (a11y) | Settings |
| 54 | 오늘 밤엔 어떤 꿈을 꿨나요? | What did you dream last night? |
| 58 | 오늘 꿈을 기록해볼까요? | Want to record today's dream? |
| 59 | Luna가 대화로 도와드릴게요 | Luna will walk you through it |
| 61 | 기록 시작 | Start recording |
| 68 | 최근 꿈 | Recent dreams |
| 76 | 꿈 목록을 불러오지 못했어요 | Couldn't load your dreams |
| 78 | 아직 기록한 꿈이 없어요 | No dreams recorded yet |

### 13-5. `record`
**`RecordChatScreen.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 91 | 세션 만료 | Session expired |
| 93 | 확인 | OK |
| 129 | 기록을 그만둘까요? | Stop recording? |
| 129 | 지금까지 입력한 내용은 사라져요 | What you've written so far will be lost |
| 130 | 계속하기 | Keep going |
| 132 | 그만두기 | Stop |
| 166 | 기록 닫기 (a11y) | Close recording |
| 173 ⚠️ | 꿈 정보 `{n}`개 담김, 전체 `{total}`개 (a11y) | {{count}} of {{total}} details captured |
| 181 ⚠️ | `{filled}`/`{total}` 담김 | {{filled}}/{{total}} captured |
| 221 | 꿈 이야기를 들려주세요 (placeholder) | Tell me about your dream |
| 231 | 전송 (a11y) | Send |

**`RecordSummaryScreen.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 130 | 세션 정보를 찾을 수 없어요 | Couldn't find this session |
| 147 | 꿈 요약 확인 | Review your dream |
| 161 | 이 내용이 맞아요? | Does this look right? |
| 163 | 이야기한 내용을 정리했어요. 자유롭게 다듬어도 좋아요. | Here's what you told me. Feel free to edit it. |
| 169 | 꿈의 흐름을 적어주세요 (placeholder) | Write how the dream unfolded |
| 178 | 이 꿈의 감정은 어땠어요? | How did this dream feel? |
| 189 | 감정 `{label}` (a11y) | Emotion: {{label}} |
| 216 | 줄거리 받기 | Get the story |
| 224 | 해몽 받기 | Get interpretation |

**`hooks/useRecordSession.ts`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 31 | 세션을 시작할 수 없어요 | Couldn't start a session |
| 82 | 알 수 없는 오류 | Something went wrong |

**`utils/sessionResume.ts`** — 이어하기 다이얼로그
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 30 | 꿈 기록을 이어할까요? | Pick up where you left off? |
| 31 | 진행 중이던 꿈 기록이 있어요. 이어서 작성할까요? | You have a dream in progress. Want to continue it? |
| 34 | 버리기 | Discard |
| 41 | 이어하기 | Continue |

**`constants/prompts.ts`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 9 | 어젯밤 어떤 꿈을 꿨어? 기억나는 대로 편하게 말해줘 | What'd you dream about last night? Just tell me whatever you remember. |
| 12 | 연결에 실패했어요 | Couldn't connect |
| 13 | 지금 꿈을 해석하는 데 시간이 좀 걸리고 있어요. 잠시 후 다시 시도해주세요 | This is taking a little longer than usual. Please try again in a moment. |
| 15 | 그림을 그리다가 잠이 들었나봐요. 나중에 다시 시도해볼게요 | Looks like we fell asleep mid-drawing. We'll try again later. |
| 16 | 30분 동안 움직임이 없어서 꿈나라에 다녀왔어요. 다시 시작해볼까요? | It's been quiet for 30 minutes, so we drifted off. Start again? |

### 13-6. `interpret`
**`InterpretScreen.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 41 | 줄거리 (탭) | Story |
| 42 | 해몽 (탭) | Meaning |
| 116/119/122 | `[상징 분석]` / `[심리적 의미]` / `[무의식 메시지]` (공유 텍스트) | §7-2의 `sub` 재사용 → `[What it represents]` 등 |
| 168 | 꿈 이야기 | Your dream |
| 176 | 아직 기록된 꿈이 없어요 | No dreams recorded yet |
| 177 | 꿈을 기록하면 줄거리와 해몽을 받아볼 수 있어요 | Record a dream to get its story and meaning |
| 204 | `{label}`, 준비 중 (a11y) | {{label}}, preparing |
| 227 | 꿈을 정리하는 중... | Putting your dream together… |
| 233 | 줄거리를 정리하지 못했어요 | Couldn't put the story together |
| 252 | 꿈을 해석하는 중... | Reading your dream… |
| 258 | 줄거리는 준비됐어요 · 기다리는 동안 먼저 읽어보기 | The story is ready · read it while you wait |
| 267 | 이 꿈의 해몽을 받아볼까요? | Want to know what this dream means? |
| 269~271 ⚠️ | 상징·심리·무의식 세 관점으로 풀어드려요.\n이번 달 `{n}`번 더 받을 수 있어요. | Three perspectives — symbol, psychology, the unconscious.\n{{count}} more this month. (§3-5 **문장 단위 키 2개로 분리**, 복수형) |
| 274 | 해몽 받기 | Get interpretation |
| 327 | 해몽 카드로 저장 | Save as a dream card |
| 332 | 공유하기 | Share |
| 348 | 이번 달 해몽을 모두 사용했어요 | You've used all your readings this month |
| 353~357 ⚠️ | 해몽은 한 달에 `{n}`번까지 받을 수 있어요.\n다음 달 1일에 다시 초기화되니 그때 또 만나요.\n그동안에도 꿈 기록과 아카이브는 그대로 사용할 수 있어요. | You get up to {{count}} readings a month.\nIt resets on the 1st — see you then.\nUntil then, recording and your archive still work as usual. (§3-5 **5조각 결합을 한 키로**) |
| 354 | 정해진 횟수 (폴백) | a set number |
| 361 | 확인 | OK |

**`DreamCardScreen.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 68, 91 | 카드를 만드는 데 실패했어요 | Couldn't create the card |
| 73 | 사진 접근 권한이 필요해요 / 설정에서 사진 접근을 허용해주세요. | Photo access needed / Allow photo access in Settings. |
| 77 | 사진 앱에 저장됐어요 | Saved to Photos |
| 79 | 저장에 실패했어요 | Couldn't save |
| 96 | 이 기기에서는 공유를 사용할 수 없어요 | Sharing isn't available on this device |
| 100 | 해몽 카드 공유 (dialogTitle) | Share dream card |
| 105 | 공유에 실패했어요 | Couldn't share |
| 134 | 해몽 카드 | Dream card |
| 143 | 해몽을 불러오고 있어요 | Loading your reading |
| 163 | 꿈 일기 (제목 폴백) | Dream journal |
| 179/189/199 | 상징 분석 / 심리적 의미 / 무의식 메시지 | §7-2 |
| 236 | 저장 중… / 사진 앱에 저장 | Saving… / Save to Photos |
| 243 | 공유 중… / 공유하기 | Sharing… / Share |

**`components/dream/DreamCard.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 38 | 제목 없는 꿈 | Untitled dream |

### 13-7. `archive`
**`ArchiveScreen.tsx`**
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 25 | 드림 아카이브 | Dream archive |
| 35 | 꿈 목록을 불러오지 못했어요 | Couldn't load your dreams |
| 36 | 잠시 후 다시 시도해주세요 | Please try again in a moment |
| 38 | 다시 시도 | Try again |
| 48 | 아직 기록한 꿈이 없어요 🌙 | No dreams recorded yet 🌙 |
| 49 | 오늘 밤 꾼 꿈을 기록해볼까요? | Want to record tonight's dream? |
| 51 | 기록 시작 | Start recording |

**`CharacterDetailScreen.tsx`** — ⚠️ 미구현 플레이스홀더 화면
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 8 | 캐릭터 상세 | Character detail |
| 9 | 캐릭터 정보 + 연관 꿈 스크롤 예정 | Character info and related dreams — coming soon |

### 13-8. `insights` — `InsightsScreen.tsx`
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 25 | 인사이트 | Insights |
| 27 ⚠️ | `{year}`년 `{month}`월 | `August 2026` — §3-5 **어순 반대.** `Intl.DateTimeFormat` 사용 |
| 39 | 통계를 불러오지 못했어요 | Couldn't load your stats |
| 40 | 잠시 후 다시 시도해주세요 | Please try again in a moment |
| 42 | 다시 시도 | Try again |
| 52 | 이번 달 기록이 없어요 🌙 | Nothing recorded this month 🌙 |
| 53 | 꿈을 기록하면 통계가 나타나요 | Record a dream and your stats appear here |
| 59 | 총 기록 | Total entries |
| 63 | 스트릭 | Streak |
| 64 ⚠️ | `{streak}`일 | {{count}} day / {{count}} days (**복수형**) |
| 69 | 감정 분포 | Emotions |
| 84 | 주요 테마 | Top themes |

### 13-9. `settings` — `SettingsScreen.tsx`
| 줄 | 한국어 | 영어 |
|----|--------|------|
| 52 ⚠️ | 오전 / 오후 | AM / PM — §3-6 **포맷 순서가 뒤집힌다** |
| 62 | 알림 권한이 필요해요 | Notifications are turned off |
| 63 | 기기 설정 > DreamTeller에서 알림을 허용해 주세요. | Allow notifications in Settings › DreamTeller. |
| 66 | 설정 열기 | Open Settings |
| 88 | 링크를 열 수 없어요 / 잠시 후 다시 시도해 주세요. | Couldn't open the link / Please try again in a moment. |
| 93 | 로그아웃 / 정말 로그아웃 할까요? | Log out / Log out of DreamTeller? |
| 117 | 회원가입이 완료됐어요. 기록이 안전하게 보관돼요. | You're all set. Your dreams are safely stored. |
| 119 | 회원가입에 실패했어요 | Couldn't create your account |
| 130 | 계정 삭제 | Delete account |
| 131 | 계정과 모든 꿈 기록이 영구적으로 삭제돼요. 이 작업은 되돌릴 수 없어요. 정말 삭제할까요? | Your account and every dream will be permanently deleted. This can't be undone. Delete anyway? |
| 139 | 정말 삭제할까요? / 삭제하면 복구할 수 없어요. | Are you sure? / There's no way to recover this. |
| 142 | 영구 삭제 | Delete permanently |
| 150 | 계정 삭제에 실패했어요 | Couldn't delete your account |
| 174 | 설정 | Settings |
| 179 | 프로필 | Profile |
| 182 | 게스트로 이용 중 | Using as a guest |
| 186 | 익명 (이름 폴백) | Anonymous |
| 195 | 회원가입 | Sign up |
| 198 | 회원가입하면 지금까지의 꿈 기록이 안전하게 보관되고, 다른 기기에서도 이어볼 수 있어요. | Sign up to keep every dream safe and pick them up on any device. |
| 201 | Google로 회원가입 | Sign up with Google |
| 214 | 알림 | Notifications |
| 218 | 아침 꿈 알림 | Morning dream reminder |
| 220 | 매일 정해진 시간에 꿈 기록을 알려드려요 | A daily nudge to write your dream down |
| 237 | 알림 시간 변경 (a11y) | Change reminder time |
| 239 | 알림 시간 | Reminder time |
| 258 | 약관 및 정책 | Terms & policies |
| 260 | 서비스 이용약관 | Terms of Service |
| 262 | 개인정보처리방침 | Privacy Policy |
| 265 | 계정 | Account |
| 269 | 로그아웃 | Log out |
| 278 | 계정 삭제 | Delete account |
| **신규** | — | 언어 / Language, 시스템 설정 따름 / Use system setting, 한국어, English |

### 13-10. `notification` — `services/notificationService.ts`
§Phase 7 표 참조 (`:12` `:13` `:34`)

### 13-11. 기타
| 파일:줄 | 한국어 | 영어 |
|---------|--------|------|
| `services/api.ts:126` | 네트워크 오류가 발생했어요 | Something went wrong with the connection |
| `services/supabase.ts:41` | 게스트 / 사용자 (**프로필 이름 폴백 — 주석 아님**) | Guest / User |
| `services/supabase.ts:12` | 환경변수 에러 | **개발자용.** 번역 대신 영어로 통일 권장 |
| `navigation/TabNavigator.tsx:52~66` | 홈/기록/해몽/아카이브/분석 | §7-1 |
| `constants/emotion.ts` | 긍정/부정/중립/복합 | §7-5 |
| `utils/date.ts:17,20~25` | `{m}월 {d}일`, 인사말 4종 | §7-3, Phase 4 |
| `components/dream/StarParticleLoader.tsx:140` | — | **오탐.** 코드 끝 주석이라 번역 대상 아님 |
