import { describe, it, expect } from "vitest";
import { eventToSse, type StreamEvent } from "../src/services/llm";

describe("eventToSse", () => {
  it("serializes token events", () => {
    const evt: StreamEvent = { type: "token", data: { text: "hello" } };
    expect(eventToSse(evt)).toBe('event: token\ndata: {"text":"hello"}\n\n');
  });

  it("serializes done events", () => {
    const evt: StreamEvent = { type: "done", data: {} };
    expect(eventToSse(evt)).toBe('event: done\ndata: {}\n\n');
  });
});