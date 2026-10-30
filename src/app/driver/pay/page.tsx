import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/portal/ui";
import { date, money } from "@/lib/format";

export const metadata = { title: "Pay" };

export default async function DriverPay() {
  const me = await requireDriver();
  const sb = await supabaseServer();
  const [{ data: runs }, { data: statements }] = await Promise.all([
    sb.from("driver_runs").select("run_sheet_id, run_date, location, load_no, load_total, qp_fee, gas, split_pct, driver_pay, invoice_no, settlement_id, status").eq("driver_id", me.driverId).order("run_date", { ascending: false }).limit(200),
    sb.from("driver_settlements").select("*").eq("driver_id", me.driverId).order("period_end", { ascending: false }),
  ]);
  const unpaid = (runs ?? []).filter((r) => !r.settlement_id);
  const sum = (l: any[]) => l.reduce((a, r) => a + Number(r.driver_pay), 0);
  return (
    <>
      <h1 className="display-2">Pay</h1>
      <p className="mt-1 text-muted">Your pay per run = (load total − quick pay fee − gas) × your split.</p>

      <section aria-labelledby="unpaid" className="mt-5 rounded-md border border-rule p-4">
        <h2 id="unpaid" className="text-lg font-semibold">Not paid out yet</h2>
        <p className="text-xl font-bold">{money(sum(unpaid))}</p>
        <ul className="mt-3 divide-y divide-rule">
          {unpaid.map((r) => (
            <li key={r.run_sheet_id} className="py-2">
              <p className="font-medium">{r.location}</p>
              <p className="text-sm text-muted">{r.load_no} · {date(r.run_date)} · {r.status === "approved" ? "approved" : "waiting for approval"}{r.invoice_no ? ` · invoice ${r.invoice_no}` : ""}</p>
              <p className="text-sm">Load {money(r.load_total)}{Number(r.qp_fee) ? ` − QP ${money(r.qp_fee)}` : ""}{Number(r.gas) ? ` − gas ${money(r.gas)}` : ""} × {r.split_pct}% = <strong>{money(r.driver_pay)}</strong></p>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="mb-2 mt-6 text-lg font-semibold">Pay statements</h2>
      {(statements ?? []).length === 0 ? <p className="text-muted">None yet.</p> : (
        <ul className="space-y-2">
          {(statements ?? []).map((s) => {
            const these = (runs ?? []).filter((r) => r.settlement_id === s.id);
            const total = sum(these) - Number(s.cash_advances);
            return (
              <li key={s.id} className="rounded-md border border-rule p-3">
                <p className="flex items-center justify-between"><span className="font-semibold">{date(s.period_start)} to {date(s.period_end)}</span>
                  <Badge status={s.status === "paid" ? "paid" : "partial"} label={s.status === "paid" ? `Paid ${date(s.paid_on)}` : "Being processed"} /></p>
                <p className="text-sm text-muted">{these.length} run{these.length === 1 ? "" : "s"} · runs {money(sum(these))}{Number(s.cash_advances) ? ` − advances ${money(s.cash_advances)}` : ""}</p>
                <p className="text-lg font-bold">{money(total)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
