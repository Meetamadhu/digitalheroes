"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  buildScoreFrequency,
  drawWinningNumbers,
  simulateDraw,
} from "@/lib/draw-engine";
import {
  allocateTierPools,
  computeMonthlyPool,
  splitAmongWinners,
} from "@/lib/prize-pool";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { DrawLogic, PlanType, SubscriptionStatus } from "@/types/database";

async function adminSupabase() {
  await requireAdmin();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) return createServiceClient();
  return createClient();
}

export async function updateUserProfile(formData: FormData): Promise<void> {
  const supabase = await adminSupabase();
  const userId = String(formData.get("user_id") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const subscriptionStatus = String(
    formData.get("subscription_status") ?? "",
  ) as SubscriptionStatus;
  const planType = String(formData.get("plan_type") ?? "") as PlanType | "";

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      subscription_status: subscriptionStatus || undefined,
      plan_type: planType || null,
    })
    .eq("id", userId);

  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/users");
}

export async function adminUpsertScore(formData: FormData): Promise<void> {
  const supabase = await adminSupabase();
  const userId = String(formData.get("user_id") ?? "");
  const score = Number(formData.get("score"));
  const playedOn = String(formData.get("played_on") ?? "");

  const { error } = await supabase.from("golf_scores").upsert(
    { user_id: userId, score, played_on: playedOn },
    { onConflict: "user_id,played_on" },
  );
  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/users");
}

export async function saveCharity(formData: FormData): Promise<void> {
  const supabase = await adminSupabase();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const slug = String(formData.get("slug") ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-");
  const description = String(formData.get("description") ?? "");
  const imageUrl = String(formData.get("image_url") ?? "") || null;
  const featured = formData.get("featured") === "on";

  const payload = { name, slug, description, image_url: imageUrl, featured };
  const { error } = id
    ? await supabase.from("charities").update(payload).eq("id", id)
    : await supabase.from("charities").insert(payload);

  if (error) redirect(`/admin/charities?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/charities");
  revalidatePath("/charities");
}

export async function deleteCharity(formData: FormData): Promise<void> {
  const supabase = await adminSupabase();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("charities").delete().eq("id", id);
  if (error) redirect(`/admin/charities?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/charities");
}

export async function setDrawLogic(formData: FormData): Promise<void> {
  const supabase = await adminSupabase();
  const drawLogic = String(formData.get("draw_logic") ?? "random") as DrawLogic;
  const { error } = await supabase
    .from("platform_settings")
    .update({ draw_logic: drawLogic })
    .eq("id", 1);
  if (error) redirect(`/admin/draws?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/draws");
}

export async function runDrawSimulation(formData: FormData): Promise<void> {
  const supabase = await adminSupabase();
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  const { data: settings } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
  if (!settings) redirect("/admin/draws?error=settings_missing");

  const logic = settings.draw_logic as DrawLogic;
  const { data: scores } = await supabase.from("golf_scores").select("user_id, score");
  const freq = buildScoreFrequency((scores ?? []).map((s) => s.score));
  const winningNumbers = drawWinningNumbers(logic, freq);

  const { data: activeProfiles } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("subscription_status", "active");

  const participants: { userId: string; email: string; scores: number[] }[] = [];
  for (const p of activeProfiles ?? []) {
    const { data: userScores } = await supabase
      .from("golf_scores")
      .select("score")
      .eq("user_id", p.id)
      .order("played_on", { ascending: false })
      .limit(5);
    if ((userScores?.length ?? 0) < 5) continue;
    participants.push({
      userId: p.id,
      email: p.email ?? p.id,
      scores: userScores!.map((s) => s.score),
    });
  }

  const simulation = simulateDraw(winningNumbers, participants);

  const { error: drawErr } = await supabase
    .from("draws")
    .upsert(
      {
        year,
        month,
        winning_numbers: winningNumbers,
        status: "simulated",
        logic_used: logic,
        simulation_snapshot: { winningNumbers, simulation },
      },
      { onConflict: "year,month" },
    )
    .select("*")
    .single();

  if (drawErr) redirect(`/admin/draws?error=${encodeURIComponent(drawErr.message)}`);
  revalidatePath("/admin/draws");
}

export async function publishDraw(formData: FormData): Promise<void> {
  const supabase = await adminSupabase();
  const drawId = String(formData.get("draw_id") ?? "");

  const { data: draw } = await supabase.from("draws").select("*").eq("id", drawId).single();
  if (!draw || draw.status === "published") redirect("/admin/draws?error=invalid_draw");

  const winningNumbers: number[] = draw.winning_numbers ?? [];
  if (winningNumbers.length !== 5) redirect("/admin/draws?error=winning_numbers");

  const { data: settings } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
  if (!settings) redirect("/admin/draws?error=settings_missing");

  const { data: activeSubs } = await supabase
    .from("profiles")
    .select("plan_type")
    .eq("subscription_status", "active")
    .not("plan_type", "is", null);

  const pool = computeMonthlyPool(
    (activeSubs ?? []) as { plan_type: PlanType }[],
    Number(settings.pool_share_percent),
    {
      monthly_price_gbp: Number(settings.monthly_price_gbp),
      yearly_price_gbp: Number(settings.yearly_price_gbp),
    },
  );

  const tiers = allocateTierPools(pool, Number(settings.jackpot_rollover));
  const tierWinners: Record<3 | 4 | 5, string[]> = { 3: [], 4: [], 5: [] };

  const { data: activeProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("subscription_status", "active");

  for (const p of activeProfiles ?? []) {
    const { data: userScores } = await supabase
      .from("golf_scores")
      .select("score")
      .eq("user_id", p.id)
      .order("played_on", { ascending: false })
      .limit(5);
    if ((userScores?.length ?? 0) < 5) continue;

    const scores = userScores!.map((s) => s.score);
    const matchCount = scores.filter((s) => winningNumbers.includes(s)).length;

    await supabase.from("draw_entries").upsert(
      { draw_id: drawId, user_id: p.id, match_count: matchCount },
      { onConflict: "draw_id,user_id" },
    );

    if (matchCount === 5) tierWinners[5].push(p.id);
    else if (matchCount === 4) tierWinners[4].push(p.id);
    else if (matchCount === 3) tierWinners[3].push(p.id);
  }

  let newRollover = Number(settings.jackpot_rollover);
  for (const tier of [5, 4, 3] as const) {
    const winners = tierWinners[tier];
    if (winners.length === 0) {
      if (tier === 5) newRollover += tiers[5];
      continue;
    }
    const amount = splitAmongWinners(tiers[tier], winners.length);
    for (const userId of winners) {
      await supabase.from("draw_winners").insert({
        draw_id: drawId,
        user_id: userId,
        tier,
        prize_amount: amount,
        verification_status: "pending",
        payout_status: "pending",
      });
    }
  }

  await supabase
    .from("draws")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", drawId);

  await supabase.from("platform_settings").update({ jackpot_rollover: newRollover }).eq("id", 1);

  revalidatePath("/admin/draws");
  revalidatePath("/dashboard");
}

export async function verifyWinner(formData: FormData): Promise<void> {
  const supabase = await adminSupabase();
  const winnerId = String(formData.get("winner_id") ?? "");
  const action = String(formData.get("action") ?? "");

  const status = action === "approve" ? "approved" : "rejected";
  const { error } = await supabase
    .from("draw_winners")
    .update({ verification_status: status })
    .eq("id", winnerId);

  if (error) redirect(`/admin/winners?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/winners");
}

export async function markPayoutPaid(formData: FormData): Promise<void> {
  const supabase = await adminSupabase();
  const winnerId = String(formData.get("winner_id") ?? "");
  const { error } = await supabase
    .from("draw_winners")
    .update({ payout_status: "paid" })
    .eq("id", winnerId);
  if (error) redirect(`/admin/winners?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/winners");
  revalidatePath("/dashboard");
}
