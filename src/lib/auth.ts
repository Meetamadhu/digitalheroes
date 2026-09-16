import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as Profile | null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireUser();
  if (profile.role !== "admin") redirect("/dashboard");
  return { user, profile };
}

export async function requireActiveSubscription() {
  const ctx = await requireUser();
  if (ctx.profile.subscription_status !== "active") {
    redirect("/subscribe");
  }
  return ctx;
}

export function isSubscriptionActive(profile: Profile): boolean {
  return profile.subscription_status === "active";
}
