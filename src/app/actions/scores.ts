"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { MAX_SCORES, SCORE_MAX, SCORE_MIN } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

function validateScore(score: number, playedOn: string) {
  if (!playedOn) return "Date is required.";
  if (!Number.isInteger(score) || score < SCORE_MIN || score > SCORE_MAX) {
    return `Score must be between ${SCORE_MIN} and ${SCORE_MAX}.`;
  }
  return null;
}

export async function upsertScore(formData: FormData): Promise<void> {
  const { user, profile } = await requireUser();
  if (profile.subscription_status !== "active") {
    redirect("/subscribe");
  }

  const score = Number(formData.get("score"));
  const playedOn = String(formData.get("played_on") ?? "");
  const err = validateScore(score, playedOn);
  if (err) redirect(`/dashboard?error=${encodeURIComponent(err)}`);

  const supabase = await createClient();
  const { error } = await supabase.from("golf_scores").upsert(
    { user_id: user.id, score, played_on: playedOn },
    { onConflict: "user_id,played_on" },
  );
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);

  const { data: rows } = await supabase
    .from("golf_scores")
    .select("id, played_on")
    .eq("user_id", user.id)
    .order("played_on", { ascending: true });

  if (rows && rows.length > MAX_SCORES) {
    const toRemove = rows.slice(0, rows.length - MAX_SCORES);
    await supabase
      .from("golf_scores")
      .delete()
      .in(
        "id",
        toRemove.map((r) => r.id),
      );
  }

  revalidatePath("/dashboard");
}

export async function deleteScore(formData: FormData): Promise<void> {
  const { user, profile } = await requireUser();
  if (profile.subscription_status !== "active") redirect("/subscribe");

  const scoreId = String(formData.get("score_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("golf_scores")
    .delete()
    .eq("id", scoreId)
    .eq("user_id", user.id);
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
}
