import { adminUpsertScore, updateUserProfile } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/server";
import type { GolfScore, Profile } from "@/types/database";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", {
    ascending: false,
  });
  const list = (users ?? []) as Profile[];

  const usersWithScores = await Promise.all(
    list.map(async (u) => {
      const { data: scores } = await supabase
        .from("golf_scores")
        .select("*")
        .eq("user_id", u.id)
        .order("played_on", { ascending: false });
      return { user: u, scores: (scores ?? []) as GolfScore[] };
    }),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Users</h1>
      <div className="mt-8 space-y-8">
        {usersWithScores.map(({ user: u, scores: scoreList }) => (
          <article key={u.id} className="rounded-2xl border border-white/10 p-5">
            <p className="font-medium text-white">{u.full_name || u.email}</p>
            <p className="text-xs text-zinc-500">{u.email}</p>
            <form action={updateUserProfile} className="mt-4 grid gap-3 md:grid-cols-4">
              <input type="hidden" name="user_id" value={u.id} />
              <input
                name="full_name"
                defaultValue={u.full_name ?? ""}
                placeholder="Name"
                className="rounded border border-white/15 bg-[#0c0f14] px-2 py-1 text-sm"
              />
              <select
                name="subscription_status"
                defaultValue={u.subscription_status}
                className="rounded border border-white/15 bg-[#0c0f14] px-2 py-1 text-sm"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="cancelled">cancelled</option>
                <option value="lapsed">lapsed</option>
              </select>
              <select
                name="plan_type"
                defaultValue={u.plan_type ?? ""}
                className="rounded border border-white/15 bg-[#0c0f14] px-2 py-1 text-sm"
              >
                <option value="">—</option>
                <option value="monthly">monthly</option>
                <option value="yearly">yearly</option>
              </select>
              <button type="submit" className="rounded bg-white/10 px-3 py-1 text-sm">
                Save profile
              </button>
            </form>
            <form action={adminUpsertScore} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="user_id" value={u.id} />
              <input
                name="score"
                type="number"
                min={1}
                max={45}
                placeholder="Score"
                className="w-20 rounded border border-white/15 bg-[#0c0f14] px-2 py-1 text-sm"
              />
              <input
                name="played_on"
                type="date"
                className="rounded border border-white/15 bg-[#0c0f14] px-2 py-1 text-sm"
              />
              <button type="submit" className="rounded bg-[#ff6b4a]/20 px-3 py-1 text-sm text-[#ffb347]">
                Add score
              </button>
            </form>
            <ul className="mt-3 text-xs text-zinc-500">
              {scoreList.map((s) => (
                <li key={s.id}>
                  {s.played_on}: {s.score}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
