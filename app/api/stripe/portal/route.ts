import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
import { db } from "@/lib/db/index";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const stripe = await getStripeClient();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const [userSub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, session.user.id))
      .limit(1);

    if (!userSub?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Kein Stripe-Kunde gefunden" },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userSub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
      configuration: {
        features: {
          subscription_update: {
            enabled: true,
            default_return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
          },
          subscription_cancel: {
            enabled: true,
          },
          payment_method_update: {
            enabled: true,
          },
          invoice_history: {
            enabled: true,
          },
        },
      },
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Portal-Sitzung" },
      { status: 500 }
    );
  }
}
