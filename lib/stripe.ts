import { getUncachableStripeClient } from "./stripe-client";

export { getUncachableStripeClient, getStripePublishableKey } from "./stripe-client";

export const PLANS = {
  starter: {
    name: "Starter",
    price: 199,
    currency: "CHF",
    interval: "month" as const,
    minutesIncluded: 500,
    features: [
      "500 Minuten inklusive",
      "Sprache: Deutsch",
      "Basic Transkripte",
      "Webseiten-Infos",
      "E-Mail Support",
    ],
    priceId: process.env.STRIPE_PRICE_STARTER || "price_starter",
  },
  pro: {
    name: "Pro",
    price: 349,
    currency: "CHF",
    interval: "month" as const,
    minutesIncluded: 1500,
    features: [
      "1500 Minuten inklusive",
      "Sprachen: DE/EN/FR/IT",
      "Advanced Transkripte",
      "Webseiten-Infos & RAG Dokumente",
      "Terminkalender Einbindung",
      "Prioritäts-Support",
    ],
    priceId: process.env.STRIPE_PRICE_PRO || "price_pro",
  },
  enterprise: {
    name: "Enterprise",
    price: 499,
    currency: "CHF",
    interval: "month" as const,
    minutesIncluded: -1,
    features: [
      "Unlimitierte Minuten",
      "Sprachen: DE/EN/FR/IT",
      "Advanced Transkripte",
      "Webseiten-Infos & RAG Dokumente",
      "Terminkalender Einbindung",
      "Dedizierter Account Manager",
      "Custom Integration Support",
    ],
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise",
  },
} as const;

export type PlanTier = keyof typeof PLANS;

export function getPlanByTier(tier: PlanTier) {
  return PLANS[tier];
}

export function getPlanByPriceId(
  priceId: string
): { tier: PlanTier; plan: (typeof PLANS)[PlanTier] } | null {
  for (const [tier, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return { tier: tier as PlanTier, plan };
    }
  }
  return null;
}

export function secondsToMinutes(seconds: number): number {
  return Math.ceil(seconds / 60);
}

export async function getStripeClient() {
  return getUncachableStripeClient();
}
