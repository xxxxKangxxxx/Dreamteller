# DreamTeller — 랜딩 + 법률 페이지 (정적 사이트)

AWS Amplify Hosting으로 배포하는 정적 사이트입니다. 빌드 단계 없이 `web/` 디렉터리를 그대로 서빙합니다.

## 구성
| 파일 | 경로(배포 후) | 용도 |
|---|---|---|
| `index.html` | `/` | 랜딩 페이지 |
| `terms.html` | `/terms.html` | 서비스 이용약관 |
| `privacy.html` | `/privacy.html` | 개인정보처리방침 |
| `styles.css` | — | 공통 스타일 (브랜드 토큰: `docs/DESIGN_SYSTEM.md`) |

> 약관/방침의 **원본(편집용)**은 `docs/legal/TERMS.md`, `docs/legal/PRIVACY.md`. 내용 수정 시 두 곳을 함께 갱신하세요.

## 로컬 미리보기
```bash
cd dreamteller/web
python3 -m http.server 5500
# http://localhost:5500
```

## Amplify Hosting 배포 (사용자 직접 — 콘솔 작업)
빌드 스펙은 리포 루트 `dreamteller/amplify.yml`에 있음 (`baseDirectory: web`).

1. **AWS Amplify 콘솔** → "Host web app" → GitHub 연동 → DreamTeller 리포 + `main` 브랜치 선택
2. 모노레포 안내가 뜨면 amplify.yml 자동 인식 (web/ 산출물)
3. 배포 완료 후 기본 도메인(`https://main.xxxx.amplifyapp.com`) 동작 확인
4. **Custom domain** → `dreamteller.io.kr` 연결
   - Route 53에 같은 호스티드 존이 있으므로 Amplify가 ACM 인증서 + CNAME/ALIAS를 자동 생성/제안
   - 루트 도메인(`dreamteller.io.kr`) + `www` 서브도메인 매핑
   - ⚠️ `api.dreamteller.io.kr`(EC2 백엔드)는 건드리지 말 것 — 별도 A 레코드 유지
5. 약관/방침 공개 URL 확정:
   - `https://dreamteller.io.kr/terms.html`
   - `https://dreamteller.io.kr/privacy.html`
   - 이 URL을 App Store Connect 앱 정보 + 앱 내 Settings 링크에 사용

## 게시 전 체크
- [ ] `support@dreamteller.io.kr` 수신 가능하게 설정 (SES는 발신 전용 → 수신은 별도: Cloudflare Email Routing / Google Workspace 등)
- [ ] App Store **App Privacy** 입력값이 `privacy.html` 수집 항목과 일치
- [ ] 유료 결제 도입 전 약관 법률 검수 (전자상거래법 반영)
