import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { csv } from "@/lib/format";

export async function GET(req: NextRequest) {
  const me = await getMe();
  if (!me || me.role === "driver") return new NextResponse("Not allowed", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const sb = await supabaseServer();
  let q = sb.from("driver_runs").select("*").order("run_date");
  let advances = 0;
  if (sp.get("settlement")) {
    q = q.eq("settlement_id", sp.get("settlement")!);
    const { data } = await sb.from("driver_settlements").select("cash_advances").eq("id", sp.get("settlement")!).single();
    advances = Number(data?.cash_advances ?? 0);
  } else {
    q = q.eq("driver_id", sp.get("driver") ?? "").gte("run_date", sp.get("from") ?? "1900-01-01").lte("run_date", sp.get("to") ?? "2999-12-31");
  }
  const { data } = await q;
  const rows = (data ?? []) as any[];
  const f = (n: number) => n.toFixed(2);
  const subtotal = rows.reduce((a, r) => a + Number(r.driver_pay), 0);
  const body = csv([
    ["Driver", rows[0]?.driver_name ?? ""],
    [],
    ["Date", "Position", "Location", "Load total", "Paid to driver", "Gas", "QP fee", "Profit", "Client type", "Company", "Inv No.", "Split %"],
    ...rows.map((r) => [r.run_date, r.positions, r.location, f(+r.load_total), f(+r.driver_pay), f(+r.gas), f(+r.qp_fee), f(+r.load_total - +r.driver_pay - +r.gas - +r.qp_fee), r.client_type, r.company, r.invoice_no, r.split_pct]),
    [],
    ["", "", "Subtotal", "", f(subtotal)],
    ["", "", "Cash advances", "", f(advances)],
    ["", "", "Due to driver", "", f(subtotal - advances)],
  ]);
  return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="driver-runs.csv"` } });
}
