/**
 * AES-256-GCM symmetric encryption for the API key vault.
 *
 * Stored format: `aes256gcm$<nonce-base64>$<ciphertext+tag-base64>`
 */
const ALGO = "AES-GCM";
const NONCE_LEN = 12;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function getKey(secretB64: string): Promise<CryptoKey> {
  const raw = fromBase64(secretB64);
  if (raw.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be 32 bytes (got ${raw.length})`);
  }
  return crypto.subtle.importKey("raw", raw as BufferSource, ALGO, false, ["encrypt", "decrypt"]);
}

export async function encrypt(plaintext: string, secretB64: string): Promise<string> {
  const key = await getKey(secretB64);
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LEN));
  const enc = new TextEncoder();
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: ALGO, iv: nonce as BufferSource }, key, enc.encode(plaintext))
  );
  return `aes256gcm$${toBase64(nonce)}$${toBase64(ciphertext)}`;
}

export async function decrypt(blob: string, secretB64: string): Promise<string> {
  const parts = blob.split("$");
  if (parts.length !== 3 || parts[0] !== "aes256gcm") {
    throw new Error("Invalid ciphertext format");
  }
  const key = await getKey(secretB64);
  const nonce = fromBase64(parts[1]!);
  const ciphertext = fromBase64(parts[2]!);
  const plaintext = await crypto.subtle.decrypt({ name: ALGO, iv: nonce as BufferSource }, key, ciphertext as BufferSource);
  return new TextDecoder().decode(plaintext);
}

export function last4(s: string): string {
  return s.slice(-4);
}