import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPrefixes = ["/dashboard", "/subscribe", "/subscribe/checkout-success"];
const adminPrefix = "/admin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const env = getSupabaseEnv();
  const response = await updateSession(request);

  if (!env) {
    const needsAuth =
      protectedPrefixes.some((p) => pathname.startsWith(p)) ||
      pathname.startsWith(adminPrefix);
    if (needsAuth && pathname !== "/setup") {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  const { createServerClient } = await import("@supabase/ssr");
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsAuth =
    protectedPrefixes.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith(adminPrefix);

  if (needsAuth && !user && pathname !== "/login" && pathname !== "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith(adminPrefix) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
