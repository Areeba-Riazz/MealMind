# Requirements Document

## Introduction

MealMind's Smart Local Search (Cravings page) currently returns hard-coded mock restaurant results. This feature replaces the mock data with real restaurant location data sourced from the Google Maps Places API, adds price range filtering derived from natural-language input, and surfaces actionable ordering links to the user. The backend uses the existing Gemini integration to parse the user's craving query and extract structured search parameters before calling the Maps API.

## Glossary

- **Cravings Page**: The `/cravings` route in the MealMind frontend (`Cravings.tsx`) where users perform natural-language food searches.
- **Query Parser**: The backend Gemini-powered component that extracts structured fields (food term, max price, city/area) from a free-text craving query.
- **Places API**: Google Maps Platform Text Search and Nearby Search REST endpoints used to retrieve real restaurant data.
- **Price Level**: Google Maps' 1–4 integer scale representing a restaurant's general price tier (1 = inexpensive, 4 = very expensive).
- **PKR Price Range**: A user-supplied maximum price in Pakistani Rupees (PKR) used to filter results.
- **Price Tier Mapping**: The server-side lookup table that converts a PKR max-price value to a Google Maps Price Level ceiling.
- **Geolocation**: The browser's `navigator.geolocation` API used to obtain the user's latitude and longitude.
- **Area Input**: An optional text field on the Cravings page where the user can type a city or neighbourhood (e.g., "DHA Phase 4, Lahore") when geolocation is unavailable or overridden.
- **Skeleton Loader**: A placeholder UI card displayed while a network request is in progress.
- **Order Link**: A URL that deep-links to a restaurant's Foodpanda listing or Google Maps page so the user can place an order or get directions.
- **MealMind Backend**: The Express.js server at `backend/server.js` that proxies AI and Maps API calls.
- **MealMind Frontend**: The Vite + React + TypeScript application under `frontend/`.

---

## Requirements

### Requirement 1

**User Story:** As a user, I want to search for nearby restaurants using natural language, so that I can find real places that match my craving without manually entering structured filters.

#### Acceptance Criteria

1. WHEN a user submits a craving query, THE MealMind Frontend SHALL send the query text and the user's geolocation coordinates (or area input text) to the MealMind Backend.
2. WHEN the MealMind Backend receives a craving query, THE Query Parser SHALL extract a food search term, an optional PKR max-price value, and an optional area string from the query text using the Gemini API.
3. WHEN the Query Parser produces a food search term, THE MealMind Backend SHALL call the Places API Text Search endpoint with that term and the provided coordinates or area string.
4. WHEN the Places API returns results, THE MealMind Backend SHALL return a list of up to 5 restaurant results to the frontend, each containing: restaurant name, address, distance in kilometres, price level, rating, and an order link.
5. IF the Places API returns zero results for the extracted search term, THEN THE MealMind Backend SHALL return an empty results array and an explanatory message string.

---

### Requirement 2

**User Story:** As a user, I want to filter results by price range, so that I only see restaurants whose price tier fits my budget.

#### Acceptance Criteria

1. WHEN a user includes a PKR amount in the craving query (e.g., "under 800 Rs"), THE Query Parser SHALL extract that value as the `maxPricePkr` field.
2. WHEN `maxPricePkr` is present, THE MealMind Backend SHALL apply the Price Tier Mapping to convert it to a Google Maps Price Level ceiling and exclude results with a price level above that ceiling.
3. WHEN `maxPricePkr` is absent from the query, THE MealMind Backend SHALL return results without applying any price level filter.
4. THE MealMind Backend SHALL use the following Price Tier Mapping: under 400 PKR → Price Level 1; 400–800 PKR → Price Level 2; 801–1500 PKR → Price Level 3; above 1500 PKR → Price Level 4.

---

### Requirement 3

**User Story:** As a user, I want to provide my location so that results are geographically relevant to me.

#### Acceptance Criteria

1. WHEN the Cravings Page loads, THE MealMind Frontend SHALL request the user's geolocation using the browser Geolocation API.
2. WHEN the user grants geolocation permission, THE MealMind Frontend SHALL use the returned latitude and longitude as the location context for the search request.
3. WHEN the user denies geolocation permission or geolocation is unavailable, THE MealMind Frontend SHALL display an Area Input field and require the user to enter a city or neighbourhood before submitting a search.
4. WHEN the user provides an Area Input value, THE MealMind Frontend SHALL send that string as the location context instead of coordinates.

---

### Requirement 4

**User Story:** As a user, I want to see loading feedback while results are being fetched, so that I know the application is working.

#### Acceptance Criteria

1. WHEN a search request is in flight, THE MealMind Frontend SHALL display 3 Skeleton Loader cards in place of the results list.
2. WHEN the search response is received, THE MealMind Frontend SHALL replace the Skeleton Loader cards with the actual result cards.
3. WHEN the results list is empty, THE MealMind Frontend SHALL display an empty-state message and suggest the user broaden the search term or adjust the price range.

---

### Requirement 5

**User Story:** As a user, I want each result to include an ordering link, so that I can immediately act on a recommendation.

#### Acceptance Criteria

1. WHEN the MealMind Backend constructs a result, THE MealMind Backend SHALL include a Google Maps place URL as the order link for every result.
2. WHEN a user clicks the "Order Now" button on a result card, THE MealMind Frontend SHALL open the order link in a new browser tab.

---

### Requirement 6

**User Story:** As a developer, I want the backend to handle API errors gracefully, so that users receive a clear error message instead of a broken UI.

#### Acceptance Criteria

1. IF the Places API call fails with a non-200 HTTP status, THEN THE MealMind Backend SHALL return a 502 status with a structured error object containing a human-readable `message` field.
2. IF the Gemini Query Parser call fails, THEN THE MealMind Backend SHALL return a 502 status with a structured error object containing a human-readable `message` field.
3. IF the `GOOGLE_MAPS_API_KEY` environment variable is absent at server startup, THEN THE MealMind Backend SHALL log a warning and return a 500 error on any `/api/cravings` request.
4. WHEN THE MealMind Frontend receives a non-200 response from `/api/cravings`, THE MealMind Frontend SHALL display the error `message` field to the user in place of the results list.
