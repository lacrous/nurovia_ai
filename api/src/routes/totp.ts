/**
 * TOTP routes — 2FA enrollment + verification.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { initTotpEnrollment, enableTotp, verifyTotpForUser, disableTotp } from "../services/totp";
import { audit } from "../lib/audit";
import { clientIp } from "../lib/rate-limit";
import { getDb, schema } from "../db/client";
import { ApiError } from "../services/auth";

const totp = new Hono<{ Variables: { user: { id: string; email: string; name: string; plan: string; role: string }; sessionId: string } }>();
totp.use("*", requireAuth);

const verifySchema = z.object({ code: z.string().min(6).max(20) });

function getMeta(req: Request) {
  return { ip: clientIp(req), userAgent: req.headers.get("user-agent") || "unknown" };
}

totp.get("/status", async (c) => {
  const userId = c.get("user").id;
  const db = getDb();
  const rows = await db
    .select({ enabled: schema.totpSecrets.enabled })
    .from(schema.totpSecrets)
    .where(eq(schema.totpSecrets.userId, userId))
    .limit(1);
  return c.json({ enabled: rows[0]?.enabled ?? false });
});

totp.post("/enroll", async (c) => {
  const userId = c.get("user").id;
  const result = await initTotpEnrollment(userId);
  return c.json({ secret: result.secret, otpauthUrl: result.otpauthUrl });
});

totp.post("/enable", zValidator("json", verifySchema), async (c) => {
  const userId = c.get("user").id;
  const meta = getMeta(c.req.raw);
  try {
    const { code } = c.req.valid("json");
    const backupCodes = await enableTotp(userId, code);
    await audit({ type: "2fa_enabled", userId, email: c.get("user").email, ip: meta.ip, userAgent: meta.userAgent });
    return c.json({ ok: true, backupCodes });
  } catch (err) {
    if (err instanceof ApiError) {
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 400);
    }
    return c.json({ error: { code: "INVALID_CODE", message: err instanceof Error ? err.message : "Failed" } }, 400);
  }
});

totp.post("/verify", zValidator("json", verifySchema), async (c) => {
  const userId = c.get("user").id;
  const meta = getMeta(c.req.raw);
  const { code } = c.req.valid("json");
  const valid = await verifyTotpForUser(userId, code);
  if (!valid) {
    await audit({ type: "2fa_failed", userId, email: c.get("user").email, ip: meta.ip, userAgent: meta.userAgent });
    return c.json({ error: { code: "INVALID_CODE", message: "Invalid code" } }, 400);
  }
  await audit({ type: "2fa_challenge", userId, email: c.get("user").email, ip: meta.ip, userAgent: meta.userAgent });
  return c.json({ ok: true });
});

totp.post("/disable", zValidator("json", verifySchema), async (c) => {
  const userId = c.get("user").id;
  const meta = getMeta(c.req.raw);
  const { code } = c.req.valid("json");
  const valid = await verifyTotpForUser(userId, code);
  if (!valid) return c.json({ error: { code: "INVALID_CODE" } }, 400);
  await disableTotp(userId);
  await audit({ type: "2fa_disabled", userId, email: c.get("user").email, ip: meta.ip, userAgent: meta.userAgent });
  return c.json({ ok: true });
});

export default totp;