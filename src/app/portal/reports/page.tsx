import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { PageHead, Panel, Stat, Table } from "@/components/portal/ui";
import { Bars } from "@/components/portal/Charts";
import { money, num } from "@/lib/format";
import { reportData } from "./data";

export const metadata = { title: "Reports" };

export default async function Reports({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requireOwner();
  const sp = await searchParams;
  const y = new Date().getFullYear();
  const from = sp.from ?? `${y}-01-01`;
  const to = sp.to ?? `${y}-12-31`;
  const r = await reportData(from, to);
  const label = (m: string) => new Date(m + "-15").toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  const exp = (report: string) => `/portal/reports/export?report=${report}&from=${from}&to=${to}`;
  const revenue = r.byMonth.reduce((a, m) => a + m.revenue, 0);
  const pay = r.drivers.reduce((a, d) => a + d.pay, 0);
  const profit = r.customers.reduce((a, c) => a + c.profit, 0);

  return (
    <>
      <PageHead title="Reports" sub="Owner only." />
      <form className="mb-5 flex flex-wrap items-end gap-3">
        <div className="field"><label htmlFor="rf">From</label><input id="rf" name="from" type="date" defaultValue={from} className="input" /></div>
        <div className="field"><label htmlFor="rt">To</label><input id="rt" name="to" type="date" defaultValue={to} className="input" /></div>
        <button className="btn btn-gold">Update</button>
      </form>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Invoiced" value={money(revenue)} />
        <Stat label="Receivables (open)" value={money(r.receivable)} hint="Invoices issued in this range" />
        <Stat label="Driver pay" value={money(pay)} />
        <Stat label="Profit on runs" value={money(profit)} hint="Load total − driver pay − gas − QP fee" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Revenue and collections by month" id="r1" actions={<a className="link text-sm" href={exp("revenue")}>CSV</a>}>
          <Bars title="Revenue and collections" data={r.byMonth.map((m) => ({ month: label(m.month), revenue: m.revenue, collected: m.collected }))} x="month" series={[{ key: "revenue", label: "Invoiced" }, { key: "collected", label: "Collected" }]} fmt="money" />
        </Panel>
        <Panel title="Miles by month" id="r2" actions={<a className="link text-sm" href={exp("revenue")}>CSV</a>}>
          <Bars title="Miles by month" data={r.byMonth.map((m) => ({ month: label(m.month), miles: m.miles }))} x="month" series={[{ key: "miles", label: "Miles" }]} />
        </Panel>
      </div>

      <Panel title="Driver earnings" id="r3" className="mt-4" actions={<a className="link text-sm" href={exp("drivers")}>CSV</a>}>
        <Table caption="Driver earnings" head={["Driver", "Runs", "Miles", "Load totals", "Driver pay"]}>
          {r.drivers.map((d) => <tr key={d.name}><td>{d.name}</td><td>{d.runs}</td><td>{num(d.miles)}</td><td>{money(d.loadTotal)}</td><td>{money(d.pay)}</td></tr>)}
        </Table>
      </Panel>

      <Panel title="Customer profitability" id="r4" className="mt-4" actions={<a className="link text-sm" href={exp("customers")}>CSV</a>}>
        <Table caption="Customer profitability" head={["Customer", "Runs", "Revenue", "Driver pay", "Gas", "QP fees", "Profit", "Margin"]}>
          {r.customers.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.runs}</td><td>{money(c.revenue)}</td><td>{money(c.driverPay)}</td><td>{money(c.gas)}</td><td>{money(c.qp)}</td><td>{money(c.profit)}</td><td>{c.revenue ? Math.round((c.profit / c.revenue) * 100) + "%" : ""}</td></tr>)}
        </Table>
      </Panel>
      <p className="mt-4"><Link className="link" href="/portal/invoices">Receivables aging and payment ledger</Link></p>
    </>
  );
}
