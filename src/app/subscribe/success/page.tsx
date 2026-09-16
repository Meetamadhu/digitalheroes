import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function SubscribeSuccessPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-white">Subscription confirmed</h1>
      <p className="mt-3 text-zinc-400">You can now enter scores and participate in draws.</p>
      <Link
        href="/dashboard"
        className="mt-8 inline-block rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ffb347] px-6 py-3 font-semibold text-[#0c0f14]"
      >
        Open dashboard
      </Link>
    </div>
  );
}
