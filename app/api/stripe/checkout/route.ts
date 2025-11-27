import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripeClient, PLANS, type PlanTier } from "@/lib/stripe";
import { db } from "@/lib/db/index";
import { user } from "@/lib/db/schema";
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

    const { tier } = await req.json();

    if (!tier || !(tier in PLANS)) {
      return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 });
    }

    const plan = PLANS[tier as PlanTier];

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

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: userData.email,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
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
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Checkout-Sitzung" },
      { status: 500 }
    );
  }
}
