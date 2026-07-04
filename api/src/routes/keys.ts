/**
 * API key vault routes.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { listKeys, saveKey, deleteKey } from "../services/vault";

const keys = new Hono<{ Variables: { user: { id: string; email: string; name: string; plan: string; role: string }; sessionId: string } }>();
keys.use("*", requireAuth);

keys.get("/", async (c) => {
  const userId = c.get("user").id;
  const rows = await listKeys(userId);
  return c.json({ keys: rows });
});

const saveKeySchema = z.object({
  provider: z.string().min(1).max(50),
  apiKey: z.string().min(1).max(500),
  label: z.string().max(80).optional(),
});

keys.post("/", zValidator("json", saveKeySchema), async (c) => {
  const userId = c.get("user").id;
  const { provider, apiKey, label } = c.req.valid("json");
  const summary = await saveKey(userId, provider, apiKey, label);
  return c.json({ key: summary }, 201);
});

keys.delete("/:id", async (c) => {
  const userId = c.get("user").id;
  const id = c.req.param("id");
  if (!/^ak_[a-z0-9-]+$/.test(id)) return c.json({ error: { code: "BAD_ID" } }, 400);
  await deleteKey(userId, id);
  return c.json({ ok: true });
});

export default keys;