import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check endpoint for Cloud Run and uptime checks
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Server-side Gemini proxy routes
  app.get("/api/quote", async (_req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "GEMINI_API_KEY not configured on server" });
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
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
      });
      const data = JSON.parse(response.text || "{}");
      return res.json(data);
    } catch (err: any) {
      console.error("Error generating quote:", err?.message || err);
      return res.status(500).json({ error: "Failed to generate quote" });
    }
  });

  app.post("/api/insight", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "GEMINI_API_KEY not configured on server" });
      }
      const { metrics } = req.body;
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Analyze these productivity metrics: ${JSON.stringify(metrics)}. Provide a one-sentence peak performance advice.`,
      });
      return res.json({ text: response.text });
    } catch (err: any) {
      console.error("Error generating insight:", err?.message || err);
      return res.status(500).json({ error: "Failed to generate insight" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
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
