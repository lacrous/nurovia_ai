/**
 * Auth routes — signup, signin, signout, me, forgot, reset, verify.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  signup,
  signin,
  signout,
  verifyEmail,
  createPasswordReset,
  consumePasswordReset,
  ApiError,
} from "../services/auth";
import { requireAuth } from "../middleware/auth";
import { getLucia } from "../services/auth";
import { rateLimit, clientIp } from "../lib/rate-limit";
import { audit } from "../lib/audit";
import { sendEmail, passwordResetEmail, verificationEmail } from "../services/email";

const auth = new Hono<{ Variables: { user: { id: string; email: string; name: string; plan: string; role: string }; sessionId: string } }>();

const signupSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(128),
});

const signinSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

const forgotSchema = z.object({
  email: z.string().email().max(254),
});

const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(128),
});

const verifySchema = z.object({
  token: z.string().min(10).max(200),
});

function getMeta(req: Request) {
  return {
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") || "unknown",
  };
}

function frontendUrl(): string {
  return process.env.FRONTEND_URL || "http://localhost:3001";
}

// --- Signup ---

auth.post("/signup", zValidator("json", signupSchema), async (c) => {
  const req = c.req.raw;
  const meta = getMeta(req);

  const rl = await rateLimit(`signup:${meta.ip}`, 3, 60 * 60);
  if (!rl.allowed) {
    c.header("Retry-After", String(rl.resetAt - Math.floor(Date.now() / 1000)));
    return c.json({ error: { code: "RATE_LIMITED", message: "Too many signup attempts." } }, 429);
  }

  try {
    const { email, name, password } = c.req.valid("json");
    const result = await signup(email, name, password);

    if (result.verificationToken) {
      const link = `${frontendUrl()}/verify?token=${result.verificationToken}`;
      const tmpl = verificationEmail(link);
      await sendEmail({ to: result.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text });
    }

    await audit({ type: "signup", userId: result.userId, email: result.email, ip: meta.ip, userAgent: meta.userAgent });

    return c.json(
      {
        user: { id: result.userId, email: result.email, name: result.name },
        ...(process.env.ENVIRONMENT === "development" && result.verificationToken
          ? { devToken: result.verificationToken }
          : {}),
      },
      201
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 400);
    }
    console.error("signup error:", err);
    return c.json({ error: { code: "INTERNAL", message: "Signup failed" } }, 500);
  }
});

// --- Signin ---

auth.post("/signin", zValidator("json", signinSchema), async (c) => {
  const req = c.req.raw;
  const meta = getMeta(req);

  const rl = await rateLimit(`signin:${meta.ip}`, 5, 15 * 60);
  if (!rl.allowed) {
    await audit({ type: "signin_failed", ip: meta.ip, userAgent: meta.userAgent, metadata: { reason: "rate_limited" } });
    return c.json({ error: { code: "RATE_LIMITED", message: "Too many signin attempts. Try again in 15 minutes." } }, 429);
  }

  try {
    const { email, password } = c.req.valid("json");
    const result = await signin(email, password, meta);

    const lucia = getLucia();
    const cookie = lucia.createSessionCookie(result.sessionId);
    c.header("Set-Cookie", cookie.serialize());

    await audit({ type: "signin_success", userId: result.userId, email: result.email, ip: meta.ip, userAgent: meta.userAgent });

    return c.json({
      user: {
        id: result.userId,
        email: result.email,
        name: result.name,
        plan: result.plan,
        role: result.role,
      },
      needs2fa: result.needs2fa ?? false,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      await audit({
        type: "signin_failed",
        email: c.req.valid("json").email,
        ip: meta.ip,
        userAgent: meta.userAgent,
        metadata: { reason: err.code },
      });
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 400);
    }
    console.error("signin error:", err);
    return c.json({ error: { code: "INTERNAL", message: "Sign-in failed" } }, 500);
  }
});

auth.post("/signout", requireAuth, async (c) => {
  const sessionId = c.get("sessionId");
  const user = c.get("user");
  await signout(sessionId);
  const lucia = getLucia();
  const cookie = lucia.createBlankSessionCookie();
  c.header("Set-Cookie", cookie.serialize());
  await audit({
    type: "signout",
    userId: user.id,
    email: user.email,
    ip: clientIp(c.req.raw),
    userAgent: c.req.raw.headers.get("user-agent") || "unknown",
  });
  return c.json({ ok: true });
});

auth.get("/me", requireAuth, async (c) => {
  return c.json({ user: c.get("user") });
});

auth.post("/forgot", zValidator("json", forgotSchema), async (c) => {
  const meta = getMeta(c.req.raw);
  const rl = await rateLimit(`forgot:${meta.ip}`, 3, 60 * 60);
  if (!rl.allowed) return c.json({ error: { code: "RATE_LIMITED" } }, 429);

  const { email } = c.req.valid("json");
  const reset = await createPasswordReset(email);

  if (reset) {
    const link = `${frontendUrl()}/reset?token=${reset.token}`;
    const tmpl = passwordResetEmail(link);
    await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text });
    await audit({
      type: "password_reset_requested",
      userId: reset.userId,
      email,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  return c.json(
    {
      ok: true,
      ...(process.env.ENVIRONMENT === "development" && reset ? { devToken: reset.token } : {}),
    },
    200
  );
});

auth.post("/reset", zValidator("json", resetSchema), async (c) => {
  const meta = getMeta(c.req.raw);
  try {
    const { token, password } = c.req.valid("json");
    const { userId } = await consumePasswordReset(token, password);

    const lucia = getLucia();
    await lucia.invalidateUserSessions(userId);

    await audit({ type: "password_reset_completed", userId, ip: meta.ip, userAgent: meta.userAgent });
    return c.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiError) {
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 400);
    }
    console.error("reset error:", err);
    return c.json({ error: { code: "INTERNAL" } }, 500);
  }
});

auth.get("/verify", zValidator("query", verifySchema), async (c) => {
  const meta = getMeta(c.req.raw);
  try {
    const { token } = c.req.valid("query");
    const { userId, email } = await verifyEmail(token);
    await audit({ type: "email_verified", userId, email, ip: meta.ip, userAgent: meta.userAgent });
    return c.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiError) {
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 400);
    }
    return c.json({ error: { code: "INTERNAL" } }, 500);
  }
});

export default auth;