# MealMind — UI Specification

> This document catalogues every existing screen and component, specifies **new UI** for MVP and growth, and defines **feature boundaries** so layout, pages, and chrome can be built before backend wiring. Use it as the single source of truth for design and implementation work.

---

## How to use this doc (feature splits)

- **Surfaces** = route + layout ownership. Teams can own a surface (e.g. “Library” = `/saved` + `/food-links`) and ship UI with mock data until APIs exist.
- **Shell** = shared chrome: navbar, optional secondary nav, floating assistant, toasts. Changes here affect every app page—coordinate centrally.
- **Status tags:** Live = implemented | Scaffold = route + layout + empty state | Planned = specified only

---

## Design System

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0c0c0c` | Page background |
| `--surface` | `rgba(255,255,255,0.04)` | Glass card surface |
| `--border` | `rgba(255,255,255,0.08)` | Subtle dividers |
| `--border2` | `rgba(255,255,255,0.15)` | Hover borders |
| `--accent` | `#e8522a` | Primary CTA, highlights |
| `--accent2` | `#ff8c00` | Gradient companion |
| `--text` | `#f2ede4` | Primary text |
| `--muted` | `#777` | Secondary / label text |

### Typography

| Role | Font | Weight |
|---|---|---|
| Headings | Syne | 700, 800 |
| Body / UI | DM Sans | 300, 400, 500 |

### Component Classes (already in `index.css`)

- `.glass-container` — centred content panel with backdrop blur and border
- `.glass-card` — inner card within a glass container
- `.btn-primary` — full-width accent button
- `.input-group` — labelled form field wrapper
- `.animate-fade-in` — 0.6 s fade-up entrance

### Shared UI primitives to add (design-system layer)

Build these once; reuse on every surface.

| Primitive | Purpose |
|---|---|
| `PageHeader` | Title + optional subtitle + breadcrumb / back |
| `SectionCard` | Titled glass block with consistent padding |
| `EmptyState` | Illustration/icon + title + body + primary CTA |
| `ConfirmDialog` | Destructive actions (delete account, remove saved item) |
| `Toast` / inline alert | Success / error feedback |
| `Tabs` or `SegmentedControl` | Profile sub-areas, settings |
| `TagInput` or multi-select chips | Allergies, diets, cuisines |
| `Skeleton` variants | List rows, cards, recipe block |

---

## UI architecture & routes

### Layouts

| Layout | Routes | Notes |
|---|---|---|
| **Marketing** | `/` | No app navbar; landing-only nav |
| **App shell** | `/dashboard`, `/demo`, `/cravings`, `/profile`, `/preferences`, `/dietary`, `/saved`, `/food-links`, `/onboarding` | Shared `Navbar` + main content area; chat FAB optional |
| **Auth** | `/login`, `/signup` | Centered forms; minimal chrome |

**Future:** Nested `profile/*` under one parent route with `<Outlet />` if sub-pages grow; until then, flat routes are fine.

### Information architecture (authenticated)

```
Dashboard (hub)
├── Try AI → /demo
├── Cravings → /cravings
├── Saved recipes → /saved
├── Saved food links → /food-links
├── Preferences → /preferences
├── Dietary & allergies → /dietary
└── Account / profile → /profile
```

Assistant (chat) is **global** in app shell: floating action button (FAB), opens panel/drawer; does not own a full-page route initially.

---

## Screen catalog

### 1. Landing Page — `/` — Live (DONE)

**File:** `frontend/src/pages/LandingPage.tsx`

Full marketing site: hero, features, local cuisine, how it works, testimonials, pricing cards, FAQ, CTA.

**Note:** Roadmap treats monetisation as post-MVP; pricing UI may stay as **marketing placeholder** or be simplified later—does not block app shell work.

All "Try AI" CTAs route to **`/demo`**.

---

### 2. Dashboard (app home) — `/dashboard` — Scaffold

**Purpose:** Single hub after login so users are not dropped straight into `/demo`. Divides features clearly: cook, discover, library, settings.

**Suggested sections (all can use placeholder counts):**

| Block | Content |
|---|---|
| Welcome | Display name + short line (“What’s cooking?”) |
| Quick actions | Cards or large buttons: Try AI, Local search, Saved recipes, Saved links |
| At a glance | Placeholder strips: “No meals planned” / “Diet profile complete” (wire later) |
| Footer link | Link to `/profile` or `/preferences` for incomplete profile |

**Layout:** `glass-container` with a responsive grid of `.glass-card` tiles; mobile stacks vertically.

**Auth:** Protected route (same as `/demo`).

---

### 3. Demo (AI Chef) — `/demo` — Live (DONE)

**File:** `frontend/src/pages/DemoPage.tsx`

Ingredients, budget, time, dietary goal/mood; recipe output with steps. Navbar via `AppLayout`.

**Enhancements (see also Macro & recipe actions):** macro badges row, Save recipe CTA (stub → `/saved`), optional “Apply profile defaults” toggle (reads preferences when backend exists).

---

### 4. Local Restaurant Search — `/cravings` — Live (mock data) (DONE)

**File:** `frontend/src/pages/Cravings.tsx`

Craving search → results with order actions. **Saved food links** are a separate library page (`/food-links`) where users revisit bookmarked outlets/items (UI can start with empty state + “Save from Cravings” copy).

---

### 5. Saved recipes — `/saved` — Scaffold

**Purpose:** Library of recipes the user saved from the AI flow (and eventually manual add).

**UI:**

- Toolbar: search (client-side later), sort (date, name), filter chips (tags—stub)
- Grid or list of `.glass-card` rows: title, date saved, macro summary placeholder, actions: Open / Cook again (pre-fill `/demo`) / Remove
- `EmptyState`: “Save a recipe from Try AI” → CTA to `/demo`

**Auth:** Protected.

---

### 6. Saved food links — `/food-links` — Scaffold

**Purpose:** Bookmarks for restaurant/order deep links (from Cravings or pasted). Distinct from saved *recipes*.

**UI:**

- List rows: restaurant name, item label, area, “Open link” primary, overflow: Edit label / Remove
- `EmptyState`: “No saved links yet” + CTA to `/cravings`
- Optional: “Add link manually” modal (URL + title fields)—stub OK

**Auth:** Protected.

---

### 7. Preferences — `/preferences` — Scaffold

**Purpose:** Non-medical preference profile—cuisines, spice, cooking effort, default budget band, goals—aligned with roadmap “preferences” system.

**UI:**

- Sections as `SectionCard`: Cuisine likes (chips), Spice level (segmented), Cooking skill (pills), Default budget range (slider or pills), Fitness / eating goal (pills)
- Sticky or bottom **Save** bar (disabled until dirty—optional)
- Mobile: single column; desktop: one column max-width for readability

**Data:** Local state + “Saved locally” stub until Firestore; structure should match `users/{uid}.preferences` in schema section.

---

### 8. Dietary & allergies — `/dietary` — Scaffold

**Purpose:** Allergies, intolerances, diets, and hard restrictions—clearly separated from “preferences” so filtering logic can attach later.

**UI:**

- **Allergies & intolerances:** multi-select chips + optional “Other” text
- **Diets:** checkboxes or multi-select (Vegetarian, Vegan, Halal, Gluten-free, Keto, etc.)
- Short **disclaimer** line: estimates only; not medical advice
- Save bar; link from onboarding step 1 should land here or mirror fields

**Auth:** Protected.

---

### 9. Profile & account — `/profile` — Scaffold

**Purpose:** Identity, credentials, danger zone—not the full diet/prefs matrix (those live on `/preferences` and `/dietary`).

**Sections:**

| Section | Content |
|---|---|
| Account | Avatar initial / upload later, display name, email read-only |
| Security | Change password, Google link status placeholder |
| Shortcuts | Links to `/preferences`, `/dietary`, `/saved`, `/food-links` |
| Danger zone | Delete account (confirm dialog) |

**Layout:** Sidebar tabs on desktop (`PageHeader` + list nav); mobile: stacked sections with anchor links or accordion.

---

### 10. Onboarding flow — `/onboarding` — Scaffold

**Route:** `/onboarding` (query `?step=` optional)

Shown once after signup (guard: if profile complete, redirect `/dashboard`). Multi-step wizard; steps should **mirror** fields on `/preferences` + `/dietary` so users can finish fast and refine later.

| Step | Focus |
|---|---|
| 1 | Diets + allergies (summary; detail on `/dietary`) |
| 2 | Budget + cooking skill |
| 3 | Cuisines + goal (optional) |

**UI:** Full-screen glass, step dots, Back / Next / Skip, final **Go to dashboard** CTA.

---

### 11. Login — `/login` — Live (DONE)

**File:** `frontend/src/pages/Login.tsx`

Email/password; redirect target should become **`/dashboard`** once it exists (today `/demo`).

---

### 12. Signup — `/signup` — Live (D0NE)

**File:** `frontend/src/pages/Signup.tsx`

Redirect after signup: **`/onboarding`** (then `/dashboard`), not raw `/demo`.

---

### 13. Navbar — shared — Live (needs enhancement)

**File:** `frontend/src/components/Navbar.tsx`

**App links (authenticated app shell):** Dashboard, Try AI, Cravings, Saved, Food links, Preferences (or grouped under “Settings” dropdown).

**Auth:** User dropdown (see below)—not logout-only.

---

### 14. User dropdown (navbar) — Scaffold

**Component:** `UserDropdown.tsx`

On avatar click: Profile, Preferences, Dietary & allergies, Saved recipes, Saved food links, Logout. Closes on outside click; `.glass-card`; min tap targets 44–48px.

---

### 15. Chat assistant (FAB) — Scaffold

**Components:** `ChatAssistantFab.tsx` + `ChatAssistantPanel.tsx` (or drawer)

- Fixed **bottom-right** FAB (accent or secondary surface); icon: message / sparkles
- Opens **right-side drawer** or bottom sheet on mobile with: header (“MealMind Assistant”), scrollable message list (placeholder bubbles), text input, send disabled or echo stub
- Z-index above page; respects safe area on notched phones
- Does not replace `/demo`—quick Q&A / tips only (backend later)

**Scope:** MVP = UI shell + stub replies; no model integration required to ship layout.

---

### 16. Macro & calorie display — Demo enhancement

Four stat pills under recipe title (calories, protein, carbs, fat). Requires backend `macros` object when wired.

---

### 17. Google Sign-In — Login & Signup enhancement

Continue with Google button + divider; same pattern as existing spec.

---

### 18. Cravings enhancements — Real data (when ready)

City/area field, skeleton cards, empty state. Deep links for ordering—not push notifications.

---

### 19. Mobile responsiveness — Cross-cutting

Audit: Dashboard, Profile, Preferences, Dietary, Saved, Food links, FAB drawer, Navbar drawer (375 / 390 widths).

---

## Phase 4+ UI (deferred)

Awareness only—do not block MVP shell.

| Item | Route / surface | Notes |
|---|---|---|
| Weekly meal plan | `/plan` | Calendar grid |
| Grocery export | panel/modal | From plan |
| Ramadan mode | toggle / planner | Slot labels |
| Urdu UI | global | Locale layer |

---

## Route map

| Route | Page | Status |
|---|---|---|
| `/` | Landing | Live |
| `/login` | Login | Live |
| `/signup` | Signup | Live |
| `/dashboard` | App hub | Scaffold |
| `/demo` | AI Chef | Live |
| `/cravings` | Local search | Live (mock) |
| `/onboarding` | Post-signup wizard | Scaffold |
| `/profile` | Account & shortcuts | Scaffold |
| `/preferences` | Cuisines, spice, budget, goals | Scaffold |
| `/dietary` | Allergies & diets | Scaffold |
| `/saved` | Saved recipes | Scaffold |
| `/food-links` | Saved restaurant/order links | Scaffold |

**Redirect policy (target):** Login/signup success → `/dashboard` or `/onboarding` if incomplete. Logout → `/`.

---

## Component checklist

| Component | File | Status |
|---|---|---|
| `Navbar` | `components/Navbar.tsx` | Live — extend links + dropdown |
| `UserDropdown` | `components/UserDropdown.tsx` | Scaffold |
| `ChatAssistantFab` | `components/ChatAssistantFab.tsx` | Scaffold |
| `ChatAssistantPanel` | `components/ChatAssistantPanel.tsx` | Scaffold |
| `PageHeader` | `components/PageHeader.tsx` | Scaffold |
| `SectionCard` | `components/SectionCard.tsx` | Scaffold |
| `EmptyState` | `components/EmptyState.tsx` | Scaffold |
| `OnboardingWizard` | `pages/OnboardingPage.tsx` or `components/OnboardingWizard.tsx` | Scaffold |
| `MacroBadges` | `components/MacroBadges.tsx` | Scaffold |
| `SkeletonCard` | `components/SkeletonCard.tsx` | Scaffold |
| `GoogleSignInButton` | `components/GoogleSignInButton.tsx` | Scaffold |
| `ConfirmDialog` | `components/ConfirmDialog.tsx` | Scaffold |

---

## Master UI implementation checklist

Use this as the **complete ordered backlog** for UI work. Check items off in PRs; sub-bullets can be parallelised by surface.

### 1. Shell & navigation

- [ ] Introduce **`/dashboard`** route and placeholder hub content
- [ ] Update **post-auth redirects**: signup → `/onboarding` (or `/dashboard` if skipping onboarding for now), login → `/dashboard`
- [ ] Extend **`Navbar`** app links: Dashboard, Try AI, Cravings, Saved, Food links, Settings entry point
- [ ] Implement **`UserDropdown`**: Profile, Preferences, Dietary, Saved recipes, Food links, Logout
- [ ] Replace inline logout-only pattern with dropdown for authenticated users
- [ ] Optional: **active link** styles for current route
- [ ] Ensure **mobile drawer** includes all new routes with 48px tap targets

### 2. Dashboard (`/dashboard`)

- [ ] Page layout: `PageHeader` + welcome line
- [ ] Quick action **tiles** to `/demo`, `/cravings`, `/saved`, `/food-links`
- [ ] Secondary row: shortcuts to `/preferences`, `/dietary`, `/profile`
- [ ] Empty / placeholder widgets for future “plan” or stats (non-blocking)
- [ ] `EmptyState` or banner if profile incomplete (copy only; logic later)

### 3. Profile (`/profile`)

- [ ] Account section: display name, email read-only
- [ ] Security placeholders: change password, “Connected with Google”
- [ ] **Shortcuts** list to preferences, dietary, saved, food links
- [ ] Danger zone: delete account UI + `ConfirmDialog` (handler stub)
- [ ] Responsive: stacked mobile, optional side nav desktop

### 4. Preferences (`/preferences`)

- [ ] `SectionCard` blocks: cuisines, spice, skill, budget defaults, goals
- [ ] Chip / segmented controls using design tokens
- [ ] Save bar or auto-save placeholder (local state OK)
- [ ] Link to `/dietary` for restrictions

### 5. Dietary & allergies (`/dietary`)

- [ ] Allergies / intolerances chip UI + optional free text
- [ ] Diet checkboxes
- [ ] Short non-medical disclaimer
- [ ] Save CTA; mirror critical fields from onboarding

### 6. Onboarding (`/onboarding`)

- [ ] Multi-step wizard shell (steps, progress dots)
- [ ] Fields aligned with preferences + dietary pages
- [ ] Final CTA to `/dashboard`; **Skip** still lands on `/dashboard` with toast “You can finish setup in Settings”
- [ ] Route guard placeholder: “completed onboarding” flag (localStorage or profile doc later)

### 7. Saved recipes (`/saved`)

- [ ] List/grid layout with `EmptyState` → CTA `/demo`
- [ ] Card actions: remove (confirm), “Cook again” (navigate to `/demo` with query stub)
- [ ] Skeleton loading state for future fetch

### 8. Saved food links (`/food-links`)

- [ ] List UI for bookmarked links
- [ ] `EmptyState` → `/cravings`
- [ ] Optional “Add manually” modal (URL + label)—stub
- [ ] Overflow menu: delete, copy link

### 9. Demo page (`/demo`) UI polish

- [ ] `MacroBadges` row (placeholder values if API missing)
- [ ] **Save recipe** button (toast “Saved” / disabled until backend)
- [ ] Optional toggle: “Use my profile defaults” (UI only)
- [ ] Mobile: stack inputs; demo-fill buttons full width

### 10. Cravings (`/cravings`) UI polish

- [ ] City/area field (when wired)
- [ ] Skeleton cards, empty state
- [ ] **Save to food links** action on card (stub)

### 11. Auth pages

- [ ] `GoogleSignInButton` on login + signup
- [ ] Divider “or continue with email”
- [ ] Adjust padding on narrow screens (QA)

### 12. Chat assistant (FAB)

- [ ] `ChatAssistantFab` fixed bottom-right (above safe area)
- [ ] `ChatAssistantPanel`: drawer + header + message list + input
- [ ] Open/close animation; focus trap optional; ESC closes
- [ ] Stub send: echo or static message—no backend required

### 13. Landing page (optional cleanup)

- [ ] If product direction removes paid tiers from MVP, replace pricing block with simpler “Free during beta” or feature list (product decision)

### 14. Cross-cutting QA

- [ ] Keyboard: tab order on modals, dropdowns, FAB
- [ ] Focus visible styles on buttons and inputs
- [ ] 375px / 390px pass on all new pages
- [ ] Loading/error toasts pattern (single approach)

---

## Full Feature Set (One‑Stop Meal Planning)

Vision reference: pantry → planning → cooking → tracking. **MVP UI** above prioritises shell + profile + library surfaces; pantry and full planner remain deferred per roadmap.

### Dietary Rules & Preferences

- Dietary style: halal / veg / vegan / pescatarian
- Allergens: nuts, dairy, gluten, eggs, soy (avoid lists)
- Disliked ingredients + cuisine preferences
- Spice tolerance and sweetness preference
- Household profiles (deferred; not MVP)

### Ordering / Eating Out (Cravings)

- Local search results; deep links to order
- Filters: distance, price, rating, halal, delivery time (when data exists)

### Accounts, Privacy, and Reliability

- Email/password (done) + Google sign-in (planned)
- Profile & preferences split across `/profile`, `/preferences`, `/dietary`
- Data export / offline (later)

---

## Implementation Plan (phased — product, not only UI)

Structured to ship UI surfaces early; wire Firestore and AI as follow-ons.

### Phase UI-1 — App shell + routes

- Add routes: `/dashboard`, `/profile`, `/preferences`, `/dietary`, `/saved`, `/food-links`, `/onboarding`
- Navbar + user dropdown + redirects
- All pages: real layout + empty states + local state stubs

### Phase UI-2 — Onboarding + profile data

- Persist preferences + dietary fields to Firestore (`users/{uid}`)
- Onboarding completion flag
- Demo: optional “apply profile” to pre-fill prompts

### Phase UI-3 — Saved content + demo actions

- Save recipe from `/demo` → `users/{uid}/recipes`
- Save Cravings link → `users/{uid}/foodLinks` (collection name as decided)
- Macro badges from API

### Phase UI-4 — Cravings real data + polish

- Backend `/api/cravings` + skeletons + mobile QA

### Phase 4+ product (post-MVP)

- Weekly plan, grocery export, Ramadan mode, Urdu UI — see roadmap

---

## Minimal Database Schema Proposal (MVP)

Because you already use **Firebase Auth**, the simplest full-stack path is **Firestore** for app data.

### Collections (Firestore)

#### `users/{uid}`

Profile + preference data (aligns with `/preferences` + `/dietary` UI).

```json
{
  "displayName": "Hafsa",
  "email": "hafsa@example.com",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "onboardingCompletedAt": "timestamp|null",
  "preferences": {
    "dietStyle": ["halal"],
    "allergens": ["nuts"],
    "dislikedIngredients": ["mushrooms"],
    "cuisineLikes": ["pakistani", "italian"],
    "spiceLevel": "medium",
    "budgetRangePkr": "300-700",
    "cookingSkill": "beginner",
    "goal": "high_protein"
  }
}
```

#### `users/{uid}/recipes/{recipeId}`

Saved recipes (from AI or manual).

```json
{
  "source": "ai",
  "title": "Spicy Chicken Rice Bowl",
  "ingredients": [
    { "name": "Chicken breast", "quantity": 250, "unit": "g" }
  ],
  "steps": ["..."],
  "macros": { "calories": 480, "protein": 38, "carbs": 42, "fat": 12 },
  "tags": ["high_protein", "desi"],
  "createdAt": "timestamp",
  "lastCookedAt": "timestamp|null",
  "rating": 4
}
```

#### `users/{uid}/foodLinks/{foodLinkId}`

Saved restaurant / order links (Cravings bookmarks).

```json
{
  "label": "Chicken handi — Cafe X",
  "url": "https://...",
  "source": "cravings|manual",
  "area": "DHA Phase 4",
  "createdAt": "timestamp"
}
```

#### `users/{uid}/pantryItems/{pantryItemId}` *(deferred feature)*

#### `users/{uid}/mealPlans/{planId}` *(deferred feature)*

---

### Minimal Indexing / Query Notes

- Saved recipes: order by `createdAt` desc
- Food links: order by `createdAt` desc

### Why Firestore (for MVP)

- Natural fit with Firebase Auth (`uid` scoping)
- Real-time updates for library pages

---

## Document history

- **2026:** Expanded for full app shell, dashboard, preferences/dietary split, saved recipes & food links, chat FAB, master checklist; aligned MVP scope with roadmap (features over monetisation).
