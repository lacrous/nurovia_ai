/**
 * Auth middleware — reads session cookie via Lucia.
 */
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getLucia } from "../services/auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  role: string;
}

export const requireAuth = createMiddleware<{
  Variables: { user: AuthUser; sessionId: string };
}>(async (c, next) => {
  const sessionId = getCookie(c, "nurovia_session");
  if (!sessionId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, 401);
  }
  const lucia = getLucia();
  const { session, user } = await lucia.validateSession(sessionId);
  if (!session) {
    return c.json({ error: { code: "SESSION_EXPIRED", message: "Session expired" } }, 401);
  }
  if (session.fresh) {
    const cookie = lucia.createSessionCookie(session.id);
    c.header("Set-Cookie", cookie.serialize(), { append: true });
  }
  c.set("user", {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    role: user.role,
  } as AuthUser);
  c.set("sessionId", session.id);
  await next();
});

export const requireAdmin = createMiddleware<{
  Variables: { user: AuthUser; sessionId: string };
}>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { code: "UNAUTHORIZED" } }, 401);
  }
  if (user.role !== "admin") {
    return c.json({ error: { code: "FORBIDDEN", message: "Admin only" } }, 403);
  }
  await next();
});