import { DRAW_NUMBER_COUNT, MAX_SCORES, TIER_SHARES } from "@/lib/constants";

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-semibold text-white">How draws & prizes work</h1>
      <p className="mt-4 text-zinc-400">
        Each month the platform draws {DRAW_NUMBER_COUNT} winning numbers between 1 and 45. Your
        five stored Stableford scores are compared — each matching number counts toward your tier.
      </p>
      <ul className="mt-8 space-y-4 text-sm text-zinc-300">
        <li className="rounded-xl border border-white/10 bg-[#141922] p-4">
          <strong className="text-white">3-number match</strong> — {TIER_SHARES[3] * 100}% of the
          monthly prize pool, split equally among winners.
        </li>
        <li className="rounded-xl border border-white/10 bg-[#141922] p-4">
          <strong className="text-white">4-number match</strong> — {TIER_SHARES[4] * 100}% of the
          pool, split equally.
        </li>
        <li className="rounded-xl border border-white/10 bg-[#141922] p-4">
          <strong className="text-white">5-number match (jackpot)</strong> — {TIER_SHARES[5] * 100}
          % plus any rollover from previous months if unclaimed.
        </li>
      </ul>
      <p className="mt-8 text-sm text-zinc-500">
        Active subscribers with {MAX_SCORES} scores on file are entered when results are published.
        Winners upload score proof for admin verification before payouts move from Pending to Paid.
      </p>
    </div>
  );
}
