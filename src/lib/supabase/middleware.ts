import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッションリフレッシュ
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証ガード: /dashboard 以下は未ログイン時に /login へ
  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/daily") ||
    pathname.startsWith("/monthly") ||
    pathname.startsWith("/partners") ||
    pathname.startsWith("/reps") ||
    pathname.startsWith("/offices") ||
    pathname.startsWith("/targets") ||
    pathname.startsWith("/import") ||
    pathname.startsWith("/settings");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 既ログインで /login へ来たら /daily へ
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/daily";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
