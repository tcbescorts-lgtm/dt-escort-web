import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export async function reportData(from: string, to: string) {
  const sb = await supabaseServer();
  const [{ data: inv }, { data: runs }, { data: sheets }] = await Promise.all([
    sb.from("invoices").select("issue_date, total, amount_paid, bill_to_name, status").neq("status", "void").gte("issue_date", from).lte("issue_date", to),
    sb.from("driver_runs").select("*").gte("run_date", from).lte("run_date", to),
    sb.from("run_sheets").select("invoice_date, total_miles, drivers(full_name)").in("status", ["submitted", "approved"]).gte("invoice_date", from).lte("invoice_date", to),
  ]);
  const months = new Map<string, { month: string; revenue: number; collected: number; miles: number }>();
  const mk = (d: string) => d.slice(0, 7);
  for (const i of inv ?? []) {
    const m = months.get(mk(i.issue_date)) ?? { month: mk(i.issue_date), revenue: 0, collected: 0, miles: 0 };
    m.revenue += Number(i.total);
    m.collected += Number(i.amount_paid);
    months.set(m.month, m);
  }
  for (const s of sheets ?? []) {
    if (!s.invoice_date) continue;
    const m = months.get(mk(s.invoice_date)) ?? { month: mk(s.invoice_date), revenue: 0, collected: 0, miles: 0 };
    m.miles += Number(s.total_miles);
    months.set(m.month, m);
  }
  const byMonth = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));

  const drivers = new Map<string, { name: string; runs: number; loadTotal: number; pay: number; miles: number }>();
  for (const r of (runs ?? []) as any[]) {
    const d = drivers.get(r.driver_name) ?? { name: r.driver_name, runs: 0, loadTotal: 0, pay: 0, miles: 0 };
    d.runs++;
    d.loadTotal += Number(r.load_total);
    d.pay += Number(r.driver_pay);
    drivers.set(r.driver_name, d);
  }
  for (const s of (sheets ?? []) as any[]) {
    const n = s.drivers?.full_name;
    if (n && drivers.has(n)) drivers.get(n)!.miles += Number(s.total_miles);
  }

  const customers = new Map<string, { name: string; runs: number; revenue: number; driverPay: number; gas: number; qp: number }>();
  for (const r of (runs ?? []) as any[]) {
    const k = r.company ?? "Unknown";
    const c = customers.get(k) ?? { name: k, runs: 0, revenue: 0, driverPay: 0, gas: 0, qp: 0 };
    c.runs++;
    c.revenue += Number(r.load_total);
    c.driverPay += Number(r.driver_pay);
    c.gas += Number(r.gas);
    c.qp += Number(r.qp_fee);
    customers.set(k, c);
  }
  return {
    byMonth,
    drivers: [...drivers.values()].sort((a, b) => b.pay - a.pay),
    customers: [...customers.values()].map((c) => ({ ...c, profit: c.revenue - c.driverPay - c.gas - c.qp })).sort((a, b) => b.profit - a.profit),
    receivable: (inv ?? []).reduce((a, i) => a + Math.max(0, Number(i.total) - Number(i.amount_paid)), 0),
  };
}
