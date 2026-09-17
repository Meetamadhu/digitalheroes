import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SubscribeButton } from "@/components/SubscribeButton";

export default async function SubscribePage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data: settings } = await supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle();

  const monthly = settings?.monthly_price_gbp ?? 9.99;
  const yearly = settings?.yearly_price_gbp ?? 99.99;

  if (profile.subscription_status === "active") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-white">You&apos;re subscribed</h1>
        <p className="mt-2 text-zinc-400">
          Plan: {profile.plan_type ?? "—"} · Renews{" "}
          {profile.subscription_renews_at
            ? new Date(profile.subscription_renews_at).toLocaleDateString()
            : "—"}
        </p>
        <a href="/dashboard" className="mt-6 inline-block text-[#ffb347] hover:text-white">
          Go to dashboard →
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-semibold text-white">Choose your plan</h1>
      <p className="mt-2 text-zinc-400">
        Unlock score tracking, monthly draws, and your chosen charity contribution.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#141922] p-6">
          <h2 className="text-lg font-semibold text-white">Monthly</h2>
          <p className="mt-2 text-3xl font-bold text-[#ffb347]">£{monthly}</p>
          <p className="mt-1 text-sm text-zinc-500">Billed every month · cancel anytime</p>
          <div className="mt-6">
            <SubscribeButton plan="monthly" label="Subscribe monthly" />
          </div>
        </div>
        <div className="rounded-2xl border border-[#ff6b4a]/40 bg-[#141922] p-6 shadow-lg shadow-[#ff6b4a]/10">
          <h2 className="text-lg font-semibold text-white">Yearly</h2>
          <p className="mt-2 text-3xl font-bold text-[#ffb347]">£{yearly}</p>
          <p className="mt-1 text-sm text-zinc-500">Discounted annual rate</p>
          <div className="mt-6">
            <SubscribeButton plan="yearly" label="Subscribe yearly" />
          </div>
        </div>
      </div>
      <p className="mt-8 text-xs text-zinc-600">
        Without Stripe price IDs on the server, buttons use demo activation (sets your profile to
        active). Add Stripe env vars on Vercel for real payments.
      </p>
    </div>
  );
}
