import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = new Set<string>(["/login", "/signup"]);

function isPublicRoutePath(pathname: string) {
  if (pathname.startsWith("/auth/callback")) return true;
  // Public booking pages
  if (pathname.startsWith("/book/")) return true;
  return false;
}

function isPublicAssetPath(pathname: string) {
  if (pathname === "/site.webmanifest") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  return pathname.includes(".");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/public") ||
    isPublicAssetPath(pathname)
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname) || isPublicRoutePath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const cookieLocale = request.cookies.get("crm_locale")?.value;
  const profileRes = await supabase
    .from("user_profiles")
    .select("locale")
    .eq("id", session.user.id)
    .maybeSingle();

  const profileLocale = profileRes.data?.locale as string | undefined;
  if ((profileLocale === "en" || profileLocale === "th") && profileLocale !== cookieLocale) {
    response.cookies.set("crm_locale", profileLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
