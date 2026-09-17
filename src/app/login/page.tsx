import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { SetupRequired } from "@/components/SetupRequired";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function loginErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  try {
    return decodeURIComponent(code);
  } catch {
    return code;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const errorMessage = loginErrorMessage(error);

  if (!isSupabaseConfigured()) {
    return <SetupRequired next={next ?? "/dashboard"} />;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-zinc-400">Log in to manage scores, draws, and giving.</p>

      {errorMessage && (
        <div
          className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error === "session" && "Please log in to continue."}
          {error === "profile" &&
            "Your account exists but the profile row is missing. Try again — we auto-create it on login. If this persists, sign up once more or contact support."}
          {error !== "session" && error !== "profile" && errorMessage}
        </div>
      )}

      <form action={signIn} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <div>
          <label className="text-sm text-zinc-400">Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#141922] px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-400">Password</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
      <p className="mt-4 text-center text-xs text-zinc-600">
        If login fails with &quot;Email not confirmed&quot;, disable confirm email in Supabase →
        Authentication → Providers, or confirm via the link in your inbox.
      </p>
    </div>
  );
}
