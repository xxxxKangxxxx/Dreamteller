# App Review — 재제출 통합 답장 (영문)

> **용도**: App Store Connect → 재제출 후, 반려 스레드(Resolution Center)에 붙여넣는 영문 답장.
> **대상 빌드**: DreamTeller 1.0.0 (build 8)
> **톤**: 공손 + 확실. 5개 반려 사유를 항목별로 반박/해결 명시.
> **붙여넣기 전 확인**: 데모 계정(이메일+비번)이 App Review Information에 기재됨 / 계정삭제 화면 녹화가 Attachment에 첨부됨.

---

## 붙여넣을 본문

Dear App Review Team,

Thank you for your detailed feedback on our previous submission. We have carefully addressed every point you raised. Below is a summary of the changes included in this updated build (1.0.0, build 8).

**Guideline 4.3(b) — Design: Spam**

We understand the concern about saturation in the fortune-telling / horoscope category, and we would respectfully like to clarify that DreamTeller is not a fortune-telling, horoscope, or tarot app. It is a personal dream journal.

The core purpose of the app is to help users (1) record their dreams through a natural, guided conversation, (2) keep them safe in a private archive, and (3) look back on recurring people, places, and emotions over time. The loop is simply: write → keep → reflect.

The optional interpretation feature is explicitly framed as a tool for personal self-reflection grounded in Jungian psychology — not as a prediction of the future. This is stated directly in the app and in the App Store description ("This is not fortune-telling, tarot, or divination; it is a personal dream diary.").

To make this positioning unambiguous, we have removed all fortune-telling terminology from the app name, subtitle, description, and keywords, and repositioned the entire listing around journaling and self-reflection.

**Guideline 4.8 — Login Services (Sign in with Apple)**

We have added Sign in with Apple, implemented using native Apple authentication. It is presented on the login screen alongside our other sign-in options and offers the same data-minimizing privacy characteristics required by this guideline.

**Guideline 5.1.1(v) — Account Sign-In (registration not required)**

Creating an account is now entirely optional. Users can access all core features — recording dreams, receiving interpretations, and browsing their archive — without signing in, via the "Continue as guest" option on the welcome and login screens. If a guest later decides to sign up with Google, their existing records are preserved.

**Guideline 5.1.1(v) — Account Deletion**

We have implemented in-app account deletion. From Settings → Delete Account, users can permanently delete their account through a two-step confirmation. This removes the account and all associated data (dreams, interpretations, and related records) from our servers. A screen recording of the full deletion flow is attached to the App Review Information for your convenience.

**Guideline 2.1 — Information Needed (demo account)**

We have verified the demo account credentials provided in the App Review Information. Please note that login uses email and password directly; the one-time verification code is only used once during initial sign-up, so the reviewer can log in immediately with the provided email and password — no code is required. Alternatively, the "Continue as guest" option provides full access to core features without any login at all.

We sincerely appreciate the time and care your team has put into reviewing our app. Please let us know if any additional information would be helpful.

Best regards,
Yeongmo Kang
Developer, DreamTeller

---

## 참고 — 각 문단이 대응하는 반려 사유
| 반려 | 대응 요지 |
|---|---|
| 4.3(b) 스팸 | 운세앱 아님 명시 + 일기장/자기성찰 재포지셔닝 + 이름/설명/키워드 운세 뉘앙스 제거 |
| 4.8 로그인 | Sign in with Apple(네이티브) 추가 |
| 5.1.1(v) 강제가입 | 게스트 모드(로그인 없이 핵심 기능) + Google 전환 시 기록 보존 |
| 5.1.1(v) 계정삭제 | 인앱 계정 삭제(2단계 확인, 서버 완전 삭제) + 화면 녹화 첨부 |
| 2.1 데모계정 | 이메일+비번 즉시 로그인(OTP는 가입 1회만) + 게스트 대안 |
