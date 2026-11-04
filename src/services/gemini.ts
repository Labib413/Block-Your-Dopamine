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

async function parseApiResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any)?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export async function callGemini(params: {
  model?: string;
  contents: any;
  config?: any;
}): Promise<{ text: string }> {
  const res = await fetch("/api/gemini/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return parseApiResponse<{ text: string }>(res);
}

export async function streamGemini(
  params: { model?: string; contents: any; config?: any },
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch("/api/gemini/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok || !res.body) {
    const errData = await res.json().catch(() => ({}));
    throw new Error((errData as any)?.error || `Stream request failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return fullText;
      const parsed = JSON.parse(payload);
      if (parsed.error) {
        throw new Error(parsed.error);
      }
      if (parsed.text) {
        fullText += parsed.text;
        onChunk(parsed.text);
      }
    }
  }

  return fullText;
}

export async function getDailyQuote() {
  const today = new Date().toDateString();
  const cached = localStorage.getItem("dailyQuote");

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.date === today && parsed.quote && parsed.quote.text) {
        return parsed.quote;
      }
    } catch {
      // ignore parsing error
    }
  }

  try {
    const res = await fetch("/api/quote");
    const quoteObj = await parseApiResponse<{ text: string; author: string }>(res);

    if (quoteObj.text && quoteObj.author) {
      localStorage.setItem("dailyQuote", JSON.stringify({ date: today, quote: quoteObj }));
      return quoteObj;
    }
    throw new Error("Invalid response format");
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    const isHighDemand =
      errorMsg.includes("503") ||
      errorMsg.includes("unavailable") ||
      errorMsg.includes("high demand") ||
      errorMsg.includes("429") ||
      errorMsg.includes("quota");

    if (isHighDemand) {
      console.warn("[Gemini] Quote generation: models busy/high demand, seamlessly serving curated stoic quote.");
    } else {
      console.warn("[Gemini] Quote notice:", error?.message || error);
    }
    const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    localStorage.setItem("dailyQuote", JSON.stringify({ date: today, quote: fallback }));
    return fallback;
  }
}

export async function getAIInsight(metrics: any) {
  try {
    const res = await fetch("/api/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics }),
    });
    const data = await parseApiResponse<{ text: string }>(res);
    return data.text || FALLBACK_INSIGHTS[Math.floor(Math.random() * FALLBACK_INSIGHTS.length)];
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    const isHighDemand =
      errorMsg.includes("503") ||
      errorMsg.includes("unavailable") ||
      errorMsg.includes("high demand") ||
      errorMsg.includes("429") ||
      errorMsg.includes("quota");

    if (isHighDemand) {
      console.warn("[Gemini] Insight generation: models busy/high demand, seamlessly serving curated insight.");
    } else {
      console.warn("[Gemini] Insight notice:", error?.message || error);
    }
    return FALLBACK_INSIGHTS[Math.floor(Math.random() * FALLBACK_INSIGHTS.length)];
  }
}

export async function analyzeMoodEntry(text: string): Promise<{ emoji: string; suggestion: string }> {
  const res = await fetch("/api/health/mood", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return parseApiResponse<{ emoji: string; suggestion: string }>(res);
}

export async function analyzeMealMacros(payload: {
  imageBase64?: string;
  mimeType?: string;
  foodText?: string;
}): Promise<{ foodName: string; protein: number; carbs: number; fats: number }> {
  const res = await fetch("/api/health/macros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseApiResponse<{ foodName: string; protein: number; carbs: number; fats: number }>(res);
}
