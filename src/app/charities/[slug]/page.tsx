import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupRequired } from "@/components/SetupRequired";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Charity } from "@/types/database";

export default async function CharityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) return <SetupRequired next={`/charities/${slug}`} />;

  const supabase = await createClient();
  const { data } = await supabase.from("charities").select("*").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  const charity = data as Charity;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <Link href="/charities" className="text-sm text-[#ffb347] hover:text-white">
        ← All charities
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-white">{charity.name}</h1>
      <p className="mt-6 leading-relaxed text-zinc-300">{charity.description}</p>
      {charity.events?.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Upcoming events</h2>
          <ul className="mt-4 space-y-3">
            {charity.events.map((ev) => (
              <li
                key={`${ev.title}-${ev.date}`}
                className="rounded-xl border border-white/10 bg-[#141922] px-4 py-3 text-sm"
              >
                <span className="font-medium text-white">{ev.title}</span>
                <span className="text-zinc-400">
                  {" "}
                  · {ev.date}
                  {ev.location ? ` · ${ev.location}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
