const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load backend secrets
dotenv.config();

const app = express();
app.use(express.json());

// Allow frontend to make requests
app.use(cors({ origin: "http://localhost:3000" }));

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
