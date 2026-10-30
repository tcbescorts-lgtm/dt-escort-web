import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { csv } from "@/lib/format";

/**
 * QuickBooks-friendly CSV exports. Invoice export uses QuickBooks Online's
 * invoice import columns (one row per line item); payments export is a simple ledger.
 */
export async function GET(req: NextRequest) {
  const me = await getMe();
  if (!me || me.role === "driver") return new NextResponse("Not allowed", { status: 403 });
  const type = req.nextUrl.searchParams.get("type") ?? "invoices";
  const sb = await supabaseServer();
  let body = "";
  if (type === "payments") {
    const { data } = await sb.from("payments").select("paid_on, amount, method, reference, source, invoices(number, bill_to_name)").order("paid_on");
    body = csv([
      ["Date", "Customer", "Invoice No", "Amount", "Method", "Reference", "Source"],
      ...(data ?? []).map((p: any) => [p.paid_on, p.invoices?.bill_to_name, p.invoices?.number, Number(p.amount).toFixed(2), p.method, p.reference, p.source]),
    ]);
  } else {
    const { data } = await sb.from("invoices").select("number, bill_to_name, issue_date, due_date, status, total, amount_paid, invoice_items(description, qty, rate, amount, kind), loads(load_no)").neq("status", "void").is("archived_at", null).order("issue_date");
    const rows: (string | number | null)[][] = [["InvoiceNo", "Customer", "InvoiceDate", "DueDate", "ItemDescription", "ItemQuantity", "ItemRate", "ItemAmount", "ServiceType", "LoadNo", "Status", "InvoiceTotal", "AmountPaid"]];
    for (const i of (data ?? []) as any[]) {
      for (const it of i.invoice_items ?? []) {
        rows.push([i.number, i.bill_to_name, i.issue_date, i.due_date, it.description, Number(it.qty), Number(it.rate).toFixed(2), Number(it.amount).toFixed(2), it.kind, i.loads?.load_no, i.status, Number(i.total).toFixed(2), Number(i.amount_paid).toFixed(2)]);
      }
    }
    body = csv(rows);
  }
  return new NextResponse(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="dt-${type}-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
