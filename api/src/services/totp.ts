/**
 * TOTP — RFC 6238 (HMAC-SHA1, 6 digits, 30s period).
 */
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db/client";

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const BACKUP_CODE_COUNT = 10;

function base32Encode(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | (bytes[i] ?? 0);
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 0x1f];
  return output;
}

function base32Decode(s: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  s = s.toUpperCase().replace(/=+$/, "");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of s) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function hotp(secret: Uint8Array, counter: number): Promise<string> {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter & 0xffffffff);
  const key = await crypto.subtle.importKey("raw", secret as BufferSource, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const offset = sig[sig.length - 1]! & 0x0f;
  const code =
    ((sig[offset]! & 0x7f) << 24) |
    ((sig[offset + 1]! & 0xff) << 16) |
    ((sig[offset + 2]! & 0xff) << 8) |
    (sig[offset + 3]! & 0xff);
  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

export async function generateSecret(): Promise<string> {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20)));
}

export function buildOtpauthUrl(secret: string, email: string): string {
  const issuer = "Nurovia AI";
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

export async function verifyTotp(secret: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const secretBytes = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000);
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const counter = Math.floor(now / TOTP_PERIOD) + i;
    const expected = await hotp(secretBytes, counter);
    if (timingSafeEqual(expected, code)) return true;
  }
  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function generateBackupCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .replace(/(.{4})/g, "$1-")
    .replace(/-$/, "");
}

export async function initTotpEnrollment(
  userId: string
): Promise<{ secret: string; otpauthUrl: string; email: string }> {
  const db = getDb();
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user[0]) throw new Error("User not found");
  const secret = await generateSecret();
  const otpauthUrl = buildOtpauthUrl(secret, user[0].email);

  await db
    .insert(schema.totpSecrets)
    .values({ userId, secret, enabled: false, enabledAt: null })
    .onConflictDoUpdate({
      target: schema.totpSecrets.userId,
      set: { secret, enabled: false, enabledAt: null, backupCodes: null },
    });

  return { secret, otpauthUrl, email: user[0].email };
}

export async function enableTotp(userId: string, code: string): Promise<string[]> {
  const db = getDb();
  const rows = await db.select().from(schema.totpSecrets).where(eq(schema.totpSecrets.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) throw new Error("No TOTP enrollment in progress");
  if (row.enabled) throw new Error("TOTP is already enabled");

  const valid = await verifyTotp(row.secret, code);
  if (!valid) throw new Error("Invalid code");

  const backupCodes = Array.from({ length: BACKUP_CODE_COUNT }, () => generateBackupCode());
  await db
    .update(schema.totpSecrets)
    .set({ enabled: true, enabledAt: new Date(), backupCodes })
    .where(eq(schema.totpSecrets.userId, userId));

  return backupCodes;
}

export async function verifyTotpForUser(userId: string, code: string): Promise<boolean> {
  const db = getDb();
  const rows = await db.select().from(schema.totpSecrets).where(eq(schema.totpSecrets.userId, userId)).limit(1);
  const row = rows[0];
  if (!row || !row.enabled) return false;

  if (/^\d{6}$/.test(code)) {
    return verifyTotp(row.secret, code);
  }

  if (row.backupCodes && Array.isArray(row.backupCodes)) {
    const idx = row.backupCodes.indexOf(code);
    if (idx >= 0) {
      const remaining = row.backupCodes.filter((_, i) => i !== idx);
      await db
        .update(schema.totpSecrets)
        .set({ backupCodes: remaining })
        .where(eq(schema.totpSecrets.userId, userId));
      return true;
    }
  }
  return false;
}

export async function disableTotp(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(schema.totpSecrets).where(eq(schema.totpSecrets.userId, userId));
}