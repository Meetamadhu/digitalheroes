import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/types/database";

type Props = {
  profile: Profile | null;
};

export function SiteHeader({ profile }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c0f14]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#ffb347] text-sm font-bold text-[#0c0f14]">
            DH
          </span>
          <span className="text-lg font-semibold tracking-tight text-white group-hover:text-[#ffb347] transition-colors">
            digital.HEROES
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <Link href="/charities" className="hover:text-white transition-colors">
            Charities
          </Link>
          <Link href="/how-it-works" className="hover:text-white transition-colors">
            How it works
          </Link>
          {profile?.role === "admin" && (
            <Link href="/admin" className="text-[#ffb347] hover:text-white transition-colors">
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
              >
                Dashboard
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full bg-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/15 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-zinc-300 hover:text-white">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ff8f6b] px-4 py-2 text-sm font-medium text-[#0c0f14] shadow-lg shadow-[#ff6b4a]/20 hover:brightness-110 transition"
              >
                Subscribe
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
