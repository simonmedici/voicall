import { getUncachableStripeClient } from "./stripe-client";

export { getUncachableStripeClient, getStripePublishableKey } from "./stripe-client";

export const PLANS = {
  starter: {
    name: "Starter",
    price: 199,
    currency: "CHF",
    interval: "month" as const,
    minutesIncluded: 200,
    overageRate: 0.25,
    features: [
      "200 Minuten inklusive",
      "Ein Voice Bot",
      "Sprache: Deutsch",
      "Web Dashboard (Summaries)",
      "Max. 4 Webpages Knowhow",
    ],
    priceId: process.env.STRIPE_PRICE_STARTER || "price_starter",
  },
  pro: {
    name: "Pro",
    price: 399,
    currency: "CHF",
    interval: "month" as const,
    minutesIncluded: 1000,
    overageRate: 0.25,
    features: [
      "1000 Minuten inklusive",
      "Multilingual DE/EN/FR/IT",
      "Rechnungs- & Order Lookup",
      "Web Dashboard (Summaries)",
      "Weiterleitung to Human",
      "ERP/CRM Anbindungen",
    ],
    priceId: process.env.STRIPE_PRICE_PRO || "price_pro",
  },
  enterprise: {
    name: "Enterprise",
    price: 549,
    currency: "CHF",
    interval: "month" as const,
    minutesIncluded: -1,
    overageRate: 0,
    features: [
      "Unlimitierte Minuten",
      "Multilingual DE/EN/FR/IT",
      "Rechnungs- & Order Lookup",
      "Web Dashboard (Summaries)",
      "Weiterleitung to Human",
      "ERP/CRM Anbindungen",
      "Toolintegrationen",
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
