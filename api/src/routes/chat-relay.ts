/**
 * Chat relay — POST /api/chat/relay (SSE).
 *
 * Server-side LLM streaming. API keys stay on the server.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { streamChat, eventToSse, type Provider, type ChatMessage } from "../services/llm";
import { decryptKey } from "../services/vault";
import { getDb, schema } from "../db/client";

const relay = new Hono<{ Variables: { user: { id: string; email: string; name: string; plan: string; role: string }; sessionId: string } }>();
relay.use("*", requireAuth);

const chatRequestSchema = z.object({
  provider: z.enum([
    "openai", "anthropic", "google", "deepseek", "openrouter",
    "qwen", "moonshot", "nvidia", "grok", "mistral", "custom",
  ]),
  model: z.string().min(1).max(200),
  baseUrl: z.string().url().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system", "tool"]),
      content: z.string().min(1).max(200_000),
      tool_call_id: z.string().optional(),
      name: z.string().optional(),
    })
  ).min(1).max(200),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(1).max(100_000).optional(),
  sessionId: z.string().optional(),
});

relay.post("/", zValidator("json", chatRequestSchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  const provider = body.provider as Provider;

  const apiKey = await decryptKey(user.id, provider);
  if (!apiKey) {
    return c.json(
      { error: { code: "NO_API_KEY", message: `No API key saved for ${provider}. Add one in Settings.` } },
      400
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(data));
      const usage = { promptTokens: 0, completionTokens: 0, costUsd: 0 };

      try {
        for await (const evt of streamChat({
          provider,
          model: body.model,
          apiKey,
          baseUrl: body.baseUrl,
          messages: body.messages as ChatMessage[],
          temperature: body.temperature,
          topP: body.topP,
          maxTokens: body.maxTokens,
        })) {
          if (evt.type === "usage") {
            usage.promptTokens += Number(evt.data.promptTokens ?? 0);
            usage.completionTokens += Number(evt.data.completionTokens ?? 0);
          }
          send(eventToSse(evt));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send(eventToSse({ type: "error", data: { code: "STREAM_FAILED", message } }));
      } finally {
        if (body.sessionId) {
          try {
            const db = getDb();
            await db.insert(schema.usageEvents).values({
              id: `ue_${crypto.randomUUID()}`,
              userId: user.id,
              eventType: "chat",
              provider,
              model: body.model,
              promptTokens: usage.promptTokens,
              completionTokens: usage.completionTokens,
              costMicros: usage.costUsd,
            });
          } catch (err) {
            console.warn("Failed to record usage:", err);
          }
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});

export default relay;