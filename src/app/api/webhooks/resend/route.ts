import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Verifies Resend's (Svix) signature: HMAC-SHA256 of "id.timestamp.body" with the whsec_ secret. */
function verify(body: string, h: Headers, secret: string) {
  const id = h.get("svix-id"), ts = h.get("svix-timestamp"), sigs = h.get("svix-signature");
  if (!id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sigs.split(" ").some((s) => {
    const [, sig] = s.split(",");
    if (!sig) return false;
    const got = Buffer.from(sig, "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

const MAP: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "viewed",
  "email.bounced": "failed",
  "email.failed": "failed",
  "email.complained": "failed",
};

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const body = await req.text();
  if (!secret || !verify(body, req.headers, secret)) return new NextResponse("Invalid signature", { status: 401 });
  const evt = JSON.parse(body) as { type: string; data: { email_id?: string; to?: string[] } };
  const emailId = evt.data?.email_id;
  if (!emailId) return NextResponse.json({ ok: true });
  const admin = supabaseAdmin();
  const { data: inv } = await admin.from("invoices").select("id, status").eq("resend_email_id", emailId).maybeSingle();
  await admin.from("email_events").insert({ invoice_id: inv?.id ?? null, resend_email_id: emailId, type: evt.type, payload: evt.data });
  if (evt.type === "email.complained" && evt.data.to?.[0]) {
    await admin.from("suppression_list").upsert({ email: evt.data.to[0].toLowerCase(), reason: "complaint" });
  }
  const next = MAP[evt.type];
  if (inv && next && !["paid", "partial", "void"].includes(inv.status)) {
    // Don't step backwards (viewed -> delivered).
    const rank = ["draft", "sent", "delivered", "viewed"];
    if (next === "failed" || rank.indexOf(next) > rank.indexOf(inv.status)) {
      await admin.from("invoices").update({ status: next, ...(next === "viewed" ? { viewed_at: new Date().toISOString() } : {}) }).eq("id", inv.id);
    }
  }
  return NextResponse.json({ ok: true });
}
