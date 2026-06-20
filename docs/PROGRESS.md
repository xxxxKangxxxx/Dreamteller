# DreamTeller — 진행 현황 & 다음 작업

> 최종 업데이트: 2026-06-19 (앱 아이콘 제작 + production 빌드 + TestFlight 업로드 — Phase F 핵심 차단점 해소)
> 대상 위치: `dreamteller/app/` (Expo) + `dreamteller/server/` (FastAPI) + `dreamteller/web/` (Amplify 정적 사이트)

---

## 오늘 세션 요약 (2026-06-19, 앱 아이콘 + Phase F production 빌드 + TestFlight) ⭐

### 앱 아이콘 4종 제작 — SVG 코드로 직접 디자인 ⭐ (최우선 차단점 해소)
Expo placeholder 아이콘이 Phase F 최우선 차단점이었음. diffusion 이미지 AI(Midjourney/Nano Banana 등) 시도하다 **SVG 코드 직접 제작**으로 전환 — 플랫 미니멀 벡터라 코드가 더 정확/유연.
- **디자인 확정**: 구름 가득한 밤하늘 + 빛나는 흰 별빛(파티클처럼 다수) + 구름에 아래쪽이 살짝 가려진 **노란 초승달**. 표정/이모티콘 없음. 배경 딥 네이비(`#050510`까지). 브랜드 토큰 컬러 사용
- **원본 보존**: `app/assets/icon-master.svg` (편집용 — 색/구름/별 등 언제든 재수정 후 4종 재생성 가능)
- **렌더 도구**: `brew install librsvg` → `rsvg-convert`로 SVG→PNG
- **4종 산출** (`app/assets/`):
  - `icon.png` (1024², **알파 없음** — App Store 반려 사유 사전 차단)
  - `adaptive-icon.png` (1024², 달이 중앙 안전영역 안 → 마스킹돼도 보존)
  - `splash-icon.png` (1024²)
  - `favicon.png` (48²)
- `app.json` 경로가 이미 이 파일명과 일치 → 설정 변경 불필요

### Phase F — production 빌드 + TestFlight 업로드 ✅
- ✅ `eas build --platform ios --profile production` 성공 — buildNumber 1→2 자동 증가, production env 3개 로드 확인
  - **App Store용 프로비저닝 프로파일 신규 생성** (`94KYQL5SQ9`) — 기존 AdHoc(preview용)과 별개. distribution 인증서(`6AE1086ECA...`, 만료 2027-05-22)는 재사용
  - `.ipa` 산출 완료
- ✅ App Store Connect **앱 레코드 생성** — 스토어 등록명 `DreamTeller - AI가 들려주는 해몽` (브랜드명 'DreamTeller' 단독은 이미 선점됨. 홈 화면 아이콘 이름은 app.json의 `DreamTeller` 그대로 유지)
- ✅ `eas submit --platform ios --profile production --latest` 성공
  - App Store Connect API Key 자동 생성 (역할 **APP_MANAGER** — 최소 권한)
  - 내부 테스트 그룹 `Team (Expo)` 자동 생성, `dudah0719@naver.com` 테스터 등록
- ✅ TestFlight 빌드 2 "제출 준비 완료" — **썸네일에 새 초승달 아이콘 정상 표시 확인**
- ✅ **실기기 설치 + 아이콘 확인 완료** — 본인 아이폰 TestFlight로 설치, 홈 화면 아이콘 양호

### 막혔던 지점 & 해결
1. **앱 이름 'DreamTeller' 선점됨** — App Store 등록명은 전세계 고유 필요. → `DreamTeller - AI가 들려주는 해몽`으로 설명어 붙여 해결 (홈 아이콘 이름은 별개라 영향 없음)
2. **production은 새 프로비저닝 프로파일 필요** — 기존은 AdHoc(내부배포). App Store 빌드용은 종류가 달라 EAS가 자동 생성 (Y)
3. **TestFlight 앱에 DreamTeller 안 뜸** — 기기 "미디어 및 구입 항목" 계정이 테스터(`dudah0719@naver.com`)와 일치해야 함. 네이버 메일 초대 링크 탭으로 해결
4. **기존 Expo preview 빌드 삭제 가능 여부** — 같은 번들 ID라 서명 충돌 방지 위해 삭제 권장. 데이터는 Supabase(클라우드)라 손실 없음, 재로그인 시 복원

### 다음 세션 시작 시
- **App Store 공개 심사 제출**로 갈 경우 남은 것: 스크린샷 5컷(6.7") + 메타데이터 입력(`docs/appstore/METADATA.md` 활용) + **심사용 데모 계정**(OTP 가입 미리 완료한 계정 제공) + 수출규정 답변(`ITSAppUsesNonExemptEncryption:false` 설정됨)
- TestFlight 내부 검증 잔여: 로그인/꿈기록/해몽/아카이브 end-to-end + Settings 약관·방침 링크 동작
- 여유 시: Archive 백엔드 라우트 미구현(404) 착수

### 오늘 발생한 코드 오류
- 없음 (아이콘 에셋 + 빌드/배포 작업). 코드 변경은 아이콘 PNG 4종 + `icon-master.svg` 신규뿐

---

## TestFlight 검증 계획 (다음 작업) ⭐

> 실기기(아이폰 TestFlight 빌드 2)에서 직접 수행. 화면별 결과 확인 후 이 체크리스트에 반영.
> 진행 방식: 검증은 사용자가 실기기로, 이슈 발견 시 Claude가 진단→코드 수정→tsc→재빌드 가이드. preview 빌드 한도 절약 위해 수정은 묶어서.

### 0. 사전 준비
- [ ] 백엔드 health `https://api.dreamteller.io.kr/health` 200
- [ ] 테스트 계정 2개: ① 기존 데이터 보유(조회용) ② 신규 빈 이메일(가입 OTP용)
- [ ] 기존 Expo preview 빌드 삭제 (같은 번들 ID 서명 충돌 방지)

### 1. 앱 진입 / 비주얼 ✅ (2026-06-20 검증 완료)
- [x] 홈 화면 아이콘 (2026-06-19 확인 완료)
- [x] 스플래시 화면 정상 (로고 등장 후 자연 전환)
- [x] Welcome(첫 화면: 로고+시작하기/앱소개) → (선택) Onboarding 3단계 — 실제 순서는 Welcome→온보딩 (미인증 스택 첫 화면이 Welcome)
- [x] Pretendard 폰트 + 다크 퍼플 톤 깨짐 없음

### 2. 인증 (Phase D 산출물 실검증)
> 인증 모델 확인: 가입=이름+이메일+비밀번호+OTP 확인 / 로그인=이메일+비밀번호 (로그인은 OTP 안 거침)
- [~] 신규 가입: 메일 수신까지 OK. **🔴 OTP 입력 후 진행 안 됨 → 코드 수정 완료, 재빌드 후 재검증 대기**
  - 원인: number-pad 키보드엔 완료 키가 없고 "인증하기" 버튼이 키보드에 가려져 제출 불가(데드락). 자동 인증 없었음
  - 수정: `OtpVerifyScreen` 6자리 채워지면 자동 인증 + `Keyboard.dismiss()` (commit 대기, tsc 통과)
- [ ] iOS OTP 자동 채움(키보드 위 6자리 suggestion) — 재빌드 후 확인
- [ ] 재발송 쿨다운(60s) — 재빌드 후 확인
- [ ] 기존 로그인 → 홈 진입 (비밀번호 방식, OTP 버그 영향 없음 → 현재 빌드로 검증 가능)
- [ ] 앱 재시작 시 세션 유지

### 3. 핵심 플로우 (꿈 기록 → 해몽) ⭐ (2026-06-20 검증 — 동작 OK, 로딩 UX 수정)
- [x] RecordChat: Luna 첫 질문 → 5단계 대화, 이모지 없음, 키보드 가림/닫힘 없음
- [x] 감정(마지막) 답변 시 자동 마무리 → 추가 입력 없이 요약 이동 (step>=4 검증)
- [x] RecordSummary → "해몽 받기"
- [x] InterpretScreen: v2 카드 3종(상징/심리/무의식) 정상 표시, 해몽 내용 양호
- [x] 홈에 Gemini 자동 생성 한국어 제목으로 새 꿈 표시
- [~] **🟡 별빛 로딩 체감 개선 → 코드 수정 완료, 재빌드 후 재검증 대기**
  - 증상: "해몽 받기" 후 밋밋한 버튼 스피너로 길게 대기 → InterpretScreen 도착 시 이미 완료돼 별빛 로더가 거의 안 보임
  - 원인: `RecordSummaryScreen.submit('interpret')`가 `await interpretService.generate()`로 해몽 생성을 끝까지 기다린 뒤 이동
  - 수정: generate 대기 제거 → 꿈 생성 직후 바로 InterpretScreen 이동. `useInterpret`의 404→generate→폴링이 생성을 맡아 별빛 로더가 대기 전체를 덮음 (중복 생성도 제거). tsc 통과

### 4. 조회 화면 ✅ (2026-06-20 검증 완료)
- [x] HomeScreen: 최근 꿈 최대 3개, 탭 → InterpretDetail 이동
- [x] InsightsScreen: 감정 분포 표시 (dreamTypeDistribution·topThemes는 빈 값이 정상 — 미구현)
- [x] DreamCardScreen: 미리보기 → 사진 저장 → 공유 시트 (저장·공유 모두 동작)
- [~] **🟡 토스트 가독성 → 코드 수정 완료, 재빌드 후 재검증 대기**: "사진 저장됐습니다" 등 success/error 토스트 배경 알파가 `33`(20%)이라 너무 투명. `Toast.tsx` 전 변형을 불투명 `bgElevated` 배경 + 컬러 보더 + 그림자로 변경. tsc 통과

### 5. Settings ✅ (2026-06-20 검증 완료)
- [x] 약관 링크 → dreamteller.io.kr/terms.html 외부 브라우저 정상
- [x] 개인정보방침 링크 → /privacy.html 정상
- [x] 로그아웃 동작

### 6. 알려진 공백 — "버그 아님" 확인 ✅ (2026-06-20 정상 처리 확인)
- [x] ArchiveScreen: 404여도 빈/에러 상태 정상, 앱 안 죽음
- [x] CharacterDetail: 진입 시 빈 화면 정상 (Phase 2 보류)

### 7. 결과 처리 (2026-06-20)
- [x] 이슈 심각도 분류 완료 (아래)
- [~] 차단 이슈 코드 수정 완료 → **preview 재빌드 묶어서 재검증 대기**
- [x] 검증 결과 PROGRESS에 기록 (각 섹션 인라인 반영)

#### 검증 결과 종합 — 발견 이슈 3건 (모두 코드 수정 완료, tsc 통과, 재빌드 대기)
| # | 심각도 | 위치 | 증상 | 수정 |
|---|---|---|---|---|
| 1 | 🔴 출시 차단 | `OtpVerifyScreen` | 신규 가입 OTP 6자리 입력 후 진행 불가 (number-pad 키보드에 완료 키 없어 "인증하기" 버튼 가려짐 → 데드락) | 6자리 채워지면 자동 인증 + `Keyboard.dismiss()` |
| 2 | 🟡 폴리시 | `RecordSummaryScreen` | "해몽 받기" 후 밋밋한 버튼 스피너로 길게 대기, 별빛 로더 거의 안 보임 | generate 대기 제거 → 즉시 InterpretScreen 이동, `useInterpret`가 생성 맡아 별빛 로더가 대기 전체 덮음 |
| 3 | 🟡 폴리시 | `Toast` | success/error 토스트 배경 알파 33(20%)이라 너무 투명해 안 보임 | 불투명 `bgElevated` 배경 + 컬러 보더 + 그림자 |

##### build 3 (2026-06-20, 수정 1~3 포함) 재검증 결과
- ✅ #1 OTP 자동 인증 + 키보드 닫힘 **정상 동작 확인** (🔴 차단 해소)
- ✅ #2 별빛 로더 / #3 토스트 가독성 **정상 확인**
- iOS 자동채움: **휴대폰(SMS) 인증 도입 시 함께 검증**으로 보류 (이메일 OTP 자동채움은 들쭉날쭉, 출시 차단 아님)
- 🆕 **이슈 4·5·6 발견** ↓

| 4 | 🟡 폴리시 | `OtpVerifyScreen` | OTP 자동 인증 후 홈 전환이 너무 즉각적(깜빡) | 인증 중 ActivityIndicator "인증하고 있어요..." 로딩 + 최소 노출 800ms |
| 5 | 🟡 폴리시 | `RecordChatScreen` | 채팅 입력 텍스트가 박스 수직 중앙보다 살짝 아래 정렬 | input 스타일 `lineHeight: undefined` (Login/Signup과 동일 해법) |
| 6 | 🟡 폴리시 | `DreamCardScreen` | "사진 앱에 저장됐어요 ✨" 토스트에 이모지 잔존 | ✨ 제거 |

**다음 빌드(build 4)에 포함**: #4 OTP 로딩, #5 채팅 입력 정렬, #6 토스트 이모지 (모두 tsc 통과)
**다음 빌드 후 재검증**: 재발송 쿨다운 60s + #4·#5·#6
> 빌드 절약: 잔여 빌드 2회. 재발송 쿨다운만 build 3에서 확인되면 build 4로 일괄 처리

---

## 이전 세션 요약 (2026-06-18, 문서 동기화 패스)

### 핵심 문서를 실제 구현 기준으로 갱신 ⭐ (commit `79c74fe`)
오래 갱신 안 된 기술 문서(API.md 4/21, ARCHITECTURE.md·SPEC.md 5/2)가 실제 코드와 벌어져 있어 전수 대조 후 정정.
- **API.md** — 거의 전면 개정:
  - base URL `api.dreamteller.app` → `api.dreamteller.io.kr`
  - 실제 라우트(`dreams`/`interpret`/`stats` + `/health`)만 정확히 기술. `/auth/*` 백엔드 엔드포인트는 없음(Supabase Auth가 처리)으로 정정
  - `/interpret/chat` **SSE → 비스트리밍 JSON**(`{text, nextStep, complete}`)
  - 해몽 응답을 **payload v2 구조**(symbolAnalysis/psychologicalMeaning/unconsciousMessage 객체 + headline/keySymbols/detail/affirmation)로 갱신
  - envelope·에러코드 실제값, stats의 `dreamTypeDistribution`·`topThemes` 빈 값 명시
  - **미구현 섹션** 분리: `archive` / `subscriptions` / `illustrations`
- **ARCHITECTURE.md** — 실제 버전·구조 반영:
  - Expo SDK 54 / RN 0.81 / Reanimated v4 + react-native-worklets / @react-navigation v7 / zustand v5 / react-query v5 / fetch 래퍼(Axios 미사용)
  - 백엔드 Python 3.13 / google-genai / PyJWT(JWKS) / pydantic-settings
  - 백엔드 폴더 구조 `routes/`·`deps/`·`schemas/`·`utils/`·`config.py` (기존 `routers/middleware/models/core`는 오기였음)
  - 인프라 EC2+systemd / SES Custom SMTP / Amplify / Route 53 (기존 Railway/Render/Vercel 권장은 폐기)
  - env 항목 실제화(`SUPABASE_SERVICE_ROLE_KEY`, JWT_SECRET 불필요), 앱 구조에 OtpVerify/Splash 추가
- **SPEC.md** — 로그인 **이메일 OTP** 흐름, 대화 **이모지 제거 + step>=4 완료**, chat **비스트리밍**, Archive **백엔드 미구현** 상태 메모, 에러 토스트 이모지 제거
- **CLAUDE.md** — 인증 설명을 "Supabase JWT를 JWKS(ES256)로 검증, 자체 JWT 미발급"으로 정정

### 작업 중 발견한 불일치 (후속 과제로 기록)
- **Archive 백엔드 미구현**: 클라 `archiveService.ts`는 `/archive/characters·places·themes`를 호출하나 백엔드 라우트 없음 → 404. 화면(`ArchiveScreen`/`CharacterDetailScreen`)·스키마 테이블은 있으나 추출·집계 파이프라인 + 조회 라우트가 비어 있음
- **Stats 부분 공백**: `dreamTypeDistribution`(dream_type 미수집), `topThemes`(테마 추출 미구현) 항상 빈 값
- **Subscriptions**: 백엔드·인앱결제 미구현 (FREE/PREMIUM 분기만 존재)

### 오늘 발생한 오류 및 해결 내역
- 없음 (문서 전용 작업, 코드 변경 없음). git status는 4개 문서만 변경 → 커밋·푸시 정상 완료

### 다음 세션 시작 시
- Phase F 최우선 차단점 = **앱 아이콘 4종 교체**(현재 Expo placeholder) → production 빌드 → `eas submit` → TestFlight
- Gemini 유료 전환(실서비스 전 필수)
- 여유 시 Archive 백엔드 라우트 구현 착수(위 "불일치" 참조)

---

## 이전 세션 요약 (2026-06-17~18, Phase E 완료 + UI/프롬프트 폴리시 + Phase F 착수)

### Phase E 완료 — Amplify 배포 + 도메인 + 문의처
- ✅ Amplify Hosting 배포(Seoul, GitHub `main` 연동, amplify.yml `baseDirectory: web`) + 기본 도메인 3페이지 렌더 확인
- ✅ Custom domain `dreamteller.io.kr` 연결(루트+www → main, Amplify SSL, Route 53 자동, `api.` 유지). 외부 curl로 `/terms.html`·`/privacy.html`·`api/health` 모두 200 검증
- ✅ 문의처 이메일: 베타는 `kang071911@gmail.com` 임시, 정식 출시 때 `support@dreamteller.io.kr` 도메인 메일 구축. 약관/방침/랜딩/README 반영
- → 상세는 아래 "다음 작업 [6] Phase E" 섹션 참조

### Phase F 착수 — App Store 준비
- ✅ `docs/appstore/METADATA.md` 작성 — 앱 이름/부제/설명/키워드, App Privacy 매핑(privacy.html과 일치), 심사용 데모 계정·연령등급 노트, 수출규정, build/submit 명령
- ✅ production EAS env 3개 등록 확인(API/SUPABASE_URL/ANON_KEY — 운영 도메인 기준)
- ⏳ **아이콘 대기** — 아이콘 4종 교체 후 production 빌드 1회 + `eas submit`. (지금 `assets/*.png`은 Expo 기본 placeholder)
- ⏳ App Store Connect 앱 레코드 생성(콘솔), 스크린샷, 심사용 데모 계정 생성

### UI/UX 폴리시 패스 (실기기 기준, preview 빌드 반복 검증) ⭐
TestFlight 전 다듬기. 변경은 모아서 preview 빌드로 검증하는 방식.
- **StarParticleLoader**: 180px 정사각 → 부모 폭 가득(`alignSelf:stretch`), 파티클 16→30개, 높이 기반 낙하 (해몽 로딩이 화면에 꽉 차게)
- **RecordChat 키보드**: 전송 시 키보드 닫히던 문제 — `editable={!isStreaming}` 게이팅 제거(스트리밍 중 입력창 비활성→iOS 키보드 dismiss가 원인)
- **OnboardingScreen 리디자인**: 이모지 제거 + LinearGradient 배경 + 깜빡이는 별 16개 레이어 + STEP 01~03 구체 플로우 카피(좌측 정렬) + 제목 34→26px(긴 제목 줄바꿈 방지)
- **WelcomeScreen**: 이모지(✨) 제거 + 브랜드는 상단/버튼은 하단 배치(spacer 1:1.8). (1차에 버튼을 너무 올려 되돌림)
- **Auth(Login/Signup/OTP)**: KeyboardAvoidingView 제거(키보드가 화면 안 밀어올림) + 이모지(✨🌙) 제거 + 입력창 수직 중앙정렬(상속 lineHeight 해제)
- **HomeScreen**: 인사말 시간대 이모지 + CTA `✨` 제거 (최근 꿈 감정 이모지는 유지)
- **Settings**: 약관/방침 외부 링크 항목 추가(`dreamteller.io.kr/terms.html`·`/privacy.html`)
- 모든 변경 `npx tsc --noEmit` 통과

### 채팅 프롬프트 + 완료 흐름 (백엔드) ⭐
- **이모지 금지**: `LUNA_SYSTEM_PROMPT` "0~2개 사용" → 이모지/이모티콘 금지. 첫 질문 🌙, Step5 ✨, fallback 이모지(✨😴🌙) 모두 제거. `PROMPT_GUIDE.md` 동기화
- **Step 5 완료 off-by-one 수정**: `_system_for_step` 마무리 분기 `step>=5` → `step>=4`. 사용자가 마지막 질문(감정)에 답한 그 응답에서 바로 `[RECORD_COMPLETE]` → 추가 입력 없이 요약 화면 이동
- **EC2 배포 완료**: 사용자가 `git pull && systemctl restart` 실행, health 200 확인. **백엔드 변경은 현재 설치 앱으로도 테스트 가능** (클라 재빌드 불필요)

### 다음 세션 시작 시 (실기기 검증 대기)
- 마지막 preview 빌드(`5c414af8`) 설치 후 검증: 채팅 완료 흐름(감정 답변→자동 마무리), 첫 질문/Luna/fallback 이모지 제거, Onboarding/Welcome/Auth/Home UI
- 검증 OK → Phase F(아이콘 → production 빌드 → TestFlight)
- 사용자 확인: 오늘 채팅 이모지 사라진 것 확인함

### 오늘 발생한 오류 및 해결 내역
1. **채팅 완료가 한 턴 늦게 트리거 (off-by-one)** — 감정(마지막 질문) 답변 후 추가 입력을 해야 `[RECORD_COMPLETE]`가 나옴. 마무리 멘트인데 사용자 입력을 요구하는 모순. → `_system_for_step` 분기를 `step>=4`로 내려 마지막 답변 턴에서 바로 완료되게 수정
2. **RecordChat 전송 시 키보드 닫힘** — `editable={!isStreaming}`로 전송 직후 입력창이 비활성화되며 iOS가 키보드를 dismiss. → 게이팅 제거(전송은 isStreaming/canSend로 이미 가드됨)
3. **Auth 입력창 텍스트/플레이스홀더 수직정렬 틀어짐** — `textStyles.body`의 `lineHeight(폰트×1.6)`가 단일행 TextInput에서 iOS 수직중앙을 깸. → `lineHeight: undefined` + `paddingVertical:0` + `textAlignVertical:center`
4. **WelcomeScreen 버튼을 과하게 위로 올림** — 1차에 브랜드+버튼을 묶어 상단으로 올렸더니 버튼이 너무 높음. → spacer를 브랜드와 버튼 사이로 옮겨 버튼 하단 복귀, 브랜드만 상단

---

## 이전 세션 요약 (2026-06-17, Phase E 착수 — 약관/방침 + 정적 사이트)

### Phase E-1: 약관/개인정보처리방침 확정본 ✅ 완료
- `docs/legal/TERMS.md` (서비스 이용약관 12조 + 부칙) + `docs/legal/PRIVACY.md` (개인정보처리방침 11조) 작성
- 실제 DB 스키마(profiles/dreams: 이메일·이름·꿈내용·감정·자각몽·대화내용)에 맞춰 수집 항목 기재
- **핵심 1 — AI 해몽 면책** (약관 제6조): 해몽은 오락·자기성찰용이며 의학적·심리학적 진단/치료 아님 명시
- **핵심 2 — 국외 이전/처리위탁** (방침 제5조): 꿈 내용이 Google Gemini(미국)로 전송됨을 표로 명시. Supabase·AWS는 서울 리전(ap-northeast-2). Gemini paid 티어라 모델 학습 미사용 문구 포함
- 확정 값: 운영자 **강영모(개인)** (추후 사업자 등록 시 상호로 갱신) / 보호책임자 강영모 / 문의 **support@dreamteller.io.kr** / 시행일 **2026-07-01** / 관할 운영자 주소지 관할법원

### Phase E-2: 정적 사이트 + Amplify 배포 구조 ✅ 완료 (배포는 콘솔 작업 대기)
- `dreamteller/web/` 신규: `index.html`(랜딩) + `terms.html` + `privacy.html` + `styles.css`(브랜드 토큰 적용) + `README.md`(배포 가이드)
- 게시본은 마크다운 원본의 "운영 메모" 블록 제외. 원본(편집용)은 `docs/legal/*.md` 유지 — 수정 시 양쪽 갱신
- Pretendard CDN + DESIGN_SYSTEM 컬러(다크 퍼플 톤)로 온브랜드 구성
- 리포 루트 `amplify.yml` 추가 (`baseDirectory: web`, 빌드 없는 정적 배포)
- 로컬 검증: `python3 -m http.server`로 4개 경로 모두 HTTP 200, 약관 12조/방침 11조 렌더 확인

### Phase E-3: Amplify 배포 + 도메인 연결 ✅ 완료 (2026-06-17)
- ✅ **Amplify Hosting 앱 생성** (Seoul 리전): GitHub `xxxxKangxxxx/Dreamteller` `main` 연동, amplify.yml 자동 인식(`baseDirectory: web`, 빌드 없음)
- ✅ 배포 성공 → 기본 도메인 `https://main.d3fwlu8189l35m.amplifyapp.com` 3개 페이지 렌더 확인
- ✅ **Custom domain `dreamteller.io.kr` 연결**: 루트 + www 모두 `main`, Amplify 관리형 SSL, Route 53 레코드 자동 생성. 리디렉션 없음(루트 직접 서빙)
- ✅ **외부 검증 통과** (curl): `dreamteller.io.kr` / `/terms.html` / `/privacy.html` / `www` 모두 HTTP 200, `api.dreamteller.io.kr/health` 200 (백엔드 영향 없음)
- 공개 URL 확정: `https://dreamteller.io.kr/terms.html`, `https://dreamteller.io.kr/privacy.html`

### Phase E-4: 문의처 이메일 결정 ✅ (2026-06-17)
- **결정**: 베타 단계는 **개인 Gmail `kang071911@gmail.com`**로 임시 운영. 정식 출시 때 `support@dreamteller.io.kr` 도메인 메일 구축
- 이유: SES는 발신 전용이라 도메인 메일 수신은 Cloudflare Email Routing/Google Workspace 등 별도 인프라 필요 → 베타 50명 규모엔 과함
- 약관/방침/랜딩/README의 문의처를 모두 `kang071911@gmail.com`으로 교체

### 다음 (Phase E 마무리 — 앱 작업)
- ⏳ **Settings 약관/방침 링크 실기기 동작 확인** — 코드(`SettingsScreen`)는 반영됨, 재빌드 필요 → Phase F production 빌드 때 함께 확인

### 차단점
- 없음. Phase E 사실상 종료(웹/도메인/문의처 완료). 남은 건 Phase F(TestFlight)에서 재빌드 + Settings 링크 확인

---

## 이전 세션 요약 (2026-06-15 ~ 06-17, Phase D 완료 + Phase C end-to-end 검증)

### Phase D — AWS SES + Custom SMTP + OTP 인증 ✅ 완료 (6/15~6/17)

#### 결정 변경: Resend → AWS SES (6/15)
- 기존 PROGRESS 5/22 결정(Resend)을 뒤집고 AWS SES로 전환
- 이유: AWS 통합 인프라 일관성(EC2/Route 53/IAM 단일 계정 관리) + 운영 비용 우위 + 한국 도달성 동일 수준
- 트레이드오프: SES는 Sandbox 신청 단계 1회 필요 (Resend는 즉시 production) → 실제로 30분 만에 자동 승인되어 부담 미미

#### Phase D-1: SES 도메인 identity + DNS (Seoul 리전, 6/15~6/16)
- ✅ AWS 콘솔 region: 처음 Tokyo 안내했으나 **사용자 지적으로 Seoul(ap-northeast-2) 지원 재확인** → AWS 공식 문서로 Seoul SMTP endpoint 존재 확인 → Seoul 사용 (EC2/Route 53과 같은 리전, 운영 일관성 ↑)
- ✅ SES Verified identity: `dreamteller.io.kr` (Easy DKIM RSA_2048_BIT, DKIM 서명 활성화)
- ✅ Custom MAIL FROM: `mail.dreamteller.io.kr` (MX 실패 시 기본 MAIL FROM domain 사용)
- ✅ Route 53 자동 발행 옵션 활성 → DKIM CNAME 3개 + MAIL FROM MX 1개 + MAIL FROM SPF TXT 1개 자동 추가
- ✅ DMARC: SES UI의 "Route53에 DNS 레코드 게시" 버튼으로 자동 추가 (`v=DMARC1; p=none;`)
- ✅ 검증: 도메인 status=확인됨 / DKIM=성공 / MAIL FROM=성공

#### Phase D-2: SMTP credentials 발급 (6/16)
- ✅ IAM 사용자 `ses-smtp-dreamteller-prod` 생성
- ✅ IAM 그룹 `AWSSESSendingGroupDoNotRename` 자동 생성 + `ses:SendRawEmail` 최소 권한
- ✅ SMTP credentials CSV 다운로드 (1회 노출)

#### Phase D-3: Production access 신청 (6/16, 즉시 승인)
- ✅ Case ID `178153647100105` 신청 → 4분 내 자동 승인 (도메인 검증 완료 + 트랜잭션 메일 use case)
- ✅ 발신 한도: 일 200 → 50,000통 / 1초당 1 → 14통

#### Phase D-4: Supabase Custom SMTP 연동 (6/16)
- ✅ host `email-smtp.ap-northeast-2.amazonaws.com` / port 587 (STARTTLS) / SMTP credentials
- ✅ sender `noreply@dreamteller.io.kr` (DreamTeller)
- ✅ URL Configuration 점검 (기존 OAuth 흐름 위해 dreamteller://auth-callback 유지)

#### Phase D-5: OTP 방식 전환 (Magic Link → OTP, 6/16) ⭐ 큰 결정
- **계기**: Magic link 흐름 검증 중 사용자 지적 — "Mac Chrome에서 confirm 링크 클릭하면 빈 탭만 보이고 토큰 1회 소비됨. 데스크탑 fallback 페이지가 운영에 필수"
- **결정**: 데스크탑 fallback 페이지(Amplify에 별도 페이지 추가) 만들기보다 **OTP 6자리 코드 방식**으로 전환. 이유:
  - 데스크탑/모바일 동일 UX (이메일에서 코드 보고 앱에 입력)
  - deep link / Universal Link 의존 X → `apple-app-site-association` 호스팅 불필요
  - **Phase E 스코프 축소** — Amplify는 약관/방침/랜딩만 처리
  - iOS `textContentType="oneTimeCode"` 자동 채움 지원 (메일 도착 시 키보드 위 6자리 suggestion)
- **Supabase 메일 템플릿 변경**: Confirm signup 템플릿을 `{{ .Token }}` 6자리 표시 + 한국어 + Pretendard 톤
- **클라이언트 변경 (5개 파일)**:
  - `services/authService.ts` — `supabaseAuth.verifySignupOtp(email, token)` + `resendSignupOtp(email)` 추가
  - `screens/auth/OtpVerifyScreen.tsx` — 신규 (6셀 + iOS 자동 채움 + 60s 재발송 쿨다운)
  - `screens/auth/SignupScreen.tsx` — session=null 분기에서 OtpVerify로 navigate
  - `navigation/types.ts` + `navigation/RootNavigator.tsx` — OtpVerify 라우트 등록
- **Supabase Email OTP Length 8 → 6 변경**: Supabase 기본값이 8자리로 잡혀있어서 클라이언트(6자리)와 불일치 → 콘솔에서 6으로 변경 (Supabase Dashboard → Authentication → Providers → Email → Email OTP Length)

#### Phase D-6: 실기기 end-to-end 검증 (6/16~6/17)
- ✅ **Gmail 도달 + 인증 + 자동 로그인 통과** (`kang071911+sestest4@gmail.com`)
- ✅ **Naver 도달 + 인증 + 자동 로그인 통과** (`dudah0719@naver.com`) — **받은편지함 도착** ⭐ deliverability 최상
  - 5/3 built-in SMTP는 네이버 도달 실패했던 케이스 → SES + DKIM/SPF/DMARC 인증으로 해결
- iOS 자동 채움(메일 도착 시 키보드 위 6자리 suggestion) 동작 확인

### Phase C — 실기기 end-to-end 검증 ✅ 완료 (6/17)
- 5/24부터 남아있던 Phase C 마지막 검증을 Phase D OTP 검증과 묶어서 처리
- ✅ RecordChat 5단계 대화 통과
- ✅ RecordSummary → 해몽 받기 → InterpretScreen 진입
- ✅ InterpretScreen v2 카드 정상 표시: headline + key symbol 칩 + perspective pill + affirmation 박스
- ✅ 홈에 새 dream이 Gemini가 생성한 한국어 명사구 title로 표시 (`21794bc` 5/29 백엔드 작업 검증)

### 비용 점검
- **베타 50명 기준 SES 월 비용 ~$0.01 (~₩15)** — 사실상 무료
- 10만 명 규모도 월 ~$5 수준 (~₩7,000)
- DreamTeller 비용 압도적 비중은 Gemini API (베타 월 ~$7), SES는 그 1% 수준

### 결정 사항
- **메일 인증 방식**: OTP 6자리 코드 확정 (Magic link 폐기) — Naver/Daum 등 한국 메인 메일 호환성 + 데스크탑 fallback 페이지 불필요
- **SES Region**: Seoul (ap-northeast-2) — EC2/Route 53과 같은 리전
- **MAIL FROM 도메인**: `mail.dreamteller.io.kr` (SPF/DMARC alignment)
- **DMARC 정책**: `p=none` 시작 (모니터링), 베타 후 quarantine 검토
- **Phase E 스코프 축소**: OTP 도입으로 `/auth-callback` 웹 페이지 / Universal Link 작업 불필요. Amplify는 약관/방침/랜딩만 처리

### 차단점
- 없음. Phase D + Phase C 모두 종료. 다음은 Phase E (약관/Amplify) + Phase F (TestFlight)

---

## 이전 세션 요약 (2026-05-24 ~ 05-29, AWS Phase A·B 완료 + Phase C 진행 + UI/기능 fix 6개)

### Phase A — AWS 계정 + 도메인 등록 + DNS 위임 ✅ 완료 (5/24)
- AWS IAM 사용자 `dreamteller-admin` 셋업 (AdministratorAccess + MFA `dreamteller-Authenticator`)
- 가비아 보유 도메인 `dreamteller.io.kr` → Route 53 hosted zone 생성
- 가비아 NS를 Route 53 NS 4개로 교체 (`ns-7.awsdns-00.com` / `ns-855.awsdns-42.net` / `ns-1453.awsdns-53.org` / `ns-1760.awsdns-28.co.uk`)
- NS 전파 즉시 완료 (`.kr` 도메인 KISA 빠른 처리)

### Phase B — EC2 백엔드 배포 ✅ 완료 (5/24)
- EC2 **t4g.micro ARM Graviton** (Ubuntu 24.04 LTS, ap-northeast-2)
- Elastic IP `54.116.7.53` 할당 + Route 53 A 레코드 `api.dreamteller.io.kr`
- SSH key `~/.ssh/dreamteller-ec2-key.pem` chmod 400
- 시스템 패키지: Python 3.12.3 + nginx 1.24.0 + Certbot 2.9.0 + git 2.43.0
- GitHub clone (`/home/ubuntu/Dreamteller`) + venv + `pip install -r requirements.txt` (ARM aarch64 wheels)
- `/home/ubuntu/dreamteller.env` scp 안전 전송 (ubuntu:ubuntu 600)
- systemd `dreamteller.service` (`User=ubuntu`, `Restart=always`, uvicorn 127.0.0.1:8000)
- nginx reverse proxy + Let's Encrypt SSL (`https://api.dreamteller.io.kr`, 만료 2026-08-22, 자동 갱신)
- 운영 URL `https://api.dreamteller.io.kr` 가동 + `/health` HTTP 200 검증

### Phase C — 클라이언트 EAS 환경변수 + 재빌드 ⏳ 부분 완료 (5/24~5/25)
- ✅ EAS env 6개 등록 (preview 3 + production 3): `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (sensitive)
- ✅ preview 재빌드 성공 — 빌드 로그에서 env 정상 로드 확인 ("Environment variables ... loaded from the preview environment")
- ✅ iPhone 재설치 + 로그인 통과 (이전 5/22 빌드의 splash 멈춤 해소)
- ✅ **end-to-end 검증 (홈 데이터/3개/탭→상세)** 통과:
  - "최근 꿈" 실제 백엔드 데이터 표시
  - 최대 3개 slice 적용
  - 탭 → `InterpretDetail` 이동 정상
- ⏳ **Gemini title 자동 생성 검증** + 5단계 대화 + 해몽 v2 검증은 다음 세션 예정

### 기능/UI Fix 7개 (5/25~5/29)
1. **`HomeScreen.tsx` 실 데이터 wiring** ⭐ — 5/2 이후 stub 상태였던 게 검증 중 발견
   - `SAMPLE_DREAMS` 하드코딩 제거 (`구름 위에서 날다` / `어두운 숲의 낯선 만남` 2개 고정)
   - `useDreams` hook 연결 + `slice(0, 3)` 최대 3개 + `onPress` → `InterpretDetail` 네비게이션
   - Loading (Skeleton 3개) / Error / Empty 상태 처리 (ArchiveScreen 패턴)
   - commit `e2f8d91`
2. **백엔드 Gemini title 자동 생성** ⭐ — 기존 `title=""` 빈 문자열로 저장 → 클라이언트 "제목 없는 꿈" fallback 문제 해결
   - `app/services/gemini_service.py`에 `generate_title(dream_content) -> str` 추가
   - 5~15자 한국어 명사구 prompt, 2회 retry, 실패 시 raw_content 앞 20자 fallback
   - `app/routes/dreams.py`의 `create_dream`에서 호출 (해몽 받기 분기 외 그냥 저장 분기에도 동일 적용)
   - 기존 데이터(title="") 백필 안 함 — 베타 본인 데이터뿐, 새 dream부터 적용
   - 추가 호출 ~$0.002/건 (무시 가능), latency +1s
   - commits `21794bc` + EC2 git pull + `systemctl restart dreamteller`
3. **RecordChat 키보드 가림 1차 fix** — `presentation: 'modal'` (iOS pageSheet sheet) → **`'fullScreenModal'`** 전환
   - iOS modal sheet 안에서 `KeyboardAvoidingView`가 키보드 높이 좌표 잘못 계산하던 문제
   - SafeAreaView edges `['top']` → `['top', 'bottom']` (홈 인디케이터 영역 처리 시도)
   - commit `31f3cef`
4. **RecordChat 상단/하단 safe area 미적용 2차 fix** — fullScreenModal 안에서 `SafeAreaView` edges prop이 동작 안 함 (iOS 26 + react-native-safe-area-context modal 호환성 이슈)
   - 증상: 헤더 X 버튼이 status bar(`00:07`) 옆에 겹침, 입력창이 홈 인디케이터에 닿음
   - 해결: `SafeAreaView` 제거 + `useSafeAreaInsets` hook으로 명시적 padding (`paddingTop: insets.top`, `paddingBottom: max(insets.bottom, spacing.sm)`)
   - commit `a70f5bc`
5. **RecordChat 키보드 padding 3차 fix** — 키보드 올라온 상태에서 입력창 아래 ~100px 빈 공간 발생
   - 원인: `KeyboardAvoidingView`가 키보드 높이만큼 위로 올렸는데, inputRow의 `paddingBottom: insets.bottom`(34px)이 그대로 남아 이중 처리
   - 해결: `Keyboard.addListener('keyboardWillShow'/'Hide')`로 visible state 추적 → keyboardVisible 시 `spacing.sm`만, 아니면 `max(insets.bottom, spacing.sm)`
   - commit `5e73b15`

### 백엔드 EC2 재배포 흐름 확립 (5/25)
- 로컬 commit + push → EC2 SSH → `git pull` + `sudo systemctl restart dreamteller`
- 첫 health는 startup 직전이라 502 가능 (3~5초 후 정상)

### IP 변동 이슈 (5/25)
- 사용자 ISP가 IP를 자주 갱신 (KT 대역) — `118.235.10.154` → `118.235.11.173` → `58.148.50.229` (5/24 ~ 5/25 사이 두 번 변경)
- 매번 EC2 보안 그룹 SSH 소스 IP 수동 업데이트 → 부담
- 영구 해결책 백로그: **AWS Systems Manager Session Manager** 도입 (PROGRESS [7]에 추가)

### 결정 사항
- **`HomeScreen.tsx`는 처음부터 stub이었음** — PROGRESS의 "실 구현" 표기를 신뢰하지 말고 검증 단계에서 항상 실제 동작 확인. 메모리 백로그
- **title 자동 생성 방식**: Gemini (b) 채택 — 의미 있는 한국어 짧은 제목. (a) raw_content 첫 N자 대비 품질 우위, 비용 미미
- **RecordChat presentation**: `fullScreenModal` 확정 — iOS modal sheet는 키보드 호환성 이슈로 비추
- **safe area 처리 패턴**: `SafeAreaView` 대신 `useSafeAreaInsets` 권장 — modal 안에서 더 안정적

### 차단점
- 없음. Step 4 (Gemini title + 5단계 + 해몽 v2 end-to-end) 검증만 남음

---

## 이전 세션 요약 (2026-05-22)

### 완료
1. **Gemini API paid tier 전환** ⭐ — 무료 티어에서 paid (Tier 1)로 전환 완료
   - AI Studio Billing 연결 + 결제 수단 등록 + Plan: Paid 활성화 (AI Studio "Tier 1" 라벨로 확인)
   - **이중 spending cap 설정** (무료 티어 일 20회 + 4/27 cap $0 사고 재발 방지):
     - Cloud Billing 예산 알림: ₩10,000/월 (DreamTeller 프로젝트 한정, 50%/90%/100% 알림)
     - AI Studio 자체 월 지출 한도: ₩15,000 (실제 차단 가능)
   - **API key는 그대로 사용** — 프로젝트의 plan만 paid로 바뀌는 구조라 `server/.env` 변경 불필요
   - 효과: 무료 티어 프롬프트 3년 Google 열람 위험 해소 + RPM/RPD 한도 대폭 완화 + 503 UNAVAILABLE 빈도 감소
2. **End-to-end 검증** ⭐ — 로그인 → 홈 → RecordChat 5단계 → RecordSummary → 해몽 generate → InterpretScreen까지 한 번에 통과
   - dev-client 재빌드 필요 (시뮬레이터 데이터 wipe 후 첫 부팅) — `npx expo run:ios --port 8082 --device "iPhone 17 Pro"`로 빌드 성공
   - RecordChat 5단계 모두 paid tier 정상 응답 (4/27/4/28에 step 5에서 quota 막혔던 흐름 통과)
   - 해몽 generate ~1분 내 완료, v2 구조화 응답 정상 (headline + keySymbols 4개 + perspective "융 심리학" pill + splitIntoParagraphs 단락 본문)
   - 꿈 내용("학교/고등학교 친구/닫힌 문/좀비 선생님")에 깊이 있는 한국어 해석 — 품질 양호

### 결정 사항
- **모델 선택**: Gemini 2.5 Flash 유지 (Claude/GPT 대비 가성비 압도적, 베타 50명 기준 월 $7 수준)
- **품질 전환 트리거**: 베타 사용자 피드백에서 "해몽 평이/감성 부족" 의견 다수 시 Claude Haiku로 A/B 테스트 검토 (gemini_service.py만 교체 가능한 구조)
- **개발 환경**: Confirm email OFF로 다시 원복했었으나, 이번 검증은 기존 계정으로 로그인했어서 영향 없음

### 완료 (이어서)
3. **EAS Build 사전 셋업** ⭐ — TestFlight 베타 배포 인프라 1차 구성
   - `eas-cli` 19.0.8 글로벌 설치 + Expo 로그인 (`dudah0719`, kang071911@gmail.com)
   - `eas init` → EAS 프로젝트 등록 (`@dudah0719/dreamteller`, ID `fb74201f-a835-4375-9259-b3b81dd3e4ac`)
   - `app.json`에 `extra.eas.projectId` + `owner` 자동 추가
   - `eas build:configure` → `eas.json` 생성 (development/preview/production 3 프로파일, 표준 템플릿)
   - EAS 대시보드: https://expo.dev/accounts/dudah0719/projects/dreamteller
4. **Apple Developer 인증서 + Provisioning Profile 자동 발급**
   - Apple ID `dudah0719@naver.com` + 2FA로 EAS에 Apple 계정 연결
   - Team: `yeongmo kang (Y99467L298)` (Individual)
   - Bundle ID `com.dreamteller.app` Apple Developer Portal에 자동 등록 + Push Notifications capability 활성화
   - **Distribution Certificate** 자동 생성 (만료 2027-05-22)
   - **Provisioning Profile** 자동 생성 (`*[expo] com.dreamteller.app AdHoc 1779456107278`, 만료 2027-05-22)
   - 본인 iPhone UDID `00008120-001164982E00C01E` Apple Developer 계정 등록 (Internal distribution 용)
   - Apple Push Notifications Key 자동 생성 (미래 push reminder 도입 대비)
5. **EAS preview 빌드 1회 성공 + iPhone 설치 → 런타임 실패** ⚠️
   - 빌드 자체는 EAS 클라우드에서 정상 완료 → 본인 iPhone에 QR 코드로 install 성공
   - 그러나 앱 부팅 시 **splash 화면에서 멈춤** (런타임 실패)
   - 원인 진단:
     - EAS 빌드 시점에 환경변수 0개 (`No environment variables ... found for the "preview" environment on EAS.`)
     - `services/supabase.ts:9-13`에서 `EXPO_PUBLIC_SUPABASE_URL` 없으면 모듈 import 즉시 throw → 앱 진입 불가
     - 추가로 `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api`는 iPhone에서 절대 접근 불가 (localhost는 iPhone 자기 자신)
   - 결정: 통합 인프라 트랙 완료 후 운영 URL로 재빌드 (지금 임시 LAN IP/ngrok 우회 안 함)

### 결정 사항 (Gemini)
- **모델 선택**: Gemini 2.5 Flash 유지 (Claude/GPT 대비 가성비 압도적, 베타 50명 기준 월 $7 수준)
- **품질 전환 트리거**: 베타 사용자 피드백에서 "해몽 평이/감성 부족" 의견 다수 시 Claude Haiku로 A/B 테스트 검토 (gemini_service.py만 교체 가능한 구조)

### 결정 사항 (AWS 통합 인프라 트랙) ⭐ 큰 결정
사용자가 도메인 구매 + AWS 인프라 통합 배포로 점프 결정. 흩어져 있던 PROGRESS [3] 약관 / [6] 도메인+SMTP / 백엔드 배포를 **단일 통합 트랙**으로 재구성.

| 컴포넌트 | 서비스 | 역할 |
|---|---|---|
| **백엔드 호스팅** | **AWS EC2** (t3.micro, ap-northeast-2, Ubuntu 24.04 LTS) | FastAPI uvicorn + systemd + nginx reverse proxy + Certbot Let's Encrypt SSL → `api.<도메인>` |
| **도메인 + DNS** | **AWS Route 53** (예정) | hosted zone, A/CNAME/MX/TXT 레코드 통합 관리 |
| **약관/랜딩 호스팅** | **AWS Amplify Hosting** | 정적 페이지 (`/terms`, `/privacy`, 메인) → `<도메인>` 루트 |
| **메일 SMTP** | **Resend** + Route 53 도메인 검증 (SPF/DKIM) | `noreply@<도메인>` sender, Supabase Custom SMTP |
| **클라이언트 환경변수** | **EAS Environment Variables** | `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

#### 백엔드를 EC2로 결정한 이유
- 베타 단계 비용 최소 (t3.micro **무료 1년**, 이후 $8~10/월. App Runner $25/월 대비 1/3)
- 완전한 컨트롤 (SSH 디버깅, Linux 운영 학습 가치)
- 베타 사용자 100명 이내까지 t3.micro 1대로 충분
- 트레이드오프: 셋업 4~8h (App Runner 1~2h 대비), 보안 패치/SSL 갱신/로그 회전 직접 관리

#### Amplify 활용 영역 결정
- Amplify를 **백엔드(FastAPI)에는 부적합** 판단 → Lambda 기반은 cold start + 15min 한도 + streaming 제약
- Amplify Hosting은 **약관/랜딩 정적 페이지에만** 활용 (사용자가 이미 익숙한 서비스)

#### 미정 결정 사항 (다음 세션에서 결정)
- 도메인 이름 (`dreamteller.app` / `.kr` / `.io` / `.com` 등)
- 도메인 등록처 (Route 53 vs Cloudflare vs 가비아)
- AWS 계정 보유 여부 + 결제 수단 등록
- GitHub `dreamteller/server/` push 상태

### 차단점
- preview 빌드 런타임 실패 — AWS 통합 트랙 완료 후 운영 URL + EAS env 등록 + 재빌드로 해소 예정

### 빌드 시 발견 이슈 (해결됨)
1. **`build.db is locked`** — 첫 번째 `expo run:ios` 백그라운드가 정리 안 된 채 두 번째 시도 시 발생
   - 해결: `pkill -9 xcodebuild` + `pkill -9 XCBBuildService`로 lock 잡고 있던 프로세스 정리 후 재시도 성공
   - 재발 방지: 빌드 백그라운드 실행 중단 시 xcodebuild 관련 프로세스도 함께 정리 필요
2. **`services/supabase.ts` import 시점 throw** — 환경변수 없으면 모듈 로드 즉시 throw해서 앱이 silent fail (splash 멈춤)
   - 현재는 dev 단계라 OK지만, **운영 빌드에서는 ErrorBoundary 또는 fallback UI 추가 검토** (배경 트랙 백로그)
   - PROGRESS 백로그에 등재

---

## 이전 세션 요약 (2026-05-07)

### 완료
1. **Pretendard 폰트 도입 (트랙 A)** ⭐ — 시스템 폰트 fallback에서 Pretendard 4종으로 전환
   - 패키지: `expo-font`, `expo-splash-screen` 신규 설치 (Expo SDK 54 core 모듈, dev-client 재빌드 불필요)
   - 폰트 파일: Pretendard v1.3.9 공식 release에서 표준 OTF 4종 다운로드 → `app/assets/fonts/`에 배치
     - `Pretendard-Regular.otf` / `Pretendard-Medium.otf` / `Pretendard-SemiBold.otf` / `Pretendard-Bold.otf` (총 ~6MB)
   - `App.tsx`: `useFonts` hook + `SplashScreen.preventAutoHideAsync()` → 폰트 로드 완료 시 `hideAsync()`. 로드 중엔 `null` 반환으로 스플래시 유지
   - `app.json`: `expo-font` config plugin 자동 등록 (옵션 없음, 추후 native 임베드 시 fonts 배열 추가 검토)
   - `typography.ts`는 이미 `Pretendard-Regular/Medium/SemiBold/Bold` 4종을 fontFamily로 지정해두고 있어 별도 코드 변경 없이 즉시 적용
2. **시뮬레이터 검증** — 시뮬레이터 재시작 후 스크린샷으로 확인
   - 가중치 4종 차이가 살아있음 (heading Bold / body Regular / 카드 SemiBold) → 4종 모두 정상 로드 증거
   - 한글 자형이 Apple SD Gothic Neo(시스템)와 다른 Pretendard 특유 modern san-serif로 표시
   - 영문/숫자도 시스템 SF Pro와 다른 자형 (Inter 기반)
   - 앱 부팅 정상 (스플래시 → 홈 진입 정상, Tab/Card/Toast 등 모든 UI 정상)

### 결정 사항
- **Pretendard 4종(400/500/600/700)으로 확정** — 9종 풀세트 대비 ~60% 용량 절감, `typography.ts`에서 사용하는 가중치만 포함
- **정적 OTF 사용** (Variable 폰트 아님) — RN에서 fontWeight 분기 안정성 우선
- **useFonts hook 방식 채택** (config plugin 임베드 X) — dev-client 재빌드 불필요, OTA 업데이트와 호환
- **앱 아이콘은 사용자 직접 제작 후 첨부** — 사양 가이드는 PROGRESS [2] 항목 참조

### 차단점
- 없음

---

## 이전 세션 요약 (2026-05-03)

### 완료
1. **Email confirm On 케이스 검증** — Supabase 콘솔에서 "Confirm email" 토글 ON 후 시뮬레이터에서 신규 가입 테스트
   - 클라이언트 fallback 정상 동작 확인: `signUpWithEmail` 응답에 session=null → SignupScreen이 "메일 확인 필요" Alert 표시 → 확인 누르면 Login 화면으로 정상 이동 → 자동 홈 진입 안 함
   - 검증 후 Supabase 콘솔에서 Confirm email 토글 OFF로 원복 (개발 편의). 운영 직전 다시 ON 예정
2. **Custom SMTP 도입 시점 결정** — TestFlight 베타 직전으로 미룸
   - Supabase 콘솔이 명시적으로 경고: built-in 이메일 서비스는 rate limit 있고 운영용 아님 ("not meant to be used for production apps")
   - 검증 중 네이버 메일(`dudah0719@naver.com`)에 confirm 메일 미도착 — built-in SMTP 도메인 평판 + 네이버 스팸 필터 조합으로 추정
   - 도메인 미보유 상태라 지금 Resend `onboarding@resend.dev` 임시 셋업해도 운영용 sender로 결국 갈아엎어야 함 → 도메인 구매 + 약관 호스팅 + Custom SMTP를 한 번에 묶어 처리하기로 결정

### 결정 사항
- **Custom SMTP**: Resend 권장 (100통/일 무료, 한국 평판 무난). 도메인 확보 후 SPF/DKIM 인증 + Supabase SMTP Settings 입력
- **도메인**: 약관 호스팅, 마케팅 페이지, 메일 sender에 모두 필요 → 배포 준비 트랙에서 통합 처리
- **현재 Auth 운영 모드**: Confirm email OFF로 유지 (개발 단계). 운영 직전 ON + Custom SMTP 동시 전환

### 차단점
- 없음. 다음 작업으로 진행 가능

---

## 이전 세션 요약 (2026-05-02)

### 완료
1. **해몽 응답 구조화 (백엔드 v2)** ⭐ — 평문 3개(symbolAnalysis/psychologicalMeaning/unconsciousMessage) → 풍부한 JSON 객체로
   - 각 파트: `{headline, detail, ...}` + symbol에는 `keySymbols[{symbol, meaning}]`, psychological에는 `perspective`, unconscious에는 `affirmation`
   - 마이그레이션 `002_interpretations_payload.sql` — `interpretations.payload jsonb` 컬럼 추가 (Supabase에서 적용 완료). 기존 평문 3개 컬럼은 호환용 fallback으로 유지
   - `app/services/gemini_service.py` — 새 프롬프트(v2) + JSON 정규화(`_normalize_interpretation_payload`) + JSON 파싱 실패 시 평문으로 흡수하는 fallback
   - `app/utils/interpretation.py` 신설 — DB row(payload 우선, 없으면 평문) → 클라이언트 응답 직렬화 단일 경로. interpret.py / dreams.py 둘 다 사용
   - `docs/PROMPT_GUIDE.md` 섹션 2 v2 형식으로 갱신 (하드코딩 금지 규칙 준수)
2. **InterpretCard 재설계 (에디토리얼 톤)** ⭐ — "AI가 쓴 글 그대로 붙여넣기" 느낌 제거
   - 헤더: 인덱스 번호(01/02/03) + 영문 라벨(SYMBOL/PSYCHOLOGY/UNCONSCIOUS) + 한국어 보조 라벨 + perspective pill(있을 때만)
   - 헤드라인(20~40자) — heading3 + letter-spacing 조정
   - 키 심볼 태그 — 라운드 보더 + 컬러 dot + symbol·meaning 한 줄
   - 본문 — `utils/text.ts` `splitIntoParagraphs`로 마침표/물음표/느낌표 기준 두 문장씩 단락 분리. line-height 25
   - affirmation — 얇은 보더 단일 박스 (`NOTE TO SELF` 라벨 + 한 줄 메시지)
   - 좌측 진한 액센트 띠는 사용자 피드백으로 제거 → 카드 외곽선만 균일한 선
3. **카드 스타일 토글 시도 → 단일 Galaxy로 정착**
   - 1차: Galaxy/Mist/Neon 3종 + AsyncStorage 영속 토글 (`CardStyleToggle.tsx`, `useDreamCardStyle.ts`) 구현
   - 2차: 사용자 결정으로 Mist/Neon 제거 → 단일 `DREAM_CARD_STYLE` (Galaxy 토큰만 export)
   - 토글 컴포넌트/훅 파일 + AsyncStorage 영속화 코드 정리, navigation `DreamCard` 라우트의 `styleId?` 파라미터도 제거
4. **DreamCardScreen 실 구현** ⭐ (Placeholder → 캡처+저장+공유)
   - 패키지: `expo-linear-gradient` + `react-native-view-shot` + `expo-sharing` + `expo-media-library` (4개 native module 추가 → dev-client 재빌드 1회)
   - `app.json`에 `expo-media-library` 플러그인 등록 (한국어 사진 권한 메시지: `photosPermission`/`savePhotosPermission`)
   - 캡처 영역: 날짜 + 꿈 제목 + 감정 태그 + 3섹션(인덱스 라벨 + 헤드라인 + 본문 단락) + affirmation 박스 + `DREAMTELLER` 워터마크 (FREE 플랜 표시)
   - 저장: `MediaLibrary.requestPermissionsAsync` → `saveToLibraryAsync` → 토스트
   - 공유: `Sharing.shareAsync(uri, {mimeType: 'image/png'})` → iOS Share Sheet
5. **세련화 패스 — 이모지 제거 + 본문 가독성**
   - InterpretCard 헤더 이모지 🔮/🧠/✨ 제거 → 인덱스 라벨로 대체
   - DreamCardScreen 워터마크 🌙 제거, 감정 pill의 이모지 제거 → `EmotionTag` 신규 컴포넌트(컬러 dot + 라벨)로 InterpretScreen/DreamCardScreen에 공통 사용
   - 카드 스타일 토글의 🌌/🌫️/⚡ 이모지도 제거되었다가 토글 자체가 사라짐
6. **토스트 위치 정리** — App.tsx 글로벌 `<ToastContainer />`에 `topOffset={48}` 부여 → 모든 헤더(48px) 아래에 일관되게 표시. RecordChatScreen은 modal이라 별도 ToastContainer 유지

### 검증 (시뮬레이터 실측)
- ✅ 새 꿈 1건 기록 → RecordChat 5단계 → RecordSummary → 해몽 받기 → InterpretScreen에서 새 구조화 카드 표시 (헤드라인/심볼 칩/perspective pill/affirmation 모두 채워짐)
- ✅ 기존 dream("구름 위에서 날다")은 평문 fallback으로 정상 표시 (headline/symbols/affirmation은 비어 있고 본문만, `splitIntoParagraphs`로 자동 단락 분리되어 가독성 개선)
- ✅ DreamCardScreen 진입 → 미리보기 → "사진 앱에 저장" → 권한 Alert → 저장 토스트(헤더 아래 정상 표시)
- ✅ 공유 버튼 → iOS Share Sheet 표시 (단, 시뮬레이터 한계로 AirDrop/메시지 항목은 누락 — 실기기에서 정상)

### 환경 변경
- 4개 native module 추가로 dev-client 재빌드 1회 (`npx expo prebuild --platform ios` → `pod install` (98 deps) → `npx expo run:ios --port 8082 --device "iPhone 16e"`)
- 기존 처럼 `cd app && npx expo run:ios --port 8082 --device "iPhone 16e"`로 시뮬레이터 기동
- 백엔드는 `--reload` 모드라 새 코드 자동 반영, Supabase migration 002 적용 완료

### 직전 차단점
- 없음 — Step B(새 꿈 생성)/Step C(저장/공유) 모두 통과

---

## 이전 세션 요약 (2026-04-30)

### 완료
0. **OnboardingScreen 실 구현** — Placeholder → SPEC 명세 그대로 3단계 슬라이드
   - `FlatList horizontal pagingEnabled` + `onMomentumScrollEnd`로 currentIndex 추적
   - 슬라이드: 🌙 "꿈을 잊기 전에 / AI가 먼저 물어볼게요" → 🔮 "꿈에 숨겨진 이야기 / 당신만의 의미로 해석해드려요" → 📖 "나만의 꿈 세계관 / 아카이브로 차곡차곡 쌓아가요"
   - 상단 우측 "건너뛰기"(페이지 1·2만 표시) → Login 직행
   - 하단 dot indicator (active 18px×6px / 비활성 6×6, primaryLight/borderLight)
   - 하단 CTA: 페이지 1·2 "다음" 단일 버튼(`scrollToIndex`) / 페이지 3 "로그인" + "회원가입" 두 버튼 (SPEC 명세 그대로)
   - 디자인 토큰 100% 사용(colors/spacing/textStyles), SafeAreaView 상하 edges로 노치 대응
   - `npx tsc --noEmit` 통과
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

> 정책:
> - Apple 로그인은 배포 후 추가 예정.
> - native Google Sign-In SDK 마이그레이션은 현 UX(두 번째 로그인부터 한 번 탭 자동 통과)로 충분하다 판단되어 백로그에서 제외 — 추후 불편 시 재논의.
> - 도메인 + 백엔드 호스팅 + 약관 + SMTP는 **AWS 단일 통합 트랙 [6]**으로 일괄 진행 (5/22 결정). 이전 PROGRESS의 분산된 [3]·[6]·[7] 항목은 모두 [6] AWS 통합 인프라 배포로 흡수됨.

### 🚀 배포 전

#### [1] 남은 stub 화면 처리 ⭐
- ✅ **OnboardingScreen** — 2026-04-30 실 구현 완료 (3단계 슬라이드 + dot indicator + 마지막 페이지 로그인/회원가입)
- ✅ **DreamCardScreen** — 2026-05-02 실 구현 완료 (해몽 응답 구조화 + InterpretCard 재설계 + Galaxy 단일 스타일 + 캡처/사진 저장/Share Sheet)
- **CharacterDetailScreen** — Phase 2 보류 결정. ArchiveScreen 캐릭터 탭 + AI 캐릭터 추출 파이프라인이 같이 도입될 때 본격 구현 (Phase 2: AI 일러스트 + 캐릭터 추출 묶음)

#### [2] 디자인 에셋 + Pretendard 폰트
- ✅ **Pretendard 도입** — 2026-05-07 완료 (정적 OTF 4종 + useFonts + SplashScreen 가드)
- ✅ **앱 아이콘** — 2026-06-19 완료. SVG 코드로 직접 제작(구름 속 노란 초승달 + 밤하늘 별빛). 원본 `app/assets/icon-master.svg` 보존 → `rsvg-convert`로 4종 재생성 가능
  - `app/assets/icon.png` (1024², 알파 없음) / `adaptive-icon.png` / `splash-icon.png` / `favicon.png` 모두 교체 완료
- ✅ **스플래시** — `splash-icon.png` 교체로 자동 적용

#### [3] Gemini 운영 직전 유료 전환
- ✅ **2026-05-22 paid tier 전환 완료** — AI Studio "Tier 1" 활성화 + 이중 cap (Cloud Billing 예산 ₩10,000 알림 + AI Studio 한도 ₩15,000 차단)
- ✅ end-to-end 검증 통과 (RecordChat 5단계 + 해몽 v2 generate 정상)
- 운영 모니터링: 베타 시작 후 https://ai.studio/spend 에서 실제 사용량 추적, 50% 알림 도달 시 cap 상향 검토

#### [4] Email confirm On 케이스 검증
- ✅ **2026-05-03 클라이언트 fallback 검증 완료** — Confirm email ON에서 가입 시 SignupScreen이 "메일 확인 필요" Alert → Login 화면 전환 정상. 검증 후 토글 OFF로 원복
- ⏳ **메일 실제 도달 검증은 통합 인프라 트랙 [6] Phase D 완료 후 재시도** (Custom SMTP 도입 의존)

#### [5] EAS Build 사전 셋업 + Apple Developer credentials
- ✅ **2026-05-22 EAS CLI + Expo 프로젝트 등록 + Apple credentials 자동 발급 완료**
  - `eas-cli` 19.0.8 / Expo 계정 `dudah0719` / 프로젝트 ID `fb74201f-a835-4375-9259-b3b81dd3e4ac`
  - Apple Team `Y99467L298` / Distribution Certificate + Provisioning Profile (만료 2027-05-22)
  - 본인 iPhone UDID `00008120-001164982E00C01E` Internal distribution 등록
  - APNs Key 자동 생성 (push reminder 도입 대비)
- ✅ **preview 빌드 1회 클라우드 빌드 성공 + iPhone 설치 성공**
- ⚠️ **런타임 실패** — 환경변수 0개로 빌드되어 `services/supabase.ts` import 시점 throw → splash 멈춤. 통합 인프라 트랙 [6] 완료 후 재빌드 예정

#### [6] AWS 통합 인프라 배포 ⭐ 가장 큰 트랙
> 백엔드 호스팅 + 도메인 + DNS + 약관 호스팅 + Custom SMTP를 **AWS 중심 단일 트랙**으로 통합 진행 (5/22 결정). 이전 PROGRESS의 [3]·[6]·[7]을 통합.

**아키텍처 확정 사항**
| 컴포넌트 | 서비스 | 산출물 |
|---|---|---|
| 백엔드 호스팅 | **AWS EC2 t4g.micro** (ARM Graviton, ap-northeast-2, Ubuntu 24.04 LTS) | `https://api.dreamteller.io.kr` (FastAPI + nginx + Let's Encrypt) |
| 도메인 + DNS | **AWS Route 53** (도메인 등록은 가비아 유지, NS는 Route 53 위임) | hosted zone, A/CNAME/MX/TXT 통합 관리 |
| 약관/랜딩 호스팅 | **AWS Amplify Hosting** | `https://dreamteller.io.kr/terms`, `/privacy`, 루트 랜딩 |
| 메일 SMTP | **Resend** + Route 53 도메인 검증 (SPF/DKIM) | `noreply@dreamteller.io.kr` sender |
| 클라이언트 환경변수 | **EAS Environment Variables** | preview/production 분리 등록 |
| AWS 계정 관리 | **IAM 사용자** `dreamteller-admin` + AdministratorAccess + MFA | 루트 직접 사용 차단, 일상 작업은 IAM 사용자 |

**확정 사항** (5/24 결정)
- ✅ **도메인 이름**: `dreamteller.io.kr` (가비아 등록, ~₩15,000/년 추정)
- ✅ **도메인 등록처**: 가비아 유지 (.kr 한국 도메인) + **NS는 Route 53 위임**
- ✅ **AWS 계정**: 보유 (`920372986654` / Kang), IAM 사용자 `dreamteller-admin` 셋업 완료
- ✅ **GitHub server push**: 5/24 재푸시 완료 (5/2~5/22 누적 변경사항 3개 commit으로 분할)
- ✅ **EC2 아키텍처**: ARM (Graviton t4g.micro) — DreamTeller 의존성 모두 ARM 호환, 30% 더 빠르고 20% 더 저렴

**미래 확장 (Phase 2+) — 현재 EC2 설정 변경 없이 추후 도입 가능** ⭐
| 항목 | 도입 시 작업 | 현재 영향 |
|---|---|---|
| **Supabase → AWS RDS PostgreSQL** | 같은 VPC에 RDS PostgreSQL (db.t4g.micro) 추가 / RDS 전용 SG 만들고 EC2→RDS 5432 허용 / `pg_dump`로 Supabase 데이터 → `pg_restore`로 RDS / 코드: `supabase-py` → `asyncpg`+`sqlalchemy` / Auth는 Supabase Auth 유지 또는 자체 JWT로 이전 | EC2 인스턴스 그대로, VPC 같이 두면 됨 |
| **S3 파일 스토리지** | S3 bucket 생성 / IAM Role (S3 액세스) 생성 후 EC2 인스턴스에 attach / 코드: `boto3` 또는 `aioboto3` / 권장 패턴: **Presigned URL** (백엔드 발급, 클라이언트 직접 업로드 → 서버 부하 최소화) | EC2 그대로, IAM Role은 인스턴스 생성 후에도 부여 가능 |
| **CloudFront CDN** (선택) | S3 + CloudFront 연결 / Route 53 CNAME `cdn.dreamteller.io.kr` | 이미지 latency 개선용, 베타엔 무관 |

→ 현재 EC2 t4g.micro + EBS 30GiB + 기본 VPC + SG 3 규칙 설정으로 미래 확장도 수용 가능. 추후 도입 시점에 RDS/S3/IAM Role 추가만 하면 됨.

**Phase A — AWS 계정 + 도메인 등록 + DNS 위임** ✅ 완료 (2026-05-24)
- ✅ AWS 계정 보유 + IAM 사용자 `dreamteller-admin` 셋업 + MFA
- ✅ 가비아에서 `dreamteller.io.kr` 도메인 보유 (기존)
- ✅ Route 53 hosted zone 생성 (`dreamteller.io.kr`)
- ✅ 가비아 NS를 Route 53 NS 4개로 교체 (`ns-7.awsdns-00.com` / `ns-855.awsdns-42.net` / `ns-1453.awsdns-53.org` / `ns-1760.awsdns-28.co.uk`)
- ✅ NS 전파 즉시 완료 (`dig NS dreamteller.io.kr +short` 통과)

**Phase B — EC2 백엔드 배포** ✅ 완료 (2026-05-24)
- ✅ EC2 인스턴스 생성 (**t4g.micro ARM Graviton**, Ubuntu 24.04 LTS, ap-northeast-2, 기본 VPC)
  - 키 페어 `dreamteller-ec2-key` (RSA .pem, `~/.ssh/dreamteller-ec2-key.pem` chmod 400)
  - 보안 그룹 `dreamteller-api-sg`: 22(SSH `118.235.11.173/32`) / 80, 443(전체) / 8000은 외부 차단 (nginx만 접근)
  - 고급: 인스턴스 자동 복구 활성화 / 종료 방지 활성화 / 크레딧 사양 표준 / IMDSv2 강제
  - 인스턴스 ID: `i-03894ef3a848c1da3`, 프라이빗 IP `172.31.22.29`
- ✅ Elastic IP 할당 + 연결: **`54.116.7.53`** (allocation `eipalloc-005ceeba0931494b2`)
- ✅ Route 53 A 레코드: `api.dreamteller.io.kr` → `54.116.7.53` (TTL 300, 즉시 전파)
- ✅ SSH 접속 (`ssh -i ~/.ssh/dreamteller-ec2-key.pem ubuntu@54.116.7.53`)
  - aarch64 Ubuntu 24.04.4 LTS, Kernel 6.17.0-1012-aws, 디스크 27GB 여유, 메모리 906MiB
- ✅ 시스템 패키지: Python 3.12.3 + nginx 1.24.0 + Certbot 2.9.0 + git 2.43.0
- ✅ GitHub repo clone: `/home/ubuntu/Dreamteller/` (public repo)
- ✅ venv 생성 + `pip install -r requirements.txt` (모든 의존성 ARM aarch64 wheels)
  - fastapi 0.136.3 / uvicorn 0.47.0 / supabase 2.30.0 / google-genai 2.6.0 / PyJWT 2.13.0 / pydantic-settings 2.14.1
- ✅ `.env` 안전 전송: `scp`로 `/home/ubuntu/dreamteller.env` (ubuntu:ubuntu 600)
  - 4 keys: PORT / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / GEMINI_API_KEY
- ✅ systemd 유닛 `/etc/systemd/system/dreamteller.service`:
  - `User=ubuntu`, `EnvironmentFile=/home/ubuntu/dreamteller.env`
  - `ExecStart=/home/ubuntu/Dreamteller/server/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - `Restart=always`, `RestartSec=5`
  - `enable --now` → active (running), uvicorn 메모리 88.8MB
  - Local health check: `curl http://127.0.0.1:8000/health` → `{"status":"ok"}` HTTP 200
- ✅ nginx reverse proxy `/etc/nginx/sites-available/dreamteller`:
  - `server_name api.dreamteller.io.kr`, `listen 80`
  - `proxy_pass http://127.0.0.1:8000` + 표준 헤더 + 120s timeout (Gemini long-running 대비)
  - `sites-enabled` 심볼릭 링크, `default` 사이트 제거
  - HTTP 외부 접근 확인: `curl http://api.dreamteller.io.kr/health` → HTTP 200
- ✅ Let's Encrypt SSL: `sudo certbot --nginx -d api.dreamteller.io.kr --non-interactive --agree-tos --email kang071911@gmail.com --redirect`
  - 인증서 `/etc/letsencrypt/live/api.dreamteller.io.kr/fullchain.pem`
  - 만료 2026-08-22 (90일), Certbot 자동 갱신 cron 설정됨
  - HTTPS 외부 접근 확인: `curl https://api.dreamteller.io.kr/health` → HTTP 200, SSL verify OK
  - HTTP → HTTPS 301 자동 redirect 확인

**Phase B 산출물 요약**:
- 운영 백엔드 URL: **`https://api.dreamteller.io.kr`** ⭐
- 운영 비용 (베타): EC2 무료 1년 + Elastic IP 할당 인스턴스 무료 + Route 53 hosted zone $0.50/월 = **~$0.50/월**
- 1년 후 비용: t4g.micro ~$6/월 + Route 53 $0.50/월 = **~$6.5/월**

**Phase C — 클라이언트 EAS 환경변수 + 재빌드** ✅ 완료 (2026-05-24 ~ 06-17)
- ✅ **EAS env 등록 6개 (preview 3 + production 3)** — `eas env:create --environment {preview|production} --name X --value Y` 6번 실행
  - `EXPO_PUBLIC_API_BASE_URL` = `https://api.dreamteller.io.kr/api` (plaintext)
  - `EXPO_PUBLIC_SUPABASE_URL` = `https://votdhwgsjxpladlodqyy.supabase.co` (plaintext)
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_...` (**sensitive** — 마스킹 저장)
  - preview/production 동일 값 (베타 단계엔 같은 백엔드 사용, 추후 staging 분리 시점에 분리)
- ✅ **preview 재빌드 성공** — `eas build --platform ios --profile preview`
  - 빌드 로그 첫 줄에서 env 정상 로드 확인: `Environment variables ... loaded from the "preview" environment on EAS: EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_URL`
  - 이전(5/22)의 `No environment variables ... found` 경고 해소
  - Apple credentials + Provisioning Profile 재사용 (Apple 재로그인 skip)
- ✅ **iPhone 재설치 + 부팅 정상** — 이전 splash 멈춤 해소
- ✅ **로그인 통과** — Supabase Auth(JWKS) + 백엔드 인증 양쪽 통신 OK
- ✅ **end-to-end 검증 통과** (2026-06-17) — Phase D OTP 검증과 묶어서 실기기에서 한 번에 처리
  - RecordChat 5단계 → RecordSummary → 해몽 v2 generate → InterpretScreen 모두 정상
  - Gemini title 자동 생성 (`21794bc`) EC2 배포 동작 확인
  - 백엔드 디버깅 명령: `ssh ubuntu@54.116.7.53 'sudo journalctl -u dreamteller -f'` (실시간 로그)

**Phase D — AWS SES + Custom SMTP + OTP 인증** ✅ 완료 (2026-06-15 ~ 06-17)
- ✅ 도메인 identity: `dreamteller.io.kr` (Seoul ap-northeast-2, Easy DKIM RSA 2048)
- ✅ MAIL FROM domain: `mail.dreamteller.io.kr` (SPF/DMARC alignment)
- ✅ DMARC: `_dmarc.dreamteller.io.kr` TXT (`v=DMARC1; p=none;`)
- ✅ Production access 즉시 승인 (Case `178153647100105`) — 일 50,000통 / 1초당 14통
- ✅ SMTP credentials: IAM 사용자 `ses-smtp-dreamteller-prod` (그룹 `AWSSESSendingGroupDoNotRename`, 권한 `ses:SendRawEmail`)
- ✅ Supabase Custom SMTP 연동: host `email-smtp.ap-northeast-2.amazonaws.com` port 587 STARTTLS
- ✅ OTP 6자리 인증 방식 (Magic link 폐기) — 데스크탑 fallback 페이지 불필요
- ✅ 클라이언트: OtpVerifyScreen 신규 + SignupScreen OtpVerify navigate + authService verifySignupOtp/resendSignupOtp
- ✅ Supabase Email OTP length 8 → 6 변경 (Authentication → Providers → Email)
- ✅ Gmail 도달 + 인증 OK
- ✅ **Naver 받은편지함 도달 + 인증 OK** ⭐ 5/3 built-in SMTP 실패 케이스 해결

**Phase E — 약관/개인정보처리방침 + 랜딩 페이지** ✅ 사실상 완료 (2026-06-17)
- ✅ 약관/방침 확정본 작성 (`docs/legal/TERMS.md`, `docs/legal/PRIVACY.md`) — Gemini 국외 전송 명시, AI 해몽 면책 조항 포함
- ✅ 정적 HTML 사이트 작성 (`dreamteller/web/`: index/terms/privacy + styles.css + amplify.yml)
- ✅ Amplify Hosting 배포 (GitHub `main` 연동, Seoul 리전)
- ✅ Custom domain `dreamteller.io.kr` 연결 (루트+www → main, Amplify SSL, Route 53 자동, `api.` 유지) — 공개 URL 검증 통과
- ✅ 문의처 이메일: 베타는 `kang071911@gmail.com` 임시, 정식 출시 때 `support@dreamteller.io.kr` 도메인 메일 구축
- ✅ Settings 화면 약관/방침 링크 항목 추가 (코드 반영, 실기기 확인은 Phase F 재빌드 시)

**Phase F — production 빌드 + TestFlight** ✅ 빌드/업로드 완료 (2026-06-19)
- ✅ 앱 아이콘 4종 제작 (최우선 차단점 해소 — 위 [2] 참조)
- ✅ production 빌드 성공 (`eas build`, buildNumber 2, App Store 프로비저닝 프로파일 `94KYQL5SQ9` 신규 생성)
- ✅ App Store Connect 앱 레코드 생성 (등록명 `DreamTeller - AI가 들려주는 해몽`)
- ✅ `eas submit` → TestFlight 업로드 (API Key APP_MANAGER 자동 생성, 그룹 `Team (Expo)`)
- ✅ 실기기 TestFlight 설치 + 새 아이콘 확인 완료
- ⏳ 남음: TestFlight end-to-end 검증(로그인/기록/해몽/아카이브/Settings 링크)
- ⏳ App Store 공개 심사 제출 시: 스크린샷 + 메타데이터 + 심사용 데모 계정 + 수출규정 답변

**예상 소요**: Phase A~B 1~2일 + Phase C 30분 + Phase D 1시간 + Phase E 반나절 + Phase F 1일. 총 ~1주일

#### [7] 추후 운영 안전장치 (배포 후 백로그)
- `services/supabase.ts`의 import 시점 throw 패턴 개선 — ErrorBoundary 또는 fallback UI 추가 (운영 빌드에서 silent splash 멈춤 방지)
- 환경변수 가드 누락 시 사용자에게 명시적 에러 화면 표시
- **AWS Systems Manager Session Manager 도입** ⭐ — 사용자 ISP가 IP를 자주 갱신해서 EC2 SG SSH 소스 매번 업데이트 부담 (5/24~5/25 사이 2회 발생)
  - 도입 시: SSM Agent + IAM Role(`AmazonSSMManagedInstanceCore`) → SG SSH 22 규칙 불필요, 브라우저에서 셸 접속
  - 셋업 시간: ~30분 (Phase D 끝나고 검토)
- **백엔드 OTA 배포 자동화 검토** — 현재 EC2에 수동 `git pull` + `systemctl restart`. GitHub Actions + SSH/SSM으로 자동화 (배포 후 도입 검토)
- **RecordChat UI 백로그** — 검증 중 추가 UI 개선점 사용자 발견 시 묶어서 fix (preview 빌드 한도 30분/월 절약 위해 묶어서 진행)

### 📱 배포 후 / 선택

#### [8] Apple 로그인 추가
- Supabase Apple Provider + Apple Developer 등록
- `expo-apple-authentication` + `signInWithIdToken({provider: 'apple', token, nonce})`
- dev-client 재빌드 후 검증

#### [9] Crash reporting 도입
- Sentry / Bugsnag — 운영 시 에러 감지

#### [10] AI 일러스트 / 음성 입력 (Phase 2+)
- CLAUDE.md "MVP 이후 별도 Phase" 규칙대로 배포 후 별도 Phase

#### [11] Husky / Lint-staged (선택, 협업 확장 시)

#### [12] 아침 꿈 알림 (모닝 푸시) ⭐ 신규 기능 제안
- **컨셉**: 매일 아침 사용자에게 푸시 알림으로 "간밤의 꿈을 기록해보세요" 하고 물어봄 → 탭하면 바로 RecordChat 진입. 꿈은 깨고 나면 빠르게 사라지므로 **기상 직후 기록 유도**가 리텐션 핵심
- **인프라 준비됨**: APNs Key는 5/22 EAS credentials 셋업 때 이미 자동 생성 ("push reminder 도입 대비"). `expo-notifications` 추가 필요
- **구현 방향 (안)**:
  - 1차(간단): **로컬 알림**(`expo-notifications`의 `scheduleNotificationAsync`, 매일 반복 트리거) — 서버 불필요, 사용자가 Settings에서 시간 설정(기본 예: 오전 8시). 빠르게 도입 가능
  - 2차(고도화): **서버 푸시**(Expo Push API / APNs) — 개인화 메시지, A/B, 미기록 시 리마인드 등. 백엔드에 푸시 토큰 저장 + 스케줄러 필요
  - 알림 탭 → deep link로 RecordChat 직행 (`expo-notifications` response listener)
  - **권한 요청 UX**: 온보딩 또는 첫 기록 완료 후 자연스러운 시점에 알림 권한 요청 (앱 첫 진입 즉시 X)
  - Settings에 "아침 알림" 토글 + 시간 선택 추가
- **고려사항**: iOS 알림 권한 거부 시 fallback, 시간대(KST) 처리, 너무 잦은 알림은 역효과 → 1일 1회 기본
- **권장 시점**: 1차(로컬 알림)는 MVP 출시 직후 리텐션 기능으로 빠르게, 2차(서버 푸시)는 사용자 늘어난 뒤

---

## 오류 및 해결 내역

### [2026-06-16] Magic Link 데스크탑 fallback 부재 → OTP 6자리 방식으로 전환
- **증상**: SES + Supabase Custom SMTP 연동 후 Gmail confirm 메일 수신 OK. 그러나 Mac Chrome에서 메일 안 confirm 링크 클릭 시 → Supabase HTTPS verify endpoint는 정상 처리되지만 `redirect_to=dreamteller://auth-callback`이 Mac에서 핸들러 없어 빈 탭만 표시. 토큰은 1회 소비된 상태로 무효화.
- **원인**: Custom URL scheme(`dreamteller://`)은 모바일 OS에만 핸들러 등록됨. 데스크탑 사용자가 메일을 PC에서 보는 경우 UX 단절. 운영 단계에선 필수.
- **해결 옵션 검토**:
  - (a) Amplify Hosting에 `/auth-callback` 웹 페이지 추가 (User-Agent 감지 → 모바일이면 `dreamteller://` redirect / 데스크탑이면 "메일 인증 완료" 안내)
  - (b) Universal Link (`apple-app-site-association` 호스팅 + iOS 등록)
  - (c) **OTP 6자리 코드 방식** ⭐ 채택
- **해결**: OTP 채택. Supabase Confirm signup 메일 템플릿을 `{{ .Token }}` 6자리 표시 + 한국어 + Pretendard 톤으로 변경. 클라이언트에 `OtpVerifyScreen` 신규 + SignupScreen에서 session=null이면 OtpVerify navigate. `supabaseAuth.verifySignupOtp(email, token)` + `resendSignupOtp(email)` 추가. `textContentType="oneTimeCode"` 적용으로 iOS 자동 채움(메일 도착 시 키보드 위 6자리 suggestion) 지원.
- **부수 효과 (긍정)**: Phase E 스코프 축소 — `/auth-callback` 웹 페이지 + Universal Link 인프라(`apple-app-site-association`, Apple Team ID 등록) 모두 불필요. Naver/Daum 등 deep link 호환성 이슈 있는 메일 앱에서도 동일 UX 보장.
- **재발 방지**: 앱+웹 둘 다 다루는 서비스가 아닌 한, **모바일 OTP가 magic link보다 항상 더 robust**한 선택. 처음 인증 흐름 설계할 때 OTP를 1순위로 검토.

### [2026-06-16] Supabase Email OTP length 8자리 기본값 → 6으로 변경
- **증상**: OTP 전환 후 첫 실기기 가입 테스트에서 메일에 도착한 코드가 8자리, 클라이언트 UI는 6셀로 구현됨 → 길이 불일치로 인증 불가
- **원인**: Supabase 프로젝트의 Email OTP Length 설정이 기본 8자리로 잡혀있음 (프로젝트마다 디폴트 다를 수 있음, 6~10 사이 설정 가능)
- **해결**: Supabase Dashboard → Authentication → Providers → Email → "Email OTP Length" 8 → 6 변경 → Save. 변경 즉시 적용, 클라이언트 빌드 재배포 불필요.
- **결정 이유 (6 vs 8)**: 6자리 = 100만 조합 + Supabase rate limit + TTL 1시간 → brute force 사실상 불가. 보안 차이는 미미하고 iOS 자동 채움 / 업계 표준(Google Authenticator, Slack, Notion 등) / 사용자 입력 부담 모두 6자리가 우위.
- **재발 방지**: Supabase OTP 설정은 프로젝트 생성 시점에 정해지고 콘솔에 명시적으로 보이지 않을 수 있음. OTP 도입 시 가장 먼저 점검할 항목.

### [2026-06-16] 네이버 메일 `+` plus alias 미지원 → 메일 silently drop
- **증상**: Gmail OTP 검증 통과 후 네이버 도달성 추가 검증 위해 `dudah0719+sestest1@naver.com` (plus alias)로 가입 시도. 네이버 받은편지함/스팸함 어디에도 메일 미도착.
- **원인**: 네이버 메일은 RFC 5233 plus addressing(`user+tag@domain`) 미지원. 해당 주소를 "존재하지 않는 주소"로 인식 → bounce 또는 silently drop. (Gmail은 plus alias 지원해서 검증 가능했던 케이스)
- **해결**: 본인 네이버 raw 주소(`dudah0719@naver.com`) 그대로 사용. 받은편지함에 정상 도달 + OTP 인증 통과.
- **부수 영향**: alias 발송 1건이 SES bounce 카운트에 등록됐을 가능성 있음. 신규 계정 평판에 미미한 영향. AWS SES → 계정 대시보드 → 평판 지표에서 Bounce Rate 모니터링 권장 (5% 초과 시 위험).
- **재발 방지**: 한국 메일(naver/daum/hanmail/kakao) 검증 시 plus alias 사용 X. 새 검증 케이스가 필요하면 별도 네이버 계정 신규 가입.

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
