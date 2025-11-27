import Stripe from "stripe";
import { db } from "../lib/db/index";
import { subscription, user } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function syncSubscriptions() {
  console.log("Fetching Stripe API key...");
  
  const stripeRes = await fetch("https://api.replit.com/v0/replspace-token");
  if (!stripeRes.ok) {
    throw new Error("Failed to get Replit token");
  }
  const stripeToken = await stripeRes.json();
  
  const keysRes = await fetch("https://replit-integration-api.replit.com/stripe/keys", {
    headers: { Authorization: `Bearer ${stripeToken.token}` },
  });
  if (!keysRes.ok) {
    throw new Error("Failed to get Stripe keys");
  }
  const keysData = await keysRes.json();
  
  const stripe = new Stripe(keysData.stripe_secret_key);
  
  console.log("Fetching recent checkout sessions from Stripe...");
  
  const sessions = await stripe.checkout.sessions.list({
    limit: 10,
    expand: ["data.subscription"],
  });

  console.log(`Found ${sessions.data.length} checkout sessions`);

  for (const session of sessions.data) {
    if (session.payment_status !== "paid") {
      console.log(`Skipping session ${session.id} - not paid`);
      continue;
    }

    const userId = session.metadata?.userId;
    if (!userId) {
      console.log(`Skipping session ${session.id} - no userId in metadata`);
      continue;
    }

    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) {
      console.log(`Skipping session ${session.id} - user ${userId} not found`);
      continue;
    }

    const [existingSub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (existingSub) {
      console.log(`User ${userData.email} already has subscription - skipping`);
      continue;
    }

    const stripeSubscription = session.subscription;
    if (!stripeSubscription || typeof stripeSubscription === "string") {
      console.log(`Skipping session ${session.id} - no expanded subscription`);
      continue;
    }

    const tier = session.metadata?.tier || "starter";
    const minutesMap: Record<string, number> = {
      starter: 500,
      pro: 1500,
      enterprise: -1,
    };

    const subData = stripeSubscription as unknown as { 
      current_period_start: number; 
      current_period_end: number;
      id: string;
    };

    console.log(`Creating subscription for ${userData.email} (${tier})...`);

    await db.insert(subscription).values({
      id: randomUUID(),
      userId: userId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subData.id,
      tier,
      status: "active",
      minutesUsed: 0,
      minutesIncluded: minutesMap[tier] || 500,
      currentPeriodStart: new Date(subData.current_period_start * 1000),
      currentPeriodEnd: new Date(subData.current_period_end * 1000),
    });

    console.log(`✓ Subscription created for ${userData.email}`);
  }

  console.log("Done!");
}

syncSubscriptions().catch(console.error);
