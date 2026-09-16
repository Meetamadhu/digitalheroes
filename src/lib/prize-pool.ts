import { TIER_SHARES } from "./constants";

export type Tier = 3 | 4 | 5;

export function subscriptionPrice(
  plan: "monthly" | "yearly",
  settings: { monthly_price_gbp: number; yearly_price_gbp: number },
): number {
  return plan === "monthly" ? Number(settings.monthly_price_gbp) : Number(settings.yearly_price_gbp);
}

/** Monthly pool from active subscribers (normalised: yearly plans count as monthly equivalent). */
export function computeMonthlyPool(
  activeSubs: { plan_type: "monthly" | "yearly" }[],
  poolSharePercent: number,
  prices: { monthly_price_gbp: number; yearly_price_gbp: number },
): number {
  let total = 0;
  for (const sub of activeSubs) {
    const price = subscriptionPrice(sub.plan_type, prices);
    const monthlyEquivalent = sub.plan_type === "yearly" ? price / 12 : price;
    total += monthlyEquivalent * (poolSharePercent / 100);
  }
  return roundMoney(total);
}

export function allocateTierPools(totalPool: number, rollover: number): Record<Tier, number> {
  const tier5Base = totalPool * TIER_SHARES[5];
  return {
    5: roundMoney(tier5Base + rollover),
    4: roundMoney(totalPool * TIER_SHARES[4]),
    3: roundMoney(totalPool * TIER_SHARES[3]),
  };
}

export function splitAmongWinners(tierPool: number, winnerCount: number): number {
  if (winnerCount <= 0) return 0;
  return roundMoney(tierPool / winnerCount);
}

export function charityContribution(
  subscriptionAmount: number,
  charityPercent: number,
): number {
  return roundMoney(subscriptionAmount * (charityPercent / 100));
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
