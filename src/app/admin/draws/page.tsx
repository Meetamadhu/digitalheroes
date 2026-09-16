import { publishDraw, runDrawSimulation, setDrawLogic } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/server";
import type { Draw } from "@/types/database";

export default async function AdminDrawsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
  const { data: draws } = await supabase
    .from("draws")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Draw management</h1>
      <form action={setDrawLogic} className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-zinc-500">Default draw logic</label>
          <select
            name="draw_logic"
            defaultValue={settings?.draw_logic ?? "random"}
            className="mt-1 block rounded border border-white/15 bg-[#0c0f14] px-3 py-2 text-sm"
          >
            <option value="random">Random</option>
            <option value="algorithmic">Algorithmic (score-weighted)</option>
          </select>
        </div>
        <button type="submit" className="rounded bg-white/10 px-4 py-2 text-sm">
          Save logic
        </button>
      </form>

      <form action={runDrawSimulation} className="mt-8 rounded-2xl border border-white/10 p-5">
        <h2 className="font-medium text-white">Simulate monthly draw</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            name="year"
            type="number"
            defaultValue={defaultYear}
            className="w-28 rounded border border-white/15 bg-[#0c0f14] px-2 py-1"
          />
          <input
            name="month"
            type="number"
            min={1}
            max={12}
            defaultValue={defaultMonth}
            className="w-20 rounded border border-white/15 bg-[#0c0f14] px-2 py-1"
          />
          <button type="submit" className="rounded bg-[#4ecdc4]/20 px-4 py-2 text-sm text-[#4ecdc4]">
            Run simulation
          </button>
        </div>
      </form>

      <div className="mt-10 space-y-6">
        {(draws ?? []).map((d) => {
          const draw = d as Draw;
          const snapshot = draw.simulation_snapshot as {
            winningNumbers?: number[];
            simulation?: { email: string; matchCount: number; scores: number[] }[];
          } | null;
          return (
            <article key={draw.id} className="rounded-2xl border border-white/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg text-white">
                  {draw.month}/{draw.year} · {draw.status}
                </h3>
                {draw.status !== "published" && (
                  <form action={publishDraw}>
                    <input type="hidden" name="draw_id" value={draw.id} />
                    <button
                      type="submit"
                      className="rounded bg-gradient-to-r from-[#ff6b4a] to-[#ffb347] px-4 py-2 text-sm font-medium text-[#0c0f14]"
                    >
                      Publish results
                    </button>
                  </form>
                )}
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Numbers: {(draw.winning_numbers ?? []).join(", ") || "—"} · Logic:{" "}
                {draw.logic_used ?? "—"}
              </p>
              {snapshot?.simulation && (
                <ul className="mt-4 max-h-48 overflow-y-auto text-xs text-zinc-500">
                  {snapshot.simulation.slice(0, 15).map((row) => (
                    <li key={row.email}>
                      {row.email}: {row.matchCount} matches [{row.scores.join(", ")}]
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
        {(draws ?? []).length === 0 && (
          <p className="text-zinc-500">No draws yet. Run a simulation to begin.</p>
        )}
      </div>
    </div>
  );
}
