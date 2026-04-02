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
- [x] Flask backend scaffold + `/api/recommend` endpoint
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
- [ ] Step-by-step instruction rendering

---

## Phase 3 — MVP Launch `Q2 2025` 🟡 In Progress

Order-in feature, public-facing pages, and launch readiness.

- [x] Landing page — full marketing site
- [x] Login / Signup pages
- [ ] Smart Local Search (Cravings) — mock restaurant results
- [ ] Shared Navbar component across all pages
- [ ] Real restaurant data integration (Foodpanda / WhatsApp deep links for ordering)
- [ ] Post-signup profile system — structured capture and storage of user context for recommendations:
  - [ ] Preferences (cuisines, spice level, cooking effort, budget defaults, etc.)
  - [ ] Allergies and intolerances (with safe filtering in recipe output)
  - [ ] Diets and restrictions (vegetarian, halal, keto, etc.)
  - [ ] Editable profile / settings so preferences stay in sync with the AI and dashboard
- [ ] Onboarding flow after first login (guided pass through the profile system above)
- [ ] Macro & calorie display in recipe output
- [ ] Google Sign-In (OAuth)
- [ ] Mobile responsiveness QA pass

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
