const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Utility and Service Imports
const {
  haversineKm,
  parseLatitude,
  parseLongitude,
  sortRawPlacesByDistance,
  distanceToRawPlace,
  cityFromAddress,
} = require("./utils/geo");

const {
  PRICE_TIER_MAP,
  mapPriceLevel,
  placePriceLevel,
  filterByPrice,
} = require("./utils/pricing");

const {
  sanitiseWebsite,
  extractPhones,
  foodpandaSearchUrl,
  formatResults,
} = require("./utils/formatting");

const { normalizeNutrition } = require("./utils/nutrition");
const { userFacingChatError } = require("./utils/errors");

const {
  systemInstructionContent,
  searchRecipesOnline,
  parseQuery,
  enrichAllRestaurantLinks,
  generateWithFallback,
} = require("./services/ai");

const { searchPlaces } = require("./services/maps");

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
// POST /api/cravings
// ─────────────────────────────────────────────────────────
app.post("/api/cravings", async (req, res) => {
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
    parsed = await parseQuery(query.trim());
  } catch (err) {
    console.error("parseQuery error:", err);
    return res.status(502).json({ error: `Failed to parse your query: ${err.message}` });
  }

  const resolvedArea = parsed.area ?? (areaTrimmed ? areaTrimmed : undefined);

  if (!hasCoords && !resolvedArea) {
    return res.status(400).json({
      error: "Location is required: enable geolocation in your browser or enter your city or area.",
    });
  }

  let rawPlaces;
  try {
    rawPlaces = await searchPlaces(parsed.foodTerm, userLat, userLng, resolvedArea);
  } catch (err) {
    console.error("searchPlaces error:", err);
    return res.status(502).json({ error: `Failed to fetch restaurant data: ${err.message}` });
  }

  if (!rawPlaces.length) {
    return res.status(200).json({ results: [], message: "No restaurants found for your search. Try broadening the search term or adjusting the price range." });
  }

  const filtered = filterByPrice(rawPlaces, parsed.maxPricePkr);

  if (!filtered.length) {
    return res.status(200).json({
      results: [],
      message:
        "No restaurants matched your filters. Try broadening the search term or adjusting the price range.",
    });
  }

  const ordered = sortRawPlacesByDistance(filtered, userLat, userLng);
  const results = formatResults(ordered, userLat, userLng);

  const restaurantsToEnrich = results.map((r) => ({
    name: r.name,
    city: cityFromAddress(r.address, resolvedArea),
  }));
  const enrichments = await enrichAllRestaurantLinks(restaurantsToEnrich);

  const enriched = results.map((r, i) => {
    const links = enrichments[i] ?? {};
    return {
      ...r,
      ...(links.foodpandaUrl
        ? { foodpandaLink: links.foodpandaUrl, foodpandaIsDirect: true }
        : {}),
      instagramUrl: links.instagramUrl ?? null,
      facebookUrl: links.facebookUrl ?? null,
    };
  });

  return res.status(200).json({ results: enriched });
});

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

    const webRecipes = await searchRecipesOnline(ingredients, goal, "web");
    const ytRecipes = await searchRecipesOnline(ingredients, goal, "youtube");

    const webContext = webRecipes.length > 0
      ? `Here are real recipes found on the internet that match the user's ingredients:\n` +
      webRecipes.map((r, i) =>
        `[WEB ${i + 1}] Title: "${r.title}"\n    URL: ${r.url}\n    Preview: ${r.snippet}`
      ).join("\n\n")
      : "No web search results were available.";

    const ytContext = ytRecipes.length > 0
      ? `Here are relevant YouTube cooking videos for this meal type:\n` +
      ytRecipes.map((r, i) =>
        `[VIDEO ${i + 1}] Title: "${r.title}"\n    URL: ${r.url}`
      ).join("\n\n")
      : "";

    const prompt = `
You are MealMind, an expert, cost-conscious culinary AI assistant.
The user needs a meal recommendation based on these constraints:
- Ingredients they already have: ${ingredients}
- Budget Constraint: ${budget || "No strict budget"}
- Max Cooking Time: ${time || "No strict time limit"}
- Dietary Goal/Mood: ${goal || "A tasty meal"}

${webContext}
${ytContext}

INSTRUCTIONS:
1. Provide a PRIMARY recommendation (recipeName) derived from the search results.
2. Select the MOST RELEVANT YouTube video for this primary dish.
3. For the [WEB] search results, select the TOP 2-3 most distinct recipes and enrich them.
4. **CRITICAL**: For enriched web results, focus heavily on extracting EXACT recipe instructions and finding a matching YouTube URL from the [VIDEO] list if possible.
5. You do NOT need to generate a precise ingredientsList for the web results (the app will use the user's input), but provide estimated nutrition and cooking time.

Respond EXACTLY in valid JSON. Use this schema:
{
  "recipeName": "Primary recommended dish",
  "ingredientsList": [ { "item": "...", "amount": "..." } ],
  "instructions": ["Step 1", "Step 2", ...],
  "cookingTime": "...",
  "estimatedCost": "...",
  "youtubeUrl": "...",
  "nutrition": { "calories": 0, "proteinG": 0, "carbsG": 0, "fatG": 0, "fiberG": 0 },
  "enrichedOnlineResults": [
    {
      "title": "...", "url": "...", "snippet": "...",
      "instructions": ["Step 1", "Step 2", ...],
      "youtubeUrl": "URL from [VIDEO] list if it matches this specific dish",
      "nutrition": { "calories": 0, "proteinG": 0, "carbsG": 0, "fatG": 0, "fiberG": 0 },
      "cookingTime": "...", "estimatedCost": "..."
    }
  ]
}
    `;

    let responseText = await generateWithFallback(prompt, { isJson: true });
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonResponse = JSON.parse(responseText);

    if (jsonResponse.nutrition != null) {
      jsonResponse.nutrition = normalizeNutrition(jsonResponse.nutrition);
    }

    // Attach results for the "Found Online" UI section
    jsonResponse.foundOnline = webRecipes;

    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Backend AI Error:", error);
    const errorMessage = error.message || "Unknown error occurred while connecting to the AI.";
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

    let prefContext = "";
    if (userPreferences) {
      const p = userPreferences;
      const lines = [];
      if (p.cuisines?.length) lines.push(`- Favourite cuisines: ${p.cuisines.join(", ")}`);
      if (p.spice) lines.push(`- Spice level: ${p.spice}`);
      if (p.budget) lines.push(`- Default budget: ${p.budget}`);
      if (p.skill) lines.push(`- Cooking skill: ${p.skill}`);
      if (p.goal) lines.push(`- Health goal: ${p.goal}`);
      if (p.allergens?.length) lines.push(`- Allergies/intolerances: ${p.allergens.join(", ")}`);
      if (p.diets?.length) lines.push(`- Dietary restrictions: ${p.diets.join(", ")}`);
      if (p.customPreferences) lines.push(`- Additional preferences: ${p.customPreferences}`);
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

    const responseText = await generateWithFallback(messages, { systemInstruction: systemPrompt });

    return res.status(200).json({ reply: responseText });

  } catch (error) {
    console.error("Chatbot AI Error:", error);
    return res.status(500).json({ error: userFacingChatError(error) });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/recipe/clarify — Clarify steps/ingredients
// ─────────────────────────────────────────────────────────
app.post("/api/recipe/clarify", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const { recipeName, selectedItem, question, contextInstructions, contextIngredients } = req.body;
    if (!selectedItem || !question) {
      return res.status(400).json({ error: "Item and question are required." });
    }

    const systemPrompt = `You are MealMind's Recipe Assistant. 
You help users with specific questions about a recipe they are currently following.
Recipe: "${recipeName}"
Ingredients in this recipe: ${JSON.stringify(contextIngredients || [])}
Full Instructions: ${JSON.stringify(contextInstructions || [])}

The user is asking about this specific item: "${selectedItem}"
User Question: "${question}"

Provide a concise, helpful, and friendly response. If they ask for substitutions, suggest common items available in a Pakistani kitchen. If they ask for technique, explain it simply. Keep it short (1-2 paragraphs).`;

    const responseText = await generateWithFallback(systemPrompt);
    return res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("Clarification Error:", error);
    return res.status(500).json({ error: "Failed to get clarification from the AI Chef." });
  }
});

const PORT = 5001;
const server = app.listen(PORT, () => {
  console.log(`✅ MealMind Backend running perfectly on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Stop the existing process and try again.`);
  } else {
    console.error("❌ Server error:", err.message);
  }
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
});

// Export functions and constants for unit testing (maintains backward compatibility)
module.exports = {
  // geo
  haversineKm,
  parseLatitude,
  parseLongitude,
  sortRawPlacesByDistance,
  distanceToRawPlace,
  cityFromAddress,
  // pricing
  PRICE_TIER_MAP,
  mapPriceLevel,
  placePriceLevel,
  filterByPrice,
  // formatting
  sanitiseWebsite,
  extractPhones,
  foodpandaSearchUrl,
  formatResults,
  // nutrition
  normalizeNutrition,
  // errors
  userFacingChatError,
  // ai
  systemInstructionContent,
  searchRecipesOnline,
  parseQuery,
  enrichAllRestaurantLinks,
  // maps
  searchPlaces,
};
