"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { MIN_CHARITY_PERCENT } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function updateCharitySettings(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const charityId = String(formData.get("charity_id") ?? "");
  const charityPercent = Number(formData.get("charity_percent") ?? MIN_CHARITY_PERCENT);

  if (!charityId) redirect("/dashboard?error=charity_required");
  if (charityPercent < MIN_CHARITY_PERCENT || charityPercent > 100) {
    redirect("/dashboard?error=charity_percent");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ charity_id: charityId, charity_percent: charityPercent })
    .eq("id", user.id);

  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard");
}

export async function recordStandaloneDonation(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const charityId = String(formData.get("charity_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  if (!charityId || amount <= 0) redirect("/dashboard?error=donation_invalid");

  const supabase = await createClient();
  const { error } = await supabase.from("standalone_donations").insert({
    user_id: user.id,
    charity_id: charityId,
    amount,
  });

  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard");
}
