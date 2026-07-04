/**
 * Audio transcription — uses the OpenAI Whisper API when an OpenAI key is configured.
 * Falls back gracefully if no key is available.
 */
import { readKeyStore } from "../api";

export async function transcribeAudio(file: File): Promise<string> {
  const keys = readKeyStore();
  const openai = keys["openai"];
  if (!openai?.api_key) {
    throw new Error("OpenAI API key required for transcription. Add one in Settings → Providers.");
  }
  const form = new FormData();
  form.append("file", file);
  form.append("model", "whisper-1");
  form.append("response_format", "text");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openai.api_key}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Whisper API error ${res.status}: ${text.slice(0, 200)}`);
  }
  return await res.text();
}