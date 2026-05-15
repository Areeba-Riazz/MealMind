# 🧠 MealMind

**AI-powered meal planning built for Pakistani kitchens.**

_Cook smarter with what you have. Discover local restaurants. Plan on your budget._

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](#license)

</div>

---

## Overview

MealMind is a full-stack AI meal planning web application tailored for Pakistani users. It solves a real, everyday problem: **what should I eat right now, given what's in my fridge, my budget in PKR, and my dietary preferences?**

Instead of generic Western-focused meal apps, MealMind understands Pakistani cuisines, local ingredients, realistic grocery budgets, and nearby restaurants — all powered by Google Gemini AI with automatic Groq fallback for zero-downtime reliability.

---

## Features

### Fridge-First AI Chef
Enter the ingredients you already have and get fully structured Pakistani recipes in seconds. The AI factors in your available ingredients, PKR budget ceiling, cooking time, dietary goals (weight loss, muscle gain, etc.), and mood — generating recipes that are actually achievable in a Pakistani home kitchen.

### Smart Cravings & Local Dining
Not feeling like cooking? Describe your craving in plain Urdu/English (e.g., *"spicy biryani near DHA under 500 PKR"*) and MealMind parses it with Gemini, queries Google Maps Places API, and returns up to 5 real nearby restaurants — mapped to your location with distance, price tier, and Foodpanda links.

### Context-Aware AI Chat Assistant
A floating chat widget available on every page that acts as your personal culinary assistant. It automatically pulls your saved profile — favourite cuisines, budget range, allergens, dietary restrictions, skill level — and never suggests food that violates your preferences. Available anywhere in the app, theme-synced.

### Single-Pass Online Recipe Enrichment
Paste any food link and MealMind simultaneously fetches structured recipe instructions, macros, and a linked YouTube video (via Tavily web search) — no extra tabs, no extra steps.

### Interactive Step-by-Step Cooking Mode
Follow recipes actively with a live cooking interface. The AI assistant tracks your current step and can answer technique questions, suggest Pakistani ingredient substitutions, or explain cooking terms in context.

### Cloud-Synced Saves
Save AI-generated recipes, online recipe links, and restaurant discoveries to your personal collection. Everything syncs in real-time across devices via Firestore. Includes an offline-resilient `localStorage` fallback.

### Secure & Resilient Backend
- API keys never leave the server — Gemini key is backend-only
- Automatic AI fallback: Gemini 503 → Groq `llama-3.3-70b-versatile` with zero user disruption
- Firestore security rules enforce per-user data isolation
- Property-based and integration tests on all critical backend logic

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React 19)           │
│  TypeScript · React Router v7 · Tailwind CSS            │
│  Firebase Auth · Firestore SDK · Leaflet Maps           │
│  PostHog Analytics · PreferencesContext                 │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP /api/* (proxied)
┌────────────────────────▼────────────────────────────────┐
│                    Backend (Express 5 / Node 18+)       │
│                                                         │
│  POST /api/recommend    → AI Chef (ingredients→recipe)  │
│  POST /api/cravings     → Restaurant finder             │
│  POST /api/chat         → Conversational assistant      │
│  POST /api/enrich       → Web recipe enrichment         │
│                                                         │
│  Google Gemini ──(503 fallback)──▶ Groq LLaMA 3.3 70B  │
│  Tavily Web Search                                      │
│  Google Maps Places API                                 │
└────────────────────────────────────────────────────────-┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    Firebase (Google Cloud)              │
│  Authentication (Email/Password)                        │
│  Firestore (savedRecipes · foodLinks · userProfile)     │
└─────────────────────────────────────────────────────────┘
```

| Layer | Technology |
|---|---|
| **Frontend** | Vite 8, React 19, TypeScript 5.9, React Router v7, Tailwind CSS v3 |
| **Backend** | Node.js 18+, Express 5, `node --watch` (no nodemon needed) |
| **AI / LLM** | Google Gemini (`@google/generative-ai`), Groq API (fallback) |
| **Search** | Tavily Web Search API |
| **Maps** | Google Maps Places Text Search API, Leaflet (frontend map) |
| **Auth & DB** | Firebase Authentication, Cloud Firestore |
| **Analytics** | PostHog |
| **Testing** | Node built-in test runner, Supertest, fast-check (property tests) |

---

## Getting Started

### Prerequisites

| Requirement | Details |
|---|---|
| **Node.js** | v18 or higher |
| **Firebase project** | Email/Password auth + Firestore enabled |
| **Google AI Studio** | [Gemini API key](https://aistudio.google.com/) |
| **Google Cloud** | Maps Platform project with [Places API](https://developers.google.com/maps/documentation/places/web-service) enabled |
| **Tavily** *(optional)* | [API key](https://tavily.com/) — improves online recipe context |

---

### 1. Clone the repository

```bash
git clone https://github.com/areeba-riazz/MealMind.git
cd MealMind
```

---

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and fill in your keys:

```env
GEMINI_API_KEY=        # Required — AI Chef, cravings parser, chat
GOOGLE_MAPS_API_KEY=   # Required — POST /api/cravings (Places Text Search)
TAVILY_API_KEY=        # Optional — richer online recipe enrichment
FRONTEND_URL=          # Optional — production CORS allowlist (e.g. https://yourdomain.com)
```

> **Security:** The `GEMINI_API_KEY` is only used server-side and is never bundled into the frontend build.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local` with your Firebase project credentials (from the Firebase console → Project Settings → Your apps):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> If Firebase vars are missing, the app still runs in demo mode — auth and Firestore sync are disabled.

---

### 4. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

This deploys `firestore.rules` (located in the repo root) to enforce that users can only read/write their own data.

---

### 5. Run Locally

Open **two terminals**:

**Terminal 1 — Backend API**
```bash
cd backend
npm run dev
# Server starts at http://localhost:5001
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# App opens at http://localhost:5173
```

The frontend Vite config proxies all `/api/*` requests to `http://localhost:5001`.

---

## Testing

```bash
cd backend
npm test
```

The test suite covers:
- **Unit tests**: Cravings price-tier filter, `formatResults`, Haversine distance calculation
- **Property-based tests**: `fast-check` fuzz testing on the price filter logic
- **Integration tests**: Supertest against live Express routes

---

## Available Scripts

| Directory | Command | Description |
|---|---|---|
| `backend/` | `npm run dev` | Start backend with `--watch` (auto-reload) |
| `backend/` | `npm start` | Start backend in production mode |
| `backend/` | `npm test` | Run full test suite (unit + property + integration) |
| `frontend/` | `npm run dev` | Vite dev server with HMR |
| `frontend/` | `npm run build` | Typecheck + production bundle |
| `frontend/` | `npm run preview` | Preview the production build locally |
| `root` | `firebase deploy --only firestore:rules` | Deploy Firestore security rules |

---

## Project Structure

```
MealMind/
├── backend/
│   ├── server.js            # Express app entry — all /api routes
│   ├── server.test.js       # Full test suite
│   ├── services/            # AI service wrappers (Gemini, Groq, Tavily)
│   ├── utils/               # Haversine, formatters, helpers
│   ├── models.json          # Gemini/Groq model configuration
│   └── .env.example         # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route-level page components
│   │   ├── components/      # Shared UI components (Chat, Sidebar, etc.)
│   │   ├── context/         # React contexts (Auth, Preferences, Theme)
│   │   ├── hooks/           # Custom hooks (useGeolocation, useSavedRecipes, etc.)
│   │   ├── lib/             # API client helpers
│   │   └── types/           # TypeScript interfaces
│   ├── public/
│   └── .env.example         # Firebase variable template
│
├── documentation/
│   ├── roadmap.md           # Full product roadmap (Phase 0–5)
│   ├── phase0_problem_framing.md
│   └── requirements.md      # Cravings / Places feature spec
│
├── firestore.rules          # Firestore security rules
└── firebase.json            # Firebase deploy config
```

---

## Security Guidelines

- **Never commit real secrets.** `.env` and `.env.local` are in `.gitignore`.
- **Only commit `*.env.example`** files with empty placeholder values — no real keys.
- **Restrict API keys** in Google Cloud Console: restrict `GEMINI_API_KEY` by server IP; restrict `GOOGLE_MAPS_API_KEY` by referrer/IP.
- **If a key was accidentally committed**, rotate it immediately in Google Cloud / Firebase / AI Studio and purge it from git history with `git filter-branch` or BFG Repo Cleaner.

---

## Documentation

| Document | Description |
|---|---|
| [`documentation/roadmap.md`](documentation/roadmap.md) | Full product roadmap — shipped phases, planned features, backlog |
| [`documentation/phase0_problem_framing.md`](documentation/phase0_problem_framing.md) | User research, competitive analysis, problem definition |
| [`documentation/requirements.md`](documentation/requirements.md) | Cravings / Places API feature specification |
| [`PHASE4_COMPLETE_GUIDE.md`](PHASE4_COMPLETE_GUIDE.md) | Phase 4 growth features guide |

---

## Roadmap

| Phase | Status | Highlights |
|---|---|---|
| **Phase 0** — Problem Framing | ✅ Complete | User research, competitive analysis |
| **Phase 1** — Foundation | ✅ Complete | Auth, routing, design system |
| **Phase 2** — Core AI Features | ✅ Complete | Fridge-first recipes, budget/macro filtering |
| **Phase 3** — MVP Launch | ✅ Complete | Full app shell, cravings, cloud sync, chat |
| **Phase 4** — Growth & Retention | 📋 Planned | Urdu UI, weekly planner, grocery export |
| **Phase 5** — Platform Expansion | 📋 Planned | Receipt OCR, AI nutritionist, mood suggestions |

---

## Contributing

This is a private academic project. Contributions are not open at this time.

---

*Developed for AI Product Development (AI-4013), FAST-NUCES Islamabad — MealMind.*