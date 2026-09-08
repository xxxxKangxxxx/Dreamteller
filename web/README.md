# DreamTeller — 웹 배포 (웹 앱 + 랜딩 + 법률 페이지)

AWS Amplify Hosting으로 `dreamteller.io.kr`에 배포한다. 빌드 스펙은 `dreamteller/amplify.yml`.

> ⚠️ **`main`에 push하면 즉시 자동 배포된다.** Amplify가 `main` 브랜치에 연결돼 있어
> push가 곧 프로덕션 배포다. 앱 코드만 고치는 커밋이어도 웹이 함께 나간다.
> 콘솔 설정(환경변수·리라이트)을 바꿔야 하는 변경이라면 **콘솔을 먼저** 끝내고 push할 것 —
> 순서가 뒤바뀌면 그 사이 `/terms.html`이 404가 된다.
>
> 환경변수만 바꾼 경우에는 자동 재빌드가 걸리지 않는다. 콘솔에서 수동으로
> redeploy 하거나 다음 push를 기다려야 값이 번들에 반영된다.

## 배포 후 경로 구조

| 경로 | 내용 | 소스 |
|---|---|---|
| `/` | **Expo Web 앱** (앱과 동일한 기능) | `app/` → `expo export -p web` |
| `/about` | 랜딩 페이지 | `web/index.html` |
| `/terms.html` | 서비스 이용약관 | `web/terms.html` |
| `/privacy.html` | 개인정보처리방침 | `web/privacy.html` |

> ⚠️ **`/terms.html`과 `/privacy.html`은 절대 옮기지 말 것.**
> 출시된 iOS 앱에 하드코딩돼 있고(`app/src/screens/settings/SettingsScreen.tsx`)
> App Store Connect의 개인정보처리방침 URL로도 등록돼 있다. 옮기면 구버전 앱에서 404가 난다.

> 약관/방침의 **원본(편집용)**은 `docs/legal/TERMS.md`, `docs/legal/PRIVACY.md`. 내용 수정 시 두 곳을 함께 갱신할 것.

정적 페이지 3종은 배포 깊이가 서로 달라(`/about` vs 루트) `./` 상대 경로 대신 **루트 절대 경로**(`/styles.css`, `/assets/...`)를 쓴다.

## 로컬 미리보기

```bash
# 웹 앱 (개발 서버)
cd dreamteller/app && npx expo start --web

# 배포 트리 전체 (앱 + 랜딩 + 약관을 실제 경로 그대로)
cd dreamteller/app && npx expo export -p web
cd .. && rm -rf dist-site && mkdir -p dist-site/about \
  && cp -R app/dist/. dist-site/ \
  && cp web/index.html dist-site/about/index.html \
  && cp web/terms.html web/privacy.html web/styles.css dist-site/ \
  && cp -R web/assets/. dist-site/assets/
cd dist-site && python3 -m http.server 5500
# http://localhost:5500
```

## Amplify 콘솔 설정 (사용자 직접)

빌드는 `amplify.yml`이 처리하지만, **리라이트 규칙은 콘솔에서만 설정할 수 있다.**
App settings → Rewrites and redirects에 **아래 순서 그대로** 넣는다.

| # | Source | Target | Type |
|---|---|---|---|
| 1 | `/about` | `/about/index.html` | 200 (Rewrite) |
| 2 | `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp\|html)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

- 2번은 Amplify 기본 SPA 규칙에 **`html`을 추가**한 것이다. 기본값 그대로 쓰면
  `/terms.html`·`/privacy.html`까지 앱으로 리라이트돼 법률 페이지가 사라진다.
- 1번이 2번보다 **위**에 있어야 한다. `/about`은 확장자가 없어 2번에 먼저 걸리면 앱이 뜬다.

### 환경변수 (App settings → Environment variables)

```
EXPO_PUBLIC_API_BASE_URL     https://api.dreamteller.io.kr/api
EXPO_PUBLIC_SUPABASE_URL     (Supabase 프로젝트 URL)
EXPO_PUBLIC_SUPABASE_ANON_KEY (Supabase anon key)
```

### 함께 등록해야 하는 외부 설정

- **Supabase** → Authentication → URL Configuration → Redirect URLs에 `https://dreamteller.io.kr` 추가
- **Google Cloud Console** → OAuth 클라이언트 → 승인된 리디렉션 URI에 Supabase 콜백 URL이 이미 있는지 확인
  (웹 로그인은 Supabase가 콜백을 받아 `https://dreamteller.io.kr`로 되돌린다)

## 배포 후 체크

- [ ] `https://dreamteller.io.kr/terms.html` 200 (구버전 앱 보호 — **가장 중요**)
- [ ] `https://dreamteller.io.kr/privacy.html` 200
- [ ] `https://dreamteller.io.kr/about` 랜딩 정상
- [ ] `https://dreamteller.io.kr/` 웹 앱 부팅
- [ ] 실기기(iPhone Safari)에서 꿈 기록 대화 중 **키보드가 입력창을 가리지 않는지**
- [ ] 홈 화면에 추가 → 전체화면 실행
