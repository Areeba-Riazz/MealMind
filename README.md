# MealMind

AI-powered meal planning for Pakistani users: fridge-first recipes (PKR budgets), smart local restaurant search, saved recipes and food links with Firestore sync, and an in-app chat assistant.

## Architecture

| Layer | Stack |
|--------|--------|
| **Frontend** | Vite, React 19, TypeScript, React Router 7, Tailwind, Firebase Auth + Firestore |
| **Backend** | Node.js, Express 5, Google Gemini (recipes, cravings parser, chat), Tavily (web search), Google Maps Places (Cravings) |

The frontend talks to the API under `/api/*` (proxied to `http://localhost:5001` in development).

## Core Features

- **Fridge-First AI Chef & Planner**: Instantly generates recipes optimized for Pakistani kitchens using ingredients you already have. Natively supports full meal planning tailored to specific PKR budgets and macronutrient/dietary goals.
- **Globally Accessible, Context-Aware AI Chat**: A theme-aware culinary assistant available anywhere in the app via a floating button. It acts as a master context, automatically reading your dynamic profile (favourite cuisines, budget, skill, allergens) so it never suggests food that violates your restrictions.
- **Interactive Recipe Follower & Clarification**: An active step-by-step cooking interface where the AI Assistant tracks your progress to offer live technical help, technique explanations, or localized ingredient substitutions.
- **Cravings & Local Dining Intelligence**: Not in the mood to cook? The AI recommends dishes to order. Powered by Google Maps Places, it parses abstract cravings (e.g., "spicy food near DHA") into localized restaurant options, mapped to realistic budgets and enriched with Foodpanda links.
- **Single-Pass Online Enrichment**: Simultaneously searches the web (via Tavily) to extract instructions, YouTube videos, and macros directly into native application cards—eliminating extra round trips when following or saving external links.
- **Zero-Config High Availability AI**: Central intelligence powered by Google Gemini with an automatic, native fallback to the **Groq API** (`llama-3.3-70b-versatile`) that instantly catches and handles 503 bottlenecks, ensuring you always get an answer.
- **Robust Cloud Sync**: Firebase Auth & Firestore architecture provides seamless, cross-device synchronization of your saved recipes and dynamic preferences.

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
