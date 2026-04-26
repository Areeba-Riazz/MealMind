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
async function searchRecipesOnline(ingredients, goal, type = "web") {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) return [];

  try {
    const tavily = new TavilyClient({ apiKey: tavilyKey });
    
    // If type is youtube, we specifically look for videos.
    // Otherwise, we search for standard recipe blogs.
    let query = `best recipe for ${goal || 'a meal'} using ${ingredients}`;
    if (type === "youtube") {
      query = `recipe for ${goal || 'this meal'} using ${ingredients} site:youtube.com`;
    }

    const response = await tavily.search(query, {
      search_depth: "basic",
      max_results: type === "youtube" ? 3 : 5,
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
    console.warn(`Tavily ${type} search failed (non-fatal):`, err.message);
    return [];
  }
}

/**
 * Fallback to Groq API using native fetch if Gemini fails.
 */
async function fallbackToGroq(messages, systemInstruction, isJson = false) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error("GROQ_API_KEY is not set.");
  }

  const formattedMessages = [];
  if (systemInstruction) {
    formattedMessages.push({ role: "system", content: systemInstruction });
  }

  if (Array.isArray(messages)) {
    // Chatbot format
    for (const m of messages) {
      formattedMessages.push({ 
        role: m.role === "model" ? "assistant" : m.role, 
        content: m.content || m.parts?.[0]?.text 
      });
    }
  } else {
    // String prompt
    formattedMessages.push({ role: "user", content: messages });
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: formattedMessages,
      temperature: 0.7,
      response_format: isJson ? { type: "json_object" } : undefined
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Unified AI generation function with Groq Fallback
 * @param {string|Array} promptOrMessages A string prompt OR an array of messages for chat
 * @param {object} options { systemInstruction: string, isJson: boolean }
 */
async function generateWithFallback(promptOrMessages, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in the backend .env");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelOptions = { model: "gemini-flash-latest" };
    if (options.systemInstruction) {
      modelOptions.systemInstruction = systemInstructionContent(options.systemInstruction);
    }
    const model = genAI.getGenerativeModel(modelOptions);

    let resultText = "";
    if (Array.isArray(promptOrMessages)) {
      // It's a chat sequence
      const history = promptOrMessages.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: [{ text: m.content }]
      }));
      const chat = model.startChat({ history });
      const lastMsg = promptOrMessages[promptOrMessages.length - 1];
      const result = await chat.sendMessage(lastMsg.content);
      resultText = result.response.text();
    } else {
      // It's a single prompt
      const result = await model.generateContent(promptOrMessages);
      resultText = result.response.text();
    }

    return resultText;
  } catch (error) {
    const errorStr = String(error.message || error).toLowerCase();
    const isServiceDown = errorStr.includes("503") || error.status === 503 || errorStr.includes("fetch failed") || errorStr.includes("overloaded");
    
    if (isServiceDown && process.env.GROQ_API_KEY) {
      console.warn("⚠️ Gemini failed or is overloaded. Falling back to Groq API...");
      return await fallbackToGroq(promptOrMessages, options.systemInstruction, options.isJson);
    }
    // If not a 503 or no Groq key, re-throw
    throw error;
  }
}

/**
 * Uses the fallback engine to extract structured search parameters from a query.
 */
async function parseQuery(query) {
  const systemInstruction = `
    You are a query parser for a food search app.
    Extract structured fields from the user's craving query.
  `;
  const prompt = `
    Query: "${query}"

    Respond ONLY with valid JSON matching this schema (no Markdown, no extra text):
    {
      "foodTerm": "<the food or restaurant type being searched for, non-empty string>",
      "maxPricePkr": <optional positive number representing max price in PKR, omit if not mentioned>,
      "area": "<optional city or neighbourhood string, omit if not mentioned>"
    }
  `;

  let responseText = await generateWithFallback(prompt, { systemInstruction, isJson: true });
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
    let text = await generateWithFallback(prompt, { isJson: true });
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
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

/**
 * Generates daily recommendations: 1 recipe and 1 delivery order.
 */
async function generateDailyRecommendations(preferences, dietary) {
  const systemInstruction = `
    You are MealMind's culinary advisor for Pakistani users.
    Generate exactly 2 daily recommendations for the user:
    1. A home-cooked recipe.
    2. A food-delivery order suggestion (types of dishes or a Pakistani restaurant chain).
    
    Take into account their preferences: ${JSON.stringify(preferences || {})}
    And their dietary restrictions: ${JSON.stringify(dietary || {})}
    
    CRITICAL: Never suggest food that violates their allergies or dietary restrictions.
  `;

  const prompt = `
    Return a JSON object with two top-level keys: "recipe" and "order".
    
    For "recipe", include:
    - title: string
    - description: string
    - ingredients: array of strings
    - instructions: array of strings
    - youtubeUrl: optional string (if a specific well-known dish, guess a search-friendly youtube URL like https://www.youtube.com/results?search_query=Dish+Name, or omit)
    - nutrition: object with calories, proteinG, carbsG, fatG, fiberG
    
    For "order", include:
    - title: string (e.g., "Smash Beef Burger from a local joint")
    - description: string (why it fits their cravings/budget)
    - estimatedCost: string (e.g., "Rs. 850")
    
    Respond ONLY with valid JSON.
  `;

  let responseText = await generateWithFallback(prompt, { systemInstruction, isJson: true });
  responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(responseText);
    // ensure rating fields exist as null initially
    if (parsed.recipe) parsed.recipe.rating = null;
    if (parsed.order) parsed.order.rating = null;
    return parsed;
  } catch (err) {
    throw new Error("Failed to parse daily recommendations JSON: " + err.message);
  }
}

module.exports = {
  systemInstructionContent,
  searchRecipesOnline,
  parseQuery,
  enrichAllRestaurantLinks,
  generateWithFallback,
  generateDailyRecommendations,
};
