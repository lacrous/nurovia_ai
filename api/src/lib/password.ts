/**
 * Password hashing — PBKDF2-SHA-256, 100,000 iterations, 16-byte salt.
 * Compatible with the frontend's Web Crypto implementation.
 *
 * Stored format: `pbkdf2$100000$<salt-base64>$<hash-base64>`
 */
const ITERATIONS = 100_000;
const KEY_LEN = 32;
const SALT_LEN = 16;
const ALGO = "SHA-256";

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: ALGO,
    },
    key,
    KEY_LEN * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const hash = await pbkdf2(password, salt);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number.parseInt(parts[1]!, 10);
  if (iterations !== ITERATIONS) return false;
  const salt = fromBase64(parts[2]!);
  const expectedHash = fromBase64(parts[3]!);
  const actualHash = await pbkdf2(password, salt);
  return timingSafeEqual(expectedHash, actualHash);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i]! ^ b[i]!);
  }
  return diff === 0;
}