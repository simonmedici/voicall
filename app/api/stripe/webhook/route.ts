/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient, getPlanByPriceId } from "@/lib/stripe";
import { db } from "@/lib/db/index";
import { subscription, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, createSubscriptionConfirmationEmail } from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  const stripe = await getStripeClient();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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

        const existingSub = await db
          .select()
          .from(subscription)
          .where(eq(subscription.userId, userId))
          .limit(1);

        if (existingSub.length > 0) {
          await db
            .update(subscription)
            .set({
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
            })
            .where(eq(subscription.userId, userId));
          console.log("Subscription updated for user:", userId);
        } else {
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
        }

        const [userRecord] = await db
          .select()
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);

        if (userRecord?.email) {
          const amount =
            (stripeSubscription.items.data[0].price.unit_amount ?? 0) / 100;
          await sendEmail(
            createSubscriptionConfirmationEmail(userRecord.email, {
              plan: tier,
              amount,
              minutesIncluded,
            })
          );
        }

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
