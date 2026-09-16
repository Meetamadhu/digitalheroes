"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function uploadWinnerProof(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const winnerId = String(formData.get("winner_id") ?? "");
  const proofUrl = String(formData.get("proof_url") ?? "").trim();

  if (!winnerId || !proofUrl) redirect("/dashboard?error=proof_required");

  const supabase = await createClient();
  const { data: winner } = await supabase
    .from("draw_winners")
    .select("id, user_id")
    .eq("id", winnerId)
    .maybeSingle();

  if (!winner || winner.user_id !== user.id) redirect("/dashboard?error=winner_not_found");

  const { error } = await supabase
    .from("draw_winners")
    .update({ proof_url: proofUrl, verification_status: "pending" })
    .eq("id", winnerId);

  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard");
}
