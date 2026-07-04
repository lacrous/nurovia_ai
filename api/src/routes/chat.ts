/**
 * Chat session routes — replaces frontend localStorage.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { getDb, schema } from "../db/client";
import { ApiError } from "../services/auth";

const chat = new Hono<{ Variables: { user: { id: string; email: string; name: string; plan: string; role: string }; sessionId: string } }>();
chat.use("*", requireAuth);

const newSessionSchema = z.object({
  title: z.string().min(1).max(200).default("New debug session"),
  workspaceId: z.string().optional(),
});

const updateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  starred: z.boolean().optional(),
  archived: z.boolean().optional(),
});

const newMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string().min(1).max(200_000),
  model: z.string().optional(),
  provider: z.string().optional(),
  reaction: z.string().nullable().optional(),
  parentId: z.string().optional(),
  usage: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateMessageSchema = z.object({
  reaction: z.string().nullable().optional(),
  content: z.string().min(1).max(200_000).optional(),
});

const messageIdRe = /^msg_[a-z0-9-]+$/;
const sessionIdRe = /^cs_[a-z0-9-]+$/;

function ensureOwned<T extends { userId: string }>(rows: T[], userId: string, entity: string): T {
  const row: T | undefined = rows[0];
  if (!row) throw new ApiError("NOT_FOUND", `${entity} not found`, 404);
  if (row.userId !== userId) throw new ApiError("FORBIDDEN", `Not your ${entity}`, 403);
  return row;
}

chat.get("/sessions", async (c) => {
  const userId = c.get("user").id;
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.chatSessions)
    .where(and(eq(schema.chatSessions.userId, userId), eq(schema.chatSessions.archived, false)))
    .orderBy(desc(schema.chatSessions.updatedAt))
    .limit(500);
  return c.json({ sessions: rows });
});

chat.post("/sessions", zValidator("json", newSessionSchema), async (c) => {
  const userId = c.get("user").id;
  const { title, workspaceId } = c.req.valid("json");
  const db = getDb();
  const id = `cs_${crypto.randomUUID()}`;
  await db.insert(schema.chatSessions).values({ id, userId, title, workspaceId });
  return c.json({ session: { id, userId, title, starred: false, archived: false, createdAt: new Date(), updatedAt: new Date() } }, 201);
});

chat.patch("/sessions/:id", zValidator("json", updateSessionSchema), async (c) => {
  const userId = c.get("user").id;
  const id = c.req.param("id");
  if (!sessionIdRe.test(id)) return c.json({ error: { code: "BAD_ID" } }, 400);
  const db = getDb();
  const existing = ensureOwned(
    await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.id, id)).limit(1),
    userId,
    "session"
  );
  const updates = c.req.valid("json");
  await db.update(schema.chatSessions).set({ ...updates, updatedAt: new Date() }).where(eq(schema.chatSessions.id, id));
  return c.json({ session: { ...existing, ...updates, updatedAt: new Date() } });
});

chat.delete("/sessions/:id", async (c) => {
  const userId = c.get("user").id;
  const id = c.req.param("id");
  if (!sessionIdRe.test(id)) return c.json({ error: { code: "BAD_ID" } }, 400);
  const db = getDb();
  ensureOwned(
    await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.id, id)).limit(1),
    userId,
    "session"
  );
  await db.delete(schema.chatSessions).where(eq(schema.chatSessions.id, id));
  return c.json({ ok: true });
});

chat.post("/sessions/clear", async (c) => {
  const userId = c.get("user").id;
  const db = getDb();
  await db.update(schema.chatSessions).set({ archived: true }).where(eq(schema.chatSessions.userId, userId));
  return c.json({ ok: true });
});

chat.get("/sessions/:id/messages", async (c) => {
  const userId = c.get("user").id;
  const sessionId = c.req.param("id");
  if (!sessionIdRe.test(sessionId)) return c.json({ error: { code: "BAD_ID" } }, 400);
  const db = getDb();
  ensureOwned(
    await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.id, sessionId)).limit(1),
    userId,
    "session"
  );
  const rows = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.sessionId, sessionId))
    .orderBy(schema.messages.createdAt);
  return c.json({ messages: rows });
});

chat.post("/sessions/:id/messages", zValidator("json", newMessageSchema), async (c) => {
  const userId = c.get("user").id;
  const sessionId = c.req.param("id");
  if (!sessionIdRe.test(sessionId)) return c.json({ error: { code: "BAD_ID" } }, 400);
  const db = getDb();
  ensureOwned(
    await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.id, sessionId)).limit(1),
    userId,
    "session"
  );
  const data = c.req.valid("json");
  const id = `msg_${crypto.randomUUID()}`;
  await db.insert(schema.messages).values({
    id,
    sessionId,
    role: data.role,
    content: data.content,
    model: data.model,
    provider: data.provider,
    reaction: data.reaction ?? null,
    parentId: data.parentId,
    usage: data.usage,
    metadata: data.metadata,
  });
  await db.update(schema.chatSessions).set({ updatedAt: new Date() }).where(eq(schema.chatSessions.id, sessionId));
  return c.json({ id }, 201);
});

chat.patch("/messages/:id", zValidator("json", updateMessageSchema), async (c) => {
  const userId = c.get("user").id;
  const id = c.req.param("id");
  if (!messageIdRe.test(id)) return c.json({ error: { code: "BAD_ID" } }, 400);
  const db = getDb();
  const rows = await db
    .select({ msg: schema.messages, session: schema.chatSessions })
    .from(schema.messages)
    .innerJoin(schema.chatSessions, eq(schema.messages.sessionId, schema.chatSessions.id))
    .where(eq(schema.messages.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: { code: "NOT_FOUND" } }, 404);
  if (row.session.userId !== userId) return c.json({ error: { code: "FORBIDDEN" } }, 403);
  const updates = c.req.valid("json");
  const patch: Record<string, unknown> = {};
  if (updates.reaction !== undefined) patch.reaction = updates.reaction;
  if (updates.content !== undefined) patch.content = updates.content;
  await db.update(schema.messages).set(patch).where(eq(schema.messages.id, id));
  return c.json({ ok: true });
});

chat.delete("/messages/:id", async (c) => {
  const userId = c.get("user").id;
  const id = c.req.param("id");
  if (!messageIdRe.test(id)) return c.json({ error: { code: "BAD_ID" } }, 400);
  const db = getDb();
  const rows = await db
    .select({ session: schema.chatSessions })
    .from(schema.messages)
    .innerJoin(schema.chatSessions, eq(schema.messages.sessionId, schema.chatSessions.id))
    .where(eq(schema.messages.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: { code: "NOT_FOUND" } }, 404);
  if (row.session.userId !== userId) return c.json({ error: { code: "FORBIDDEN" } }, 403);
  await db.delete(schema.messages).where(eq(schema.messages.id, id));
  return c.json({ ok: true });
});

export default chat;