import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { company } from "@/lib/site";

export const runtime = "nodejs";

const eq = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

/**
 * Quo (formerly OpenPhone) signs webhooks one of two ways:
 *  - current: webhook-id / webhook-timestamp / webhook-signature ("v1,<b64>"), HMAC of "id.ts.body", whsec_ secret
 *  - legacy (created in the Quo app): openphone-signature "hmac;1;<ts>;<b64>", HMAC of "ts.body", base64 secret
 */
function verify(body: string, h: Headers, secret: string) {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const legacy = h.get("openphone-signature");
  if (legacy) {
    return legacy.split(",").some((part) => {
      const [scheme, , ts, sig] = part.trim().split(";");
      if (scheme !== "hmac" || !ts || !sig) return false;
      return eq(Buffer.from(sig, "base64"), createHmac("sha256", key).update(`${ts}.${body}`).digest());
    });
  }
  const id = h.get("webhook-id"), ts = h.get("webhook-timestamp"), sigs = h.get("webhook-signature");
  if (!id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sigs.split(" ").some((s) => {
    const [v, sig] = s.split(",");
    return v === "v1" && !!sig && eq(Buffer.from(sig, "base64"), expected);
  });
}

function kindOf(type: string) {
  if (type.startsWith("message.")) return "message";
  if (type === "call.missed") return "missed_call";
  if (type.includes("voicemail")) return "voicemail";
  if (type.startsWith("call.")) return "call";
  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.QUO_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const body = await req.text();
  if (!verify(body, req.headers, secret)) return NextResponse.json({ error: "Bad signature" }, { status: 401 });

  const evt = JSON.parse(body);
  const type: string = evt.type ?? "";
  const kind = kindOf(type);
  if (!kind) return NextResponse.json({ ok: true, ignored: type });

  // Works with both payload versions: data.resource + data.context (2026-03-30) or data.object (legacy).
  const r = evt.data?.resource ?? evt.data?.object ?? {};
  const c = evt.data?.context ?? {};
  const workspace: string | undefined = c.participants?.workspace?.[0];
  const external: string | undefined = c.participants?.external?.[0];
  const from = r.from ?? c.senderIdentifier ?? (r.direction === "outgoing" ? workspace : external) ?? null;
  const to = (Array.isArray(r.to) ? r.to[0] : r.to) ?? c.recipientIdentifiers?.[0] ?? (r.direction === "outgoing" ? external : workspace) ?? null;

  // Only keep activity on D & T's own line (other numbers in the same Quo workspace are ignored).
  const last10 = (n: string | null | undefined) => (n ?? "").replace(/\D/g, "").slice(-10);
  const ours = last10(process.env.QUO_ONLY_NUMBER || company.phoneE164);
  const ourSide = workspace ?? (r.direction === "outgoing" ? from : to);
  if (ours && last10(ourSide) !== ours) return NextResponse.json({ ok: true, ignored: "other number" });

  const admin = supabaseAdmin();
  const { error } = await admin.from("comms").upsert(
    {
      provider: "quo",
      external_id: String(r.id ?? evt.id),
      event_type: type,
      kind,
      direction: r.direction ?? (type === "call.missed" ? "incoming" : null),
      from_number: from,
      to_number: to,
      body: r.text ?? r.body ?? r.transcript ?? null,
      duration_seconds: r.duration ?? null,
      recording_url: r.recordingUrl ?? null,
      status: r.status ?? null,
      occurred_at: r.createdAt ?? evt.createdAt ?? new Date().toISOString(),
      payload: evt,
    },
    { onConflict: "provider,external_id,event_type", ignoreDuplicates: true },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
