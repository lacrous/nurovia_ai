/**
 * Real brand logos for each provider. Sourced from:
 *   - simple-icons (MIT) — for OpenAI, Anthropic, Google Gemini, DeepSeek, Mistral,
 *     Moonshot AI, NVIDIA, OpenRouter, Qwen
 *   - lobehub-icons-static-svg (MIT) — for Grok, MiniMax
 *
 * Rendered as <img src="/logos/<id>.svg" /> so they cache like other static
 * assets and work offline. Sized via the `imgClassName` prop.
 */

const LOGO_MAP: Record<string, string> = {
  openai: "/logos/openai.svg",
  moonshot: "/logos/moonshotai.svg",
  anthropic: "/logos/anthropic.svg",
  gemini: "/logos/googlegemini.svg",
  deepseek: "/logos/deepseek.svg",
  qwen: "/logos/qwen.svg",
  nvidia: "/logos/nvidia.svg",
  grok: "/logos/grok.svg",
  minimax: "/logos/MiniMax.svg",
  mistral: "/logos/mistralai.svg",
  openrouter: "/logos/openrouter.svg",
  custom: "", // uses plus icon, no image
};

interface ProviderLogoProps {
  providerId: string;
  size?: number;
  className?: string;
  imgClassName?: string;
}

/**
 * Renders the real brand logo as an <img>. Falls back to a styled initial
 * if the SVG is missing.
 */
export function ProviderLogo({ providerId, size = 32, imgClassName = "" }: ProviderLogoProps) {
  const src = LOGO_MAP[providerId];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={`${providerId} logo`}
      width={size}
      height={size}
      className={imgClassName}
      style={{ width: size, height: size }}
      loading="lazy"
      decoding="async"
    />
  );
}

/** Map providerId → logo path, useful for the side-sheet and legend. */
export function getProviderLogoPath(providerId: string): string | undefined {
  return LOGO_MAP[providerId] || undefined;
}
