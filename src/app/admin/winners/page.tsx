import { markPayoutPaid, verifyWinner } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminWinnersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("draw_winners")
    .select("*, profiles(email, full_name), draws(year, month)")
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    tier: number;
    prize_amount: number;
    proof_url: string | null;
    verification_status: string;
    payout_status: string;
    profiles: { email: string | null; full_name: string | null } | null;
    draws: { year: number; month: number } | null;
  };

  const rows = (data ?? []) as Row[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Winners</h1>
      <div className="mt-8 space-y-4">
        {rows.map((w) => (
          <article key={w.id} className="rounded-2xl border border-white/10 p-5 text-sm">
            <p className="text-white">
              {w.profiles?.full_name || w.profiles?.email} · {w.draws?.month}/{w.draws?.year} · Tier{" "}
              {w.tier} · £{Number(w.prize_amount).toFixed(2)}
            </p>
            <p className="text-zinc-500">
              Proof: {w.proof_url ? (
                <a href={w.proof_url} className="text-[#ffb347] underline" target="_blank" rel="noreferrer">
                  View
                </a>
              ) : (
                "Not uploaded"
              )}
            </p>
            <p className="text-zinc-500">
              Verification: {w.verification_status} · Payout: {w.payout_status}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={verifyWinner}>
                <input type="hidden" name="winner_id" value={w.id} />
                <input type="hidden" name="action" value="approve" />
                <button type="submit" className="rounded bg-green-500/20 px-3 py-1 text-green-400">
                  Approve
                </button>
              </form>
              <form action={verifyWinner}>
                <input type="hidden" name="winner_id" value={w.id} />
                <input type="hidden" name="action" value="reject" />
                <button type="submit" className="rounded bg-red-500/20 px-3 py-1 text-red-400">
                  Reject
                </button>
              </form>
              <form action={markPayoutPaid}>
                <input type="hidden" name="winner_id" value={w.id} />
                <button type="submit" className="rounded bg-white/10 px-3 py-1">
                  Mark paid
                </button>
              </form>
            </div>
          </article>
        ))}
        {rows.length === 0 && <p className="text-zinc-500">No winners recorded yet.</p>}
      </div>
    </div>
  );
}
