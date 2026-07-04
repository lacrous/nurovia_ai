/**
 * Image generation via OpenAI DALL-E API. Tool callable from council.
 */
import { readKeyStore } from "../api";

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

export async function generateImage(prompt: string): Promise<{ urls: string[] }> {
  const keys = readKeyStore();
  const openai = keys["openai"];
  if (!openai?.api_key) {
    throw new Error("OpenAI API key required for image generation.");
  }
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openai.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DALL-E API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return { urls: (data?.data ?? []).map((d: GeneratedImage) => d.url) };
}