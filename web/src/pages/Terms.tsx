import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { FileText } from "lucide-react";
import { LegalLayout, type LegalSection } from "../components/LegalLayout";

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance",
    body: `By using Nurovia AI you agree to these terms. If you don't agree, please don't use the product. The product is currently in public beta and provided as-is.`,
  },
  {
    id: "service",
    title: "2. The service",
    body: `Nurovia AI is a client-side web application that helps you orchestrate calls to third-party large language model providers. We do not provide the language models ourselves — you either bring your own API keys (BYOK) or, on certain paid plans, route through our pooled relay.

We do not host, store, or transmit your chats. The product is a single-page application that runs in your browser.`,
  },
  {
    id: "responsibilities",
    title: "3. Your responsibilities",
    body: `You are responsible for:

- The API keys you add — including keeping them secure and rotating them if leaked.
- The cost of any LLM usage you incur through your providers.
- Any code changes you apply to your projects as a result of Nurovia's output. **The product always requires your explicit approval before writing anything.** You alone decide what to apply.
- Compliance with your providers' terms of service and your local laws.

You agree not to use Nurovia for: illegal activity, generating malware intended to cause harm, harassing people, generating CSAM, or anything that violates export controls.`,
  },
  {
    id: "ai-output",
    title: "4. AI output disclaimer",
    body: `Large language models can produce code that looks correct but isn't. Nurovia's council mode reduces (but does not eliminate) this risk by surfacing disagreement between models.

**Always review proposed changes before applying them.** Nurovia is a tool, not a replacement for engineering judgment.`,
  },
  {
    id: "beta",
    title: "5. Beta status",
    body: `Nurovia is in public beta. We may change, break, or remove features without notice. We try to communicate breaking changes in the changelog.`,
  },
  {
    id: "paid",
    title: "6. Paid plans",
    body: `On Starter, you only pay your provider (BYOK). On Pro and Team, you can optionally use our pooled credits; if you do, you agree to pay the listed subscription fee. We use Stripe for payment processing — your payment details never touch our servers.

Refunds: we offer a 14-day money-back guarantee on Pro and Team plans, no questions asked. Email billing@nurovia.ai.`,
  },
  {
    id: "liability",
    title: "7. Limitation of liability",
    body: `To the maximum extent permitted by law, Nurovia AI is provided "as is" without warranty of any kind. We are not liable for any damages arising from your use of the product, including but not limited to lost profits, lost data, or business interruption caused by AI-generated code.`,
  },
  {
    id: "changes",
    title: "8. Changes",
    body: `We may update these terms occasionally. If we do, we'll bump the "Last updated" date and surface a notice in the in-app changelog. Continued use after a change means you accept the new terms.`,
  },
  {
    id: "contact",
    title: "9. Contact",
    body: `Questions? Email **legal@nurovia.ai**.`,
  },
];

export function Terms() {
  useDocumentTitle("Terms of Service");
  return (
    <LegalLayout
      pageTitle="Terms of Service"
      pageKicker="Legal"
      icon={FileText}
      sections={SECTIONS}
      contactEmail="legal@nurovia.ai"
      contactLabel="Email"
      contactHref="mailto:legal@nurovia.ai"
      relatedLabel="Privacy Policy"
      relatedHref="/privacy"
      relatedPageLabel="Back to home"
      relatedPagePath="/"
      acceptanceKey="nurovia-ai-terms-accepted"
    />
  );
}