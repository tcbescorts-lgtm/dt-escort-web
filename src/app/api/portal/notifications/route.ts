import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Unread notifications for the signed-in office user created after `after` (ISO time). */
export async function GET(req: NextRequest) {
  const me = await getMe();
  if (!me || me.role === "driver") return NextResponse.json({ items: [] }, { status: 401 });
  const after = req.nextUrl.searchParams.get("after") ?? new Date(Date.now() - 60_000).toISOString();
  const sb = await supabaseServer();
  const { data } = await sb
    .from("notifications")
    .select("id, kind, title, body, link, created_at")
    .is("read_at", null)
    .gt("created_at", after)
    .order("created_at", { ascending: true })
    .limit(10);
  return NextResponse.json({ items: data ?? [], now: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
