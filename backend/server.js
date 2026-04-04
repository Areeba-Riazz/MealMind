const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { TavilyClient } = require("tavily");

// Load backend secrets
dotenv.config();

const app = express();
app.use(express.json());

// Allow frontend to make requests.
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

    // ── Phase 1: search the web for real recipes ──────────
    const webRecipes = await searchRecipesOnline(ingredients, goal);

    // Build a context block from search results so Gemini can reference them
    const webContext = webRecipes.length > 0
      ? `Here are real recipes found on the internet that match the user's ingredients:\n` +
        webRecipes.map((r, i) =>
          `[${i + 1}] Title: "${r.title}"\n    URL: ${r.url}\n    Preview: ${r.snippet}`
        ).join("\n\n")
      : "No web search results were available for these ingredients.";

    // ── Phase 2: ask Gemini to generate + cite ────────────
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

Respond EXACTLY in valid JSON. Do NOT use Markdown code fences. Use this schema:
{
  "recipeName": "Name of the dish",
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "isFallback": false,
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

    // Attach the raw Tavily results as "foundOnline" for the UI to display
    jsonResponse.foundOnline = webRecipes;

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
