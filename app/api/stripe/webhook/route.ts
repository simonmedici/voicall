/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { db } from "@/lib/db/index";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;

        if (!userId || !tier) {
          console.error("Missing metadata in checkout session:", session.id);
          break;
        }

        const stripeSubscription = (await stripe.subscriptions.retrieve(
          session.subscription as string
        )) as Stripe.Subscription;

        const planInfo = getPlanByPriceId(
          stripeSubscription.items.data[0].price.id
        );
        const minutesIncluded = planInfo?.plan.minutesIncluded ?? 500;

        // Create subscription record
        await db.insert(subscription).values({
          id: crypto.randomUUID(),
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: stripeSubscription.items.data[0].price.id,
          currentPeriodStart: new Date(
            (stripeSubscription as any).current_period_start * 1000
          ),
          currentPeriodEnd: new Date(
            (stripeSubscription as any).current_period_end * 1000
          ),
          tier,
          status: stripeSubscription.status,
          minutesIncluded,
          minutesUsed: 0,
          minutesReset: new Date(
            (stripeSubscription as any).current_period_end * 1000
          ),
        });

        console.log("Subscription created for user:", userId);
        break;
      }

      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const userId = stripeSubscription.metadata?.userId;

        if (!userId) {
          console.error(
            "Missing userId in subscription metadata:",
            stripeSubscription.id
          );
          break;
        }

        const planInfo = getPlanByPriceId(
          stripeSubscription.items.data[0].price.id
        );
        const tier = planInfo?.tier ?? "starter";
        const minutesIncluded = planInfo?.plan.minutesIncluded ?? 500;

        // Update subscription
        await db
          .update(subscription)
          .set({
            stripePriceId: stripeSubscription.items.data[0].price.id,
            currentPeriodStart: new Date(
              (stripeSubscription as any).current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              (stripeSubscription as any).current_period_end * 1000
            ),
            tier,
            status: stripeSubscription.status,
            minutesIncluded,
            minutesReset: new Date(
              (stripeSubscription as any).current_period_end * 1000
            ),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          })
          .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id));

        console.log("Subscription updated:", stripeSubscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        // Mark subscription as canceled
        await db
          .update(subscription)
          .set({
            status: "canceled",
            cancelAtPeriodEnd: true,
          })
          .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id));

        console.log("Subscription canceled:", stripeSubscription.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if ((invoice as any).subscription) {
          const stripeSubscription = (await stripe.subscriptions.retrieve(
            (invoice as any).subscription as string
          )) as Stripe.Subscription;

          // Reset minutes usage on successful payment (new billing period)
          await db
            .update(subscription)
            .set({
              minutesUsed: 0,
              minutesReset: new Date(
                (stripeSubscription as any).current_period_end * 1000
              ),
              status: "active",
            })
            .where(
              eq(subscription.stripeSubscriptionId, stripeSubscription.id)
            );

          console.log("Minutes reset for subscription:", stripeSubscription.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if ((invoice as any).subscription) {
          // Mark subscription as past_due
          await db
            .update(subscription)
            .set({
              status: "past_due",
            })
            .where(
              eq(
                subscription.stripeSubscriptionId,
                (invoice as any).subscription as string
              )
            );

          console.log(
            "Payment failed for subscription:",
            (invoice as any).subscription
          );
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
