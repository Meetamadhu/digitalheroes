const PLACEHOLDER_HINTS = [
  "replace-me",
  "your-project",
  "your-anon-key",
  "example.supabase.co",
];

function looksLikePlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return PLACEHOLDER_HINTS.some((hint) => lower.includes(hint));
}

function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.includes("supabase");
  } catch {
    return false;
  }
}

export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  if (looksLikePlaceholder(url) || looksLikePlaceholder(anonKey)) return null;
  if (!isValidSupabaseUrl(url)) return null;
  if (anonKey.length < 20) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
