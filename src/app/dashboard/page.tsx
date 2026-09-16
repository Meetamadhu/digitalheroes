import { format } from "date-fns";
import {
  recordStandaloneDonation,
  updateCharitySettings,
} from "@/app/actions/profile";
import { deleteScore, upsertScore } from "@/app/actions/scores";
import { uploadWinnerProof } from "@/app/actions/winners";
import { requireUser } from "@/lib/auth";
import { MAX_SCORES, MIN_CHARITY_PERCENT } from "@/lib/constants";
import { charityContribution, subscriptionPrice } from "@/lib/prize-pool";
import { createClient } from "@/lib/supabase/server";
import type { Charity, Draw, DrawWinner, GolfScore } from "@/types/database";

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const [
    { data: scores },
    { data: charities },
    { data: settings },
    { data: entries },
    { data: winners },
    { data: publishedDraws },
  ] = await Promise.all([
    supabase
      .from("golf_scores")
      .select("*")
      .eq("user_id", user.id)
      .order("played_on", { ascending: false }),
    supabase.from("charities").select("id, name").order("name"),
    supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("draw_entries").select("*, draws(year, month, status)").eq("user_id", user.id),
    supabase
      .from("draw_winners")
      .select("*, draws(year, month)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("draws")
      .select("*")
      .eq("status", "published")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(3),
  ]);

  const scoreList = (scores ?? []) as GolfScore[];
  const charityList = (charities ?? []) as Pick<Charity, "id" | "name">[];
  const winnerList = (winners ?? []) as (DrawWinner & {
    draws: { year: number; month: number } | null;
  })[];
  const upcomingDraw = (publishedDraws ?? [])[0] as Draw | undefined;

  const subAmount =
    profile.plan_type && settings
      ? subscriptionPrice(profile.plan_type, {
          monthly_price_gbp: Number(settings.monthly_price_gbp),
          yearly_price_gbp: Number(settings.yearly_price_gbp),
        })
      : 0;
  const charityAmt =
    profile.charity_percent && subAmount
      ? charityContribution(subAmount, profile.charity_percent)
      : 0;

  const totalWon = winnerList.reduce((s, w) => s + Number(w.prize_amount), 0);
  const active = profile.subscription_status === "active";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold text-white">Your dashboard</h1>
      <p className="mt-1 text-zinc-400">Subscription, scores, charity, draws, and winnings.</p>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#141922] p-5">
          <h2 className="text-sm font-medium text-zinc-400">Subscription</h2>
          <p className="mt-2 text-xl font-semibold capitalize text-white">
            {profile.subscription_status}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Plan: {profile.plan_type ?? "—"} · Renews{" "}
            {profile.subscription_renews_at
              ? format(new Date(profile.subscription_renews_at), "d MMM yyyy")
              : "—"}
          </p>
          {!active && (
            <a href="/subscribe" className="mt-3 inline-block text-sm text-[#ffb347]">
              Activate subscription →
            </a>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#141922] p-5">
          <h2 className="text-sm font-medium text-zinc-400">Participation</h2>
          <p className="mt-2 text-xl font-semibold text-white">
            {(entries ?? []).length} draws entered
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Latest published:{" "}
            {upcomingDraw
              ? `${upcomingDraw.month}/${upcomingDraw.year}`
              : "None yet — stay tuned"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#141922] p-5">
          <h2 className="text-sm font-medium text-zinc-400">Winnings</h2>
          <p className="mt-2 text-xl font-semibold text-[#ffb347]">£{totalWon.toFixed(2)}</p>
          <p className="mt-1 text-sm text-zinc-500">Track verification & payout below</p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white">Stableford scores</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Latest {MAX_SCORES} scores · one entry per date · range 1–45
        </p>
        {!active ? (
          <p className="mt-4 text-sm text-zinc-400">Subscribe to add or edit scores.</p>
        ) : (
          <form action={upsertScore} className="mt-4 flex flex-wrap gap-3">
            <input
              name="score"
              type="number"
              min={1}
              max={45}
              required
              placeholder="Score"
              className="rounded-lg border border-white/15 bg-[#0c0f14] px-3 py-2 w-24"
            />
            <input
              name="played_on"
              type="date"
              required
              className="rounded-lg border border-white/15 bg-[#0c0f14] px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Save score
            </button>
          </form>
        )}
        <ul className="mt-6 divide-y divide-white/10">
          {scoreList.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-3 text-sm">
              <span>
                {format(new Date(s.played_on), "d MMM yyyy")} —{" "}
                <strong className="text-white">{s.score}</strong>
              </span>
              {active && (
                <form action={deleteScore}>
                  <input type="hidden" name="score_id" value={s.id} />
                  <button type="submit" className="text-red-400 hover:text-red-300">
                    Delete
                  </button>
                </form>
              )}
            </li>
          ))}
          {scoreList.length === 0 && (
            <li className="py-4 text-zinc-500">No scores yet.</li>
          )}
        </ul>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white">Charity & giving</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Estimated £{charityAmt.toFixed(2)} per billing cycle at {profile.charity_percent}%
          </p>
          <form action={updateCharitySettings} className="mt-4 space-y-3">
            <select
              name="charity_id"
              defaultValue={profile.charity_id ?? ""}
              className="w-full rounded-lg border border-white/15 bg-[#0c0f14] px-3 py-2"
            >
              {charityList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              name="charity_percent"
              type="number"
              min={MIN_CHARITY_PERCENT}
              max={100}
              defaultValue={profile.charity_percent}
              className="w-full rounded-lg border border-white/15 bg-[#0c0f14] px-3 py-2"
            />
            <button type="submit" className="rounded-lg bg-[#ff6b4a]/20 px-4 py-2 text-sm text-[#ffb347]">
              Update charity settings
            </button>
          </form>
          <form action={recordStandaloneDonation} className="mt-6 space-y-3 border-t border-white/10 pt-6">
            <p className="text-sm text-zinc-400">One-off donation (not tied to gameplay)</p>
            <select name="charity_id" required className="w-full rounded-lg border border-white/15 bg-[#0c0f14] px-3 py-2">
              <option value="">Charity…</option>
              {charityList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="Amount (£)"
              required
              className="w-full rounded-lg border border-white/15 bg-[#0c0f14] px-3 py-2"
            />
            <button type="submit" className="rounded-lg bg-white/10 px-4 py-2 text-sm">
              Record donation
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white">Wins & verification</h2>
          <ul className="mt-4 space-y-4">
            {winnerList.map((w) => (
              <li key={w.id} className="rounded-xl bg-[#0c0f14] p-4 text-sm">
                <p className="text-white">
                  {w.draws?.month}/{w.draws?.year} · Tier {w.tier} · £
                  {Number(w.prize_amount).toFixed(2)}
                </p>
                <p className="text-zinc-500">
                  Verification: {w.verification_status} · Payout: {w.payout_status}
                </p>
                {w.verification_status !== "approved" && (
                  <form action={uploadWinnerProof} className="mt-3 flex gap-2">
                    <input type="hidden" name="winner_id" value={w.id} />
                    <input
                      name="proof_url"
                      placeholder="Proof image URL"
                      className="flex-1 rounded border border-white/15 bg-[#141922] px-2 py-1"
                    />
                    <button type="submit" className="rounded bg-white/10 px-3 py-1">
                      Upload
                    </button>
                  </form>
                )}
              </li>
            ))}
            {winnerList.length === 0 && (
              <li className="text-zinc-500">No winnings yet — keep scoring!</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
