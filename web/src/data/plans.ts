import type { Plan } from "../contexts/AuthContext";

export interface PlanInfo {
  id: Plan;
  name: string;
  monthlyUsd: number;
  blurb: string;
  features: string[];
  /** Stripe price ID — would be live in production with a real Stripe account */
  stripePriceId?: string;
  recommended?: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    monthlyUsd: 0,
    blurb: "BYOK. 1 provider. Unlimited messages.",
    features: [
      "1 LLM provider (you bring the key)",
      "Unlimited messages & sessions",
      "Council mode when 2+ providers configured",
      "All persona presets + custom commands",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyUsd: 19,
    blurb: "For serious devs. Council on every query.",
    features: [
      "Everything in Free",
      "Council mode always on (auto-engage)",
      "Per-provider custom system prompts",
      "Priority response time",
      "Share sessions via link",
      "1 year of session history",
    ],
    stripePriceId: "price_PRO_PLACEHOLDER",
    recommended: true,
  },
  {
    id: "team",
    name: "Team",
    monthlyUsd: 49,
    blurb: "Workspaces, members, shared sessions.",
    features: [
      "Everything in Pro",
      "Multi-workspace (Personal + Work + Side)",
      "Shared council prompts across team",
      "Centralized billing",
      "SSO via Google / GitHub (beta)",
      "Unlimited session history",
    ],
    stripePriceId: "price_TEAM_PLACEHOLDER",
  },
];

export function getPlanInfo(plan: Plan): PlanInfo {
  return PLANS.find((p) => p.id === plan) ?? PLANS[0]!;
}