import { NextResponse } from "next/server";
import { isStripeCheckoutReady } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

/**
 * Activates subscription in DB when Stripe Checkout is not configured.
 * Allowed on production only while Stripe is not fully set up (assignment / testing).
 */
export async function POST(request: Request) {
  const stripeReady = isStripeCheckoutReady();
  const demoForced = process.env.ALLOW_DEMO_SUBSCRIBE === "true";

  if (process.env.NODE_ENV === "production" && stripeReady && !demoForced) {
    return NextResponse.json(
      { error: "Use Stripe Checkout — demo activation is disabled when Stripe is configured." },
      { status: 403 },
    );
  }

  const { plan } = await request.json();
  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const renews = new Date();
  renews.setMonth(renews.getMonth() + (plan === "yearly" ? 12 : 1));

  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      plan_type: plan,
      subscription_renews_at: renews.toISOString(),
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
