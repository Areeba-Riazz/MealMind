const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load backend secrets
dotenv.config();

// Warn early if the Maps key is missing so the issue is obvious in logs
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn(
    "⚠️  WARNING: GOOGLE_MAPS_API_KEY is not set. " +
    "The /api/cravings endpoint will return HTTP 500 until this is configured."
  );
}

const app = express();
app.use(express.json());

// Allow frontend to make requests.
// In dev the Vite proxy forwards /api/* so the browser never hits this directly,
// but we list common origins as a safety net and for direct testing.
const ALLOWED_ORIGINS = [
  "http://localhost:5173", // Vite default
  "http://localhost:5174", // Vite fallback port
  "http://localhost:4173", // Vite preview
  process.env.FRONTEND_URL, // Production origin (set in .env)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
}));

/**
 * @typedef {{ foodTerm: string, maxPricePkr?: number, area?: string }} ParsedQuery
 */

/**
 * Uses Gemini to extract structured search parameters from a free-text craving query.
 * @param {string} query
 * @returns {Promise<ParsedQuery>}
 */
async function parseQuery(query) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in the backend .env");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are a query parser for a food search app.
    Extract structured fields from the user's craving query.

    Query: "${query}"

    Respond ONLY with valid JSON matching this schema (no Markdown, no extra text):
    {
      "foodTerm": "<the food or restaurant type being searched for, non-empty string>",
      "maxPricePkr": <optional positive number representing max price in PKR, omit if not mentioned>,
      "area": "<optional city or neighbourhood string, omit if not mentioned>"
    }
  `;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text();

  // Strip markdown fences (same pattern as /api/recommend)
  responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

  const parsed = JSON.parse(responseText);

  if (!parsed.foodTerm || typeof parsed.foodTerm !== "string" || parsed.foodTerm.trim() === "") {
    throw new Error("Query parser returned an empty or missing foodTerm");
  }

  return {
    foodTerm: parsed.foodTerm.trim(),
    ...(typeof parsed.maxPricePkr === "number" && parsed.maxPricePkr > 0
      ? { maxPricePkr: parsed.maxPricePkr }
      : {}),
    ...(typeof parsed.area === "string" && parsed.area.trim()
      ? { area: parsed.area.trim() }
      : {}),
  };
}

/**
 * Maps a PKR max-price value to a Google Maps Price Level ceiling.
 * Entries are checked in order; the first entry whose maxPkr >= maxPricePkr wins.
 * Requirements: 2.4
 */
const PRICE_TIER_MAP = [
  { maxPkr: 400,      priceLevel: 1 },
  { maxPkr: 800,      priceLevel: 2 },
  { maxPkr: 1500,     priceLevel: 3 },
  { maxPkr: Infinity, priceLevel: 4 },
];

/**
 * Returns the Google Maps Price Level ceiling for a given PKR amount.
 * @param {number} maxPricePkr
 * @returns {number} priceLevel ceiling (1–4)
 */
function mapPriceLevel(maxPricePkr) {
  const entry = PRICE_TIER_MAP.find((e) => maxPricePkr <= e.maxPkr);
  return entry ? entry.priceLevel : 4;
}

/**
 * Filters an array of place objects by price level.
 * When maxPricePkr is undefined the input array is returned unchanged.
 * Requirements: 2.2, 2.3
 *
 * @param {Array<{priceLevel?: number}>} places
 * @param {number|undefined} maxPricePkr
 * @returns {Array}
 */
function filterByPrice(places, maxPricePkr) {
  if (maxPricePkr === undefined) return places;
  const ceiling = mapPriceLevel(maxPricePkr);
  return places.filter((p) => (p.priceLevel ?? 0) <= ceiling);
}

/**
 * Haversine formula — straight-line distance between two lat/lng points in km.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number}
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Maps raw Google Maps place objects to CravingResult shape.
 * Caps output at 5 results.
 * Requirements: 1.3, 1.4, 5.1
 *
 * @param {Array<object>} places  Raw places from the Maps API
 * @param {number|undefined} userLat
 * @param {number|undefined} userLng
 * @returns {Array<import('./types').CravingResult>}
 */
function formatResults(places, userLat, userLng) {
  return places.slice(0, 5).map((place) => {
    const placeLat = place.geometry?.location?.lat;
    const placeLng = place.geometry?.location?.lng;

    const distanceKm =
      userLat != null &&
      userLng != null &&
      placeLat != null &&
      placeLng != null
        ? haversineKm(userLat, userLng, placeLat, placeLng)
        : 0;

    return {
      id: place.place_id ?? "",
      name: place.name ?? "",
      address: place.formatted_address ?? "",
      distanceKm,
      priceLevel: place.price_level ?? 0,
      rating: place.rating ?? 0,
      orderLink: `https://www.google.com/maps/place/?q=place_id:${place.place_id ?? ""}`,
    };
  });
}

/**
 * Calls the Google Maps Places Text Search endpoint.
 * Requirements: 1.3
 *
 * @param {string} foodTerm
 * @param {number|undefined} lat
 * @param {number|undefined} lng
 * @param {string|undefined} area
 * @returns {Promise<Array<object>>} raw places array
 */
async function searchPlaces(foodTerm, lat, lng, area) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  // Build the query: combine food term with area or rely on location bias
  const query = area ? `${foodTerm} in ${area}` : foodTerm;

  const params = new URLSearchParams({
    query,
    key: apiKey,
    type: "restaurant",
  });

  // Add location bias when coordinates are available
  if (lat != null && lng != null) {
    params.set("location", `${lat},${lng}`);
    params.set("radius", "5000"); // 5 km radius
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Places API responded with HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API error: ${data.status} — ${data.error_message ?? ""}`);
  }

  return data.results ?? [];
}

/**
 * POST /api/cravings
 * Accepts { query, lat?, lng?, area? } and returns { results, message? } or { error }.
 * Requirements: 1.1, 1.4, 1.5, 6.1, 6.2, 6.3
 */
app.post("/api/cravings", async (req, res) => {
  // Requirement 6.3 — fail fast if the Maps key is absent
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({ error: "Server is not configured: GOOGLE_MAPS_API_KEY is missing." });
  }

  const { query, lat, lng, area } = req.body;

  if (!query || typeof query !== "string" || query.trim() === "") {
    return res.status(400).json({ error: "A non-empty query string is required." });
  }

  let parsed;
  try {
    // Requirement 1.2 — parse the natural-language query via Gemini
    parsed = await parseQuery(query.trim());
  } catch (err) {
    // Requirement 6.2 — Gemini failure → 502
    console.error("parseQuery error:", err);
    return res.status(502).json({ error: `Failed to parse your query: ${err.message}` });
  }

  // Merge area from the request body if the parser didn't extract one
  const resolvedArea = parsed.area ?? (typeof area === "string" && area.trim() ? area.trim() : undefined);

  let rawPlaces;
  try {
    // Requirement 1.3 — call Places API
    rawPlaces = await searchPlaces(parsed.foodTerm, lat, lng, resolvedArea);
  } catch (err) {
    // Requirement 6.1 — Places API failure → 502
    console.error("searchPlaces error:", err);
    return res.status(502).json({ error: `Failed to fetch restaurant data: ${err.message}` });
  }

  // Requirement 1.5 — empty results get an explanatory message
  if (!rawPlaces.length) {
    return res.status(200).json({ results: [], message: "No restaurants found for your search. Try broadening the search term or adjusting the price range." });
  }

  // Requirement 2.2 / 2.3 — apply price filter
  const filtered = filterByPrice(rawPlaces, parsed.maxPricePkr);

  // Requirement 1.4 — cap at 5, build CravingResult objects
  const results = formatResults(filtered, lat, lng);

  return res.status(200).json({ results });
});

app.post("/api/recommend", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in the backend .env" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { ingredients, budget, time, goal } = req.body;

    if (!ingredients) {
      return res.status(400).json({ error: "Ingredients are required to find a meal." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are MealMind, an expert, cost-conscious culinary AI assistant.
      The user needs a practical meal recommendation based on the following precise constraints:
      - Ingredients they already have: ${ingredients}
      - Budget Constraint: ${budget || "No strict budget"}
      - Max Cooking Time: ${time || "No strict time limit"}
      - Dietary Goal/Mood: ${goal || "A tasty meal"}

      IMPORTANT INSTRUCTIONS: 
      If the user provides contradictory or impossible constraints, gracefully suggest a realistic, cheap, and very simple alternative that strictly fits their budget.
      
      Respond EXACTLY in valid JSON format using this schema. Do not use Markdown formatting like \\\`json:
      {
        "recipeName": "Name of the dish",
        "instructions": ["Step 1", "Step 2", "Step 3"],
        "isFallback": boolean
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean markdown
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonResponse = JSON.parse(responseText);
    
    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Backend AI Error:", error);
    const errorMessage = error.message || "Unknown error occurred while connecting to Gemini.";
    return res.status(500).json({ error: `Failed to connect to the AI Chef: ${errorMessage}` });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ MealMind Backend running perfectly on http://localhost:${PORT}`);
});

// Export pure functions for unit / property-based testing
module.exports = { PRICE_TIER_MAP, mapPriceLevel, filterByPrice, parseQuery, formatResults, searchPlaces, haversineKm };
