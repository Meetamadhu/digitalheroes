"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MIN_CHARITY_PERCENT } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function signUp(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/setup");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const charityId = String(formData.get("charity_id") ?? "");
  const charityPercent = Number(formData.get("charity_percent") ?? MIN_CHARITY_PERCENT);

  if (!email || !password || !charityId) {
    redirect("/signup?error=missing_fields");
  }
  if (charityPercent < MIN_CHARITY_PERCENT || charityPercent > 100) {
    redirect("/signup?error=charity_percent");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  if (!data.user) redirect("/signup?error=signup_failed");

  await ensureProfile(data.user.id, data.user.email);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      charity_id: charityId,
      charity_percent: charityPercent,
    })
    .eq("id", data.user.id);

  if (profileError) redirect(`/signup?error=${encodeURIComponent(profileError.message)}`);

  redirect("/subscribe");
}

export async function signIn(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/setup");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  if (data.user) {
    await ensureProfile(data.user.id, data.user.email);
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
