# MealMind

AI-powered meal planning for Pakistani users: fridge-first recipes (PKR budgets), smart local restaurant search, saved recipes and food links with Firestore sync, and an in-app chat assistant.

## Architecture

| Layer | Stack |
|--------|--------|
| **Frontend** | Vite, React 19, TypeScript, React Router 7, Tailwind, Firebase Auth + Firestore |
| **Backend** | Node.js, Express 5, Google Gemini (recipes, cravings parser, chat), Tavily (web search), Google Maps Places (Cravings) |

The frontend talks to the API under `/api/*` (proxied to `http://localhost:5001` in development).

## Core Features

- **Smart Fridge-First AI Chef**: Instant primary recipe generation specifically optimized for Pakistani kitchens—respecting budget, ingredients on hand, and current cooking skill.
- **Interactive Recipe Follower**: An active step-by-step cooking interface featuring a context-aware **AI Assistant widget** that automatically knows which step you are on to offer live technical help or localized ingredient substitutions.
- **Zero-Config High Availability AI**: The central intelligence is powered by Google Gemini, equipped with an automatic, native fallback to the **Groq API** (`llama-3.3-70b-versatile`) that instantly catches and handles 503 bottlenecks, ensuring users always get a recipe.
- **Single-Pass Online Enrichment**: Simultaneously searches the web via Tavily and extracts instructions, youtube videos, and macros directly into native application cards—eliminating extra round trips when following or saving external links.
- **Cravings & Local Dining**: Powered by Google Maps Places, parses abstract cravings ("I want something spicy near DHA") to extract localized Pakistani restaurant options mapped by realistic PKR budgets, distances, and enriched with social and Foodpanda links. 
- **Dynamic User Profiles**: Highly customizable diet/allergy restrictions and user macronutrient (calorie/protein) goals that transparently sync and act as a master context for all generated recommendations.
- **Robust Cloud Sync**: Firebase Auth & Firestore architecture for seamless cross-device synchronization of user saved recipes.

## Prerequisites

- Node.js 18+
- Firebase project with Email/Password auth and Firestore enabled
- [Google AI Studio](https://aistudio.google.com/) API key (Gemini)
- For **Cravings / local search**: Google Cloud project with [Places API](https://developers.google.com/maps/documentation/places/web-service) and a Maps API key
- Optional: [Tavily](https://tavily.com/) API key for richer web search in `/api/recommend`

## Setup

Install dependencies in **both** `backend/` and `frontend/`.

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set:

- `GEMINI_API_KEY` — required for AI Chef, Cravings query parsing, and chat
- `TAVILY_API_KEY` — optional; improves online recipe context
- `GOOGLE_MAPS_API_KEY` — required for `POST /api/cravings` (Places Text Search)
- `FRONTEND_URL` — optional; production CORS allowlist

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local` with your Firebase web app keys from the Firebase console. If Firebase vars are missing, the UI still runs but auth and Firestore features are disabled.

The **chat widget** calls `POST /api/chat` on the backend only; the Gemini key stays in `backend/.env` (`GEMINI_API_KEY`) and is never bundled into the frontend.

### Firestore rules

Deploy rules so users can only read/write their own data:

```bash
firebase deploy --only firestore:rules
```

(`firebase.json` and `firestore.rules` are in the repo root.)

## Run locally

**Terminal 1 — API**

```bash
cd backend
npm run dev
```

Expect: `http://localhost:5000`

**Terminal 2 — UI**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** (not port 3000).

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `backend/` | `npm run dev` | Watch mode server |
| `backend/` | `npm start` | Production-style start |
| `backend/` | `npm test` | Node test runner + cravings unit/property tests |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Typecheck + production bundle |

## Documentation

- [Product roadmap](documentation/roadmap.md) — phases, shipped features, backlog
- [Phase 0 problem framing](documentation/phase0_problem_framing.md)
- [Local search requirements (spec)](documentation/requirements.md) — Cravings / Places feature spec

## Security and API keys

- **Never commit real secrets.** Use `.env` / `.env.local` only on your machine; they are listed in `.gitignore`.
- **Only commit** `*.env.example` files with **empty** placeholders (no real keys).
- Root `.gitignore` and `frontend/` / `backend/` ignore files cover `.env` and `*.local`.
- If a key was ever committed, **rotate it** in Google Cloud / Firebase / AI Studio and remove it from git history.
- **Gemini** is used only on the server (`GEMINI_API_KEY`); restrict that key by server IP or disable browser key usage. **Maps** keys used from the backend for Cravings should be restricted similarly.

## License

Private / project use unless otherwise noted.
