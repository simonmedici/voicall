import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripeClient, PLANS, type PlanTier } from "@/lib/stripe";
import { db } from "@/lib/db/index";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    const { tier } = await req.json();

    if (!tier || !(tier in PLANS)) {
      return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 });
    }

    const plan = PLANS[tier as PlanTier];

    if (!plan.priceId || plan.priceId === "price_starter" || plan.priceId === "price_pro" || plan.priceId === "price_enterprise") {
      console.error("Stripe Price IDs not configured:", { tier, priceId: plan.priceId });
      return NextResponse.json(
        { error: "Stripe ist nicht korrekt konfiguriert. Bitte kontaktieren Sie den Support." },
        { status: 500 }
      );
    }

    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userData) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    let stripe;
    try {
      stripe = await getStripeClient();
    } catch (stripeError) {
      console.error("Stripe client initialization error:", stripeError);
      return NextResponse.json(
        { error: "Zahlungssystem vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut." },
        { status: 503 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL not configured");
      return NextResponse.json(
        { error: "App-URL nicht konfiguriert" },
        { status: 500 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: userData.email,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "chf",
            unit_amount: plan.price * 100,
            product_data: {
              name: `${plan.name} Plan - Voicall`,
              description: plan.minutesIncluded === -1 
                ? "Unbegrenzte Minuten" 
                : `${plan.minutesIncluded} Minuten pro Monat`,
            },
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscribe`,
      metadata: {
        userId: session.user.id,
        tier,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          tier,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Checkout-Sitzung", details: errorMessage },
      { status: 500 }
    );
  }
}
