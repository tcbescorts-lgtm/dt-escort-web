import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Empty, PageHead, Panel, Stat, Table } from "@/components/portal/ui";
import { INVOICE_STATUS, PAY_METHOD, date, money } from "@/lib/format";
import { createBlankInvoice, createInvoiceFromLoad, restoreInvoice } from "./actions";

export const metadata = { title: "Invoices" };

export default async function Invoices({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; tab?: string; archived?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [{ data: everything }, { data: customers }, { data: sheets }] = await Promise.all([
    sb.from("invoices").select("id, number, bill_to_name, issue_date, due_date, total, amount_paid, status, sent_at, archived_at, archive_reason, run_sheet_id, loads(load_no)").order("created_at", { ascending: false }).limit(1000),
    sb.from("customers").select("id, company").order("company"),
    sb.from("run_sheets").select("id, load_id, total_due, submitted_at, status, drivers(full_name), loads(load_no, pickup, dropoff, customer:customers!loads_customer_id_fkey(company))").in("status", ["submitted", "approved"]).order("submitted_at", { ascending: false }).limit(200),
  ]);
  const all = (everything ?? []).filter((i) => !i.archived_at);
  const archived = (everything ?? []).filter((i) => i.archived_at);
  const invoicedSheets = new Set(all.map((i) => i.run_sheet_id).filter(Boolean));
  const ready = (sheets ?? []).filter((r: any) => !invoicedSheets.has(r.id));
  const tab = sp.tab ?? (ready.length ? "ready" : "invoices");
  const { data: payments } = tab === "ledger"
    ? await sb.from("payments").select("id, amount, method, paid_on, reference, source, invoices(id, number, bill_to_name)").order("paid_on", { ascending: false }).limit(500)
    : { data: [] as any[] };
  const today = new Date().toISOString().slice(0, 10);
  const open = (all ?? []).filter((i) => !["void", "draft"].includes(i.status) && Number(i.amount_paid) < Number(i.total));
  const age = (i: any) => (i.due_date ? Math.floor((Date.now() - new Date(i.due_date + "T12:00:00").getTime()) / 86400000) : 0);
  const buckets = [
    ["Current", open.filter((i) => age(i) <= 0)],
    ["1-30 days", open.filter((i) => age(i) > 0 && age(i) <= 30)],
    ["31-60 days", open.filter((i) => age(i) > 30 && age(i) <= 60)],
    ["61-90 days", open.filter((i) => age(i) > 60 && age(i) <= 90)],
    ["Over 90 days", open.filter((i) => age(i) > 90)],
  ] as [string, any[]][];
  const bal = (l: any[]) => l.reduce((a, i) => a + Number(i.total) - Number(i.amount_paid), 0);

  let rows = all as any[];
  if (sp.status === "overdue") rows = open.filter((i) => i.due_date && i.due_date < today);
  else if (sp.status) rows = rows.filter((i) => i.status === sp.status);
  if (sp.q) rows = rows.filter((i) => [i.number, i.bill_to_name, i.loads?.load_no].some((v: string) => v?.toLowerCase().includes(sp.q!.toLowerCase())));

  return (
    <>
      <PageHead title="Invoices" actions={<>
        <a className="btn btn-line" href="/portal/invoices/export?type=invoices" download>Export invoices (CSV)</a>
        <a className="btn btn-line" href="/portal/invoices/export?type=payments" download>Export payments (CSV)</a>
      </>} />
      {sp.archived && <p role="status" className="mb-3 rounded-md border-2 border-success p-3 font-medium text-success">Invoice deleted. It&apos;s in the Archive tab if you need it back.</p>}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {buckets.map(([l, list]) => <Stat key={l} label={`Aging: ${l}`} value={money(bal(list))} hint={`${list.length} invoice${list.length === 1 ? "" : "s"}`} />)}
      </div>

      <nav aria-label="Invoice views" className="my-4 flex flex-wrap gap-1 border-b border-rule">
        {[["ready", `📝 Ready to invoice (${ready.length})`], ["invoices", `Invoices (${all.length})`], ["ledger", "Payments"], ["archive", `Archive (${archived.length})`]].map(([k, l]) => (
          <Link key={k} href={`?tab=${k}`} aria-current={tab === k ? "page" : undefined}
            className={`-mb-px inline-flex min-h-10 items-center border-b-2 px-3 text-sm font-semibold ${tab === k ? "border-gold-fill text-ink" : "border-transparent text-muted hover:text-ink"}`}>{l}</Link>
        ))}
      </nav>

      {tab === "ready" ? (
        ready.length === 0 ? <Empty>No run sheets waiting. When a driver sends a run sheet, it shows up here.</Empty> : (
          <>
            <p className="mb-2 text-sm text-muted">Run sheets drivers have sent in. Review one, then turn it into the invoice you send the customer.</p>
            <Table caption="Run sheets ready to invoice" head={["Load", "Customer", "Route", "Driver", "Sent", "Run sheet total", ""]}>
              {ready.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.loads?.load_no}</td><td>{r.loads?.customer?.company}</td><td>{r.loads?.pickup} to {r.loads?.dropoff}</td><td>{r.drivers?.full_name}</td>
                  <td>{date(r.submitted_at?.slice(0, 10))}</td><td>{money(r.total_due)}</td>
                  <td className="whitespace-nowrap">
                    <Link className="link mr-3" href={`/portal/run-sheets/${r.id}`}>Review</Link>
                    <form action={createInvoiceFromLoad} className="inline"><input type="hidden" name="load_id" value={r.load_id} /><input type="hidden" name="run_sheet_id" value={r.id} /><button className="btn btn-gold !min-h-9 !py-1 text-sm">Create invoice</button></form>
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )
      ) : tab === "archive" ? (
        archived.length === 0 ? <Empty>Nothing archived.</Empty> : (
          <Table caption="Archived invoices" head={["Invoice", "Customer", "Total", "Archived", "Reason", ""]}>
            {archived.map((i: any) => (
              <tr key={i.id}><td>{i.number}</td><td>{i.bill_to_name}</td><td>{money(i.total)}</td><td>{date(i.archived_at?.slice(0, 10))}</td><td>{i.archive_reason}</td>
                <td><form action={restoreInvoice}><input type="hidden" name="id" value={i.id} /><button className="link text-sm">Restore</button></form></td></tr>
            ))}
          </Table>
        )
      ) : tab === "ledger" ? (
        (payments ?? []).length === 0 ? <Empty>No payments recorded yet.</Empty> : (
          <Table caption="Payment ledger" head={["Date", "Invoice", "Customer", "Method", "Reference", "Amount"]}>
            {(payments ?? []).map((p: any) => (
              <tr key={p.id}><td>{date(p.paid_on)}</td><td><Link className="link" href={`/portal/invoices/${p.invoices?.id}`}>{p.invoices?.number}</Link></td><td>{p.invoices?.bill_to_name}</td><td>{PAY_METHOD[p.method]}{p.source === "stripe" ? " (auto)" : ""}</td><td>{p.reference}</td><td>{money(p.amount)}</td></tr>
            ))}
          </Table>
        )
      ) : (
        <>
          <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_22rem]">
            <form role="search" className="grid gap-2 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
              <input type="hidden" name="tab" value="invoices" />
              <div className="field"><label htmlFor="iq">Search</label><input id="iq" name="q" defaultValue={sp.q} className="input" placeholder="Invoice #, customer, load #" /></div>
              <div className="field"><label htmlFor="ist">Status</label>
                <select id="ist" name="status" defaultValue={sp.status ?? ""} className="input"><option value="">All</option><option value="overdue">Overdue (past due date)</option>{Object.entries(INVOICE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <button className="btn btn-line">Filter</button>
            </form>
            <Panel title="New blank invoice" id="nb">
              <form action={createBlankInvoice} className="flex gap-2">
                <label htmlFor="nbc" className="sr-only">Customer</label>
                <select id="nbc" name="customer_id" className="input"><option value="">No customer yet</option>{(customers ?? []).map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}</select>
                <button className="btn btn-gold">Create</button>
              </form>
              <p className="mt-2 text-sm text-muted">Most invoices start from the Ready to invoice tab.</p>
            </Panel>
          </div>
          {rows.length === 0 ? <Empty>No invoices match.</Empty> : (
            <Table caption="Invoices" head={["Invoice", "Customer", "Load", "Issued", "Due", "Total", "Balance", "Status"]}>
              {rows.map((i) => {
                const overdue = i.due_date && i.due_date < today && Number(i.amount_paid) < Number(i.total) && !["void", "draft"].includes(i.status);
                return (
                  <tr key={i.id}>
                    <td><Link className="link font-semibold" href={`/portal/invoices/${i.id}`}>{i.number}</Link></td>
                    <td>{i.bill_to_name}</td><td>{i.loads?.load_no}</td><td>{date(i.issue_date)}</td><td>{date(i.due_date)}</td>
                    <td>{money(i.total)}</td><td>{money(Number(i.total) - Number(i.amount_paid))}</td>
                    <td className="space-x-1"><Badge status={i.status} label={INVOICE_STATUS[i.status]} />{overdue && i.status !== "overdue" && <Badge status="overdue" label="Past due" />}</td>
                  </tr>
                );
              })}
            </Table>
          )}
        </>
      )}
    </>
  );
}
