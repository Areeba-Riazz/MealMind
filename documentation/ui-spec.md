# MealMind — UI Specification

> This document catalogues every existing screen and component, and specifies all **new UI** needed to complete Phase 3 and prepare for Phase 4. Use it as the single source of truth for design and implementation work.

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

---

## Existing Screens

### 1. Landing Page — `/`

**File:** `frontend/src/pages/LandingPage.tsx`

Full marketing site. Sections:
- Hero (headline, sub-copy, two CTAs, scrolling ticker)
- Features grid (`.feat-card` with custom `--c` colour token)
- Local cuisine / desi angle
- How It Works (3-step process)
- Testimonials / reviews carousel (drag-to-scroll)
- Pricing cards (Free / Pro / Family)
- FAQ accordion
- Final CTA banner

All "Try AI" CTAs now route to **`/demo`**.

---

### 2. Demo (AI Chef) — `/demo`

**File:** `frontend/src/pages/DemoPage.tsx`

Authenticated users can input:
- Ingredients (required textarea)
- Budget constraint (optional)
- Max cooking time (optional)
- Dietary goal / mood (optional)

Demo-fill buttons: "Fill PKR Demo" and "Desi Empty Fridge Demo".

Output: recipe name + numbered step-by-step instructions, with fallback creative pivot banner.

**Navbar:** provided by `AppLayout` in `App.tsx` (shared `Navbar` component).

---

### 3. Local Restaurant Search — `/cravings`

**File:** `frontend/src/pages/Cravings.tsx`

Natural-language craving search → mock list of restaurant results with:
- Restaurant name, item name, rating
- Distance & price
- "Order Now" button (deep-links to Foodpanda / WhatsApp)

Currently returns hard-coded mock data. Real integration is a Phase 3 to-do.

---

### 4. Login — `/login`

**File:** `frontend/src/pages/Login.tsx`

Email + password sign-in via Firebase. Redirects to `/demo` on success.
Link to Signup page.

---

### 5. Signup — `/signup`

**File:** `frontend/src/pages/Signup.tsx`

Email + password account creation via Firebase. Redirects to `/demo` on success.
Link to Login page.

---

### 6. Navbar — shared component

**File:** `frontend/src/components/Navbar.tsx`

Fixed top bar. Adapts based on route:
- On `/`: shows landing-page section anchors (Features, Local Cuisine, How It Works, Pricing, Reviews)
- On all other routes: shows app links (Home, Try AI `/demo`, Local Search `/cravings`)

Auth state:
- Unauthenticated: "Log In" ghost button + "Try Free" accent button
- Authenticated: avatar initial + username + Logout button

Responsive: collapses to hamburger on ≤768 px with a full-screen mobile drawer.

---

## New UI Needed — Phase 3

### A. Onboarding Flow (post-signup)

**Route:** `/onboarding` (or modal triggered after `/signup`)
**Priority:** High

A one-time, multi-step wizard shown immediately after a user creates an account. Prevents raw entry into the demo without context.

**Steps:**

| Step | Fields |
|---|---|
| 1 — Dietary Profile | Checkboxes: Vegetarian, Vegan, Halal, Gluten-free, Dairy-free |
| 2 — Budget Range | Slider or quick-pick: Under 300 PKR / 300–700 PKR / 700–1500 PKR / No limit |
| 3 — Cooking Skill | Single-select pill: Beginner / Intermediate / Home Chef |
| 4 — Fitness Goal | Pill: Weight loss / Muscle gain / Maintenance / Just eat well |

**UI pattern:** Full-screen glass panel, step indicator dots at top, "Next" / "Skip" / "Back" navigation at bottom, progress stored in Firebase user profile document.

---

### B. User Profile & Settings — `/profile`

**Priority:** High

Accessible via Navbar avatar click (currently triggers logout; needs a dropdown first — see C).

**Sections:**

| Section | Content |
|---|---|
| Account | Display name (editable), email (read-only), change password link |
| Dietary Preferences | Same fields as onboarding — editable at any time |
| Budget & Cooking | Budget range, skill level |
| Saved Meals | List of saved recipes (see Phase 4 note) — placeholder "No saved meals yet" for now |
| Danger Zone | Delete account button |

**Layout:** Two-column on desktop (sidebar nav + content panel), single-column on mobile.

---

### C. User Dropdown Menu (Navbar enhancement)

**Priority:** High (blocks profile access)

When a user is logged in, the avatar + username area should open a small dropdown on click instead of showing a Logout button inline.

**Dropdown items:**
- Profile & Preferences → `/profile`
- My Saved Meals → `/profile#saved` (or `/saved`)
- Logout

**UI pattern:** Absolute-positioned `.glass-card` below the avatar, 180–200 px wide, subtle entrance animation, closes on outside click.

---

### D. Macro & Calorie Display (DemoPage enhancement)

**Priority:** Medium

After the AI returns a recipe, display a nutrition summary row beneath the recipe name.

**Fields to show:** Estimated calories, protein (g), carbs (g), fat (g).

**UI pattern:** Four pill-shaped stat badges in a horizontal row:
```
🔥 480 kcal   💪 38 g protein   🌾 42 g carbs   🥑 12 g fat
```
Sourced from the AI response (the backend prompt needs to return a `macros` object alongside `recipeName` and `instructions`).

**Backend change required:** Update `/api/recommend` response schema and Gemini prompt to include `macros: { calories, protein, carbs, fat }`.

---

### E. Google Sign-In (Login & Signup enhancement)

**Priority:** Medium

Add a "Continue with Google" button above the email/password form on both `/login` and `/signup`.

**UI pattern:** White pill button with Google logo SVG on the left, full width, with a subtle divider row ("— or —") between it and the email form. Uses `signInWithPopup(auth, new GoogleAuthProvider())` from Firebase.

---

### F. Real Restaurant Data (Cravings enhancement)

**Priority:** Medium

Replace the hard-coded mock array in `Cravings.tsx` with a real API call.

**Approach options (decide in sprint):**
1. Backend endpoint `/api/cravings` that calls the Foodpanda public API or a curated database
2. Backend returns Foodpanda deep-link URLs based on search term + city

**New UI elements needed:**
- City / area picker input field (e.g., "DHA Phase 4, Lahore") above the craving search
- "No results found" empty state with a suggestion to try a broader search
- Skeleton loader cards (3 placeholder cards while fetching) instead of the current text spinner

---

### G. Mobile Responsiveness QA Pass (cross-cutting)

**Priority:** Medium

Audit all pages at 375 px (iPhone SE) and 390 px (iPhone 14):

| Page | Known issues to fix |
|---|---|
| LandingPage | FAQ accordion text overflow; pricing cards stack needs gap tuning |
| DemoPage | Demo-fill buttons wrap awkwardly on narrow screens |
| Cravings | "Order Now" button pushed off card edge |
| Login / Signup | Form padding too tight on narrow screens |
| Navbar | Mobile drawer links need larger tap targets (min 48 px) |

---

## New UI Needed — Phase 4

*(Specified here for awareness; do not build until Phase 3 is complete.)*

### H. Saved Meals / Recipe History — `/saved`

Grid of recipe cards the user has saved from the DemoPage. Each card shows: recipe name, date saved, macro summary, "Cook Again" button (pre-fills DemoPage), "Delete" icon.

### I. Weekly Meal Plan — `/plan`

A 7-column calendar grid (Mon–Sun). Each cell = a meal slot (Sehri / Breakfast / Lunch / Dinner for Ramadan mode). Drag-and-drop reordering. "Generate Week" button calls AI with dietary profile. Grocery list sidebar auto-populated.

### J. Grocery List Export

Slide-out panel or modal listing all ingredients across the week's plan. Toggle individual items. "Export PDF" and "Copy to Clipboard" buttons.

### K. Ramadan Planner Mode

Toggle in Profile or Navbar. Replaces meal slots with Sehri / Iftar. Pre-populates AI prompts with Ramadan-appropriate context (light sehri, high-protein iftar, etc.).

---

## Route Map (current + planned)

| Route | Page | Status |
|---|---|---|
| `/` | Landing Page | ✅ Live |
| `/login` | Login | ✅ Live |
| `/signup` | Signup | ✅ Live |
| `/demo` | AI Chef Demo | ✅ Live |
| `/cravings` | Local Restaurant Search | ✅ Live (mock data) |
| `/onboarding` | Onboarding Wizard | 🔲 To build |
| `/profile` | User Profile & Settings | 🔲 To build |
| `/saved` | Saved Meals | 📋 Phase 4 |
| `/plan` | Weekly Meal Plan | 📋 Phase 4 |

---

## Component Checklist

| Component | File | Status |
|---|---|---|
| `Navbar` | `components/Navbar.tsx` | ✅ Live |
| `AuthProvider` | `context/AuthContext.tsx` | ✅ Live |
| `OnboardingWizard` | `components/OnboardingWizard.tsx` | 🔲 To build |
| `UserDropdown` | `components/UserDropdown.tsx` | 🔲 To build |
| `MacroBadges` | `components/MacroBadges.tsx` | 🔲 To build |
| `SkeletonCard` | `components/SkeletonCard.tsx` | 🔲 To build |
| `GoogleSignInButton` | `components/GoogleSignInButton.tsx` | 🔲 To build |

---

## Full Feature Set (One‑Stop Meal Planning)

This is the complete product vision: pantry → planning → cooking → tracking, all in one place.

### Pantry & Inventory

- Capture pantry items (name, quantity, unit)
- Support common units + conversions (g/ml/pcs)
- Categorise items (produce, dairy, spices, pantry staples)
- Expiry dates + “use soon” surface area
- Low-stock thresholds + “running out” surface area
- Pantry clean-up: archive/consume/discard actions
- Import options (later): barcode scan, receipt OCR, manual quick add

### Dietary Rules & Preferences

- Dietary style: halal/veg/vegan/pescatarian
- Allergens: nuts, dairy, gluten, eggs, soy (avoid lists)
- Disliked ingredients + cuisine preferences
- Spice tolerance and sweetness preference
- Household profiles (later): different diets per person

### Meal Planning (Daily → Weekly)

- Daily plan view (Today)
- Weekly plan calendar (Mon–Sun)
- Meal slots: Breakfast / Lunch / Dinner / Snack (configurable)
- Auto-generate plan from goals + constraints + pantry
- “Swap” meal suggestion for any slot
- Serving scaling (1–6+)
- Schedule constraints (busy day → fast meals)

### Grocery List & Shopping

- Grocery list generated from plan (“missing ingredients”)
- Pantry subtraction (only buy what you don’t have)
- Mark items purchased / unavailable
- Optional budget mode: estimate total cost
- Export: copy-to-clipboard + PDF (later)
- Store/deal price comparison (later; requires partnerships/data)

### Recipes & Cooking Mode

- Recipe cards with ingredients + steps
- Cooking mode: step-by-step, keep-screen-on, timers
- Substitutions: suggest replacements using pantry
- Leftovers mode: “cook with what’s expiring”
- Save recipe, rate it, and see history

### Nutrition & Goals

- Macro targets (calories/protein/carbs/fat)
- Macro display per recipe + per day/week summary
- Dietary adherence score (simple, not medical)
- “AI nutritionist chat” is deferred due to regulatory risk (keep as Phase 5)

### Ordering / Eating Out (Cravings)

- Local search results powered by real data
- Deep links to Foodpanda / WhatsApp / call to order
- Filters: distance, price, rating, halal, delivery time

### Accounts, Privacy, and Reliability

- Email/password auth (done) + Google sign-in (planned)
- User profile & preferences (planned)
- Data backups / export (later)
- Offline‑friendly pantry edits (later)
- Audit trail (later): who changed household pantry

---

## Implementation Plan (Phased)

This plan is structured to ship a real pantry + planning MVP quickly, while keeping the AI pieces safe and maintainable.

### Phase 3A — Data Layer + Pantry MVP (foundation)

**Goal:** Introduce a real database and make pantry a first-class feature.

- Add Firestore (recommended) and define collections (see schema below)
- Create a `/pantry` page:
  - List pantry items, search, filters (expiring soon, low stock)
  - Add/edit/delete pantry item modal
- Add a minimal `/profile` page:
  - Dietary preferences + allergens + cuisine likes/dislikes
- Add route protection (if not already): require auth for `/pantry`, `/profile`, `/demo`, `/cravings`

### Phase 3B — Plan Builder + Grocery List (core value loop)

**Goal:** Pantry → plan → grocery list is the core “one-stop” loop.

- Create `/plan` (MVP version):
  - Simple weekly view (list or calendar)
  - Add meal slot (manual) using recipe picker
- Create `/grocery`:
  - Generate “missing items” from plan vs pantry
  - Checkbox to mark bought
- Add “Cook Again” / “Save recipe” on Demo output (writes to DB)

### Phase 3C — AI Integration with Structured Outputs

**Goal:** Make AI outputs reliable enough to store and reuse.

- Update backend `/api/recommend`:
  - Return structured JSON: recipe name, steps, ingredients (structured), macros (estimates), tags
- Update Demo UI:
  - Show macro badges (D)
  - “Save recipe” button
  - “Use pantry” button to prefill ingredients from user pantry items

### Phase 3D — Cravings real data + QA

**Goal:** Replace mock results and harden the UI for mobile.

- Add backend `/api/cravings` (integrate real provider or curated dataset)
- Add city/area picker + skeleton loaders + empty states (F)
- Mobile responsiveness QA pass (G)

### Phase 4 — Retention & Growth (after validation)

- Saved meals history upgrades (`/saved`)
- Weekly auto meal plan generation (deferred but high value)
- Ramadan mode (planner slots Sehri/Iftar)
- WhatsApp reminders / push notifications
- Family mode / household sharing (multi-user)

---

## Minimal Database Schema Proposal (MVP)

Because you already use **Firebase Auth**, the simplest full-stack path is **Firestore** for app data. Below is a minimal schema that supports pantry + meal plans + saved recipes.

### Collections (Firestore)

#### `users/{uid}`

Stores profile + preference data.

```json
{
  "displayName": "Hafsa",
  "email": "hafsa@example.com",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
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

#### `users/{uid}/pantryItems/{pantryItemId}`

Inventory items with optional expiry and low-stock.

```json
{
  "name": "Chicken breast",
  "normalizedName": "chicken breast",
  "quantity": 1.0,
  "unit": "kg",
  "category": "protein",
  "expiryDate": "timestamp|null",
  "lowStockThreshold": 0.5,
  "notes": "freeze half",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `users/{uid}/recipes/{recipeId}`

Saved recipes (from AI or manual). Keep the saved copy immutable to preserve history.

```json
{
  "source": "ai",
  "title": "Spicy Chicken Rice Bowl",
  "ingredients": [
    { "name": "Chicken breast", "quantity": 250, "unit": "g" },
    { "name": "Rice", "quantity": 1, "unit": "cup" }
  ],
  "steps": ["..."],
  "macros": { "calories": 480, "protein": 38, "carbs": 42, "fat": 12 },
  "tags": ["high_protein", "desi"],
  "createdAt": "timestamp",
  "lastCookedAt": "timestamp|null",
  "rating": 4
}
```

#### `users/{uid}/mealPlans/{planId}`

One document per week (or per date range).

```json
{
  "weekStart": "2026-04-06",
  "timezone": "Asia/Karachi",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `users/{uid}/mealPlans/{planId}/slots/{slotId}`

Each slot is a planned meal on a day/time.

```json
{
  "date": "2026-04-06",
  "mealType": "dinner",
  "recipeRef": "users/{uid}/recipes/{recipeId}",
  "servings": 2,
  "notes": "make extra for lunch",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `users/{uid}/groceryLists/{listId}`

Generated list (typically from a `mealPlan`), with item status.

```json
{
  "sourcePlanRef": "users/{uid}/mealPlans/{planId}",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `users/{uid}/groceryLists/{listId}/items/{itemId}`

```json
{
  "name": "Yogurt",
  "normalizedName": "yogurt",
  "quantity": 1,
  "unit": "cup",
  "status": "needed",
  "estimatedPricePkr": 0,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Minimal Indexing / Query Notes

- Query pantry:
  - order by `expiryDate` (nulls last) for “expiring soon”
  - filter by `category`
- Grocery list:
  - filter by `status` in `needed|bought`
- “Normalized” fields:
  - keep `normalizedName` for case-insensitive search and matching pantry subtraction

### Why Firestore (for MVP)

- Works naturally with Firebase Auth (`uid` scoping)
- Fast to implement with the current stack
- Real-time updates (pantry edits reflected immediately)

