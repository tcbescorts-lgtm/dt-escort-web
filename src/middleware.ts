import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/portal", "/driver", "/account"];
const IDLE_LIMIT_MS = { staff: 8 * 3600_000, driver: 12 * 3600_000 };

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const needsAuth = PROTECTED.some((p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + "/"));
  if (!url || !anon) {
    if (needsAuth) return NextResponse.redirect(new URL("/login?setup=1", req.url));
    return NextResponse.next();
  }

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (needsAuth && !user) {
    const to = new URL("/login", req.url);
    to.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(to);
  }

  if (user && needsAuth) {
    // Idle timeout: 8 h for office staff, 12 h for drivers.
    const role = (user.user_metadata?.role as string) === "driver" ? "driver" : "staff";
    const last = Number(req.cookies.get("dt-last")?.value ?? 0);
    if (last && Date.now() - last > IDLE_LIMIT_MS[role]) {
      await supabase.auth.signOut();
      const to = new URL("/login?timeout=1", req.url);
      const out = NextResponse.redirect(to);
      res.cookies.getAll().forEach((c) => out.cookies.set(c));
      out.cookies.delete("dt-last");
      return out;
    }
    res.cookies.set("dt-last", String(Date.now()), { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  }
  return res;
}

export const config = {
  matcher: ["/portal/:path*", "/driver/:path*", "/account/:path*", "/login", "/auth/:path*"],
};
