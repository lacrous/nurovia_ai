import { describe, expect, it } from "vitest";
import {
  computeCost,
  estimateTokens,
  getPricing,
  isChatGPTExport,
} from "../src/services/api";
import { addFact, getMemory, memoryAsSystemPrompt, removeFact } from "../src/data/memory";

describe("token estimation", () => {
  it("estimates ~4 chars per token", () => {
    expect(estimateTokens("hello world")).toBe(3);
    expect(estimateTokens("a".repeat(40))).toBe(10);
  });

  it("returns at least 1 for empty string", () => {
    expect(estimateTokens("")).toBe(1);
  });
});

describe("cost computation", () => {
  it("computes cost for known models", () => {
    const cost = computeCost("gpt-4o-mini", 1_000_000, 0);
    expect(cost).toBeCloseTo(0.15, 2);
  });

  it("falls back to default for unknown models", () => {
    const cost = computeCost("some-future-model", 1000, 1000);
    expect(cost).toBeGreaterThan(0);
  });

  it("uses prefix matching for versioned models", () => {
    const pricing = getPricing("claude-3-5-sonnet-20241022");
    expect(pricing.input).toBeGreaterThan(0);
  });
});

describe("ChatGPT export detection", () => {
  it("detects valid ChatGPT export", () => {
    expect(
      isChatGPTExport([
        {
          id: "abc",
          title: "test",
          create_time: 1234,
          mapping: { foo: { message: { author: { role: "user" }, content: { parts: ["hi"] } } } },
        },
      ])
    ).toBe(true);
  });

  it("rejects invalid format", () => {
    expect(isChatGPTExport([])).toBe(false);
    expect(isChatGPTExport({ not: "an array" })).toBe(false);
    expect(isChatGPTExport(null)).toBe(false);
  });
});

describe("memory", () => {
  it("starts empty", () => {
    expect(getMemory()).toEqual([]);
  });

  it("adds facts", () => {
    addFact("My name is Alex");
    addFact("I prefer tabs", "preference");
    const m = getMemory();
    expect(m.length).toBe(2);
    expect(m[0].category).toBe("context");
    expect(m[1].category).toBe("preference");
  });

  it("removes facts", () => {
    const f = addFact("temporary");
    removeFact(f.id);
    expect(getMemory().find((x) => x.id === f.id)).toBeUndefined();
  });

  it("renders facts as a system prompt", () => {
    addFact("Working on a Next.js app");
    addFact("Prefer tabs", "preference");
    const prompt = memoryAsSystemPrompt();
    expect(prompt).toContain("Long-term memory");
    expect(prompt).toContain("User context");
    expect(prompt).toContain("User preferences");
    expect(prompt).toContain("Working on a Next.js app");
    expect(prompt).toContain("Prefer tabs");
  });
});