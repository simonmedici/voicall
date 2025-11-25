import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("⚠️ STRIPE_SECRET_KEY is not set - Stripe features will be disabled");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    })
  : null;

// Subscription Plans (CHF Pricing)
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
    // This will be your actual Stripe Price ID - create in Stripe Dashboard
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
    minutesIncluded: -1, // Unlimited
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

// Helper to get plan details by tier
export function getPlanByTier(tier: PlanTier) {
  return PLANS[tier];
}

// Helper to get plan by Stripe Price ID
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

// Calculate minutes from seconds (ElevenLabs sends duration in seconds)
export function secondsToMinutes(seconds: number): number {
  return Math.ceil(seconds / 60); // Round up to nearest minute
}
