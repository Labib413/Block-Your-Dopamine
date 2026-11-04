import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

function normalizeModelName(requested?: string): string {
  if (!requested) return "gemini-3.8-flash";
  if (requested === "gemini-3.1-flash-lite-preview") return "gemini-3.1-flash-lite";
  if (requested === "gemini-3.1-pro-preview") return "gemini-3.8-flash";
  return requested;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err: any = new Error("GEMINI_API_KEY is not configured on the server.");
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
  if (msg.includes("404") || msg.includes("not_found")) return 404;
  if (msg.includes("503") || msg.includes("unavailable")) return 503;
  return 500;
}

async function generateWithFallback(params: {
  model?: string;
  contents: any;
  config?: any;
}): Promise<GenerateContentResponse> {
  const ai = getGeminiClient();
  const primaryModel = normalizeModelName(params.model);
  const candidateModels = [
    primaryModel,
    ...FALLBACK_MODELS.filter((m) => m !== primaryModel),
  ];

  let lastError: any = null;
  for (const model of candidateModels) {
    try {
      return await ai.models.generateContent({
        model,
        contents: params.contents,
        ...(params.config ? { config: params.config } : {}),
      });
    } catch (error: any) {
      lastError = error;
      const errorMsg = (
        error?.message || JSON.stringify(error)
      ).toLowerCase();
      const isTransientOrUnavailable =
        errorMsg.includes("503") ||
        errorMsg.includes("unavailable") ||
        errorMsg.includes("high demand") ||
        errorMsg.includes("overloaded") ||
        errorMsg.includes("spike") ||
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("not found");

      if (!isTransientOrUnavailable) {
        throw error;
      }
      console.warn(
        `[Gemini Server] Model ${model} unavailable (${errorMsg.slice(0, 80)}...). Trying fallback model...`
      );
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

  // 1. Daily stoic productivity quote
  app.get("/api/quote", async (_req, res) => {
    try {
      const response = await generateWithFallback({
        model: "gemini-3.8-flash",
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
      const data = JSON.parse((response.text ?? "{}").trim());
      return res.json(data);
    } catch (err: any) {
      const status = getErrorStatus(err);
      console.error("Error generating quote:", err?.message || err);
      return res
        .status(status)
        .json({ error: err?.message || "Failed to generate quote" });
    }
  });

  // 2. Dashboard AI Advisor insight
  app.post("/api/insight", async (req, res) => {
    try {
      const { metrics } = req.body || {};
      const response = await generateWithFallback({
        model: "gemini-3.8-flash",
        contents: `Analyze these productivity metrics: ${JSON.stringify(metrics ?? {})}. Provide a one-sentence peak performance advice.`,
      });
      return res.json({ text: response.text ?? "" });
    } catch (err: any) {
      const status = getErrorStatus(err);
      console.error("Error generating insight:", err?.message || err);
      return res
        .status(status)
        .json({ error: err?.message || "Failed to generate insight" });
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
      console.error("Error analyzing mood:", err?.message || err);
      return res
        .status(status)
        .json({ error: err?.message || "Failed to analyze mood" });
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
        model: "gemini-3.8-flash",
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
      console.error("Error analyzing macros:", err?.message || err);
      return res
        .status(status)
        .json({ error: err?.message || "Failed to analyze meal macros" });
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
      console.error("Error in /api/gemini/generate:", err?.message || err);
      return res
        .status(status)
        .json({ error: err?.message || "Gemini API generation failed" });
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
      const resolvedModel = normalizeModelName(model);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const streamResponse = await ai.models.generateContentStream({
        model: resolvedModel,
        contents,
        ...(config ? { config } : {}),
      });

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          res.write(`data: ${JSON.stringify({ text: c.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      return res.end();
    } catch (err: any) {
      console.error("Error in /api/gemini/stream:", err?.message || err);
      if (!res.headersSent) {
        const status = getErrorStatus(err);
        return res
          .status(status)
          .json({ error: err?.message || "Gemini streaming request failed" });
      }
      res.write(
        `data: ${JSON.stringify({ error: err?.message || "Gemini streaming request failed" })}\n\n`
      );
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
