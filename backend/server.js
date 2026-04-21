const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { TavilyClient } = require("tavily");

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

/**
 * Gemini expects system_instruction as a Content object (parts), not a bare string.
 * @param {string} text
 * @returns {{ parts: { text: string }[] }}
 */
function systemInstructionContent(text) {
  return { parts: [{ text }] };
}

/**
 * Short, safe message for API clients — full error stays in server logs.
 * @param {unknown} err
 * @returns {string}
 */
function userFacingChatError(err) {
  const raw = err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
  if (/400|Bad Request|INVALID_ARGUMENT|system_instruction/i.test(raw)) {
    return "We couldn't process that request. Try again or shorten your message.";
  }
  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (/403|PERMISSION_DENIED|API key|API_KEY_INVALID/i.test(raw)) {
    return "Chat is temporarily unavailable.";
  }
  if (/503|UNAVAILABLE|overloaded|Deadline/i.test(raw)) {
    return "The assistant is busy. Please try again in a moment.";
  }
  return "Something went wrong. Please try again.";
}

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
}));

// ─────────────────────────────────────────────────────────
// Helper: search the web for recipes via Tavily
// ─────────────────────────────────────────────────────────
async function searchRecipesOnline(ingredients, goal) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) return [];

  try {
    const tavily = new TavilyClient({ apiKey: tavilyKey });
    const query = `recipe using ${ingredients}${goal ? ` for ${goal}` : ""}`;

    const response = await tavily.search(query, {
      search_depth: "basic",
      max_results: 4,
      include_answer: false,
    });

    const results = response.results || [];
    return results
      .filter(r => r.url && r.title)
      .map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content ? r.content.slice(0, 200).trim() + "…" : "",
      }));
  } catch (err) {
    console.warn("Tavily search failed (non-fatal):", err.message);
    return [];
  }
}

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
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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
 * Google Places API returns `price_level`; tests and mocks may use `priceLevel`.
 * @param {{ priceLevel?: number, price_level?: number }} place
 * @returns {number}
 */
function placePriceLevel(place) {
  return place.priceLevel ?? place.price_level ?? 0;
}

/**
 * Filters an array of place objects by price level.
 * When maxPricePkr is undefined the input array is returned unchanged.
 * Requirements: 2.2, 2.3
 *
 * @param {Array<{priceLevel?: number, price_level?: number}>} places
 * @param {number|undefined} maxPricePkr
 * @returns {Array}
 */
function filterByPrice(places, maxPricePkr) {
  if (maxPricePkr === undefined) return places;
  const ceiling = mapPriceLevel(maxPricePkr);
  return places.filter((p) => placePriceLevel(p) <= ceiling);
}

/**
 * @param {number|undefined|null} v
 * @returns {number|null}
 */
function parseLatitude(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < -90 || n > 90) return null;
  return n;
}

/**
 * @param {number|undefined|null} v
 * @returns {number|null}
 */
function parseLongitude(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < -180 || n > 180) return null;
  return n;
}

/**
 * Sort Places API results by straight-line distance when user coords exist.
 * @param {Array<object>} places raw Google place objects
 * @param {number|null} userLat
 * @param {number|null} userLng
 * @returns {Array<object>}
 */
function sortRawPlacesByDistance(places, userLat, userLng) {
  if (userLat == null || userLng == null) return places;
  return [...places].sort((a, b) => {
    const da = distanceToRawPlace(a, userLat, userLng);
    const db = distanceToRawPlace(b, userLat, userLng);
    return da - db;
  });
}

/**
 * @param {object} place
 * @param {number} userLat
 * @param {number} userLng
 * @returns {number}
 */
function distanceToRawPlace(place, userLat, userLng) {
  const plat = place.geometry?.location?.lat;
  const plng = place.geometry?.location?.lng;
  if (plat == null || plng == null) return Number.POSITIVE_INFINITY;
  return haversineKm(userLat, userLng, plat, plng);
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
 * Validates that a website URL is plausible before surfacing it to users.
 * Rejects nulls, non-HTTP(S) protocols, bare IPs, and malformed URLs.
 * Does NOT make a network request — purely structural validation.
 *
 * @param {unknown} url
 * @returns {string | null}  The original URL string if valid, otherwise null.
 */
function sanitiseWebsite(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    // Reject bare IPv4 addresses (e.g. http://192.168.1.1)
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname)) return null;
    // Must have at least one dot in the hostname (real TLD)
    if (!u.hostname.includes(".")) return null;
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Collects all non-null phone strings from a place object, deduplicates them,
 * and returns a clean array. Returns an empty array when none are present.
 *
 * @param {{ formatted_phone_number?: string|null, international_phone_number?: string|null }} place
 * @returns {string[]}
 */
function extractPhones(place) {
  const candidates = [
    place.formatted_phone_number,
    place.international_phone_number,
  ];
  const seen = new Set();
  const phones = [];
  for (const p of candidates) {
    if (p && typeof p === "string") {
      const trimmed = p.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        phones.push(trimmed);
      }
    }
  }
  return phones;
}

/**
 * Builds a FoodPanda search URL for a restaurant name + city.
 * Used as a fallback when no direct listing is found.
 *
 * @param {string} name
 * @param {string} [city]
 * @returns {string}
 */
function foodpandaSearchUrl(name, city) {
  const q = city ? `${name} ${city}` : name;
  return `https://www.foodpanda.pk/?query=${encodeURIComponent(q)}`;
}

/**
 * Runs three focused Tavily searches for a restaurant (Instagram, Facebook, FoodPanda),
 * then uses Gemini to extract only high-confidence direct profile/listing URLs.
 *
 * All searches run in parallel. Gemini extraction is a single fast call over the
 * combined results. Entire function is non-fatal — returns empty object on any failure.
 *
 * @param {string} name  Restaurant name as returned by Google Places
 * @param {string} city  City extracted from formatted_address or resolved area
 * @returns {Promise<{ instagramUrl?: string, facebookUrl?: string, foodpandaUrl?: string }>}
 */
async function enrichRestaurantLinks(name, city) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!tavilyKey || !geminiKey) return {};

  const tavily = new TavilyClient({ apiKey: tavilyKey });

  // Three targeted queries — each scoped to one platform
  const queries = [
    `"${name}" "${city}" site:instagram.com`,
    `"${name}" "${city}" site:facebook.com`,
    `"${name}" "${city}" site:foodpanda.pk`,
  ];

  let allResults = [];
  try {
    const searches = await Promise.all(
      queries.map((q) =>
        tavily
          .search(q, { search_depth: "basic", max_results: 3, include_answer: false })
          .then((r) => r.results ?? [])
          .catch(() => []) // individual query failure is non-fatal
      )
    );
    allResults = searches.flat();
  } catch {
    return {};
  }

  if (allResults.length === 0) return {};

  // Build a compact context block for Gemini — url + title + first 120 chars of content
  const context = allResults
    .map((r, i) => `[${i + 1}] URL: ${r.url}\n    Title: ${r.title}\n    Snippet: ${(r.content ?? "").slice(0, 120)}`)
    .join("\n\n");

  const prompt = `You are extracting social media and ordering links for a restaurant.

Restaurant: "${name}" in "${city}"

Search results:
${context}

Rules:
- instagramUrl: must be a profile page (instagram.com/<handle>) — NOT a reel, post, or story URL. Reject any URL containing /reel/, /p/, /stories/.
- facebookUrl: must be a page URL (facebook.com/<page>) — NOT a post or photo URL. Reject any URL containing /posts/, /photos/, /videos/.
- foodpandaUrl: must be a direct restaurant listing on foodpanda.pk — must contain "/restaurant/" in the path. Reject city pages, search pages, or other restaurants.
- Only include a URL if you are highly confident it belongs to THIS restaurant ("${name}"), not a different restaurant with a similar name.
- Return null for any field you cannot confirm.

Respond ONLY with valid JSON, no markdown:
{
  "instagramUrl": "<url or null>",
  "facebookUrl": "<url or null>",
  "foodpandaUrl": "<url or null>"
}`;

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    const out = {};

    // Validate each extracted URL structurally before returning
    const ig = sanitiseWebsite(parsed.instagramUrl);
    if (ig && /instagram\.com\/(?!reel|p\/|stories)[\w.]+/.test(ig)) out.instagramUrl = ig;

    const fb = sanitiseWebsite(parsed.facebookUrl);
    if (fb && /facebook\.com\/(?!posts|photos|videos)[\w.]+/.test(fb)) out.facebookUrl = fb;

    const fp = sanitiseWebsite(parsed.foodpandaUrl);
    if (fp && /foodpanda\.pk\/restaurant\//.test(fp)) out.foodpandaUrl = fp;

    return out;
  } catch {
    return {};
  }
}

/**
 * Extracts the city name from a Google Places formatted_address string.
 * Falls back to the resolvedArea string if address parsing yields nothing.
 *
 * @param {string} formattedAddress  e.g. "123 Main St, Lahore, Punjab, Pakistan"
 * @param {string} [fallback]
 * @returns {string}
 */
function cityFromAddress(formattedAddress, fallback) {
  if (!formattedAddress) return fallback ?? "";
  // Addresses are comma-separated; city is typically the second-to-last or third segment
  const parts = formattedAddress.split(",").map((s) => s.trim()).filter(Boolean);
  // Walk from the end: skip "Pakistan" and province names, take first plausible city
  const skipWords = /^(pakistan|punjab|sindh|kpk|khyber|balochistan|islamabad capital territory)$/i;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!skipWords.test(parts[i]) && !/^\d/.test(parts[i])) {
      return parts[i];
    }
  }
  return fallback ?? parts[0] ?? "";
}
/**
 * Maps raw Google Maps place objects to CravingResult shape.
 * Caps output at 5 results. Social/ordering links are stubs here —
 * enrichRestaurantLinks() fills them in after this call.
 * Requirements: 1.3, 1.4, 5.1
 *
 * @param {Array<object>} places  Raw places from the Maps API
 * @param {number|undefined} userLat
 * @param {number|undefined} userLng
 * @returns {Array<object>}
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

    const name = place.name ?? "";
    const placeId = place.place_id ?? "";
    const googleMapsLink = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    const city = cityFromAddress(place.formatted_address ?? "");

    return {
      id: placeId,
      name,
      address: place.formatted_address ?? "",
      distanceKm,
      priceLevel: place.price_level ?? 0,
      rating: place.rating ?? 0,
      // ── Ordering links ──────────────────────────────────────────────────
      /** @deprecated use googleMapsLink — kept for FoodLinks save-link compat */
      orderLink: googleMapsLink,
      googleMapsLink,
      foodpandaLink: foodpandaSearchUrl(name, city), // fallback search; may be upgraded to direct
      foodpandaIsDirect: false,
      instagramUrl: null,
      facebookUrl: null,
      // ── Contact ─────────────────────────────────────────────────────────
      /** @deprecated use phones[] — kept for any consumers still reading .phone */
      phone: place.formatted_phone_number ?? place.international_phone_number ?? null,
      phones: extractPhones(place),
      // ── Website ─────────────────────────────────────────────────────────
      website: sanitiseWebsite(place.website),
      // ── Coordinates ─────────────────────────────────────────────────────
      lat: placeLat ?? null,
      lng: placeLng ?? null,
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

  const query = area ? `${foodTerm} in ${area}` : foodTerm;

  const params = new URLSearchParams({
    query,
    key: apiKey,
    type: "restaurant",
  });

  if (lat != null && lng != null) {
    params.set("location", `${lat},${lng}`);
    params.set("radius", "5000");
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

  const places = data.results ?? [];

  // Fetch phone numbers for top 5 results via Place Details API
  const detailsPromises = places.slice(0, 5).map(async (place) => {
    if (!place.place_id) return place;
    try {
      const detailParams = new URLSearchParams({
        place_id: place.place_id,
        fields: "formatted_phone_number,international_phone_number,website",
        key: apiKey,
      });
      const detailRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${detailParams.toString()}`
      );
      if (!detailRes.ok) return place;
      const detailData = await detailRes.json();
      if (detailData.status === "OK" && detailData.result) {
        return {
          ...place,
          formatted_phone_number: detailData.result.formatted_phone_number ?? null,
          international_phone_number: detailData.result.international_phone_number ?? null,
          website: detailData.result.website ?? null,
        };
      }
    } catch {
      // non-fatal — just return place without phone
    }
    return place;
  });

  const topWithPhones = await Promise.all(detailsPromises);
  // Merge enriched top-5 back with the rest (rest won't be used but keep array intact)
  return [...topWithPhones, ...places.slice(5)];
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

  const userLat = parseLatitude(lat);
  const userLng = parseLongitude(lng);
  const hasCoords = userLat != null && userLng != null;
  const areaTrimmed = typeof area === "string" ? area.trim() : "";

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
  const resolvedArea = parsed.area ?? (areaTrimmed ? areaTrimmed : undefined);

  // Requirement 3 — need coordinates and/or an area string (from body or parsed query)
  if (!hasCoords && !resolvedArea) {
    return res.status(400).json({
      error: "Location is required: enable geolocation in your browser or enter your city or area.",
    });
  }

  let rawPlaces;
  try {
    // Requirement 1.3 — call Places API
    rawPlaces = await searchPlaces(parsed.foodTerm, userLat, userLng, resolvedArea);
  } catch (err) {
    // Requirement 6.1 — Places API failure → 502
    console.error("searchPlaces error:", err);
    return res.status(502).json({ error: `Failed to fetch restaurant data: ${err.message}` });
  }

  // Requirement 1.5 — empty results get an explanatory message
  if (!rawPlaces.length) {
    return res.status(200).json({ results: [], message: "No restaurants found for your search. Try broadening the search term or adjusting the price range." });
  }

  // Requirement 2.2 / 2.3 — apply price filter (uses Google `price_level`)
  const filtered = filterByPrice(rawPlaces, parsed.maxPricePkr);

  if (!filtered.length) {
    return res.status(200).json({
      results: [],
      message:
        "No restaurants matched your filters. Try broadening the search term or adjusting the price range.",
    });
  }

  // Prefer closest matches when the user sent coordinates
  const ordered = sortRawPlacesByDistance(filtered, userLat, userLng);

  // Requirement 1.4 — cap at 5, build CravingResult objects
  const results = formatResults(ordered, userLat, userLng);

  // Enrich each result with social/ordering links via Tavily + Gemini (parallel, non-fatal)
  const enriched = await Promise.all(
    results.map(async (r) => {
      const links = await enrichRestaurantLinks(r.name, cityFromAddress(r.address, resolvedArea));
      return {
        ...r,
        ...(links.foodpandaUrl
          ? { foodpandaLink: links.foodpandaUrl, foodpandaIsDirect: true }
          : {}),
        instagramUrl: links.instagramUrl ?? null,
        facebookUrl: links.facebookUrl ?? null,
      };
    })
  );

  return res.status(200).json({ results: enriched });
});

/**
 * Normalizes Gemini nutrition output to a plain object or drops invalid values.
 * @param {unknown} raw
 * @returns {{ calories: number, proteinG: number, carbsG: number, fatG: number, fiberG?: number }|undefined}
 */
function normalizeNutrition(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const calories = Number(o.calories);
  const proteinG = Number(o.proteinG ?? o.protein);
  const carbsG = Number(o.carbsG ?? o.carbs);
  const fatG = Number(o.fatG ?? o.fat);
  const fiberRaw = o.fiberG ?? o.fiber;
  const fiberG =
    fiberRaw != null && fiberRaw !== "" ? Number(fiberRaw) : undefined;
  if (![calories, proteinG, carbsG, fatG].every((x) => Number.isFinite(x))) {
    return undefined;
  }
  const out = { calories, proteinG, carbsG, fatG };
  if (fiberG != null && Number.isFinite(fiberG)) out.fiberG = fiberG;
  return out;
}

// ─────────────────────────────────────────────────────────
// POST /api/recommend
// ─────────────────────────────────────────────────────────
app.post("/api/recommend", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in the backend .env" });
    }

    const { ingredients, budget, time, goal } = req.body;
    if (!ingredients) {
      return res.status(400).json({ error: "Ingredients are required to find a meal." });
    }

    // Phase 1: search the web for real recipes
    const webRecipes = await searchRecipesOnline(ingredients, goal);

    // Build a context block from search results so Gemini can reference them
    const webContext = webRecipes.length > 0
      ? `Here are real recipes found on the internet that match the user's ingredients:\n` +
        webRecipes.map((r, i) =>
          `[${i + 1}] Title: "${r.title}"\n    URL: ${r.url}\n    Preview: ${r.snippet}`
        ).join("\n\n")
      : "No web search results were available for these ingredients.";

    // Phase 2: ask Gemini to generate + cite
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
You are MealMind, an expert, cost-conscious culinary AI assistant.
The user needs a meal recommendation based on these constraints:
- Ingredients they already have: ${ingredients}
- Budget Constraint: ${budget || "No strict budget"}
- Max Cooking Time: ${time || "No strict time limit"}
- Dietary Goal/Mood: ${goal || "A tasty meal"}

${webContext}

INSTRUCTIONS:
1. Use the web search results above as primary references. If they are relevant, prefer recommending from them and include their URLs as references.
2. Generate clear, practical step-by-step instructions for the chosen or created recipe.
3. If the user's constraints are contradictory or impossible, suggest a simple realistic alternative.
4. In the "references" field, include 2–4 source links. These MUST be real, working URLs — use the ones from the web search results above if relevant, or use well-known recipe sites (allrecipes.com, bbcgoodfood.com, seriouseats.com, etc.) that would logically have this recipe.
5. Do NOT make up URLs. Only include URLs from the web search results provided above, or major well-known cookery websites.
6. Estimate per-serving nutrition for ONE typical serving of the finished dish (numbers only, best-effort):
   "nutrition": { "calories": <number>, "proteinG": <number>, "carbsG": <number>, "fatG": <number>, "fiberG": <optional number> }

Respond EXACTLY in valid JSON. Do NOT use Markdown code fences. Use this schema:
{
  "recipeName": "Name of the dish",
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "isFallback": false,
  "nutrition": { "calories": 0, "proteinG": 0, "carbsG": 0, "fatG": 0, "fiberG": 0 },
  "references": [
    { "title": "Source name", "url": "https://..." }
  ]
}
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Strip any accidental markdown fences
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonResponse = JSON.parse(responseText);

    if (jsonResponse.nutrition != null) {
      jsonResponse.nutrition = normalizeNutrition(jsonResponse.nutrition);
    }

    // Attach the raw Tavily results as "foundOnline" for the UI to display
    jsonResponse.foundOnline = webRecipes;

    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Backend AI Error:", error);
    const errorMessage = error.message || "Unknown error occurred while connecting to Gemini.";
    return res.status(500).json({ error: `Failed to connect to the AI Chef: ${errorMessage}` });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/chat — MealMind Chatbot
// ─────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in the backend .env" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { messages, userPreferences } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required." });
    }

    // Build preferences context block
    let prefContext = "";
    if (userPreferences) {
      const p = userPreferences;
      const lines = [];
      if (p.cuisines?.length)   lines.push(`- Favourite cuisines: ${p.cuisines.join(", ")}`);
      if (p.spice)              lines.push(`- Spice level: ${p.spice}`);
      if (p.budget)             lines.push(`- Default budget: ${p.budget}`);
      if (p.skill)              lines.push(`- Cooking skill: ${p.skill}`);
      if (p.goal)               lines.push(`- Health goal: ${p.goal}`);
      if (p.allergens?.length)  lines.push(`- Allergies/intolerances: ${p.allergens.join(", ")}`);
      if (p.diets?.length)      lines.push(`- Dietary restrictions: ${p.diets.join(", ")}`);
      if (p.customPreferences)  lines.push(`- Additional preferences: ${p.customPreferences}`);
      if (lines.length) {
        prefContext = `\n\nUSER PROFILE (use this as context for all suggestions):\n${lines.join("\n")}`;
      }
    }

    const systemPrompt = `You are MealMind's AI food assistant — a friendly, knowledgeable, and practical culinary companion built into the MealMind app.

MealMind is a smart meal planning app for Pakistani users (students, young professionals, families) that helps with:
- Fridge-first cooking: what to cook with what you have
- Budget-conscious meal planning (prices in PKR)
- Nutritional goals (weight loss, muscle gain, etc.)
- Cravings and food ordering suggestions
- Dietary restrictions and allergen management
- Recipe discovery and saving

Your personality: warm, practical, concise. You speak like a helpful foodie friend — not a robot. You can suggest specific dishes, ask clarifying questions, give cooking tips, help with ingredient substitutions, and suggest what to order when the user doesn't want to cook.

IMPORTANT RULES:
- Always keep budget context in PKR if the user hasn't specified
- Respect all stated allergies and dietary restrictions strictly — never suggest food containing them
- Keep responses focused on food, meals, cooking, nutrition, and meal planning
- If asked something completely unrelated to food/meals, politely redirect
- Be concise — 2-4 short paragraphs max unless listing steps or ingredients
- Use emojis naturally but sparingly${prefContext}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemInstructionContent(systemPrompt),
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || typeof lastMessage.content !== "string") {
      return res.status(400).json({ error: "Each message must include text content." });
    }

    const result = await chat.sendMessage(lastMessage.content.trim());
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });

  } catch (error) {
    console.error("Chatbot AI Error:", error);
    return res.status(500).json({ error: userFacingChatError(error) });
  }
});

const PORT = 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ MealMind Backend running perfectly on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Stop the existing process and try again.`);
  } else {
    console.error("❌ Server error:", err.message);
  }
  // Don't exit during test runs — the test runner requires the process to stay alive
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
});

// Export pure functions for unit / property-based testing
module.exports = {
  PRICE_TIER_MAP,
  mapPriceLevel,
  filterByPrice,
  parseQuery,
  formatResults,
  searchPlaces,
  haversineKm,
  placePriceLevel,
  sortRawPlacesByDistance,
  normalizeNutrition,
  sanitiseWebsite,
  extractPhones,
  foodpandaSearchUrl,
  cityFromAddress,
  enrichRestaurantLinks,
};
