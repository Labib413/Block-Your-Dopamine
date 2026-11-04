import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Active distinct models (avoid aliases like gemini-flash-latest that share gemini-3.8-flash quota)
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

const CURATED_QUOTES = [
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good person should be. Be one.", author: "Marcus Aurelius" },
];

// Per-key, per-model circuit breaker to prevent hammering rate-limited (429) or overloaded (503) models
const modelCooldownUntil = new Map<string, { until: number; status: number; reason: string }>();

// Server-side response caches to conserve free-tier daily quota
let cachedDailyQuote: { dateKey: string; data: { text: string; author: string } } | null = null;
const insightCache = new Map<string, { expiresAt: number; text: string }>();

function normalizeModelName(requested?: string): string {
  if (!requested) return "gemini-3.8-flash";
  if (requested === "gemini-3.1-flash-lite-preview") return "gemini-3.1-flash-lite";
  if (requested === "gemini-3.1-pro-preview" || requested === "gemini-flash-latest") {
    return "gemini-3.8-flash";
  }
  return requested;
}

function getKeyFingerprint(): string {
  const key = process.env.GEMINI_API_KEY || "";
  if (!key) return "missing";
  return `${key.length}:${key.slice(-6)}`;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err: any = new Error(
      "GEMINI_API_KEY is not configured. Please verify your API key in Settings > Secrets."
    );
    err.status = 503;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function getErrorStatus(err: any): number {
  const status = Number(err?.status || err?.statusCode || err?.code);
  if (status >= 400 && status < 600) return status;
  const msg = String(err?.message || "").toLowerCase();
  if (msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota")) return 429;
  if (msg.includes("403") || msg.includes("permission_denied")) return 403;
  if (msg.includes("400") && msg.includes("api_key_invalid")) return 400;
  if (msg.includes("404") || msg.includes("not_found")) return 404;
  if (msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand")) return 503;
  return 500;
}

function parseRetryDelayMs(err: any, status: number): number {
  const raw = String(err?.message || JSON.stringify(err || ""));
  const secMatch = raw.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (secMatch) {
    const parsedMs = Math.ceil( parseFloat(secMatch[1]) * 1000 );
    // Cap in-memory cooldown at 15 minutes so quota resets or key upgrades recover promptly
    return Math.min(Math.max(parsedMs, 15_000), 15 * 60 * 1000);
  }
  if (status === 429) return 5 * 60 * 1000; // 5 minutes default cooldown on 429
  if (status === 503) return 45 * 1000; // 45 seconds cooldown on 503 high demand
  return 0;
}

function formatCleanGeminiError(err: any, status: number): string {
  if (status === 429) {
    return "Gemini API free-tier quota reached. Upgrade or select a billing-enabled API key in Settings > Secrets for higher limits.";
  }
  if (status === 503) {
    return "Gemini models are temporarily experiencing high demand. Please retry in a moment.";
  }
  if (status === 403 || (status === 400 && String(err?.message || "").toLowerCase().includes("key"))) {
    return "Invalid or unauthorized Gemini API key. Please check your key in Settings > Secrets.";
  }
  const rawMsg = String(err?.message || "Gemini API request failed");
  return rawMsg.length > 220 ? `${rawMsg.slice(0, 220)}...` : rawMsg;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildContextualInsight(metrics: any): string {
  const focusSeconds = Number(metrics?.focusTime) || 0;
  const focusMinutes = Math.round(focusSeconds / 60);
  const tasks = Number(metrics?.tasks) || 0;
  const type = metrics?.type;

  if (type === "consistency") {
    if (focusMinutes >= 60 && tasks >= 3) {
      return `Strong momentum with ${focusMinutes}m of deep focus and ${tasks} completed tasks—lock in tomorrow's first block tonight to protect your streak.`;
    }
    if (tasks > 0 || focusMinutes > 0) {
      return `You've logged ${focusMinutes}m of focus and ${tasks} ${tasks === 1 ? "task" : "tasks"} today; add one uninterrupted 25-minute block to compound consistency.`;
    }
    return "Anchor your consistency with a single distraction-free 25-minute session before checking any feeds.";
  }

  if (type === "peak") {
    if (focusMinutes >= 90) {
      return `After ${focusMinutes}m of deep work, take a 5-minute hydration and visual reset to sustain peak cognitive output.`;
    }
    return "Batch your highest-friction task into your next guarded focus window while mental energy is sharpest.";
  }

  if (focusMinutes >= 60 && tasks >= 2) {
    return `High-leverage execution detected (${focusMinutes}m focused, ${tasks} tasks done)—eliminate context switching to finish strong.`;
  }
  if (focusMinutes > 0) {
    return `${focusMinutes}m of clean focus banked today; pair your next session with Distraction Guard to double deep-work velocity.`;
  }
  if (tasks > 0) {
    return `${tasks} ${tasks === 1 ? "task" : "tasks"} cleared—convert this momentum into a timed deep-work block right now.`;
  }
  return "Protect your first deep-work block today; momentum compounds fastest when distractions are locked out early.";
}

async function generateWithFallback(params: {
  model?: string;
  contents: any;
  config?: any;
}): Promise<GenerateContentResponse> {
  const ai = getGeminiClient();
  const keyFp = getKeyFingerprint();
  const primaryModel = normalizeModelName(params.model);
  const orderedCandidates = [
    primaryModel,
    ...FALLBACK_MODELS.filter((m) => m !== primaryModel),
  ];

  const now = Date.now();
  const activeModels = orderedCandidates.filter((m) => {
    const cd = modelCooldownUntil.get(`${keyFp}:${m}`);
    if (!cd) return true;
    if (cd.until <= now) {
      modelCooldownUntil.delete(`${keyFp}:${m}`);
      return true;
    }
    return false;
  });

  // If all models are in cooldown, fail fast without hammering upstream API
  if (activeModels.length === 0) {
    const earliest = orderedCandidates
      .map((m) => modelCooldownUntil.get(`${keyFp}:${m}`))
      .filter(Boolean)[0];
    const syntheticErr: any = new Error(
      earliest?.reason || "Gemini models are cooling down due to rate limits or high demand."
    );
    syntheticErr.status = earliest?.status || 429;
    throw syntheticErr;
  }

  let lastError: any = null;

  for (const model of activeModels) {
    // Allow 1 brief backoff retry on transient 503 spikes before switching models
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: params.contents,
          ...(params.config ? { config: params.config } : {}),
        });
      } catch (error: any) {
        lastError = error;
        const status = getErrorStatus(error);
        const errorMsg = String(error?.message || JSON.stringify(error)).toLowerCase();

        const is503 =
          status === 503 ||
          errorMsg.includes("503") ||
          errorMsg.includes("unavailable") ||
          errorMsg.includes("high demand") ||
          errorMsg.includes("overloaded") ||
          errorMsg.includes("spike");

        const is429 =
          status === 429 ||
          errorMsg.includes("429") ||
          errorMsg.includes("resource_exhausted") ||
          errorMsg.includes("quota");

        const is404 = status === 404 || errorMsg.includes("not found");

        if (is503 && attempt === 0) {
          await sleep(600);
          continue;
        }

        if (is429 || is503) {
          const cooldownMs = parseRetryDelayMs(error, is429 ? 429 : 503);
          if (cooldownMs > 0) {
            modelCooldownUntil.set(`${keyFp}:${model}`, {
              until: Date.now() + cooldownMs,
              status: is429 ? 429 : 503,
              reason: formatCleanGeminiError(error, is429 ? 429 : 503),
            });
          }
          console.log(
            `[Gemini Router] ${model} ${is429 ? "quota cooldown" : "busy (503)"}; switching fallback if available.`
          );
          break;
        }

        if (is404) {
          break;
        }

        throw error;
      }
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Support base64 meal images and multimodal payloads
  app.use(express.json({ limit: "25mb" }));

  // Ensure OAuth popups (Google Sign-In) always retain window.opener in browsers and standalone PWAs
  app.use((_req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
  });

  // Health check endpoint for Cloud Run and uptime checks
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. Daily stoic productivity quote (cached once per calendar day)
  app.get("/api/quote", async (_req, res) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (cachedDailyQuote && cachedDailyQuote.dateKey === todayKey) {
      return res.json(cachedDailyQuote.data);
    }

    try {
      const response = await generateWithFallback({
        model: "gemini-3.1-flash-lite",
        contents:
          "Generate a short, powerful, and unique productivity or self-improvement quote for a high-performance dashboard. The tone should be professional, slightly stoic, and inspiring. Return a JSON object with 'text' (the quote) and 'author' (the person who said it).",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              author: { type: Type.STRING },
            },
            required: ["text", "author"],
          },
        },
      });
      const parsed = JSON.parse((response.text ?? "{}").trim());
      if (parsed?.text && parsed?.author) {
        cachedDailyQuote = { dateKey: todayKey, data: { text: parsed.text, author: parsed.author } };
        return res.json(cachedDailyQuote.data);
      }
      const fallback = CURATED_QUOTES[new Date().getDate() % CURATED_QUOTES.length];
      return res.json(fallback);
    } catch (err: any) {
      const status = getErrorStatus(err);
      if (status === 429 || status === 503) {
        const fallback = CURATED_QUOTES[new Date().getDate() % CURATED_QUOTES.length];
        cachedDailyQuote = { dateKey: todayKey, data: fallback };
        return res.json({ ...fallback, source: "fallback" });
      }
      return res
        .status(status)
        .json({ error: formatCleanGeminiError(err, status) });
    }
  });

  // 2. Dashboard AI Advisor insight (cached per metric milestone bucket)
  app.post("/api/insight", async (req, res) => {
    const { metrics } = req.body || {};
    const focusBucket = Math.floor((Number(metrics?.focusTime) || 0) / 900); // 15-min buckets
    const tasksCount = Number(metrics?.tasks) || 0;
    const actionType = String(metrics?.type || "auto");
    const cacheKey = `${actionType}:${focusBucket}:${tasksCount}`;

    const cached = insightCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ text: cached.text, cached: true });
    }

    try {
      const response = await generateWithFallback({
        model: "gemini-3.1-flash-lite",
        contents: `Analyze these productivity metrics: ${JSON.stringify(metrics ?? {})}. Provide a one-sentence peak performance advice.`,
      });
      const text = (response.text ?? "").trim() || buildContextualInsight(metrics);
      if (insightCache.size > 100) {
        const firstKey = insightCache.keys().next().value;
        if (firstKey) insightCache.delete(firstKey);
      }
      insightCache.set(cacheKey, { expiresAt: Date.now() + 15 * 60 * 1000, text });
      return res.json({ text });
    } catch (err: any) {
      const status = getErrorStatus(err);
      if (status === 429 || status === 503) {
        const fallbackText = buildContextualInsight(metrics);
        insightCache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, text: fallbackText });
        return res.json({ text: fallbackText, source: "fallback" });
      }
      return res
        .status(status)
        .json({ error: formatCleanGeminiError(err, status) });
    }
  });

  // 3. HealthHub Mood Journal analysis
  app.post("/api/health/mood", async (req, res) => {
    try {
      const { text } = req.body || {};
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Journal entry text is required." });
      }

      const response = await generateWithFallback({
        model: "gemini-3.1-flash-lite",
        contents: `Analyze this journal entry and determine the mood. Provide a short, supportive response (max 20 words) and a single emoji that represents the mood. If the mood is sad or down, use the "😕" emoji. Entry: ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emoji: { type: Type.STRING, description: "Representing emoji" },
              suggestion: {
                type: Type.STRING,
                description: "Supportive response",
              },
            },
            required: ["emoji", "suggestion"],
          },
        },
      });

      const result = JSON.parse((response.text ?? "{}").trim());
      return res.json({
        emoji: result.emoji || "😐",
        suggestion: result.suggestion || "I'm here to listen.",
      });
    } catch (err: any) {
      const status = getErrorStatus(err);
      return res
        .status(status)
        .json({ error: formatCleanGeminiError(err, status) });
    }
  });

  // 4. HealthHub Macros meal image / text analysis
  app.post("/api/health/macros", async (req, res) => {
    try {
      const { imageBase64, mimeType, foodText } = req.body || {};
      if (!imageBase64 && (!foodText || !String(foodText).trim())) {
        return res
          .status(400)
          .json({ error: "Either meal image or food description is required." });
      }

      const contents = imageBase64
        ? {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: imageBase64,
                },
              },
              {
                text: "Analyze this food image and estimate the macronutrients (protein, carbs, fats) in grams for the entire portion shown. Return only the numbers.",
              },
            ],
          }
        : `Analyze this food description and estimate the macronutrients (protein, carbs, fats) in grams for the entire portion described. Return only the numbers. Food: ${String(foodText).trim()}`;

      const response = await generateWithFallback({
        model: imageBase64 ? "gemini-3.8-flash" : "gemini-3.1-flash-lite",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foodName: {
                type: Type.STRING,
                description: "Name of the food identified",
              },
              protein: {
                type: Type.NUMBER,
                description: "Estimated protein in grams",
              },
              carbs: {
                type: Type.NUMBER,
                description: "Estimated carbohydrates in grams",
              },
              fats: {
                type: Type.NUMBER,
                description: "Estimated fats in grams",
              },
            },
            required: ["foodName", "protein", "carbs", "fats"],
          },
        },
      });

      const result = JSON.parse((response.text ?? "{}").trim());
      return res.json({
        foodName: result.foodName || (foodText ? String(foodText).trim() : "Unknown Food"),
        protein: Number(result.protein) || 0,
        carbs: Number(result.carbs) || 0,
        fats: Number(result.fats) || 0,
      });
    } catch (err: any) {
      const status = getErrorStatus(err);
      return res
        .status(status)
        .json({ error: formatCleanGeminiError(err, status) });
    }
  });

  // 5. Generic server-side generateContent endpoint
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { model, contents, config } = req.body || {};
      if (!contents) {
        return res.status(400).json({ error: "Missing 'contents' in request body." });
      }
      const response = await generateWithFallback({ model, contents, config });
      return res.json({ text: response.text ?? "" });
    } catch (err: any) {
      const status = getErrorStatus(err);
      return res
        .status(status)
        .json({ error: formatCleanGeminiError(err, status) });
    }
  });

  // 6. Server-Sent Events (SSE) streaming endpoint
  app.post("/api/gemini/stream", async (req, res) => {
    try {
      const { model, contents, config } = req.body || {};
      if (!contents) {
        return res.status(400).json({ error: "Missing 'contents' in request body." });
      }

      const ai = getGeminiClient();
      const keyFp = getKeyFingerprint();
      const primaryModel = normalizeModelName(model);
      const candidates = [
        primaryModel,
        ...FALLBACK_MODELS.filter((m) => m !== primaryModel),
      ].filter((m) => {
        const cd = modelCooldownUntil.get(`${keyFp}:${m}`);
        return !cd || cd.until <= Date.now();
      });

      if (candidates.length === 0) {
        return res.status(429).json({
          error:
            "Gemini API free-tier quota reached. Upgrade or select a billing-enabled API key in Settings > Secrets.",
        });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      let streamResponse: AsyncGenerator<GenerateContentResponse> | null = null;
      let lastStreamErr: any = null;

      for (const candidate of candidates) {
        try {
          streamResponse = await ai.models.generateContentStream({
            model: candidate,
            contents,
            ...(config ? { config } : {}),
          });
          break;
        } catch (streamInitErr: any) {
          lastStreamErr = streamInitErr;
          const st = getErrorStatus(streamInitErr);
          if (st === 429 || st === 503) {
            const cdMs = parseRetryDelayMs(streamInitErr, st);
            if (cdMs > 0) {
              modelCooldownUntil.set(`${keyFp}:${candidate}`, {
                until: Date.now() + cdMs,
                status: st,
                reason: formatCleanGeminiError(streamInitErr, st),
              });
            }
            continue;
          }
          throw streamInitErr;
        }
      }

      if (!streamResponse) {
        throw lastStreamErr || new Error("Gemini streaming unavailable");
      }

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          res.write(`data: ${JSON.stringify({ text: c.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      return res.end();
    } catch (err: any) {
      const status = getErrorStatus(err);
      const cleanMessage = formatCleanGeminiError(err, status);
      if (!res.headersSent) {
        return res.status(status).json({ error: cleanMessage });
      }
      res.write(`data: ${JSON.stringify({ error: cleanMessage })}\n\n`);
      return res.end();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          res.status(500).send("Application build artifacts loading error.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
