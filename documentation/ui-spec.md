# MealMind — UI Specification

> This document catalogues every screen and component, specifies UI for MVP and growth, and defines **feature boundaries**. Use it as the single source of truth for design and implementation work.
>
> **Last updated:** April 2026 — reflects the completed UI overhaul (unified Profile, new Sidebar, full page redesigns).

---

## How to use this doc

- **Surfaces** = route + layout ownership.
- **Shell** = shared chrome: sidebar, topbar. Changes here affect every app page.
- **Status tags:** `✅ Live` = implemented | `🏗 Scaffold` = UI built, no backend | `📋 Planned` = specified only

---

## Design System

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0c0c0c` | Page background |
| `--surface` | `#161616` | Card / panel base |
| `--surface2` | `#1f1f1f` | Secondary surfaces |
| `--border` | `rgba(255,255,255,0.07)` | Subtle dividers |
| `--border2` | `rgba(255,255,255,0.13)` | Hover borders |
| `--accent` | `#e8522a` | Primary CTA, highlights |
| `--accent2` | `#f5c842` | Gradient companion / warnings |
| `--accent3` | `#2ec27e` | Success, complete states |
| `--text` | `#f2ede4` | Primary text |
| `--muted` | `#777` | Secondary / label text |
| `--muted2` | `#444` | Tertiary / disabled |

### Typography

| Role | Font | Weight |
|---|---|---|
| Headings | Syne | 700, 800 |
| Body / UI | DM Sans | 300, 400, 500, 600, 700 |

Both fonts loaded from Google Fonts in `index.html`.

### Glass Card Pattern

All authenticated pages use a consistent glass card aesthetic:

```css
background: rgba(22, 22, 22, 0.7–0.8);
border: 1px solid rgba(255, 255, 255, 0.07);
border-radius: 18–22px;
backdrop-filter: blur(12–20px);
```

### Reusable CSS classes (in `index.css`)

| Class | Purpose |
|---|---|
| `.glass-container` | Centred content panel with blur + border |
| `.glass-card` | Inner card within a glass container |
| `.btn-primary` | Full-width accent button |
| `.input-group` | Labelled form field wrapper |
| `.animate-fade-in` | 0.55s fade-up entrance animation |

> **Note:** Sidebar, AppShellLayout, and all page components use scoped `<style>` blocks for their own styles, keeping `index.css` minimal and global only.

---

## UI Architecture & Routes

### Layouts

| Layout | Routes | Notes |
|---|---|---|
| **Marketing** | `/` | Landing-only nav (Navbar.tsx) |
| **App shell** | `/dashboard`, `/demo`, `/cravings`, `/profile`, `/saved`, `/food-links`, `/onboarding` | Sidebar + topbar + scrollable content |
| **Auth** | `/login`, `/signup` | Centred forms; minimal chrome |

### Information Architecture (Authenticated)

```
Sidebar navigation
├── Dashboard        → /dashboard
├── AI Chef          → /demo
├── Cravings         → /cravings
├── Saved Recipes    → /saved
├── Food Links       → /food-links
├── Profile          → /profile  (tabs: Profile | Preferences | Diet & Allergies)
└── Onboarding       → /onboarding
```

> **Key change (April 2026):** `/preferences` and `/dietary` are no longer standalone routes. They are **tabs within `/profile`**. Visiting those old URLs redirects to `/profile`.

---

## App Shell Components

### Sidebar — `components/Sidebar.tsx` — ✅ Live

Premium glassmorphism sidebar with full redesign:

- **Brand**: MealMind logo (🍛 icon + wordmark) linking to `/dashboard`
- **Nav items** with emoji icons: Dashboard 🏠, AI Chef 👨‍🍳, Cravings 🛵, Saved Recipes 📖, Food Links 🔗, Profile ⚙️, Onboarding ✨
- **Active state**: orange-tinted background + border highlight on current route
- **User card** at bottom: avatar initials, display name, plan badge, logout button
- **Dimensions**: 220px wide, sticky, full viewport height
- All styles are scoped within the component's `<style>` tag

### AppShellLayout — `components/AppShellLayout.tsx` — ✅ Live

Authenticated layout wrapper:

- Renders **Sidebar** + a right-side main area
- **Topbar**: sticky, shows current page title + subtitle (resolved from `PAGE_TITLES` map) + "Free tier" pill
- Scrollable content area with custom thin scrollbar styling
- Passes page content via `<Outlet />`

---

## Screen Catalog

### 1. Landing Page — `/` — ✅ Live

**File:** `frontend/src/pages/LandingPage.tsx`

Full marketing site: hero, stats strip, food ticker, features grid, local cuisine section, how it works (tabbed), testimonials carousel, pricing cards, FAQ accordion, CTA, footer.

Design tokens defined inline via a `<style>` tag; uses same `--accent`, `--bg`, `--text` variables as app shell.

---

### 2. Dashboard — `/dashboard` — ✅ Live

**File:** `frontend/src/pages/DashboardPage.tsx`

Rich landing experience after login:

| Block | Content |
|---|---|
| **Welcome hero** | Gradient glow, "Hey [name]" greeting, two CTAs (AI Chef + Cravings) |
| **Stats row** | 3 clickable stat cards: meals this week, saved recipes, profile %, each linking to the relevant page |
| **Quick actions grid** | 6 tiles (AI Chef, Cravings, Saved, Food Links, Profile, Onboarding) with emojis and descriptions |

All stats are placeholder values until Firestore is wired.

---

### 3. AI Chef (Demo) — `/demo` — ✅ Live

**File:** `frontend/src/pages/DemoPage.tsx`

Redesigned UI, same backend call:

- Glass card with title, subtitle, demo-fill buttons (PKR Demo + Desi Empty Fridge)
- Form fields: ingredients (textarea), budget, time, goal — all styled to match design system
- Loading spinner with rotating messages during API call
- **Result view**: recipe title (Syne 800), numbered steps with accent-bordered step numbers, "Plan Another Meal" ghost button
- **Error view**: red-tinted card with Try Again CTA

---

### 4. Cravings — `/cravings` — ✅ Live (mock data)

**File:** `frontend/src/pages/Cravings.tsx`

Redesigned full-page experience:

- **Search card**: title, description, quick-pick chips (Burger, Biryani, Wrap, Pizza, Ramen, Healthy Bowl)
- Single text input with focus ring, full-width submit button
- **Loading state**: inline spinner with "Scanning restaurants near you..."
- **Result cards**: emoji, item name, restaurant, tags (⭐ rating, 📍 distance, 💰 price, 📱 platform), "Order ↗" accent button

---

### 5. Saved Recipes — `/saved` — 🏗 Scaffold

**File:** `frontend/src/pages/SavedRecipesPage.tsx`

Full redesign with interactive state:

- **Card list**: emoji, title, meta tags (time, difficulty, date saved), macros, "Cook again" / "Remove" buttons
- Remove is interactive (updates local state, card disappears)
- **Empty state**: illustrated prompt with CTA to `/demo`
- CTA row at bottom linking to AI Chef

---

### 6. Food Links — `/food-links` — 🏗 Scaffold

**File:** `frontend/src/pages/FoodLinksPage.tsx`

Clean list of bookmarked restaurants:

- Cards with emoji, item name, restaurant, tags (distance, price, area, platform)
- "Order ↗" button styled with accent outline
- CTA strip linking to Cravings

---

### 7. Profile — `/profile` — ✅ Live (tabbed, replaces 3 pages)

**File:** `frontend/src/pages/ProfilePage.tsx`

**Single unified page** replacing `/profile`, `/preferences`, and `/dietary`. Contains three tabs:

#### Tab 1 — Profile
- Avatar with initials, display name, email, member since, plan tier
- Profile completion progress bar
- Security buttons (change password, Google connect — stubbed)
- Danger zone (delete account — stubbed)

#### Tab 2 — Preferences
- Favourite cuisines (interactive multi-select chips): Pakistani, Italian, East Asian, Middle Eastern, Fast Casual, Thai, Mexican, American
- Spice level (pill select with emoji): 🌿 Mild, 🌶️ Medium, 🔥 Hot, 💀 Extra Hot
- Default budget (pills): Under 300 PKR, 300–700 PKR, 700–1500 PKR, No limit
- Cooking skill (pills): Beginner, Intermediate, Home Chef
- Health goal (pills): Weight loss, Muscle gain, Maintenance, Eat well
- Save button (stubbed)

#### Tab 3 — Diet & Allergies
- Allergies & intolerances (interactive chips): Peanuts, Tree nuts, Shellfish, Dairy, Eggs, Wheat/Gluten, Soy, Fish
- Dietary restrictions (chips): Halal, Vegetarian, Vegan, Gluten-free, Dairy-free, High protein, Low carb, Diabetic-friendly
- Non-medical disclaimer
- Save button (stubbed)

> **Old routes** `/preferences` and `/dietary` now redirect to `/profile` via `<Navigate>`.

---

### 8. Onboarding — `/onboarding` — 🏗 Scaffold

**File:** `frontend/src/pages/OnboardingPage.tsx`

Multi-step wizard with redesigned UI:

- **Step indicator bar**: 3 steps with emoji, label, and status (✓ Done / ● In progress / ○)
- Step 2 form: weekly budget text input + cooking skill pill selector
- Actions: Back (disabled), Next → (navigates to dashboard), Skip for now

---

### 9. Login — `/login` — ✅ Live

**File:** `frontend/src/pages/Login.tsx`

Post-login redirect: `/dashboard`.

---

### 10. Signup — `/signup` — ✅ Live

**File:** `frontend/src/pages/Signup.tsx`

Post-signup redirect: `/onboarding`.

---

## Route Map

| Route | Page | Status | Notes |
|---|---|---|---|
| `/` | Landing | ✅ Live | Marketing site |
| `/login` | Login | ✅ Live | Redirects → `/dashboard` |
| `/signup` | Signup | ✅ Live | Redirects → `/onboarding` |
| `/dashboard` | App hub | ✅ Live | Welcome hero + stats + quick actions |
| `/demo` | AI Chef | ✅ Live | Redesigned form + result UI |
| `/cravings` | Local search | ✅ Live (mock) | Quick chips + result cards |
| `/saved` | Saved recipes | 🏗 Scaffold | Interactive list, empty state |
| `/food-links` | Saved order links | 🏗 Scaffold | Card list with order buttons |
| `/profile` | Profile + Preferences + Dietary | ✅ Live | Unified tabbed page |
| `/preferences` | — | Redirect | → `/profile` |
| `/dietary` | — | Redirect | → `/profile` |
| `/onboarding` | Setup wizard | 🏗 Scaffold | Step indicator, skill picker |

---

## Component Checklist

| Component | File | Status |
|---|---|---|
| `Sidebar` | `components/Sidebar.tsx` | ✅ Live — redesigned |
| `AppShellLayout` | `components/AppShellLayout.tsx` | ✅ Live — redesigned |
| `AppPageShell` | `components/AppPageShell.tsx` | Legacy — still used by Login/Signup only |
| `Navbar` | `components/Navbar.tsx` | ✅ Live — landing page only |
| `RequireAuth` | `components/RequireAuth.tsx` | ✅ Live |
| `GoogleSignInButton` | `components/GoogleSignInButton.tsx` | 📋 Planned |
| `ConfirmDialog` | `components/ConfirmDialog.tsx` | 📋 Planned |
| `MacroBadges` | `components/MacroBadges.tsx` | 📋 Planned |
| `ChatAssistantFab` | `components/ChatAssistantFab.tsx` | 📋 Planned |

---

## Remaining MVP UI Work

### Priority 1 — Backend wiring
- [ ] Wire `/profile` tabs → Firestore `users/{uid}.preferences`
- [ ] Wire `/saved` remove + "Cook again" → `users/{uid}/recipes`
- [ ] Wire `/food-links` → `users/{uid}/foodLinks`
- [ ] Wire Cravings "Save to Food Links" action

### Priority 2 — Demo enhancements
- [ ] `MacroBadges` row on recipe result (calories, protein, carbs, fat)
- [ ] "Save recipe" button (stub toast until backend)
- [ ] "Use my profile defaults" toggle (UI only)

### Priority 3 — Auth enhancements
- [ ] `GoogleSignInButton` on login + signup
- [ ] Divider "or continue with email"

### Priority 4 — Polish & QA
- [ ] Mobile sidebar: collapse to icon-only or hamburger drawer at < 768px
- [ ] Onboarding multi-step completion (steps 1 + 3)
- [ ] 375px / 390px responsive pass on all pages
- [ ] Keyboard navigation (tab order, focus visible)
- [ ] Loading/error toast pattern (single consistent approach)

---

## Phase 4+ UI (Deferred)

| Item | Route / surface | Notes |
|---|---|---|
| Weekly meal plan | `/plan` | Calendar grid |
| Grocery export | panel/modal | From plan |
| Ramadan mode | toggle / planner | Slot labels |
| Urdu UI | global | Locale layer |
| Household profiles | `/family` | Multiple member preferences |

---

## Minimal Database Schema (MVP)

Using **Firestore** with Firebase Auth (`uid` scoping).

### `users/{uid}`

```json
{
  "displayName": "Hafsa",
  "email": "hafsa@example.com",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "onboardingCompletedAt": "timestamp|null",
  "preferences": {
    "cuisines": ["pakistani", "italian"],
    "spiceLevel": "medium",
    "budgetRangePkr": "300-700",
    "cookingSkill": "intermediate",
    "goal": "eat_well",
    "allergens": ["peanuts", "shellfish", "dairy"],
    "diets": ["halal", "high_protein"]
  }
}
```

> **Note:** Profile + preferences + dietary are all stored in a single `preferences` object within the user doc. Previously these were modelled separately to match 3 separate routes; they are now unified to match the tabbed Profile UI.

### `users/{uid}/recipes/{recipeId}`

```json
{
  "source": "ai",
  "title": "Chicken Karahi",
  "steps": ["..."],
  "macros": { "calories": 480, "protein": 38, "carbs": 42, "fat": 12 },
  "tags": ["desi", "high_protein"],
  "emoji": "🍛",
  "time": "30 min",
  "difficulty": "Medium",
  "createdAt": "timestamp"
}
```

### `users/{uid}/foodLinks/{foodLinkId}`

```json
{
  "label": "Smash Beef Burger",
  "restaurant": "Burger Lab — DHA",
  "url": "https://...",
  "platform": "Foodpanda",
  "area": "DHA Phase 4",
  "distance": "1.2 km",
  "price": "Rs. 850",
  "emoji": "🍔",
  "createdAt": "timestamp"
}
```

---

## Document History

| Date | Change |
|---|---|
| Early 2026 | Initial spec — app shell, dashboard, preferences/dietary split, saved recipes, food links, chat FAB, master checklist |
| April 2026 | **Major overhaul** — unified Profile page (tabs replace `/preferences` + `/dietary` routes), redesigned Sidebar (glassmorphism, emoji icons, user card), new AppShellLayout (topbar), complete page redesigns (Dashboard hero, Cravings chips, Demo numbered steps, Saved interactive cards, Food Links, Onboarding step tracker) |
