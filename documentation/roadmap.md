# MealMind — Product Roadmap

> Phases and timelines are indicative. Re-evaluated each sprint based on user feedback and validation data.

MVP focus: ship core product behaviour (auth, profile and preferences, AI flows, discovery). Monetisation and household tiers are out of scope until the MVP is validated.

---

## Phase 0 — Problem Framing `Q4 2024` ✅ Complete

Research and validation of the core problem space.

- [x] User research — decision fatigue problem space
- [x] Competitive analysis (Eat This Much, Mealime, Yummly)
- [x] Target segment definition (students, young professionals, families)
- [x] Problem framing document
- [x] Core insight: no tool unifies budget + nutrition + available ingredients at the decision moment

---

## Phase 1 — Foundation `Q1 2025` ✅ Complete

Infrastructure, tooling, and authentication.

- [x] Vite + React 19 + TypeScript frontend scaffold
- [x] Tailwind CSS + custom design system (dark theme)
- [x] Firebase Authentication (email/password)
- [x] React Router v7 — client-side routing
- [x] AuthContext + protected route pattern
- [x] Express.js backend scaffold + `/api/recommend` endpoint
- [x] Environment variable setup (`VITE_FIREBASE_*`)

---

## Phase 2 — Core AI Features `Q1 2025` ✅ Complete

Fridge-first cooking — the primary use case.

- [x] AI recipe engine — ingredient input → structured recipe output
- [x] Budget constraint filtering (PKR-aware)
- [x] Cooking time constraint
- [x] Dietary goal / mood input
- [x] Dashboard UI with loading states + demo fill buttons
- [x] Fallback / creative pivot response handling
- [x] Step-by-step instruction rendering (numbered steps with accent badges)

---

## Phase 3 — MVP Launch `Q2 2025` 🟡 In Progress

Order-in feature, public-facing pages, launch readiness, and app shell.

- [x] Landing page — full marketing site
- [x] Login / Signup pages (redirect → `/dashboard` / `/onboarding`)
- [x] Shared Sidebar navigation with emoji icons, active states, user card
- [x] **Collapsible sidebar** — toggle collapses to icon-only rail (64 px); state persisted to `localStorage`
- [x] App shell layout — sticky topbar + scrollable content area
- [x] **Dashboard** — welcome hero, stat cards, quick-action grid
- [x] **Unified Profile page** (tabbed) — replaces separate `/preferences` + `/dietary` routes
  - [x] Profile tab: account info, completion bar, security placeholders, danger zone
  - [x] Preferences tab: interactive cuisine chips, spice/budget/skill/goal pill selectors
  - [x] Diet & Allergies tab: allergen + diet interactive chips, disclaimer
- [x] **AI Chef (Demo)** — redesigned form + numbered step results + error state
- [x] **Cravings** — quick-pick chips, loading spinner, redesigned result cards
- [x] **Smart Local Search** — real restaurant results via Google Maps Places API + Gemini query parser
  - [x] `POST /api/cravings` endpoint — Gemini query parser → Maps Text Search → price-tier filter → up to 5 results
  - [x] `PRICE_TIER_MAP` — PKR → Google Maps price level ceiling (1–4)
  - [x] Haversine distance calculation from user coordinates
  - [x] Skeleton loaders (3 × `SkeletonCard`) while request is in flight
  - [x] Empty state with suggestion text when no results returned
  - [x] Error state with human-readable message on API failure
  - [x] Area text-input fallback when browser geolocation is denied
  - [x] `useGeolocation` hook — exposes `{ lat, lng, denied, loading }`
  - [x] CravingsMap component — renders restaurant pins on a map
- [x] **Saved Recipes** — interactive card list, remove action, empty state, filter tabs
  - [x] AI recipe cards with expandable step-by-step instructions
  - [x] Online recipe cards with external link
  - [x] **Craving / restaurant cards** — save restaurants from Smart Local Search results
  - [x] Filter tabs: All · AI Recipes · Online Finds · Cravings
  - [x] **Cloud sync** — saved recipes in Firestore (`users/{uid}/savedRecipes`); one-time migration from `localStorage` when empty; realtime listener; `localStorage` fallback if Firebase is not configured
- [x] **Food Links** — card list with platform tags + order buttons; Firestore `users/{uid}/foodLinks` with add/remove UI; demo seed on first empty load; offline demo when Firebase is missing
- [x] **Profile Firestore** — preferences and dietary restrictions on `users/{uid}` document; load on mount; Save buttons persist to Firestore
- [x] **Onboarding** — step indicator, skill pill selector, navigation
- [x] Backend port conflict error handling — explicit `EADDRINUSE` message + graceful exit
- [x] **Firestore security rules** — `firestore.rules` + `firebase.json` for deploy (`firebase deploy --only firestore:rules`)
- [ ] Macro & calorie display in recipe output (MacroBadges component)
- [ ] Google Sign-In (OAuth)
- [ ] Mobile responsiveness QA pass (375px / 390px)
- [x] "Save recipe" action on AI Chef (Demo) page → saved collection

---

## Phase 4 — Growth & Retention `Q3 2025` 📋 Planned

Engagement features and localisation — product depth after MVP is stable.

- [ ] Urdu language interface *(high-value; significant localisation effort)*
- [ ] Weekly auto meal plan generation *(full-week planning with combined grocery list)*
- [ ] Ramadan Sehri / Iftar planner
- [ ] Saved meals & personal recipe history
- [ ] In-app meal reminders *(optional; no third-party messaging dependency)*
- [ ] Grocery list export (PDF)
- [ ] Recipe scaling *(servings per dish; ties into profile defaults)*

---

## Phase 5 — Platform Expansion `Q4 2025+` 📋 Planned

Data layer and advanced intelligence.

- [ ] Expiry date tracking *(reduces pantry waste; adds pantry management scope)*
- [ ] Receipt scanning (OCR) *(high technical complexity; validates pantry state automatically)*
- [ ] Store price comparison *(requires grocery retailer data partnerships)*
- [ ] Mood-based meal suggestions *(needs validation data from Phase 3–4 usage)*
- [ ] AI nutritionist chat *(regulatory & liability framework required first)*
- [ ] Monthly meal budget report

---

## Post-MVP Backlog — Validated but Deferred

Features that appeared in research and are validated as valuable, but are out of scope for Phase 3. Each has a clear reason for deferral and a target phase for re-evaluation.

| Feature | Reason Deferred | Target Phase |
|---|---|---|
| Urdu language interface | High value but significant localisation effort | Phase 4 |
| Weekly auto meal plan generation | High effort; useful but not the core decision-moment use case | Phase 4 |
| Mood-based meal suggestions | Unvalidated; adds scope without proven demand | Phase 5 |
| Expiry date tracking | Useful but increases pantry management complexity | Phase 5 |
| Receipt scanning (OCR) | High technical complexity; not validated as essential | Phase 5 |
| Store price comparison | Requires grocery retailer data partnerships | Phase 5 |
| Household multi-user accounts | Out of MVP scope; not prioritised | TBD |
| AI nutritionist chat | Regulatory and liability risk; requires medical disclaimer framework | Phase 5 |
