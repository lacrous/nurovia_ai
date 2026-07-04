import { useCallback, useEffect, useState } from "react";

/**
 * Text-to-speech using the browser's SpeechSynthesis API.
 * Auto-detects support and no-ops when unavailable.
 */
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported("speechSynthesis" in window);
  }, []);

  const speak = useCallback(
    (text: string, opts: { voice?: string; rate?: number; pitch?: number; onEnd?: () => void } = {}) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (opts.voice) {
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find((v) => v.name === opts.voice);
        if (match) utter.voice = match;
      }
      if (opts.rate) utter.rate = opts.rate;
      if (opts.pitch) utter.pitch = opts.pitch;
      utter.onend = () => {
        setSpeaking(false);
        opts.onEnd?.();
      };
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
      setSpeaking(true);
    },
    []
  );

  const cancel = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const listVoices = useCallback((): SpeechSynthesisVoice[] => {
    if (!("speechSynthesis" in window)) return [];
    return window.speechSynthesis.getVoices();
  }, []);

  return { supported, speaking, speak, cancel, listVoices };
}