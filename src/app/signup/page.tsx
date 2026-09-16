import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { SetupRequired } from "@/components/SetupRequired";
import { MIN_CHARITY_PERCENT } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Charity } from "@/types/database";

export default async function SignUpPage() {
  if (!isSupabaseConfigured()) return <SetupRequired next="/signup" />;

  const supabase = await createClient();
  const { data } = await supabase.from("charities").select("id, name").order("name");
  const charities = (data ?? []) as Pick<Charity, "id" | "name">[];

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-white">Create your account</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Pick your charity and contribution — minimum {MIN_CHARITY_PERCENT}% of your subscription.
      </p>
      <form action={signUp} className="mt-8 space-y-4">
        <div>
          <label className="text-sm text-zinc-400">Full name</label>
          <input
            name="full_name"
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#141922] px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-400">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#141922] px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-400">Password</label>
          <input
            name="password"
            type="password"
            minLength={8}
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#141922] px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-400">Charity</label>
          <select
            name="charity_id"
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#141922] px-4 py-3 text-white"
          >
            <option value="">Select…</option>
            {charities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-zinc-400">Charity contribution (%)</label>
          <input
            name="charity_percent"
            type="number"
            min={MIN_CHARITY_PERCENT}
            max={100}
            defaultValue={10}
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#141922] px-4 py-3 text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#ffb347] py-3 font-semibold text-[#0c0f14]"
        >
          Continue to subscribe
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Already registered?{" "}
        <Link href="/login" className="text-[#ffb347] hover:text-white">
          Log in
        </Link>
      </p>
    </div>
  );
}
