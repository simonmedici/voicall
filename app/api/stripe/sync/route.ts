import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripeClient, getPlanByPriceId } from "@/lib/stripe";
import { db } from "@/lib/db/index";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session-ID fehlt" },
        { status: 400 }
      );
    }

    const stripe = await getStripeClient();

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Zahlung nicht abgeschlossen" },
        { status: 400 }
      );
    }

    const metadataUserId = checkoutSession.metadata?.userId;
    if (metadataUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Ungültige Session" },
        { status: 403 }
      );
    }

    const subscriptionId = checkoutSession.subscription;
    if (!subscriptionId || typeof subscriptionId !== "string") {
      return NextResponse.json(
        { error: "Keine Subscription-ID gefunden" },
        { status: 400 }
      );
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subData = stripeSubscription as unknown as { 
      id: string;
      items: { data: Array<{ price: { id: string } }> };
      current_period_start?: number; 
      current_period_end?: number;
    };

    const tier = checkoutSession.metadata?.tier || "starter";
    const planInfo = getPlanByPriceId(subData.items.data[0].price.id);
    const minutesIncluded = planInfo?.plan.minutesIncluded ?? 500;

    const now = new Date();
    const periodStart = subData.current_period_start 
      ? new Date(subData.current_period_start * 1000)
      : now;
    const periodEnd = subData.current_period_end
      ? new Date(subData.current_period_end * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const existingSub = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, session.user.id))
      .limit(1);

    if (existingSub.length > 0) {
      await db
        .update(subscription)
        .set({
          stripeCustomerId: checkoutSession.customer as string,
          stripeSubscriptionId: subData.id,
          tier,
          status: "active",
          minutesIncluded,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscription.userId, session.user.id));
    } else {
      await db.insert(subscription).values({
        id: randomUUID(),
        userId: session.user.id,
        stripeCustomerId: checkoutSession.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        tier,
        status: "active",
        minutesUsed: 0,
        minutesIncluded,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });
    }

    return NextResponse.json({ success: true, tier });
  } catch (error) {
    console.error("Stripe sync error:", error);
    return NextResponse.json(
      { error: "Fehler beim Synchronisieren" },
      { status: 500 }
    );
  }
}
