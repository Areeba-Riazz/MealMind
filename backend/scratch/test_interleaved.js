const dotenv = require('dotenv');
const path = require('path');

// Mock environment variables
process.env.GEMINI_API_KEY = "G_KEY_1, G_KEY_2";
process.env.GEMINI_API_KEY_3 = "G_KEY_3";
process.env.GROQ_API_KEY = "Q_KEY_1";
process.env.GROQ_API_KEY_2 = "Q_KEY_2";

function collectKeys(prefix) {
  const keys = new Set();
  const primary = process.env[prefix];
  if (primary) {
    primary.split(',').forEach(k => {
      const trimmed = k.trim();
      if (trimmed) keys.add(trimmed);
    });
  }
  Object.keys(process.env).forEach(envKey => {
    if (envKey.startsWith(`${prefix}_`)) {
      const value = process.env[envKey];
      if (value) {
        value.split(',').forEach(k => {
          const trimmed = k.trim();
          if (trimmed) keys.add(trimmed);
        });
      }
    }
  });
  // Sort to ensure deterministic test result
  return Array.from(keys).sort();
}

function interleaveUnits() {
  const geminiKeys = collectKeys("GEMINI_API_KEY");
  const groqKeys = collectKeys("GROQ_API_KEY");
  const units = [];
  const maxLen = Math.max(geminiKeys.length, groqKeys.length);
  for (let i = 0; i < maxLen; i++) {
    if (geminiKeys[i]) units.push({ provider: "gemini", key: geminiKeys[i] });
    if (groqKeys[i]) units.push({ provider: "groq", key: groqKeys[i] });
  }
  return units;
}

const units = interleaveUnits();
console.log("Units discovered and interleaved:");
console.log(JSON.stringify(units, null, 2));

const expected = [
  { provider: "gemini", key: "G_KEY_1" },
  { provider: "groq", key: "Q_KEY_1" },
  { provider: "gemini", key: "G_KEY_2" },
  { provider: "groq", key: "Q_KEY_2" },
  { provider: "gemini", key: "G_KEY_3" }
];

const pass = JSON.stringify(units) === JSON.stringify(expected);
console.log(`\nTest Result: ${pass ? "PASS" : "FAIL"}`);
