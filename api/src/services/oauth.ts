/**
 * OAuth service — Google + GitHub via Arctic.
 */
import { Google, GitHub, generateState } from "arctic";
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "../db/client";

export type OAuthProvider = "google" | "github";

interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

function frontendUrl(): string {
  return process.env.FRONTEND_URL || "http://localhost:3001";
}

export function getGoogleClient(): Google | null {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!id || !secret) return null;
  return new Google(id, secret, `${frontendUrl()}/api/auth/oauth/google/callback`);
}

export function getGitHubClient(): GitHub | null {
  const id = process.env.GITHUB_OAUTH_CLIENT_ID;
  const secret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!id || !secret) return null;
  return new GitHub(id, secret, `${frontendUrl()}/api/auth/oauth/github/callback`);
}

export async function getGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google profile");
  const data = (await res.json()) as { id: string; email: string; name: string; picture?: string };
  return { id: data.id, email: data.email, name: data.name, avatarUrl: data.picture };
}

export async function getGitHubProfile(accessToken: string): Promise<OAuthProfile> {
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "nurovia-api" },
  });
  if (!userRes.ok) throw new Error("Failed to fetch GitHub user");
  const user = (await userRes.json()) as { id: number; login: string; name: string | null; avatar_url: string };

  let email = "";
  const emailsRes = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "nurovia-api" },
  });
  if (emailsRes.ok) {
    const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
    const primary = emails.find((e) => e.primary && e.verified);
    if (primary) email = primary.email;
  }

  return {
    id: String(user.id),
    email,
    name: user.name || user.login,
    avatarUrl: user.avatar_url,
  };
}

export interface OAuthLinkResult {
  userId: string;
  isNewUser: boolean;
  email: string;
  name: string;
  plan: string;
  role: string;
}

export async function linkOrCreateOAuth(
  provider: OAuthProvider,
  profile: OAuthProfile
): Promise<OAuthLinkResult> {
  const db = getDb();

  const existingLink = await db
    .select({ userId: schema.oauthAccounts.userId })
    .from(schema.oauthAccounts)
    .where(
      and(eq(schema.oauthAccounts.provider, provider), eq(schema.oauthAccounts.providerUserId, profile.id))
    )
    .limit(1);

  if (existingLink[0]) {
    const user = await db.select().from(schema.users).where(eq(schema.users.id, existingLink[0].userId)).limit(1);
    if (user[0]) {
      return {
        userId: user[0].id,
        isNewUser: false,
        email: user[0].email,
        name: user[0].name,
        plan: user[0].plan,
        role: user[0].role,
      };
    }
  }

  if (profile.email) {
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, profile.email.toLowerCase()))
      .limit(1);
    const user = existingUser[0];
    if (user) {
      await db.insert(schema.oauthAccounts).values({
        id: `oa_${crypto.randomUUID()}`,
        userId: user.id,
        provider,
        providerUserId: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        lastUsedAt: new Date(),
      });
      if (!user.emailVerified) {
        await db
          .update(schema.users)
          .set({ emailVerified: true, emailVerifiedAt: new Date(), avatarUrl: profile.avatarUrl ?? user.avatarUrl })
          .where(eq(schema.users.id, user.id));
      }
      return {
        userId: user.id,
        isNewUser: false,
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
      };
    }
  }

  const userId = `user_${crypto.randomUUID()}`;
  const email = profile.email || `${provider}_${profile.id}@noemail.nurovia.ai`;
  await db.insert(schema.users).values({
    id: userId,
    email: email.toLowerCase(),
    name: profile.name,
    plan: "free",
    role: "user",
    emailVerified: !!profile.email,
    emailVerifiedAt: profile.email ? new Date() : null,
    avatarUrl: profile.avatarUrl,
  });
  await db.insert(schema.oauthAccounts).values({
    id: `oa_${crypto.randomUUID()}`,
    userId,
    provider,
    providerUserId: profile.id,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    lastUsedAt: new Date(),
  });

  return {
    userId,
    isNewUser: true,
    email: email.toLowerCase(),
    name: profile.name,
    plan: "free",
    role: "user",
  };
}

export { generateState };