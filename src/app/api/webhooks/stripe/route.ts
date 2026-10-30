import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Marks invoices paid when a Stripe payment link checkout completes (card, or ACH once it clears). */
export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY, secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !secret) return new NextResponse("Stripe not configured", { status: 503 });
  const stripe = new Stripe(key);
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status !== "paid") return NextResponse.json({ ok: true, pending: true });
    const admin = supabaseAdmin();
    const linkId = typeof s.payment_link === "string" ? s.payment_link : s.payment_link?.id;
    let invoiceId = (s.metadata?.invoice_id as string) || null;
    if (!invoiceId && linkId) {
      const { data } = await admin.from("invoices").select("id").eq("stripe_payment_link_id", linkId).maybeSingle();
      invoiceId = data?.id ?? null;
    }
    if (invoiceId) {
      const { data: dup } = await admin.from("payments").select("id").eq("reference", s.id).maybeSingle();
      if (!dup) {
        await admin.from("payments").insert({
          invoice_id: invoiceId,
          amount: (s.amount_total ?? 0) / 100,
          method: "stripe",
          paid_on: new Date().toISOString().slice(0, 10),
          reference: s.id,
          source: "stripe",
        });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
