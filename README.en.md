# DreamTeller 🌙

[한국어](README.md) | **English**

> A cozy dream journal app where a conversational AI helps you record your dreams, then offers interpretation and an archive

DreamTeller is an iOS app that helps you capture the fading fragments of a dream right after waking up — through a natural conversation with AI — and build your own dream archive alongside AI-powered interpretations.

## Features

- **Conversational dream logging** — A chat-based flow where the AI asks questions and helps you piece your dream together
- **AI dream interpretation** — Interpretation and self-reflection insights for each recorded dream (Google Gemini)
- **Dream archive** — A growing journal of your dreams by date, with recording stats
- **Guest mode** — Start exploring without signing up, then upgrade to an Apple/Google account later while keeping all your records

## Tech Stack

| Area | Technology |
|------|------------|
| App | React Native (Expo), TypeScript — iOS first |
| Backend | FastAPI (Python) |
| DB / Auth / Storage | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth — email OTP, Apple/Google sign-in, anonymous (guest) sign-in |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| Infra | AWS EC2 (API server), AWS Amplify (static web), Route 53 |

## Project Structure

```
dreamteller/
├── app/          # React Native (Expo) mobile app
│   └── src/      # components, screens, navigation, services, store, hooks ...
├── server/       # FastAPI backend
│   └── app/      # routes (dreams, interpret, stats, account), services, schemas ...
├── web/          # Static website (landing, privacy policy, terms) — deployed via Amplify
├── app-store/    # App Store submission assets (screenshots, metadata)
├── docs/         # Project documentation
└── amplify.yml   # Amplify deployment config
```

## Getting Started

### App (Expo)

```bash
cd app
npm install
npx expo start
```

### Backend (FastAPI)

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

> Both the app and the server require a `.env` file with environment variables (Supabase URL/Key, Gemini API Key, etc.). Never hardcode secrets in the codebase.

## Documentation

All documents are written in Korean.

| Document | Description |
|----------|-------------|
| [`docs/SPEC.md`](docs/SPEC.md) | Detailed feature specs per screen |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Folder structure, tech stack, data model |
| [`docs/API.md`](docs/API.md) | Backend REST API reference |
| [`docs/PROMPT_GUIDE.md`](docs/PROMPT_GUIDE.md) | Prompt design for each AI feature |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Colors, typography, component rules |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | Current progress and next steps |

## Website

- Home: https://dreamteller.io.kr
- Privacy Policy: https://dreamteller.io.kr/privacy.html
- Terms of Service: https://dreamteller.io.kr/terms.html

## License

© 2026 Yeongmo Kang. All rights reserved.
