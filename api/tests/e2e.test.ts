/**
 * E2E test for the auth flow.
 *
 * Requires a running server + DATABASE_URL.
 * Run with:
 *   DATABASE_URL=... npm run dev  (in one terminal)
 *   npm run test:e2e              (in another)
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3001";

describe("auth flow (e2e)", () => {
  let cookie = "";

  beforeAll(() => {
    // Make sure server is reachable
  });

  it("rejects signup with weak password", async () => {
    const res = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "weak@example.com", name: "Weak", password: "short" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("WEAK_PASSWORD");
  });

  it("rejects signup with bad email", async () => {
    const res = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", name: "X", password: "Strong1234!" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_EMAIL");
  });

  it("signs up a new user", async () => {
    const email = `test-${Date.now()}@example.com`;
    const res = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: "Test User", password: "Test1234!" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { user: { email: string } };
    expect(body.user.email).toBe(email);

    // Save session cookie
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    if (setCookie) cookie = setCookie.split(";")[0]!;
  });

  it("returns the user via /me with the session cookie", async () => {
    if (!cookie) return; // skip if previous test failed
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { name: string } };
    expect(body.user.name).toBe("Test User");
  });

  it("rejects signin with wrong password", async () => {
    const res = await fetch(`${BASE}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" }),
    });
    expect(res.status).toBe(401);
  });

  it("signs out and clears the cookie", async () => {
    if (!cookie) return;
    const res = await fetch(`${BASE}/api/auth/signout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toMatch(/nurovia_session=;/);
  });
});