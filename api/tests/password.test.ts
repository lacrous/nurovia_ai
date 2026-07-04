import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";

describe("password", () => {
  it("hashes and verifies a password", async () => {
    const h = await hashPassword("hunter2");
    expect(h.startsWith("pbkdf2$100000$")).toBe(true);
    expect(await verifyPassword("hunter2", h)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const h = await hashPassword("hunter2");
    expect(await verifyPassword("nope", h)).toBe(false);
  });

  it("rejects malformed hash", async () => {
    expect(await verifyPassword("hunter2", "garbage")).toBe(false);
  });

  it("uses random salt", async () => {
    const a = await hashPassword("hunter2");
    const b = await hashPassword("hunter2");
    expect(a).not.toBe(b);
  });
});