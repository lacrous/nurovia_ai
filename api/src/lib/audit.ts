/**
 * Audit log — record every auth event for security review.
 */
import { getDb, schema } from "../db/client";

export type AuthEventType =
  | "signup"
  | "signin_success"
  | "signin_failed"
  | "signout"
  | "password_reset_requested"
  | "password_reset_completed"
  | "email_verification_sent"
  | "email_verified"
  | "account_locked"
  | "oauth_signin"
  | "oauth_link"
  | "2fa_enabled"
  | "2fa_disabled"
  | "2fa_challenge"
  | "2fa_failed";

export interface AuthEvent {
  userId?: string;
  email?: string;
  type: AuthEventType;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}

export async function audit(evt: AuthEvent): Promise<void> {
  try {
    const db = getDb();
    await db.insert(schema.authEvents).values({
      id: `ae_${crypto.randomUUID()}`,
      userId: evt.userId,
      email: evt.email,
      type: evt.type,
      ip: evt.ip,
      userAgent: evt.userAgent,
      metadata: evt.metadata,
    });
  } catch (err) {
    console.warn("audit() failed:", err);
  }
}