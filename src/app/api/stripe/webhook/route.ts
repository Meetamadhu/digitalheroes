import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata.supabase_user_id;
    const customerId = subscription.customer as string;
    if (!userId) return NextResponse.json({ received: true });

    const status = mapStripeStatus(subscription.status);
    const planType =
      subscription.items.data[0]?.price.recurring?.interval === "year" ? "yearly" : "monthly";
    const periodEnd =
      "current_period_end" in subscription
        ? (subscription as Stripe.Subscription & { current_period_end: number }).current_period_end
        : Math.floor(Date.now() / 1000) + 86400 * 30;
    const renewsAt = new Date(periodEnd * 1000).toISOString();

    await supabase
      .from("profiles")
      .update({
        subscription_status: status,
        plan_type: planType,
        subscription_renews_at: renewsAt,
        stripe_customer_id: customerId,
      })
      .eq("id", userId);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata.supabase_user_id;
    if (userId) {
      await supabase
        .from("profiles")
        .update({ subscription_status: "cancelled", subscription_renews_at: null })
        .eq("id", userId);
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    const planType = session.metadata?.plan_type as "monthly" | "yearly" | undefined;
    if (userId && session.subscription) {
      await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          plan_type: planType ?? "monthly",
        })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing") return "active";
  if (status === "canceled") return "cancelled";
  if (status === "past_due" || status === "unpaid") return "lapsed";
  return "inactive";
}
