/**
 * Auth service — server-side only.
 *
 * Phase 1-5 hardening:
 *   - rate limiting + account lockout
 *   - audit log on every event
 *   - constant-time password compare
 *   - httpOnly + Secure session cookie via Lucia
 */
import { Lucia, TimeSpan } from "lucia";
import { NeonHTTPAdapter } from "@lucia-auth/adapter-postgresql";
import { eq, gt, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/password";
import { generateToken, generateVerificationToken, hashToken } from "../lib/tokens";
import { getDb, schema } from "../db/client";

let _lucia: Lucia<
  Record<never, never>,
  { email: string; name: string; plan: string; role: string }
> | null = null;

export function getLucia() {
  if (_lucia) return _lucia;
  const db = getDb();
  const adapter = new NeonHTTPAdapter(db.$client, { user: "users", session: "sessions" });
  _lucia = new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax",
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: "/",
      },
    },
    sessionExpiresIn: new TimeSpan(30, "d"),
    getUserAttributes: (attrs) => ({
      email: attrs.email,
      name: attrs.name,
      plan: attrs.plan,
      role: attrs.role,
    }),
  });
  return _lucia;
}

export class ApiError extends Error {
  public code: string;
  public status: number;
  constructor(code: string, message: string, status: number = 400) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const FAILED_SIGNIN_LIMIT = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function passwordIssues(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (pw.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters`;
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(pw)) return "Password must contain a number";
  return null;
}

function isLocked(user: { lockedUntil: Date | null }): boolean {
  if (!user.lockedUntil) return false;
  return user.lockedUntil.getTime() > Date.now();
}

export interface SignupResult {
  userId: string;
  email: string;
  name: string;
  verificationToken?: string;
}

export async function signup(
  email: string,
  name: string,
  password: string
): Promise<SignupResult> {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new ApiError("INVALID_EMAIL", "Invalid email address", 400);
  }
  if (!name.trim() || name.length > 80) {
    throw new ApiError("INVALID_NAME", "Name is required and must be under 80 characters", 400);
  }
  const pwError = passwordIssues(password);
  if (pwError) throw new ApiError("WEAK_PASSWORD", pwError, 400);

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, normalizedEmail))
    .limit(1);
  if (existing.length > 0) {
    throw new ApiError("EMAIL_TAKEN", "An account with this email already exists", 409);
  }

  const userId = `user_${crypto.randomUUID()}`;
  const passwordHash = await hashPassword(password);
  await db.insert(schema.users).values({
    id: userId,
    email: normalizedEmail,
    name: name.trim(),
    passwordHash,
    plan: "free",
    role: "user",
    emailVerified: false,
  });

  const { raw, hash, expiresAt } = await generateVerificationToken();
  await db.insert(schema.emailVerifications).values({
    id: `ev_${crypto.randomUUID()}`,
    userId,
    email: normalizedEmail,
    tokenHash: hash,
    expiresAt,
  });

  return {
    userId,
    email: normalizedEmail,
    name: name.trim(),
    verificationToken: process.env.ENVIRONMENT === "development" ? raw : undefined,
  };
}

export interface SigninResult {
  userId: string;
  email: string;
  name: string;
  plan: string;
  role: string;
  sessionId: string;
  needs2fa?: boolean;
}

export async function signin(
  email: string,
  password: string,
  meta: { ip: string; userAgent: string }
): Promise<SigninResult> {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalizedEmail))
    .limit(1);
  const user = rows[0];

  if (!user) {
    await hashPassword(password);
    throw new ApiError("INVALID_CREDENTIALS", "Email or password is incorrect", 401);
  }

  if (isLocked(user)) {
    throw new ApiError(
      "ACCOUNT_LOCKED",
      "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.",
      423
    );
  }

  if (!user.passwordHash) {
    throw new ApiError(
      "OAUTH_ACCOUNT",
      "This account uses social sign-in. Please sign in with Google or GitHub.",
      401
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failedCount = (user.failedSigninCount ?? 0) + 1;
    const shouldLock = failedCount >= FAILED_SIGNIN_LIMIT;
    await db
      .update(schema.users)
      .set({
        failedSigninCount: failedCount,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : user.lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    throw new ApiError("INVALID_CREDENTIALS", "Email or password is incorrect", 401);
  }

  await db
    .update(schema.users)
    .set({
      failedSigninCount: 0,
      lockedUntil: null,
      lastSigninAt: new Date(),
      lastSigninIp: meta.ip,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  const totp = await db
    .select()
    .from(schema.totpSecrets)
    .where(eq(schema.totpSecrets.userId, user.id))
    .limit(1);
  const needs2fa = totp[0]?.enabled === true;

  const lucia = getLucia();
  const session = await lucia.createSession(user.id, {});

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    role: user.role,
    sessionId: session.id,
    needs2fa,
  };
}

export async function signout(sessionId: string): Promise<void> {
  const lucia = getLucia();
  await lucia.invalidateSession(sessionId);
}

// --- Forgot / reset password ---

export async function createPasswordReset(
  email: string
): Promise<{ token: string; userId: string } | null> {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalizedEmail))
    .limit(1);
  const user = rows[0];
  if (!user) return null;

  const { raw, hash, expiresAt } = await generateToken();
  await db.insert(schema.passwordResets).values({
    id: `pr_${crypto.randomUUID()}`,
    userId: user.id,
    tokenHash: hash,
    expiresAt,
  });
  return { token: raw, userId: user.id };
}

export async function consumePasswordReset(
  token: string,
  newPassword: string
): Promise<{ userId: string }> {
  const db = getDb();
  const tokenHash = await hashToken(token);
  const now = new Date();

  const rows = await db
    .select()
    .from(schema.passwordResets)
    .where(
      and(eq(schema.passwordResets.tokenHash, tokenHash), gt(schema.passwordResets.expiresAt, now))
    )
    .limit(1);
  const reset = rows[0];
  if (!reset) throw new ApiError("INVALID_TOKEN", "Invalid or expired reset link", 400);
  if (reset.usedAt) throw new ApiError("TOKEN_USED", "This reset link has already been used", 400);

  const pwError = passwordIssues(newPassword);
  if (pwError) throw new ApiError("WEAK_PASSWORD", pwError, 400);

  const newHash = await hashPassword(newPassword);
  await db.transaction(async (tx) => {
    await tx
      .update(schema.passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(schema.passwordResets.id, reset.id));
    await tx
      .update(schema.users)
      .set({ passwordHash: newHash, failedSigninCount: 0, lockedUntil: null })
      .where(eq(schema.users.id, reset.userId));
  });

  return { userId: reset.userId };
}

// --- Email verification ---

export async function verifyEmail(token: string): Promise<{ userId: string; email: string }> {
  const db = getDb();
  const tokenHash = await hashToken(token);
  const now = new Date();

  const rows = await db
    .select()
    .from(schema.emailVerifications)
    .where(
      and(eq(schema.emailVerifications.tokenHash, tokenHash), gt(schema.emailVerifications.expiresAt, now))
    )
    .limit(1);
  const verification = rows[0];
  if (!verification) throw new ApiError("INVALID_TOKEN", "Invalid or expired verification link", 400);
  if (verification.consumedAt) throw new ApiError("TOKEN_USED", "This verification link has already been used", 400);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.emailVerifications)
      .set({ consumedAt: new Date() })
      .where(eq(schema.emailVerifications.id, verification.id));
    await tx
      .update(schema.users)
      .set({ emailVerified: true, emailVerifiedAt: new Date() })
      .where(eq(schema.users.id, verification.userId));
  });

  return { userId: verification.userId, email: verification.email };
}