/**
 * API key vault — encrypted at rest with AES-256-GCM.
 */
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import { encrypt, decrypt, last4 } from "../lib/encryption";

export interface ApiKeySummary {
  id: string;
  provider: string;
  label: string | null;
  last4: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export async function listKeys(userId: string): Promise<ApiKeySummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.apiKeys.id,
      provider: schema.apiKeys.provider,
      label: schema.apiKeys.label,
      last4: schema.apiKeys.last4,
      createdAt: schema.apiKeys.createdAt,
      lastUsedAt: schema.apiKeys.lastUsedAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, userId));
  return rows;
}

export async function saveKey(
  userId: string,
  provider: string,
  plaintext: string,
  label?: string
): Promise<ApiKeySummary> {
  const db = getDb();
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY not set");
  const ciphertext = await encrypt(plaintext, key);
  const id = `ak_${crypto.randomUUID()}`;

  const existing = await db
    .select({ id: schema.apiKeys.id })
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.userId, userId), eq(schema.apiKeys.provider, provider)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.apiKeys)
      .set({ ciphertext, last4: last4(plaintext), label: label ?? null })
      .where(eq(schema.apiKeys.id, existing[0].id));
    return {
      id: existing[0].id,
      provider,
      label: label ?? null,
      last4: last4(plaintext),
      createdAt: new Date(),
      lastUsedAt: null,
    };
  }

  await db.insert(schema.apiKeys).values({
    id,
    userId,
    provider,
    label: label ?? null,
    ciphertext,
    last4: last4(plaintext),
  });
  return {
    id,
    provider,
    label: label ?? null,
    last4: last4(plaintext),
    createdAt: new Date(),
    lastUsedAt: null,
  };
}

export async function deleteKey(userId: string, keyId: string): Promise<void> {
  const db = getDb();
  await db
    .delete(schema.apiKeys)
    .where(and(eq(schema.apiKeys.userId, userId), eq(schema.apiKeys.id, keyId)));
}

export async function decryptKey(userId: string, provider: string): Promise<string | null> {
  const db = getDb();
  const key = process.env.ENCRYPTION_KEY;
  if (!key) return null;
  const rows = await db
    .select({ ciphertext: schema.apiKeys.ciphertext })
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.userId, userId), eq(schema.apiKeys.provider, provider)))
    .limit(1);
  if (!rows[0]) return null;
  const plaintext = await decrypt(rows[0].ciphertext, key);
  db.update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(schema.apiKeys.userId, userId), eq(schema.apiKeys.provider, provider)))
    .catch(() => undefined);
  return plaintext;
}