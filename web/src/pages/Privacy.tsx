import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ShieldCheck } from "lucide-react";
import { LegalLayout, type LegalSection } from "../components/LegalLayout";

const SECTIONS: LegalSection[] = [
  {
    id: "collect",
    title: "1. What we collect",
    body: `**Nothing.** Nurovia AI is a fully client-side single-page application. We do not operate any backend that receives your chats, your API keys, or any other content from you.

Your browser stores everything locally:

- \`nurovia-ai-chat-sessions\` — your chat history
- \`nurovia-ai-provider-keys\` — API keys you add
- \`nurovia-ai-settings\` — preferences (temperature, council mode, theme)

We have no servers, no analytics, no telemetry, no cookies, no tracking pixels, no error reporting service.`,
  },
  {
    id: "leaves",
    title: "2. What leaves your browser",
    body: `Only the LLM provider calls you make. When you send a message, your browser sends it directly to the LLM provider you've configured (OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, Qwen, or your custom endpoint). That call goes straight from your browser to the provider — no Nurovia server sits in the middle.

The provider then sees: your message, your attached files (if any), and your API key in the \`Authorization\` header. They log this according to their own privacy policy.`,
  },
  {
    id: "providers",
    title: "3. Provider data retention",
    body: `Each provider has their own data retention policy:

- **OpenAI** — data is retained for 30 days for abuse monitoring, then deleted. You can opt out via your OpenAI account settings.
- **Anthropic** — prompts and outputs are retained for 30 days, then deleted.
- **Google Gemini** — controlled by your Google account settings.
- **DeepSeek, OpenRouter, Qwen** — see their respective privacy policies.

We recommend reviewing each provider's policy if you handle sensitive code or data.`,
  },
  {
    id: "children",
    title: "4. Children",
    body: `Nurovia is not directed at children under 13. We do not knowingly collect any information from children — and given that we collect nothing at all, this is a non-issue in practice.`,
  },
  {
    id: "changes",
    title: "5. Changes",
    body: `If this policy ever changes (it shouldn't — there's nothing to change), we'll bump the "Last updated" date below and notify active users via the in-app changelog.`,
  },
  {
    id: "rights",
    title: "6. Your rights",
    body: `Since we don't collect anything, you inherently have full data rights:

- **Access** — all your data is in your browser's \`localStorage\` (DevTools → Application → Local Storage).
- **Delete** — Settings → Data → Erase all local data, or clear your browser storage.
- **Export** — Settings → Data → Download backup.
- **Portability** — exports are plain JSON, easy to import elsewhere.

For anything else, email us.`,
  },
  {
    id: "contact",
    title: "7. Contact",
    body: `Questions about privacy? Email **privacy@nurovia.ai**. We typically respond within 1 business day, though usually faster.`,
  },
];

export function Privacy() {
  useDocumentTitle("Privacy Policy");
  return (
    <LegalLayout
      pageTitle="Privacy Policy"
      pageKicker="Legal"
      icon={ShieldCheck}
      sections={SECTIONS}
      contactEmail="privacy@nurovia.ai"
      contactLabel="Email"
      contactHref="mailto:privacy@nurovia.ai"
      relatedLabel="Terms of Service"
      relatedHref="/terms"
      relatedPageLabel="Back to home"
      relatedPagePath="/"
      summary={`we don't collect anything. Your chats, keys, and settings live entirely in your browser. The only data that leaves is the calls you make directly to the LLM providers you configure.`}
    />
  );
}