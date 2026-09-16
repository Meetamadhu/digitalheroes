import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";

const protectedPrefixes = ["/dashboard", "/subscribe", "/subscribe/checkout-success"];
const adminPrefix = "/admin";

function shouldSkipMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname === "/favicon.ico" ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function needsAuth(pathname: string): boolean {
  return (
    protectedPrefixes.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith(adminPrefix)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  try {
    const env = getSupabaseEnv();

    if (!env) {
      if (needsAuth(pathname) && pathname !== "/setup") {
        const url = request.nextUrl.clone();
        url.pathname = "/setup";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      // Stale or invalid session cookie — continue as logged out
      if (needsAuth(pathname) && pathname !== "/login" && pathname !== "/signup") {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (needsAuth(pathname) && !user && pathname !== "/login" && pathname !== "/signup") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Admin role is enforced in src/app/admin/layout.tsx (Node runtime)
    return supabaseResponse;
  } catch {
    // Never fail the whole site if middleware throws (Edge + Supabase hiccups)
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
