import Link from "next/link";
import { SetupRequired } from "@/components/SetupRequired";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Charity } from "@/types/database";

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupRequired next="/charities" />;

  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("charities").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  const { data } = await query;
  const charities = (data ?? []) as Charity[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="text-3xl font-semibold text-white">Charity directory</h1>
      <p className="mt-2 text-zinc-400">Search partners and explore upcoming events.</p>
      <form className="mt-6 max-w-md">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name…"
          className="w-full rounded-xl border border-white/15 bg-[#141922] px-4 py-3 text-white placeholder:text-zinc-500"
        />
      </form>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {charities.map((c) => (
          <Link
            key={c.id}
            href={`/charities/${c.slug}`}
            className="rounded-2xl border border-white/10 p-5 hover:border-[#ff6b4a]/40 transition"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-white">{c.name}</h2>
              {c.featured && (
                <span className="rounded-full bg-[#ffb347]/20 px-2 py-0.5 text-xs text-[#ffb347]">
                  Featured
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
