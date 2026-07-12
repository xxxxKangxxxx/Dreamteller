# DreamTeller 🌙

**한국어** | [English](README.en.md)

> 대화형 AI가 꿈 기록을 도와주고, 해석과 아카이브를 제공하는 감성 꿈 일기 앱

DreamTeller는 잠에서 깬 직후 흐릿하게 남은 꿈을 AI와의 대화를 통해 자연스럽게 기록하고, AI가 들려주는 해석과 함께 나만의 꿈 아카이브를 쌓아가는 iOS 앱입니다.

## 주요 기능

- **대화형 꿈 기록** — AI가 질문을 던지며 꿈의 조각을 함께 정리해 주는 채팅 기반 기록
- **AI 꿈 해석** — 기록된 꿈에 대한 해석과 자기 성찰 포인트 제공 (Google Gemini)
- **꿈 아카이브** — 날짜별로 쌓이는 꿈 일기와 기록 통계
- **게스트 모드** — 가입 없이 둘러보기로 시작하고, 나중에 Apple/Google 계정으로 전환해도 기록 유지

## 기술 스택

| 영역 | 기술 |
|------|------|
| 앱 | React Native (Expo), TypeScript — iOS 우선 |
| 백엔드 | FastAPI (Python) |
| DB / 인증 / 스토리지 | Supabase (PostgreSQL + Auth + Storage) |
| 인증 | Supabase Auth — 이메일 OTP, Apple/Google 로그인, 익명(게스트) 로그인 |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| 인프라 | AWS EC2 (API 서버), AWS Amplify (정적 웹), Route 53 |

## 프로젝트 구조

```
dreamteller/
├── app/          # React Native (Expo) 모바일 앱
│   └── src/      # components, screens, navigation, services, store, hooks ...
├── server/       # FastAPI 백엔드
│   └── app/      # routes(dreams, interpret, stats, account), services, schemas ...
├── web/          # 정적 웹사이트 (랜딩, 개인정보처리방침, 이용약관) — Amplify 배포
├── app-store/    # App Store 제출용 산출물 (스크린샷, 메타데이터)
├── docs/         # 프로젝트 문서
└── amplify.yml   # Amplify 배포 설정
```

## 시작하기

### 앱 (Expo)

```bash
cd app
npm install
npx expo start
```

### 백엔드 (FastAPI)

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

> 앱과 서버 모두 `.env` 파일에 환경변수(Supabase URL/Key, Gemini API Key 등)가 필요합니다. 키값은 절대 코드에 하드코딩하지 않습니다.

## 문서

| 문서 | 설명 |
|------|------|
| [`docs/SPEC.md`](docs/SPEC.md) | 화면별 기능 상세 정의 |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | 폴더 구조, 기술 스택, 데이터 모델 |
| [`docs/API.md`](docs/API.md) | 백엔드 REST API 명세 |
| [`docs/PROMPT_GUIDE.md`](docs/PROMPT_GUIDE.md) | AI 기능별 프롬프트 설계 |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | 컬러, 타이포, 컴포넌트 규칙 |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | 진행 현황 및 다음 작업 |

## 웹사이트

- 홈: https://dreamteller.io.kr
- 개인정보처리방침: https://dreamteller.io.kr/privacy.html
- 이용약관: https://dreamteller.io.kr/terms.html

## 라이선스

© 2026 Yeongmo Kang. All rights reserved.
