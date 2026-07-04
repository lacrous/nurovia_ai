import { describe, it, expect } from "vitest";
import { generateToken, generateVerificationToken, hashToken, verifyToken } from "../src/lib/tokens";

describe("tokens", () => {
  it("generates a 256-bit token with Date expiry", async () => {
    const t = await generateToken();
    expect(t.raw.length).toBeGreaterThanOrEqual(40);
    expect(t.hash.length).toBe(64);
    expect(t.expiresAt).toBeInstanceOf(Date);
    expect(t.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("generates unique tokens", async () => {
    const t1 = await generateToken();
    const t2 = await generateToken();
    expect(t1.raw).not.toBe(t2.raw);
  });

  it("verifies a token against its hash", async () => {
    const t = await generateVerificationToken();
    expect(await verifyToken(t.raw, t.hash)).toBe(true);
  });

  it("rejects a tampered token", async () => {
    const t = await generateToken();
    expect(await verifyToken("wrong", t.hash)).toBe(false);
  });

  it("hashToken is deterministic", async () => {
    expect(await hashToken("hello")).toBe(await hashToken("hello"));
  });
});