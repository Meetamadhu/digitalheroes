import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Charity } from "@/types/database";

export default async function HomePage() {
  let featured: Charity[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("charities").select("*").eq("featured", true).limit(2);
    featured = (data ?? []) as Charity[];
  }

  return (
    <div className="overflow-hidden">
      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 md:px-6 md:pt-24">
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#ff6b4a]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-[#4ecdc4]/10 blur-3xl" />
        {!isSupabaseConfigured() && (
          <div className="relative mb-8 rounded-xl border border-[#ffb347]/40 bg-[#ffb347]/10 px-4 py-3 text-sm text-[#ffd9a0]">
            Supabase is not configured yet.{" "}
            <a href="/setup" className="font-medium underline hover:text-white">
              View setup steps
            </a>
          </div>
        )}
        <div className="relative animate-fade-up max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-[#ffb347]">
            Charity first · Performance powered
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
            Your rounds fuel causes you care about — and monthly draws that reward your game.
          </h1>
          <p className="mt-6 text-lg text-zinc-400 md:text-xl">
            Subscribe, log your last five Stableford scores, pick a charity for at least 10% of
            your fee, and enter automatic prize pools every month. No plaid. No fairway clichés.
            Just impact and momentum.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ffb347] px-8 py-3 font-semibold text-[#0c0f14] shadow-lg shadow-[#ff6b4a]/25 hover:brightness-110 transition"
            >
              Start your subscription
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-white/20 px-8 py-3 font-medium text-white hover:bg-white/5 transition"
            >
              See how you win
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#141922]/50 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3 md:px-6">
          {[
            {
              title: "Subscribe & give",
              body: "Choose monthly or yearly billing. Direct 10%+ of your subscription to a charity you select.",
            },
            {
              title: "Track five scores",
              body: "Enter Stableford scores (1–45). We keep your latest five — one entry per date.",
            },
            {
              title: "Win monthly pools",
              body: "Matching draw numbers against your scores unlocks tiered prizes with jackpot rollover.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-[#0c0f14] p-6 hover:border-[#ff6b4a]/40 transition-colors"
            >
              <h2 className="text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Spotlight charities</h2>
              <p className="mt-1 text-zinc-400">Where your subscription makes noise beyond the course.</p>
            </div>
            <Link href="/charities" className="text-sm text-[#ffb347] hover:text-white">
              View directory →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((c) => (
              <Link
                key={c.id}
                href={`/charities/${c.slug}`}
                className="group rounded-2xl border border-white/10 bg-gradient-to-br from-[#141922] to-[#0c0f14] p-6 hover:border-[#4ecdc4]/40 transition"
              >
                <h3 className="text-xl font-semibold text-white group-hover:text-[#ffb347] transition-colors">
                  {c.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
