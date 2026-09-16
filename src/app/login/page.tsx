import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { SetupRequired } from "@/components/SetupRequired";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  if (!isSupabaseConfigured()) {
    return <SetupRequired next={next ?? "/dashboard"} />;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-zinc-400">Log in to manage scores, draws, and giving.</p>
      <form action={signIn} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
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
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#141922] px-4 py-3 text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#ffb347] py-3 font-semibold text-[#0c0f14]"
        >
          Log in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        No account?{" "}
        <Link href="/signup" className="text-[#ffb347] hover:text-white">
          Sign up
        </Link>
      </p>
    </div>
  );
}
