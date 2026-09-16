import { computeMonthlyPool } from "@/lib/prize-pool";
import { createClient } from "@/lib/supabase/server";
import type { PlanType } from "@/types/database";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const [
    { count: userCount },
    { data: settings },
    { data: activeSubs },
    { data: donations },
    { count: drawCount },
    { data: winners },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("platform_settings").select("*").eq("id", 1).single(),
    supabase
      .from("profiles")
      .select("plan_type, charity_percent, subscription_status")
      .eq("subscription_status", "active")
      .not("plan_type", "is", null),
    supabase.from("standalone_donations").select("amount"),
    supabase.from("draws").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("draw_winners").select("prize_amount, payout_status"),
  ]);

  const pool =
    settings && activeSubs
      ? computeMonthlyPool(
          activeSubs as { plan_type: PlanType }[],
          Number(settings.pool_share_percent),
          {
            monthly_price_gbp: Number(settings.monthly_price_gbp),
            yearly_price_gbp: Number(settings.yearly_price_gbp),
          },
        )
      : 0;

  const charityFromSubs = (activeSubs ?? []).reduce((sum, p) => {
    const price =
      p.plan_type === "yearly"
        ? Number(settings?.yearly_price_gbp ?? 0)
        : Number(settings?.monthly_price_gbp ?? 0);
    return sum + price * (Number(p.charity_percent) / 100);
  }, 0);

  const standaloneTotal = (donations ?? []).reduce((s, d) => s + Number(d.amount), 0);
  const paidOut = (winners ?? [])
    .filter((w) => w.payout_status === "paid")
    .reduce((s, w) => s + Number(w.prize_amount), 0);

  const stats = [
    ["Total users", userCount ?? 0],
    ["Est. monthly prize pool", `£${pool.toFixed(2)}`],
    ["Jackpot rollover", `£${Number(settings?.jackpot_rollover ?? 0).toFixed(2)}`],
    ["Est. charity from subs (cycle)", `£${charityFromSubs.toFixed(2)}`],
    ["Standalone donations", `£${standaloneTotal.toFixed(2)}`],
    ["Published draws", drawCount ?? 0],
    ["Paid winnings", `£${paidOut.toFixed(2)}`],
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Reports & analytics</h1>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        {stats.map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-white/10 bg-[#141922] p-5">
            <dt className="text-sm text-zinc-500">{label}</dt>
            <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
