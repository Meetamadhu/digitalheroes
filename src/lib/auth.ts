import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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

/** Create profile row if auth user exists but trigger did not run (common after late schema migration). */
export async function ensureProfile(userId: string, email?: string | null): Promise<Profile | null> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const row = { id: userId, email: email ?? null };
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (serviceKey) {
    const admin = await createServiceClient();
    const { error } = await admin.from("profiles").upsert(row);
    if (error && error.code !== "23505") return null;
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").insert(row);
    if (error && error.code !== "23505") return null;
  }

  return getProfile(userId);
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login?error=session");

  let profile = await getProfile(user.id);
  if (!profile) {
    profile = await ensureProfile(user.id, user.email);
  }
  if (!profile) redirect("/login?error=profile");

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
