const { GoogleGenerativeAI } = require("@google/generative-ai");
const { TavilyClient } = require("tavily");
const { sanitiseWebsite } = require("../utils/formatting");
const { cityFromAddress } = require("../utils/geo");

/**
 * Gemini expects system_instruction as a Content object (parts), not a bare string.
 * @param {string} text
 * @returns {{ parts: { text: string }[] }}
 */
function systemInstructionContent(text) {
  return { parts: [{ text }] };
}

/**
 * Helper: search the web for recipes via Tavily
 */
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
 * Uses Gemini to extract structured search parameters from a free-text craving query.
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
 * Enriches ALL restaurants in one batch.
 */
async function enrichAllRestaurantLinks(restaurants) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const empty = restaurants.map(() => ({}));
  if (!tavilyKey || !geminiKey || restaurants.length === 0) return empty;

  const tavily = new TavilyClient({ apiKey: tavilyKey });

  const tavilyResults = await Promise.all(
    restaurants.map(({ name, city }) =>
      Promise.all([
        tavily
          .search(`"${name}" "${city}" (site:instagram.com OR site:facebook.com)`, {
            search_depth: "basic", max_results: 3, include_answer: false,
          })
          .then((r) => r.results ?? [])
          .catch(() => []),
        tavily
          .search(`"${name}" "${city}" site:foodpanda.pk`, {
            search_depth: "basic", max_results: 3, include_answer: false,
          })
          .then((r) => r.results ?? [])
          .catch(() => []),
      ]).then(([social, fp]) => [...social, ...fp])
    )
  );

  const sections = restaurants.map(({ name, city }, i) => {
    const hits = tavilyResults[i];
    if (hits.length === 0) return `[Restaurant ${i + 1}] "${name}" in "${city}"\n  No results found.`;
    const lines = hits
      .map((r) => `  - URL: ${r.url}\n    Title: ${r.title}\n    Snippet: ${(r.content ?? "").slice(0, 100)}`)
      .join("\n");
    return `[Restaurant ${i + 1}] "${name}" in "${city}"\n${lines}`;
  }).join("\n\n");

  const prompt = `You are extracting social media and ordering links for a list of restaurants.

${sections}

For EACH restaurant, extract the following — only if you are highly confident the URL belongs to THAT specific restaurant:
- instagramUrl: profile page only (instagram.com/<handle>). Reject /reel/, /p/, /stories/ URLs.
- facebookUrl: page only (facebook.com/<page>). Reject /posts/, /photos/, /videos/ URLs.
- foodpandaUrl: direct listing only — must contain "/restaurant/" in the path. Reject city/search pages or wrong restaurants.

Return null for any field you cannot confirm with high confidence.
Do NOT cross-assign links between restaurants.

Respond ONLY with a valid JSON array of ${restaurants.length} objects in the same order, no markdown:
[
  { "instagramUrl": "<url or null>", "facebookUrl": "<url or null>", "foodpandaUrl": "<url or null>" }
]`;

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) return empty;

    return parsed.map((item) => {
      if (!item || typeof item !== "object") return {};
      const out = {};

      const ig = sanitiseWebsite(item.instagramUrl);
      if (ig && /instagram\.com\/(?!reel|p\/|stories)[\w.]+/.test(ig)) out.instagramUrl = ig;

      const fb = sanitiseWebsite(item.facebookUrl);
      if (fb && /facebook\.com\/(?!posts|photos|videos)[\w.]+/.test(fb)) out.facebookUrl = fb;

      const fp = sanitiseWebsite(item.foodpandaUrl);
      if (fp && /foodpanda\.pk\/restaurant\//.test(fp)) out.foodpandaUrl = fp;

      return out;
    });
  } catch {
    return empty;
  }
}

module.exports = {
  systemInstructionContent,
  searchRecipesOnline,
  parseQuery,
  enrichAllRestaurantLinks,
};
