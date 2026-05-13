import { GoogleGenAI, Type } from "@google/genai";

const FALLBACK_QUOTES = [
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins" },
  { text: "Great things never come from comfort zones.", author: "Roy T. Bennett" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Efficiency is doing things right; effectiveness is doing the right things.", author: "Peter Drucker" }
];

const FALLBACK_INSIGHTS = [
  "Focus on deep work blocks to accelerate your progress.",
  "Consistency is your greatest leverage. Maintain your current focus block.",
  "Small daily improvements lead to staggering long-term results.",
  "Protect your focus time; it is your most valuable asset.",
  "The best way to predict the future is to create it through action."
];

function getGenAI(apiKey?: string | null) {
  const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!finalApiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  return new GoogleGenAI({ apiKey: finalApiKey });
}

export async function callGemini(params: any, apiKey?: string | null) {
  const ai = getGenAI(apiKey);
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    const isPermissionError = errorMsg.includes("permission") || errorMsg.includes("403") || errorMsg.includes("denied");
    
    // If permission denied, try fallback to gemini-flash-latest
    if (params.model !== "gemini-2.0-flash" && isPermissionError) {
      console.warn(`Permission denied for ${params.model}, falling back to gemini-2.0-flash`);
      return await ai.models.generateContent({
        ...params,
        model: "gemini-2.0-flash"
      });
    }
    throw error;
  }
}

export async function getDailyQuote(apiKey?: string | null) {
  const today = new Date().toDateString();
  const cached = localStorage.getItem('dailyQuote');
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.date === today && parsed.quote && parsed.quote.text) {
        return parsed.quote;
      }
    } catch (e) {
      // ignore parsing error
    }
  }

  try {
    const response = await callGemini({
      model: "gemini-2.0-flash",
      contents: "Generate a short, powerful, and unique productivity or self-improvement quote for a high-performance dashboard. The tone should be professional, slightly stoic, and inspiring. Return a JSON object with 'text' (the quote) and 'author' (the person who said it).",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            author: { type: Type.STRING }
          },
          required: ["text", "author"]
        }
      }
    }, apiKey);
    
    const quoteObj = JSON.parse(response.text || "{}");
    if (quoteObj.text && quoteObj.author) {
      localStorage.setItem('dailyQuote', JSON.stringify({ date: today, quote: quoteObj }));
      return quoteObj;
    }
    throw new Error("Invalid response format");
  } catch (error: any) {
    // Handle quota exceeded or other API errors silently with a fallback
    if (error?.message?.includes("429") || error?.message?.includes("quota")) {
      console.warn("Gemini API quota exceeded, using fallback quote.");
    } else {
      console.error("Error fetching quote:", error);
    }
    const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    localStorage.setItem('dailyQuote', JSON.stringify({ date: today, quote: fallback }));
    return fallback;
  }
}

export async function getAIInsight(metrics: any, apiKey?: string | null) {
  try {
    const response = await callGemini({
      model: "gemini-2.0-flash",
      contents: `Analyze these productivity metrics: ${JSON.stringify(metrics)}. Provide a one-sentence peak performance advice.`,
    }, apiKey);
    return response.text || FALLBACK_INSIGHTS[Math.floor(Math.random() * FALLBACK_INSIGHTS.length)];
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.message?.includes("quota")) {
      console.warn("Gemini API quota exceeded, using fallback insight.");
    } else {
      console.error("Error fetching AI insight:", error);
    }
    return FALLBACK_INSIGHTS[Math.floor(Math.random() * FALLBACK_INSIGHTS.length)];
  }
}
