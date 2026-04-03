# Implementation Plan — Local Search Enhancement

- [x] 1. Add backend dependencies and environment setup





  - Install `fast-check` and `supertest` as dev dependencies in the backend
  - Add `GOOGLE_MAPS_API_KEY` to `backend/.env.example` with a placeholder comment
  - Validate that `GOOGLE_MAPS_API_KEY` is present at server startup and log a warning if missing
  - _Requirements: 6.3_

- [x] 2. Implement `parseQuery` — Gemini-powered query parser





  - Add `parseQuery(query: string): Promise<ParsedQuery>` function in `backend/server.js`
  - Prompt Gemini to return `{ foodTerm, maxPricePkr?, area? }` as strict JSON
  - Strip markdown fences from Gemini response before parsing (same pattern as `/api/recommend`)
  - _Requirements: 1.2, 2.1_

- [ ]* 2.1 Write property test for query parser output structure
  - **Property 5: Query parser round-trip structure**
  - **Validates: Requirements 1.2, 2.1**
  - Use fast-check to generate arbitrary query strings containing food terms and optional PKR amounts
  - Assert `foodTerm` is always a non-empty string and `maxPricePkr` is a positive finite number when a PKR amount was present

- [x] 3. Implement `filterByPrice` and price tier mapping





  - Define the `PRICE_TIER_MAP` constant in `backend/server.js`
  - Implement `filterByPrice(places, maxPricePkr?)` as a pure function
  - When `maxPricePkr` is undefined, return the input array unchanged
  - When `maxPricePkr` is defined, exclude places whose `priceLevel` exceeds the mapped ceiling
  - _Requirements: 2.2, 2.3, 2.4_

- [ ]* 3.1 Write property test for price filter ceiling
  - **Property 1: Price filter ceiling**
  - **Validates: Requirements 2.2**
  - Use fast-check to generate arrays of place objects with random price levels (0–4) and random maxPricePkr values
  - Assert every result has priceLevel ≤ mapped ceiling

- [ ]* 3.2 Write property test for no-filter pass-through
  - **Property 3: No-filter pass-through**
  - **Validates: Requirements 2.3**
  - Use fast-check to generate arbitrary place arrays
  - Assert `filterByPrice(places, undefined)` returns the same array reference or equal contents

- [ ]* 3.3 Write property test for price tier mapping monotonicity
  - **Property 2: Price tier mapping monotonicity**
  - **Validates: Requirements 2.4**
  - Use fast-check to generate pairs of PKR values (A, B) where A < B
  - Assert `mapPriceLevel(A) <= mapPriceLevel(B)`

- [x] 4. Implement `formatResults` and `searchPlaces`





  - Implement `formatResults(places, userLat?, userLng?)` that maps raw Google Maps place objects to `CravingResult` shape
  - Compute `distanceKm` using the haversine formula when coordinates are available; default to 0 otherwise
  - Cap output at 5 results
  - Build `orderLink` as `https://www.google.com/maps/place/?q=place_id:<place_id>`
  - Implement `searchPlaces(foodTerm, lat?, lng?, area?)` that calls the Google Maps Text Search endpoint
  - _Requirements: 1.3, 1.4, 5.1_

- [ ]* 4.1 Write property test for result count cap
  - **Property 4: Result count cap**
  - **Validates: Requirements 1.4**
  - Use fast-check to generate arrays of raw place objects of arbitrary length (0–50)
  - Assert `formatResults(places).length <= 5`

- [ ]* 4.2 Write property test for order link format
  - **Property 6: Order link format**
  - **Validates: Requirements 5.1**
  - Use fast-check to generate arrays of raw place objects with arbitrary place_id strings
  - Assert every result's `orderLink` is parseable by `new URL(...)` without throwing

- [x] 5. Wire up `POST /api/cravings` endpoint





  - Add the `/api/cravings` route to `backend/server.js`
  - Accept `{ query, lat?, lng?, area? }` in the request body
  - Call `parseQuery` → `searchPlaces` → `filterByPrice` → `formatResults` in sequence
  - Return `{ results, message? }` on success
  - Return `{ error }` with appropriate HTTP status on each failure scenario (502 for API failures, 500 for missing key)
  - _Requirements: 1.1, 1.4, 1.5, 6.1, 6.2, 6.3_

- [x] 6. Checkpoint — ensure all backend tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add `useGeolocation` hook to the frontend





  - Create `frontend/src/hooks/useGeolocation.ts`
  - On mount, call `navigator.geolocation.getCurrentPosition`
  - Expose `{ lat, lng, denied, loading }` state
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Create `SkeletonCard` component





  - Create `frontend/src/components/SkeletonCard.tsx`
  - Render an animated placeholder card matching the height of a result card using existing CSS design tokens
  - _Requirements: 4.1_

- [x] 9. Update `Cravings.tsx` to use real data





  - Replace the mock `setTimeout` with a real `fetch` call to `POST /api/cravings`
  - Integrate `useGeolocation` hook; show Area Input field when `denied === true`
  - Display 3 `SkeletonCard` instances while `loading === true`
  - Render result cards from the real `CravingResult[]` response
  - Render empty state with suggestion text when `results.length === 0`
  - Render error message when the API returns a non-200 response
  - Update result card to show `address` instead of the old mock `distance` string, and use `orderLink` for the "Order Now" button
  - _Requirements: 1.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.2, 6.4_

- [x] 10. Final Checkpoint — ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
