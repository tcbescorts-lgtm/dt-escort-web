import { NextResponse } from "next/server";
import { getMe } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { invoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getMe();
  if (!me || me.role === "driver") return new NextResponse("Not allowed", { status: 403 });
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: inv } = await sb.from("invoices").select("*, loads(load_no, pickup, dropoff, order_no, trucking_company, truck_number)").eq("id", id).single();
  if (!inv) return new NextResponse("Not found", { status: 404 });
  const { data: items } = await sb.from("invoice_items").select("*").eq("invoice_id", id).order("seq");
  const { data: pay } = await sb.from("settings").select("value").eq("key", "payment_instructions").maybeSingle();
  const pdf = await invoicePdf(inv, items ?? [], inv.loads, (pay?.value as any)?.text ?? "");
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${inv.number}.pdf"` } });
}
