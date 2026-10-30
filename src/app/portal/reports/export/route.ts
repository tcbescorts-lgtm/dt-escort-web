import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/auth";
import { csv } from "@/lib/format";
import { reportData } from "../data";

export async function GET(req: NextRequest) {
  const me = await getMe();
  if (!me || me.role !== "owner") return new NextResponse("Not allowed", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const r = await reportData(sp.get("from") ?? "1900-01-01", sp.get("to") ?? "2999-12-31");
  const f = (n: number) => n.toFixed(2);
  const report = sp.get("report");
  const rows =
    report === "drivers"
      ? [["Driver", "Runs", "Miles", "Load totals", "Driver pay"], ...r.drivers.map((d) => [d.name, d.runs, d.miles, f(d.loadTotal), f(d.pay)])]
      : report === "customers"
        ? [["Customer", "Runs", "Revenue", "Driver pay", "Gas", "QP fees", "Profit"], ...r.customers.map((c) => [c.name, c.runs, f(c.revenue), f(c.driverPay), f(c.gas), f(c.qp), f(c.profit)])]
        : [["Month", "Invoiced", "Collected", "Miles"], ...r.byMonth.map((m) => [m.month, f(m.revenue), f(m.collected), m.miles])];
  return new NextResponse(csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="dt-report-${report ?? "revenue"}.csv"` } });
}
