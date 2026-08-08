# App Review — 2.1(b) 정보 요청 답장 (영문)

> **용도**: App Store Connect → Resolution Center(앱 심사 커뮤니케이션)에 그대로 붙여넣는 영문 답장.
> **대상**: 제출 ID `29e6bed7-5fed-4fc1-8eb2-18b1113db798` / 1.0 (build 8) / 심사일 2026-08-08 / 심사 기기 iPad Air 11" (M3)
> **사유**: Guideline 2.1(b) — Information Needed (비즈니스 모델 질의 4문항)
> **전략**: **새 빌드 없이 답장만으로 해소.** 동일 build 8 유지. 관련 배경·판단 근거는 [`REJECTION_ANALYSIS.md`](#부록--왜-이-질문을-받았는가) 대신 본 문서 하단 부록 참조.

---

## 붙여넣을 본문

Dear App Review Team,

Thank you for the opportunity to clarify our business model.

**DreamTeller is currently a completely free app. It contains no paid content, no subscriptions, and no purchasable features of any kind — neither through In-App Purchase nor through any external channel.** No money is collected from users anywhere, inside or outside the app. The app binary contains no payment, commerce, or subscription SDK of any kind.

Below are our answers to each of your questions.

**1. Who are the users that will use the paid features in the app?**

There are no paid features, and therefore no paying users. Every user — whether signed in or using the app as a guest — has access to exactly the same functionality at no cost. There is no user segment, promotional code, or account type that receives paid or unlocked content.

**2. Where can users purchase the features that can be accessed in the app?**

Nowhere. There is no purchase flow, no payment form, no pricing page, and no external website, storefront, or third-party platform where anything related to DreamTeller can be bought. Our website (https://dreamteller.io.kr) contains only an app introduction, our Privacy Policy, and our Terms of Service — it has no commerce functionality whatsoever.

**3. What specific types of previously purchased features can a user access in the app?**

None. The app does not recognize, restore, validate, or unlock any content or entitlement purchased elsewhere. There is no "Restore Purchases" function in the app, because there is nothing that could be restored. No account arrives in the app with pre-existing paid entitlements.

**4. What paid content, subscriptions, or features are unlocked within the app that do not use In-App Purchase?**

None. We would like to explain the likely source of the confusion directly and transparently, rather than simply denying it.

Our app internally assigns every account a "plan" field, and the Settings screen displays that value as a small badge reading "FREE". One message in the interpretation screen also refers to a future "Premium" tier. **These are placeholder labels for a tier that does not exist and cannot be obtained by anyone.** Specifically:

- Every account is created with the plan value "FREE" and remains "FREE" permanently.
- There is no code path — in the app or on our backend server — that can change an account's plan value. No endpoint, no purchase handler, no promotional mechanism, and no administrative flow exists to grant a different plan.
- Consequently, no feature in the app is gated behind a payment. Nothing is locked, and nothing can be unlocked by paying.

The free plan applies identically to all users: up to 30 dream entries and 5 AI interpretations per month. These limits exist solely to control our AI API costs (the app uses a third-party generative AI service that bills per request). They are not a paywall, and there is no way for any user to lift them by paying.

**Our commitment and the corrective actions we have taken**

If we introduce a paid tier in the future, we will implement it exclusively through Apple's In-App Purchase system, in full compliance with Guideline 3.1.1. We will never direct users to an external purchase mechanism.

To remove any ambiguity, we have already updated our public Terms of Service (https://dreamteller.io.kr/terms.html, Article 11). It now states explicitly that the service is entirely free with no payment mechanism in existence, and that any future paid service will be offered **only** through In-App Purchase.

We will also remove the placeholder "Premium" wording and the plan badge from the app in our next update, so that no future reviewer encounters the same ambiguity.

We hope this fully addresses your questions, and we are happy to provide any further detail — including a walkthrough of the relevant source code or backend configuration — if that would be helpful.

Best regards,
Yeongmo Kang
Developer, DreamTeller

---

## 한글 대조본 (제출용 아님 — 내용 확인용)

**서두**: 드림텔러는 현재 완전 무료 앱. 유료 콘텐츠·구독·구매 기능 일절 없음(IAP로도, 외부로도). 앱 안팎 어디서도 금전 수취 없음. 바이너리에 결제/커머스/구독 SDK 0개.

| 질문 | 답변 요지 |
|---|---|
| 1. 유료 기능 사용자는 누구인가 | 유료 기능이 없으니 유료 사용자도 없음. 로그인/게스트 모두 동일 기능 무료. 프로모션 코드·특별 계정 유형도 없음 |
| 2. 어디서 구매하는가 | 어디에도 없음. 구매 플로우·결제 폼·가격 페이지·외부 스토어 전무. 웹사이트는 앱 소개/방침/약관뿐, 커머스 기능 0 |
| 3. 기존 구매분 접근 | 없음. 외부 구매 내역을 인식·복원·검증·해제하지 않음. **복원할 대상이 없으므로 "구매 복원" 기능 자체가 없음** |
| 4. IAP 없이 해제되는 유료 기능 | 없음 + **오해의 출처를 먼저 인정하고 해명** ↓ |

**질문 4 상세 (핵심)**
- 설정 화면의 `FREE` 뱃지와 해몽 화면의 "프리미엄" 문구는 **존재하지 않고 아무도 획득할 수 없는 등급의 플레이스홀더**
- 모든 계정은 `FREE`로 생성되어 영구히 `FREE` (`app/src/services/supabase.ts:32`)
- **플랜 값을 바꿀 수 있는 코드 경로가 앱에도 서버에도 없음** — 엔드포인트·구매 핸들러·프로모션·관리자 플로우 전무 (`server/app/utils/usage.py`에 한도 테이블만 존재)
- 따라서 결제 뒤에 잠긴 기능이 하나도 없음
- 무료 한도(월 꿈 30건 / 해몽 5회)는 **Gemini API 종량 과금 통제용**이지 페이월이 아님. 돈 내고 풀 방법 자체가 없음

**마무리**
- 향후 유료 도입 시 **Apple IAP로만** 구현, 3.1.1 완전 준수, 외부 결제 유도 절대 없음
- **이미 조치 완료**: 약관 제11조 개정 (전면 무료 + 결제 수단 부재 명시, 향후 유료 시 인앱결제 전용 명시)
- **다음 업데이트에서 조치 예정**: 앱 내 "프리미엄" 문구 및 플랜 뱃지 제거
- 필요하면 소스 코드/백엔드 설정도 보여드릴 수 있음

---

## 제출 전 체크리스트

- [ ] `web/terms.html` 제11조 개정본 **배포 완료** (답장에서 URL을 인용하므로 반드시 선행 — Amplify 반영 확인)
- [ ] https://dreamteller.io.kr/terms.html 실제 접속해서 개정 문구 노출 확인
- [ ] ASC → 앱 심사 → Resolution Center에 위 영문 본문 게시
- [ ] **새 빌드 업로드하지 않음** (build 8 유지, EAS 빌드 한도 미소비)
- [ ] 게시 후 24~48시간 상태 모니터링 → `In Review` 복귀 확인
- [ ] 72시간 경과에도 `해결되지 않은 문제` 유지 시 → 7/8 제출 상세에서 `Resubmit to App Review`(동일 build 8, 새 빌드 불필요)

---

## 부록 — 왜 이 질문을 받았는가 (2026-08-08 분석)

심사관은 코드나 `docs/` 내부 문서를 볼 수 없음. 노출 표면은 ① 화면 UI ② ASC 입력값 ③ 링크된 웹페이지뿐.

| 위치 | 노출 문구 | 위험도 |
|---|---|---|
| `app/src/screens/settings/SettingsScreen.tsx:188` | 프로필 옆 `FREE` 뱃지 | 🔴 최상 |
| `app/src/screens/interpret/InterpretScreen.tsx:218-229` | "프리미엄으로 업그레이드하면 무제한" + "프리미엄 알아보기" 버튼 | 🔴 최상 |
| `app/src/screens/interpret/DreamCardScreen.tsx:232` | 공유 카드 `DREAMTELLER / FREE` 워터마크 | 🟠 높음 |
| `web/terms.html` 제11조 (개정 전) | "요금·결제·환불" 조항 | 🟠 높음 → **개정 완료** |
| `web/privacy.html:35` | 수집 항목 "요금제 상태" | 🟡 중간 |

**가장 유력한 트리거**: 지난 반려의 5.1.1(v) 인앱 계정 삭제를 재검증하려면 심사관이 반드시 설정 화면에 진입 → 프로필 옆 `FREE` 뱃지 목격 → "FREE가 있으면 유료 등급도 있다 → 근데 구매 버튼이 없다 → 외부 결제인가?" → 2.1(b) 정형 질문 4종.

**결백이 확인된 곳**: App Store 설명·프로모션 텍스트·키워드에 결제 언급 0건 / App Privacy에 "구입(Purchases)" 데이터 유형 **미선언** / `package.json`에 결제 SDK 0개 / 서버에 결제 라우트 0개.

**다음 업데이트(build 9) 시 정리 대상**
1. `InterpretScreen.tsx:218-229` — 한도 초과 모달에서 "프리미엄 업그레이드" 문구·버튼 제거 → "다음 달에 초기화됩니다" 안내로 대체
2. `SettingsScreen.tsx:188-192` — 플랜 뱃지 제거
3. `DreamCardScreen.tsx:232` — 카드 워터마크의 `FREE` 서브라벨 제거
4. `web/privacy.html:35` — "요금제 상태" 표현 정리 검토
