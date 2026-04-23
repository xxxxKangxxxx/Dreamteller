# DreamTeller — Claude Code 컨텍스트

> **이 파일을 먼저 읽으세요.** Claude Code가 이 프로젝트에서 작업할 때 항상 참조해야 하는 핵심 컨텍스트입니다.

## 프로젝트 한줄 정의
대화형 AI가 꿈 기록을 도와주고, 해몽·아카이브를 제공하는 감성 꿈 일기 앱

## 확정된 기술 스택
- **앱**: React Native (Expo) — iOS 우선, Android 추후
- **백엔드**: FastAPI (Python)
- **DB / 인증 / 스토리지**: Supabase 풀 활용 (PostgreSQL + Auth + Storage)
- **DB 접근**: Supabase Python Client SDK (Prisma 사용 안 함)
- **인증**: Supabase Auth + 자체 JWT 별도 발급
- **AI**: Google Gemini API — `gemini-2.5-flash` (해몽/대화/요약)
- **AI 이미지 생성**: MVP 이후 별도 Phase

## 핵심 문서 목록
| 문서 | 경로 | 설명 |
|------|------|------|
| 기능 명세 | `docs/SPEC.md` | 화면별 기능 상세 정의 |
| 아키텍처 | `docs/ARCHITECTURE.md` | 폴더 구조, 기술 스택, 데이터 모델 |
| API 설계 | `docs/API.md` | 백엔드 REST API 전체 명세 |
| AI 프롬프트 | `docs/PROMPT_GUIDE.md` | AI 기능별 프롬프트 설계 |
| 디자인 시스템 | `docs/DESIGN_SYSTEM.md` | 컬러, 타이포, 컴포넌트 규칙 |

## 개발 시 반드시 지켜야 할 규칙
1. 컬러는 반드시 `DESIGN_SYSTEM.md`의 토큰 변수명을 사용할 것 (`colors.primary` 등)
2. API 호출은 `src/services/` 레이어를 통해서만 할 것 (컴포넌트 직접 호출 금지)
3. AI 프롬프트는 `docs/PROMPT_GUIDE.md`를 기준으로 작성하고 하드코딩 금지
4. 모든 화면 컴포넌트는 `src/screens/` 에, 공통 컴포넌트는 `src/components/` 에 위치
5. TypeScript strict mode 사용, `any` 타입 사용 금지
6. 환경변수는 `.env` 파일 사용, 키값 하드코딩 절대 금지
7. Gemini API는 반드시 `gemini-2.5-flash` 모델 사용 (`gemini-2.0-flash`는 deprecated)

## ⚠️ Gemini API 운영 주의사항
- **개발/테스트**: 무료 티어 사용 가능 (일 약 20회 요청 한도)
- **실사용자 서비스 시작 전**: 반드시 유료 전환 필요
  - 이유 1: 무료 티어는 일 20회 한도로 실서비스 불가
  - 이유 2: 무료 티어 프롬프트는 Google이 3년간 열람 가능 → 사용자 꿈 데이터 노출 위험
- **유료 요금**: 입력 $0.30/1M 토큰, 출력 $2.50/1M 토큰 (매우 저렴)

## 현재 개발 Phase
**Phase 1 (MVP)**: 대화형 AI 꿈 기록 + AI 해몽 + 기본 아카이브
- AI 이미지 생성 (드림 일러스트)은 MVP 이후 별도 Phase — 지금 구현하지 말 것
- 음성 입력은 Phase 5에서 도입 예정 — 지금 구현하지 말 것
