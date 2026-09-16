# PRD assumptions (Digital Heroes)

Documented ambiguities resolved for implementation:

1. **Draw numbers** — Five winning integers (1–45) are drawn each month. A subscriber’s five stored Stableford scores are compared; **match count** = how many winning numbers appear among those scores.
2. **Prize pool funding** — `pool_share_percent` (default **30%**) of each active subscription payment feeds the monthly pool; charity takes the user’s chosen % (min 10%); remainder is platform margin.
3. **Tier split** — Of the monthly pool: **40%** tier-5, **35%** tier-4, **25%** tier-3. Unclaimed tier-5 share rolls into `jackpot_rollover` for the next month.
4. **Draw participation** — Active subscribers with five scores on file are entered automatically when a draw is published.
5. **Prices** — Defaults £9.99/month and £99.99/year (configurable in `platform_settings` and Stripe products).
