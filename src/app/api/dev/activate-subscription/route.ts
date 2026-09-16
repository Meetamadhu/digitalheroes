import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Local/demo helper when Stripe keys are not set. Disabled in production. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SUBSCRIBE !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
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
