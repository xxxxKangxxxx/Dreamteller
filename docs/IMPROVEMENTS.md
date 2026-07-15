# DreamTeller — 수정·개선 과제 정리

> 작성일: 2026-07-12 (build 8 재제출 완료, Apple 심사 결과 대기 시점)
> 목적: `PROGRESS.md`에 흩어져 있던 보류/백로그/미구현 항목을 우선순위별로 한 곳에 정리.
> 항목 완료 시 이 문서에 체크하고, 세부 이력은 기존대로 `PROGRESS.md`에 기록.
> **코드 레벨 이슈(보안/비효율/중복)는 `CODE_REVIEW.md` 별도 관리** — 특히 서버 사용량 강제(S2)는 §1-1 Gemini 비용 방어의 실질 수단.

---

## 현재 상태 스냅샷

- **App Store**: 1.0.0 (build 8) 재제출 완료(07-08), **심사 결과 대기 중**. 수동 릴리스 — 승인돼도 직접 "출시" 클릭 필요
- **인프라**: EC2 FastAPI(`api.dreamteller.io.kr`) + Supabase(Auth/DB) + Amplify 웹(`dreamteller.io.kr`) 모두 정상 운영
- **1차 반려(4.3/4.8/5.1.1/2.1) 대응 완료**: Apple 로그인 + 게스트 모드 + 계정 삭제 + 메타데이터 재포지셔닝

---

## 0. 지금 당장 (심사 결과에 따라 분기) 🔴

### 승인 시
- [ ] ASC에서 **수동 "출시" 클릭** → 앱 공개
- [ ] **웹 랜딩 App Store 버튼 활성화** — `web/index.html`의 disabled `<span>` 2곳(히어로+마무리 CTA) → 실제 앱스토어 URL `<a>`로 교체
- [ ] 출시 직후 실기기에서 스토어 버전 스모크 테스트 (로그인→기록→해몽)

### 반려 시
- [ ] 사유 확인 → 사유별 재대응 (4.3 재반려면 답장 재작성 or 포지셔닝 추가 순화)

### 심사와 무관하게 확인
- [ ] **Google OAuth 동의화면 브랜딩 실제 반영 확인** — 앱에서 Google 로그인 눌러 "DreamTeller" 표기 눈으로 확인 (GCP 게시는 07-07 완료)

---

## 1. 출시 직후 — 운영 안정성 (장애 예방) 🟠

| # | 과제 | 배경/리스크 | 작업 |
|---|---|---|---|
| 1-1 | **Gemini 예산·잔액 알림** ⭐ | 선불(prepaid) 티어라 **잔액 0 = 해몽/대화 전면 장애**. 사용자 늘면 소진 속도 예측 불가 | Cloud Billing 예산 알림 + `ai.studio/spend` 모니터링 루틴. 추후 후불 전환(사용자 방침: 출시 후 사용량 보고 결정) |
| 1-2 | **Supabase captcha 도입 검토** | 익명 로그인(게스트) 열려 있어 어뷰징 → Gemini 비용 직결 | Turnstile/hCaptcha. 출시 후 사용량 모니터링하며 도입 판단 (콘솔 작업은 사용자 직접) |
| 1-3 | **Supabase pause/resume 리스크** | Free 플랜 미사용 시 자동 pause. **resume 후 Auth 설정(Anonymous sign-ins, Manual linking) 꺼진 사례 발생**(07-07) | 출시 후 트래픽 있으면 pause 안 되지만, resume 발생 시 Auth 설정 재확인 체크리스트화. 장기적으론 Pro 플랜 검토 |
| 1-4 | **`services/supabase.ts` import 시점 throw 개선** | 환경변수 누락 빌드에서 splash 멈춤(silent) — 5/22 실제 발생 | ErrorBoundary 또는 명시적 에러 화면으로 fallback |
| 1-5 | **EC2 SSH 접근성 — SSM Session Manager** | 집 IP 변동으로 SG 22번 매번 갱신 필요(수차례 발생, 6/22엔 SSH 자체가 막혀 우회) | SSM Agent + IAM Role(`AmazonSSMManagedInstanceCore`) → SG 22 규칙 제거, 브라우저 셸. ~30분 |
| 1-6 | **백엔드 배포 자동화** | 현재 수동 `git pull` + `systemctl restart` | GitHub Actions + SSM/SSH 배포 파이프라인 (SSM 도입 후 묶어서) |
| 1-7 | **SSL 인증서 갱신 확인** | Let's Encrypt 만료 2026-08-22. certbot cron 설정돼 있으나 미검증 | 8월 중 `certbot renew --dry-run` 또는 만료일 재확인 |

---

## 2. 기능 공백 — 미구현/스텁 해소 🟡

| # | 과제 | 현재 상태 | 작업 |
|---|---|---|---|
| 2-1 | **Archive 백엔드 구현** ⭐ | 클라 `archiveService.ts`가 `/archive/characters·places·themes` 호출 → 백엔드 라우트 없어 **404** (화면은 빈 상태로 정상 처리 중) | 추출·집계 파이프라인(해몽 시 인물/장소/테마 추출 저장) + 조회 라우트 3종. 스키마 테이블은 이미 존재 |
| 2-2 | **Stats 공백 채우기** | `dreamTypeDistribution`(dream_type 미수집), `topThemes`(테마 추출 없음) 항상 빈 배열 → Insights 화면 반쪽 | 해몽 파이프라인에서 dream_type/테마 수집 (2-1과 같은 추출 파이프라인으로 묶어 진행 권장) |
| 2-3 | **알림 콜드스타트 → RecordChat 직행** | 앱 완전 종료 상태에서 아침 알림 탭 시 홈으로만 이동 (사용자 수용, 폴리시로 남김) | 콜드스타트 시 notification response 처리해 RecordChat 딥링크 |
| 2-4 | **OTP 재발송 버튼(#8) 실기기 검증** | 코드 반영·빌드 포함됐으나 UI 동작 미검증 | 다음 실기기 세션에서 쿨다운 종료 후 버튼 표시 확인 |
| 2-5 | **게스트→Apple/이메일 전환 시 기록 보존** | Google만 `linkIdentity`로 보존. Apple/이메일은 신규 계정 경로(기록 유실) | Apple OAuth(Services ID) 콘솔 추가 시 Apple 전환도 보존 가능. 우선순위 낮음(의도된 설계) |
| 2-6 | **서버 푸시(2차 알림)** | 현재 로컬 알림만 (아침 리마인더) | APNs Key는 이미 발급됨. 서버 발송 인프라 + 토큰 저장 필요 |
| 2-7 | **CharacterDetailScreen** | 스텁 (진입 시 빈 화면, 정상 처리 확인됨) | Phase 2(캐릭터 추출 + AI 일러스트)와 묶어 구현 — 지금 착수 금지 |
| 2-8 | **Subscriptions/인앱결제** | FREE/PREMIUM 분기만 존재, 백엔드·IAP 없음 | 수익화 시점에 착수. Apple IAP 심사 요건 선조사 필요 |

---

## 3. 품질·UX 개선 🟢

- [ ] **웹 컴포넌트화** ⭐ — `web/index.html` 단일 파일 상태. 사용자 확정 방침: **앞으로 웹 작업은 컴포넌트화 기준으로** (빌드러너/partial 도입은 다음 웹 작업 때 상의 후 결정)
- [ ] **Google OAuth 로고 업로드** — 현재 이름만 브랜딩됨. 로고 업로드는 GCP verification 트리거라 보류했음 → 여유 있을 때 진행
- [ ] **Google 버튼 폰트 미세조정** — 18px로 Apple과 매칭 확인(build 8 OK). 추후 UI 개편 시에만 재검토
- [ ] **스크린샷 선명도** — raw 캡처가 @1x(393×852)라 약간 부드러움. 마케팅 개선 시 시뮬레이터 native 해상도 캡처로 교체 후 `build.sh` 재실행
- [ ] **iOS OTP 자동채움 검증** — 이메일 OTP는 들쭉날쭉. SMS 인증 도입 시 함께 검증 (출시 차단 아님)
- [ ] **RecordChat swipe-dismiss 근본 원인** — `gestureEnabled` 차단으로 증상 해소했으나 세션 reset 콜사이트 미확정. 재발 시 추적
- [ ] **Supabase Custom Domain** ($10/월) — OAuth 주소창까지 자체 도메인 원할 때만. 출시엔 불필요
- [ ] **support@dreamteller.io.kr 도메인 메일** — 현재 문의처는 개인 Gmail. 정식 운영 단계에서 구축

---

## 4. Phase 2+ 로드맵 (중장기) 🔵

| 항목 | 메모 |
|---|---|
| **AI 드림 일러스트** | MVP 이후 별도 Phase (CLAUDE.md 규칙: 지금 구현 금지) |
| **캐릭터 추출 파이프라인** | 일러스트와 묶음 — 2-7 CharacterDetail, 2-1 Archive와 연계 |
| **음성 입력** | Phase 5 예정 (지금 구현 금지) |
| **Android 출시** | iOS 안정화 후. Expo라 빌드 자체는 낮은 비용 |
| **인프라 확장** | Supabase→RDS / S3(Presigned URL) / CloudFront — 현 EC2 구성 그대로 추가만 하면 됨 (PROGRESS [6] 미래 확장 표 참조) |

---

## 5. 반복 실수 방지 메모 (운영 노하우)

- **capability 추가 후 첫 EAS 빌드는 대화형 + Apple 로그인(Y)** — `--non-interactive`는 프로파일 재생성 못 해 실패 (build 6 사례). 이후엔 재사용 가능
- **EAS Free 월 iOS 15빌드** — 수정은 모아서 한 빌드에, `eas submit`은 한도 미소비
- **tsc는 반드시 `cd app && npx tsc --noEmit`** — 상위 디렉터리에서 실행하면 엉뚱한 tsc 설치됨
- **ASC URL 입력은 직접 타이핑** — 붙여넣기 시 숨은 문자로 "형식 오류" 발생 사례
- **Supabase resume 후 Auth 토글 재확인** (1-3 참조)
- **게스트 유저는 email이 비어 있어 대시보드에서 User ID로 검색해야 보임**
