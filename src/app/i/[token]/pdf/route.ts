import { NextResponse } from "next/server";
import { invoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Customer download of their invoice PDF, by the same unguessable token as the invoice page. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token) || !process.env.SUPABASE_SERVICE_ROLE_KEY) return new NextResponse("Not found", { status: 404 });
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = supabaseAdmin();
  const { data: inv } = await admin.from("invoices").select("*, loads(load_no, pickup, dropoff, order_no, trucking_company, truck_number)").eq("public_token", token).maybeSingle();
  if (!inv || ["void", "draft"].includes(inv.status) || inv.archived_at) return new NextResponse("Not found", { status: 404 });
  const { data: items } = await admin.from("invoice_items").select("*").eq("invoice_id", inv.id).order("seq");
  const { data: st } = await admin.from("settings").select("key, value").in("key", ["payment_instructions", "payment_info"]);
  const v = Object.fromEntries((st ?? []).map((r) => [r.key, r.value])) as Record<string, any>;
  const pdf = await invoicePdf(inv, items ?? [], inv.loads, v.payment_info ?? null, v.payment_instructions?.text ?? "");
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${inv.number}.pdf"`, "Cache-Control": "private, no-store" } });
}
