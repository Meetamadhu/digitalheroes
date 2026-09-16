export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "lapsed";
export type PlanType = "monthly" | "yearly";
export type DrawLogic = "random" | "algorithmic";
export type DrawStatus = "draft" | "simulated" | "published";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "user" | "admin";
  charity_id: string | null;
  charity_percent: number;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  plan_type: PlanType | null;
  subscription_renews_at: string | null;
  created_at: string;
};

export type Charity = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  featured: boolean;
  events: { title: string; date: string; location?: string }[];
  created_at: string;
};

export type GolfScore = {
  id: string;
  user_id: string;
  score: number;
  played_on: string;
  created_at: string;
};

export type Draw = {
  id: string;
  year: number;
  month: number;
  winning_numbers: number[];
  status: DrawStatus;
  logic_used: DrawLogic | null;
  simulation_snapshot: unknown;
  published_at: string | null;
};

export type DrawWinner = {
  id: string;
  draw_id: string;
  user_id: string;
  tier: 3 | 4 | 5;
  prize_amount: number;
  proof_url: string | null;
  verification_status: "pending" | "approved" | "rejected" | "not_required";
  payout_status: "pending" | "paid";
  created_at: string;
};

export type PlatformSettings = {
  id: number;
  draw_logic: DrawLogic;
  jackpot_rollover: number;
  monthly_price_gbp: number;
  yearly_price_gbp: number;
  pool_share_percent: number;
};
