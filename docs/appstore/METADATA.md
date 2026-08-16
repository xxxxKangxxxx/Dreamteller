# DreamTeller — App Store Connect 메타데이터 초안

> Phase F 제출용. App Store Connect 입력란에 그대로 붙여넣을 수 있게 정리했습니다.
> `「 」`는 확정 필요 항목. 글자 수 제한은 App Store Connect 기준 표기.

---

## 1. 기본 정보 (앱 레코드 생성 시)
| 항목 | 값 |
|---|---|
| 앱 이름 (App Name, 30자 이내) | **DreamTeller - 매일 기록하는 꿈 일기** (2026-07-08 실제 반영값. ※ 'DreamTeller' 단독은 App Store에 선점됨 → 설명어 결합. 홈 화면 아이콘 이름은 app.json의 `DreamTeller` 그대로. **4.3 대응: 이름에서 '해몽' 제거 → 일기장 포지셔닝**) |
| 부제 (Subtitle, 30자 이내) | **AI와 함께 쓰고 간직하는 꿈** |
| 기본 언어 | 한국어 |
| 번들 ID | `com.dreamteller.app` |
| SKU | `dreamteller-ios-001` (임의 고유값, 외부 비노출) |
| 사용자 액세스 | 전체 |

## 2. 카테고리
- 기본(Primary): **라이프스타일**
- 보조(Secondary): **엔터테인먼트** (선택)

## 3. URL
| 항목 | 값 |
|---|---|
| 지원 URL (Support URL) | `https://dreamteller.io.kr` |
| 마케팅 URL (선택) | `https://dreamteller.io.kr` |
| 개인정보처리방침 URL (필수) | `https://dreamteller.io.kr/privacy.html` |
| 저작권 (Copyright) | `© 2026 Yeongmo Kang` (2026-07-08 실제 반영값. 사업자 등록 시 상호로 갱신) |

## 4. 프로모션 텍스트 (Promotional Text, 170자 이내 — 심사 없이 수시 변경 가능)

**2026-08-16 실제 반영값 (1.1.0 제출 시, 110자)** — 줄거리 기능(1.1.0 신규)을 앞세우되 일기장 포지셔닝은 유지:
```
간밤의 꿈, 흘려보내지 마세요. AI와 대화하듯 적으면 한 편의 줄거리로 정리해드려요. 나만의 아카이브에 차곡차곡 쌓아두고, 반복되는 인물·장소와 감정 속에서 새로운 나를 발견하는 꿈 일기장입니다.
```
- **4.3(b) 안전**: 해몽·운세·점·예언 등 운세성 단어 0. 일기장·기록·아카이브 계열로만 구성
- ⭐ **이 필드만 심사 없이 즉시 변경 가능**하다 — 설명(§5)은 수정하려면 새 버전 심사가 필요하다. 프로모션 문구 실험은 여기서 할 것
- <sub>이전 초안(줄거리 언급 없음, 114자): 간밤의 꿈, 흘려보내지 마세요. AI와 대화하며 손쉽게 적고, 나만의 아카이브에 차곡차곡 간직하세요. 언제든 다시 꺼내보고, 반복되는 인물·장소와 감정의 흐름 속에서 새로운 나를 발견하는 꿈 일기장입니다.</sub>

## 5. 설명 (Description, 4000자 이내)
> **4.3 대응 — 일기장 포지셔닝.** 핵심 루프(적다 → 간직하다 → 돌아보다)를 앞세우고, 해석 기능은 '미래 예측이 아닌 자기 성찰'로 명확히 한정. 첫 문단에서 운세/점/타로가 아님을 명시.
```
잠에서 깨면 순식간에 사라지는 꿈. DreamTeller는 그 꿈을 붙잡아 적어두고, 언제든 다시 꺼내볼 수 있는 '나만의 꿈 일기장'입니다.

운세나 점, 타로가 아닙니다. DreamTeller는 매일 밤의 꿈을 기록하고, 안전하게 보관하고, 시간이 흘러 다시 펼쳐보는 개인 꿈 일기 앱입니다.

■ 적다 — 대화로 완성하는 꿈 기록
빈 화면 앞에서 막막할 필요 없어요. AI가 "그곳은 어떤 분위기였나요?", "누가 함께 있었나요?" 하고 물어보면 답하기만 하면 됩니다. 흐릿한 기억도 자연스러운 대화로 한 편의 일기가 됩니다.

■ 간직하다 — 나만의 꿈 아카이브
기록한 모든 꿈은 개인 아카이브에 차곡차곡 쌓입니다. 일기장을 넘기듯, 지난 꿈을 언제든 다시 꺼내 볼 수 있어요.

■ 돌아보다 — 꿈 속의 나를 발견
자주 등장하는 인물과 장소, 감정의 흐름을 한눈에 확인하세요. 반복되는 꿈의 패턴 속에서 평소 미처 몰랐던 나를 만날 수 있습니다.

■ 곱씹다 — 자기 성찰을 돕는 해석
원한다면, 기록한 꿈에 대한 짧은 심리적 해석을 받아볼 수 있어요. 미래를 점치는 운세가 아니라, 꿈에 담긴 상징과 감정을 융(Jung) 심리학의 관점에서 부드럽게 풀어 오늘의 나를 돌아보게 하는 자기 성찰의 도구입니다.

지금 DreamTeller와 함께, 매일 밤의 이야기를 기록해보세요.

※ DreamTeller의 해석은 오락 및 자기 성찰을 위한 참고 자료이며, 미래 예측이나 의학적·심리학적 진단·치료를 대체하지 않습니다.
```

## 6. 키워드 (Keywords, 100자 이내 — 쉼표 구분, 공백 없이)
> **4.3 대응 — 운세성 키워드 전면 제거('해몽'·'꿈해몽'·'꿈분석' 삭제).** 일기/저널/기록 계열만 사용해 메타데이터 전체에서 운세 뉘앙스 0.

⚠️ **아래는 초안이고, ASC 실제 반영값은 다르다 (2026-08-16 확인)**:
```
꿈, 꿈일기, 일기, 다이어리, AI, 심리, 무의식, 자각몽, 감정기록, 수면, 저널
```
- 48/100자 — **52자가 남아 있어 키워드를 더 넣을 여지가 있다** (ASO 개선 여지)
- 쉼표 뒤 공백도 글자 수에 포함된다. 공백을 빼면 약 10자를 더 쓸 수 있다
- 다만 **6월 반려 사유가 4.3(b)였던 만큼 키워드는 민감 영역**이라, 기능 업데이트 제출과 섞지 말고 **별도 사이클에서 손볼 것**
- 실제값·초안 모두 운세성 단어 0개라 4.3 관점 리스크는 없다
```
꿈일기,꿈,일기,다이어리,저널,꿈기록,기록,감정기록,꿈아카이브,자각몽,심리,무의식,마음챙김,회고,꿈수첩,수면일기,수면
```

## 7. 연령 등급 (Age Rating)
- 설문에서 모든 항목 "없음/드물게" 선택 예상 → **4+** 또는 **12+**
- ⚠️ 단, **AI 생성 콘텐츠**(꿈 해석)는 예측 불가 텍스트라 Apple이 최근 "사용자 생성/AI 콘텐츠" 관련 질문에 민감 → 안전하게 **12+** 권장 검토
- 「설문 응답 후 최종 등급 확정」

## 8. App Privacy (앱 개인정보 — privacy.html과 반드시 일치)
수집하는 데이터 유형 (Data Used to Track You: **없음**, 추적 안 함):
| 데이터 유형 | 수집 | 앱 기능 목적 | 사용자와 연결됨 |
|---|---|---|---|
| 이메일 주소 | O | 계정/인증 | O |
| 이름 | O | 계정 | O |
| 사용자 콘텐츠(꿈 기록·대화) | O | 앱 기능 | O |
| 식별자(사용자 ID) | O | 앱 기능 | O |
| 사용 데이터/진단 | O | 분석·앱 기능 | O |
- **제3자 공유**: AI 처리를 위해 사용자 콘텐츠가 Google(Gemini)로 전송됨 (privacy.html 제5조)
- **추적(Tracking) 목적 사용: 없음** → ATT 권한 요청 불필요

## 9. 수출 규정 (Export Compliance)
- `app.json`에 `ITSAppUsesNonExemptEncryption: false` 설정됨 → 제출 시 "표준 암호화(HTTPS)만 사용, 비면제 암호화 없음" → **추가 서류 불필요**

## 10. TestFlight 정보 (베타 테스트용)
| 항목 | 값 |
|---|---|
| 베타 앱 설명 | AI 대화로 꿈을 기록하고 다시 꺼내보는 꿈 일기 앱입니다. 게스트(둘러보기) 또는 Apple/Google/이메일 로그인 → 꿈 기록 → 대화 → 해석(자기 성찰) → 아카이브 흐름을 테스트해 주세요. |
| 피드백 이메일 | `kang071911@gmail.com` |
| 테스트 대상 | 내부 테스트(본인 + 1~2명) |

## 11. 심사용 데모 계정 (App Review Information) ⚠️ 중요
Apple 심사자는 로그인 후 기능을 확인합니다. **반드시 동작하는 테스트 계정을 제공**해야 합니다.

> ✅ **인증 모델 확인(2026-06-20)**: OTP는 **가입(signup) 시 이메일 확인용**으로만 쓰이고, **로그인(login)은 이메일+비밀번호** 방식. 따라서 **미리 가입을 완료해 둔 계정의 이메일+비밀번호**를 주면 심사자는 **OTP 없이 바로 로그인**됨 → OTP가 심사 차단 요인이 아님.

| 항목 | 값 |
|---|---|
| 로그인 필요 | 예 |
| 데모 계정 이메일 | **kangym071900@gmail.com** (가입 완료 + 꿈 1~2건 기록해 둘 것) |
| 데모 계정 비밀번호 | **123456** (※ 제출 전 앱에서 직접 로그인 검증 필수) |
| 비고(Notes) | 실제 기재하는 메모 전문은 아래 **§11-1** 참조 |

### 11-1. 앱 심사 정보 — 메모 전문 (2026-08-16, 1.1.0 제출 시 실제 반영값)

> ⚠️ **1.1.0에서 갱신함.** 이전 메모는 *"AI와 5단계 대화"* 라고 적혀 있었는데, 2026-08-16 대화 구조 개편(턴 카운터 → 슬롯 채우기)으로 **5단계 고정이 아니게 됐다.** 한 번에 다 말하면 1턴에 끝난다. 메모와 실제 동작이 어긋나면 심사관이 혼란스러워하고, 이 앱은 이미 2.1(b) 정보 요청을 받은 이력이 있어 불일치를 만들지 않는다.
>
> **함께 고친 것**: ① 줄거리 기능과 두 탭 구조 설명 추가 ② AI 처리 범위를 `해몽 생성` → **`대화·줄거리·해몽 생성`** 으로 정정 — 줄거리가 추가되며 Gemini 호출 지점이 늘었는데 메모는 해몽만 적고 있었다. 데이터 처리 범위를 실제보다 좁게 신고하지 않기 위함(개인정보처리방침 §5는 동일한 데이터 흐름이라 수정 불필요).
>
> **다음에 대화 흐름이나 AI 호출 지점을 바꾸면 이 메모도 반드시 같이 고칠 것.**

```
본 앱은 한국어 서비스입니다.

[로그인 안내]
로그인은 이메일 + 비밀번호 방식입니다. 6자리 OTP 코드는 신규 가입 시 이메일 확인용으로 1회만 사용되며, 로그인에는 필요하지 않습니다. 아래 데모 계정은 이미 가입이 완료된 상태이므로 비밀번호로 바로 로그인하실 수 있습니다.

[핵심 기능 확인]
로그인 후 홈 화면에서 '기록 시작'을 누른 뒤, AI(Luna)의 첫 질문에 편하게 답해주세요. Luna는 아직 언급되지 않은 내용만 물어보므로, 꿈을 한 번에 자세히 말씀하시면 한 번의 답변으로 대화가 끝날 수 있습니다. 필요한 내용이 모이면 요약 화면으로 이동하며, 여기서 '줄거리 받기'(대화를 한 편의 글로 정리) 또는 '해몽 받기'(줄거리 + 해석)를 선택할 수 있습니다. 꿈 상세 화면은 '줄거리'와 '해몽' 두 개의 탭으로 구성되어 있습니다. 데모 계정에는 이미 기록된 꿈이 있어 홈/아카이브/인사이트 화면도 바로 확인 가능합니다.

[AI 처리]
사용자가 입력한 꿈 내용은 대화·줄거리·해몽 생성을 위해 Google Gemini API로 전송·처리됩니다(개인정보처리방침 제5조에 명시). 광고 추적(ATT)은 하지 않습니다.

---

This app is a Korean-language service.

[Login] Login uses email + password. The 6-digit OTP code is used only once for email verification at sign-up, NOT for login. The demo account below is already registered—just log in with the password.

[How to test] After login, tap '기록 시작' (Start) on the Home screen and answer Luna's opening question in your own words. Luna only asks about details you have not mentioned yet, so the conversation can end after a single reply if you describe the dream fully. Once enough detail is gathered you are taken to the summary screen, where you can choose '줄거리 받기' (turn the conversation into a written story) or '해몽 받기' (story + interpretation). The dream detail screen has two tabs: '줄거리' (story) and '해몽' (interpretation). The demo account already has saved dreams, so Home/Archive/Insights screens are populated.

[AI processing] User dream content is sent to the Google Gemini API to generate the conversation, story, and interpretation (disclosed in Privacy Policy §5). No ad tracking.
```

> 💡 준비 방법: 앱에서 심사 전용 이메일로 **가입(이메일+비밀번호 입력 → 6자리 코드 확인)을 미리 완료** → 그 이메일/비밀번호를 위 칸에 기재. 데모 데이터(꿈 1~2건)도 미리 기록해두면 심사자가 아카이브/인사이트까지 바로 확인 가능.

---

## 스크린샷 (필수 — 시뮬레이터에서 캡처)
- ⚠️ **iPhone 6.5"(1284×2778) + iPad 12.9"(2048×2732) 슬롯 둘 다 필수** — 앱이 iPad 지원이라 **iPad 슬롯을 비우면 심사 제출이 막힘**(2026-07-08 확인)
- 제작: `app-store/screenshots/` — raw 캡처를 `build.sh`(iPhone, `out/` 6컷) / `build-ipad.sh`(iPad, `out-ipad/` 5컷)로 브랜드 합성. 상세는 그 폴더의 `CAPTURE_GUIDE.md`
- 캡션은 4.3 대응으로 '해몽'→'해석/자기 성찰' 순화됨. 로그인 화면은 스크린샷에 없으므로 로그인 UI 변경 시 재캡처 불필요
- 권장 컷: ① 온보딩/랜딩 ② RecordChat 대화 ③ 해석 카드(InterpretScreen) ④ 아카이브(미구현 시 Home) ⑤ 인사이트
- TestFlight 내부 테스트만 할 거면 스크린샷 없이도 빌드 업로드 가능. **App Store 공개 심사 제출 시 필수.**

## 빌드/제출 명령 (아이콘 교체 후)
```bash
cd dreamteller/app
# 1) 아이콘 4종 교체: assets/icon.png(1024², no alpha) / adaptive-icon / splash-icon / favicon
# 2) production 빌드
eas build --platform ios --profile production
# 3) TestFlight 업로드
eas submit --platform ios --latest
```
