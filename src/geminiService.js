// ================================================================
// GEMINI AI SERVICE
// Models used:
//   • gemini-3-flash        — text, reasoning, JSON generation
//   • gemini-3-flash        — multimodal vision (image OCR)
//   • Web Speech API          — real-time speech recognition
// ================================================================

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TEXT_MODEL  = "gemini-3-flash-preview";
const VISION_MODEL = "gemini-3-flash-preview"; 

const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ---- Low-level call ----
async function callGemini(model, parts, apiKeyOverride = null, isJson = true) {
  const finalKey = apiKeyOverride || ENV_API_KEY;
  if (!finalKey) throw new Error("Missing Gemini API Key in .env");

  const res = await fetch(
    `${GEMINI_BASE}/${model}:generateContent?key=${finalKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: isJson
          ? { responseMimeType: "application/json", temperature: 0.1 }
          : { temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (isJson) {
    try {
      const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      return JSON.parse(clean);
    } catch {
      throw new Error("Gemini returned invalid JSON: " + text.substring(0, 200));
    }
  }
  return text;
}

// ================================================================
// 1. EXTRACT EXPENSES FROM TEXT (NLP)
// ================================================================
export async function extractExpensesWithAI(userInput) {
  const prompt = `You are an AI Personal Finance Assistant. Extract ALL expenses from the input.
Use these categories ONLY: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"].
Return ONLY valid JSON array:
[{"amount": number, "category": "string", "merchant": "string", "type": "expense"|"income", "note": "string"}]
Input: "${userInput}"`;

  return callGemini(TEXT_MODEL, [{ text: prompt }]);
}

// ================================================================
// 2. OCR BANK STATEMENT IMAGE
// ================================================================
export async function extractFromImage(base64Data, mimeType) {
  const prompt = `Extract transactions from this bank statement image. 
Return ONLY valid JSON:
{"transactions": [{"date": "YYYY-MM-DD", "amount": number, "merchant": "string", "category": "string", "type": "expense"|"income"}], "warning": "string|null"}`;

  return callGemini(
    VISION_MODEL,
    [
      { text: prompt },
      { inlineData: { mimeType, data: base64Data } },
    ]
  );
}

// ================================================================
// 3. GENERATE AI FINANCIAL INSIGHTS
// ================================================================
export async function generateAIInsights(transactions) {
  const prompt = `Analyze this finance data and generate insights. Return ONLY JSON:
{"summary": "string", "overspending_categories": [], "warnings": [], "suggestions": [], "spending_score": number}`;

  return callGemini(TEXT_MODEL, [{ text: JSON.stringify(transactions) + prompt }]);
}

// ================================================================
// 4. SPENDING PREDICTION
// ================================================================
export async function predictSpending(transactions) {
  const prompt = `Predict end-of-month finances based on this velocity. Return ONLY JSON:
{"predicted_spending": number, "predicted_savings": number, "risk_level": "Low"|"Medium"|"High", "reason": "string", "breakdown": {}}`;

  return callGemini(TEXT_MODEL, [{ text: JSON.stringify(transactions) + prompt }]);
}

// ================================================================
// 5. GOAL TRACKING
// ================================================================
export async function checkGoalProgress(transactions, goalAmount, goalName) {
  const prompt = `Analyze if user can save ₹${goalAmount} for "${goalName}". Return ONLY JSON:
{"status": "on track"|"behind"|"at risk", "progress_percentage": number, "advice": "string", "daily_budget": number}`;

  return callGemini(TEXT_MODEL, [{ text: JSON.stringify(transactions) + prompt }]);
}

// ================================================================
// 6. CONVERSATIONAL AI CHAT
// ================================================================
export async function chatWithFinanceAI(question, transactions, chatHistory, systemInstruction = null) {
  const defaultContext = `You are FinanceAI. Total expenses: ₹${transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)}. Respond briefly.`;
  const systemContext = systemInstruction || defaultContext;
  
  const history = chatHistory.slice(-6).map(h => ({
    role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user', 
    parts: [{ text: h.content }]
  }));

  const res = await fetch(
    `${GEMINI_BASE}/${TEXT_MODEL}:generateContent?key=${ENV_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemContext }] },
        contents: [
          ...history,
          { role: "user", parts: [{ text: question }] }
        ],
        generationConfig: { temperature: 0.6, maxOutputTokens: 512 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
}

// ================================================================
// 7. CORRECT SPEECH TRANSCRIPT WITH AI
// ================================================================
export async function correctSpeechWithAI(transcript) {
  const prompt = `Fix speech-to-text transcript: "${transcript}". Return ONLY corrected text.`;
  return callGemini(TEXT_MODEL, [{ text: prompt }], null, false);
}

// ================================================================
// 8. ONBOARDING DATA EXTRACTION
// ================================================================
export async function extractSetupData(conversationText) {
  const prompt = `You are a financial analyst. Analyze this setup conversation and extract all monthly recurring income and expenses.
Use these categories ONLY: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"].
Return ONLY valid JSON array of transaction objects:
[{"amount": number, "category": "string", "merchant": "string", "type": "expense"|"income", "date": "2024-04-01"}]

Conversation:
${conversationText}`;

  return callGemini(TEXT_MODEL, [{ text: prompt }]);
}
