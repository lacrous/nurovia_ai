/**
 * OAuth routes — Google + GitHub via Arctic.
 */
import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { OAuth2RequestError, generateState, generateCodeVerifier } from "arctic";
import {
  getGoogleClient,
  getGitHubClient,
  getGoogleProfile,
  getGitHubProfile,
  linkOrCreateOAuth,
} from "../services/oauth";
import { getLucia } from "../services/auth";
import { audit } from "../lib/audit";
import { clientIp } from "../lib/rate-limit";

const oauth = new Hono<{ Variables: { user: { id: string; email: string; name: string; plan: string; role: string }; sessionId: string } }>();

const STATE_COOKIE = "nurovia_oauth_state";
const VERIFIER_COOKIE = "nurovia_oauth_verifier";

function frontendUrl(): string {
  return process.env.FRONTEND_URL || "http://localhost:3001";
}

function setStateCookies(c: any, state: string, codeVerifier: string) {
  const opts = {
    path: "/",
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax" as const,
    maxAge: 60 * 10,
  };
  setCookie(c, STATE_COOKIE, state, opts);
  setCookie(c, VERIFIER_COOKIE, codeVerifier, opts);
}

function clearStateCookies(c: any) {
  deleteCookie(c, STATE_COOKIE, { path: "/" });
  deleteCookie(c, VERIFIER_COOKIE, { path: "/" });
}

function getMeta(req: Request) {
  return { ip: clientIp(req), userAgent: req.headers.get("user-agent") || "unknown" };
}

oauth.get("/google", async (c) => {
  const client = getGoogleClient();
  if (!client) return c.json({ error: { code: "OAUTH_NOT_CONFIGURED", message: "Google OAuth is not configured" } }, 503);
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = client.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);
  setStateCookies(c, state, codeVerifier);
  return c.redirect(url.toString());
});

oauth.get("/google/callback", async (c) => {
  const client = getGoogleClient();
  if (!client) return c.json({ error: { code: "OAUTH_NOT_CONFIGURED" } }, 503);

  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, STATE_COOKIE);
  const codeVerifier = getCookie(c, VERIFIER_COOKIE);
  clearStateCookies(c);

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return c.redirect(`${frontendUrl()}/signin?error=oauth_state_mismatch`);
  }

  try {
    const tokens = await client.validateAuthorizationCode(code, codeVerifier);
    const profile = await getGoogleProfile(tokens.accessToken());
    const result = await linkOrCreateOAuth("google", profile);

    const lucia = getLucia();
    const session = await lucia.createSession(result.userId, {});
    const cookie = lucia.createSessionCookie(session.id);
    c.header("Set-Cookie", cookie.serialize());

    const meta = getMeta(c.req.raw);
    await audit({ type: "oauth_signin", userId: result.userId, email: result.email, ip: meta.ip, userAgent: meta.userAgent, metadata: { provider: "google", isNewUser: result.isNewUser } });

    return c.redirect(`${frontendUrl()}/dashboard`);
  } catch (err) {
    if (err instanceof OAuth2RequestError) return c.redirect(`${frontendUrl()}/signin?error=oauth_denied`);
    console.error("google oauth error:", err);
    return c.redirect(`${frontendUrl()}/signin?error=oauth_failed`);
  }
});

oauth.get("/github", async (c) => {
  const client = getGitHubClient();
  if (!client) return c.json({ error: { code: "OAUTH_NOT_CONFIGURED", message: "GitHub OAuth is not configured" } }, 503);
  const state = generateState();
  const url = client.createAuthorizationURL(state, ["user:email"]);
  setStateCookies(c, state, "");
  return c.redirect(url.toString());
});

oauth.get("/github/callback", async (c) => {
  const client = getGitHubClient();
  if (!client) return c.json({ error: { code: "OAUTH_NOT_CONFIGURED" } }, 503);

  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, STATE_COOKIE);
  clearStateCookies(c);

  if (!code || !state || !storedState || state !== storedState) {
    return c.redirect(`${frontendUrl()}/signin?error=oauth_state_mismatch`);
  }

  try {
    const tokens = await client.validateAuthorizationCode(code);
    const profile = await getGitHubProfile(tokens.accessToken());
    if (!profile.email) return c.redirect(`${frontendUrl()}/signin?error=oauth_no_email`);
    const result = await linkOrCreateOAuth("github", profile);

    const lucia = getLucia();
    const session = await lucia.createSession(result.userId, {});
    const cookie = lucia.createSessionCookie(session.id);
    c.header("Set-Cookie", cookie.serialize());

    const meta = getMeta(c.req.raw);
    await audit({ type: "oauth_signin", userId: result.userId, email: result.email, ip: meta.ip, userAgent: meta.userAgent, metadata: { provider: "github", isNewUser: result.isNewUser } });

    return c.redirect(`${frontendUrl()}/dashboard`);
  } catch (err) {
    if (err instanceof OAuth2RequestError) return c.redirect(`${frontendUrl()}/signin?error=oauth_denied`);
    console.error("github oauth error:", err);
    return c.redirect(`${frontendUrl()}/signin?error=oauth_failed`);
  }
});

export default oauth;