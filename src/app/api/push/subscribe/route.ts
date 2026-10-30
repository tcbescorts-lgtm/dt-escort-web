import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const me = await getMe();
  if (!me) return new NextResponse("Sign in first", { status: 401 });
  const sub = await req.json().catch(() => null);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return new NextResponse("Bad subscription", { status: 400 });
  const sb = await supabaseServer();
  await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  const { error } = await sb.from("push_subscriptions").insert({ user_id: me.id, endpoint: sub.endpoint, keys: sub.keys });
  return error ? new NextResponse(error.message, { status: 400 }) : NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const me = await getMe();
  if (!me) return new NextResponse("Sign in first", { status: 401 });
  const { endpoint } = await req.json().catch(() => ({}));
  const sb = await supabaseServer();
  await sb.from("push_subscriptions").delete().eq("endpoint", endpoint ?? "");
  return NextResponse.json({ ok: true });
}
