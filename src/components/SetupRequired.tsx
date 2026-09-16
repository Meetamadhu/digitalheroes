import Link from "next/link";

export function SetupRequired({ next }: { next?: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="text-2xl font-semibold text-white">Connect Supabase</h1>
      <p className="mt-4 text-zinc-400">
        Copy <code className="text-[#ffb347]">.env.example</code> to{" "}
        <code className="text-[#ffb347]">.env.local</code>, paste your project URL and anon key
        from the Supabase dashboard, then run{" "}
        <code className="text-[#ffb347]">supabase/schema.sql</code> in the SQL editor.
      </p>
      <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-zinc-500">
        <li>Restart <code>npm run dev</code> after saving env vars.</li>
        <li>Enable Email auth in Supabase.</li>
        <li>Promote an admin: <code>update profiles set role = &apos;admin&apos; …</code></li>
      </ol>
      {next && (
        <p className="mt-6 text-sm text-zinc-500">
          After setup, return to:{" "}
          <Link href={next} className="text-[#ffb347] hover:text-white">
            {next}
          </Link>
        </p>
      )}
      <Link
        href="/"
        className="mt-8 inline-block rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/5"
      >
        Back to home
      </Link>
    </div>
  );
}
