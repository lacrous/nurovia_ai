/**
 * Secure token generation — for password reset, email verification, etc.
 *
 * Stores SHA-256 hash of token in DB. Raw token only sent via email.
 */
const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = {
  passwordReset: 15 * 60 * 1000,
  emailVerify: 24 * 60 * 60 * 1000,
};

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export interface GeneratedToken {
  raw: string;
  hash: string;
  expiresAt: Date;
}

export async function generateToken(): Promise<GeneratedToken> {
  const raw = toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
  const hash = await sha256Hex(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS.passwordReset);
  return { raw, hash, expiresAt };
}

export async function generateVerificationToken(): Promise<GeneratedToken> {
  const raw = toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
  const hash = await sha256Hex(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS.emailVerify);
  return { raw, hash, expiresAt };
}

export async function hashToken(token: string): Promise<string> {
  return sha256Hex(token);
}

export async function verifyToken(token: string, expectedHash: string): Promise<boolean> {
  const actual = await sha256Hex(token);
  return timingSafeEqual(actual, expectedHash);
}

async function sha256Hex(s: string): Promise<string> {
  const bytes = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Buffer.from(hash).toString("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}