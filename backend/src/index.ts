import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import OpenAI from "openai";
import type { ChatMessage, ChatRequestBody, ChatResult } from "./type.ts";

const app = express();
const port = Number(process.env.PORT || 5050);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:4200";
const defaultModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

// Basic rate limit to avoid accidental key burn
app.use(
  "/api/",
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const ChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1)
      })
    )
    .min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().optional()
});

// Non-streaming chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const parsed = ChatSchema.parse(req.body as ChatRequestBody);
    const { messages, model, temperature } = parsed;

    const completion = await client.chat.completions.create({
      model: model || defaultModel,
      messages,
      temperature: temperature ?? 0.4
    });

    const choice = completion.choices[0];
    const content = choice?.message?.content ?? "";

    const payload: ChatResult = {
      id: completion.id,
      created: completion.created,
      model: completion.model,
      content,
      usage: completion.usage
        ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens
          }
        : undefined
    };

    res.status(200).json(payload);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({
      error: { message: err?.message || "Request failed" }
    });
  }
});

// Streaming chat endpoint (SSE)
app.post("/api/chat/stream", async (req, res) => {
  try {
    const parsed = ChatSchema.parse(req.body as ChatRequestBody);
    const { messages, model, temperature } = parsed;

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const stream = await client.chat.completions.create({
      model: model || defaultModel,
      messages,
      temperature: temperature ?? 0.4,
      stream: true
    });

    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error(err);
    // In SSE, send error as an event if possible
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err?.message || "Stream failed" })}\n\n`);
    } catch {}
    res.end();
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});