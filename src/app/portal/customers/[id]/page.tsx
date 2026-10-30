import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Flash, PageHead, Panel, Stat, Table } from "@/components/portal/ui";
import { INVOICE_STATUS, LOAD_STATUS, date, money } from "@/lib/format";
import CustomerForm from "../CustomerForm";

export const metadata = { title: "Customer" };

export default async function CustomerDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [{ data: c }, { data: loads }, { data: invoices }] = await Promise.all([
    sb.from("customers").select("*, customer_rate_cards(*)").eq("id", id).single(),
    sb.from("loads").select("id, load_no, load_date, pickup, dropoff, status").or(`customer_id.eq.${id},invoice_customer_id.eq.${id}`).order("load_date", { ascending: false }).limit(100),
    sb.from("invoices").select("id, number, issue_date, total, amount_paid, status, paid_at").eq("customer_id", id).neq("status", "void").order("issue_date", { ascending: false }),
  ]);
  if (!c) notFound();
  const billed = (invoices ?? []).reduce((a, i) => a + Number(i.total), 0);
  const open = (invoices ?? []).reduce((a, i) => a + Math.max(0, Number(i.total) - Number(i.amount_paid)), 0);
  const paidDays = (invoices ?? []).filter((i) => i.paid_at).map((i) => (new Date(i.paid_at!).getTime() - new Date(i.issue_date + "T12:00:00").getTime()) / 86400000);
  const avg = paidDays.length ? (paidDays.reduce((a, b) => a + b, 0) / paidDays.length).toFixed(1) : null;

  return (
    <>
      <PageHead title={c.company} sub="Load history, billing and payment speed." actions={<Link href={`/portal/loads/new`} className="btn btn-gold">Book a load</Link>} />
      <Flash msg={sp.saved ? "Customer saved." : null} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Loads" value={(loads ?? []).length} />
        <Stat label="Invoiced" value={money(billed)} />
        <Stat label="Open balance" value={money(open)} />
        <Stat label="Average days to pay" value={avg ?? "No data"} hint="From invoice date to paid" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Loads" id="cl">
          {(loads ?? []).length === 0 ? <p className="text-muted">No loads yet.</p> : (
            <Table caption="Loads for this customer" head={["Load", "Date", "Route", "Status"]}>
              {(loads ?? []).map((l) => (
                <tr key={l.id}><td><Link className="link" href={`/portal/loads/${l.id}`}>{l.load_no}</Link></td><td>{date(l.load_date)}</td><td>{l.pickup} → {l.dropoff}</td><td><Badge status={l.status} label={LOAD_STATUS[l.status]} /></td></tr>
              ))}
            </Table>
          )}
        </Panel>
        <Panel title="Invoices" id="ci">
          {(invoices ?? []).length === 0 ? <p className="text-muted">No invoices yet.</p> : (
            <Table caption="Invoices for this customer" head={["Invoice", "Date", "Total", "Status"]}>
              {(invoices ?? []).map((i) => (
                <tr key={i.id}><td><Link className="link" href={`/portal/invoices/${i.id}`}>{i.number}</Link></td><td>{date(i.issue_date)}</td><td>{money(i.total)}</td><td><Badge status={i.status} label={INVOICE_STATUS[i.status]} /></td></tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
      <details className="mt-6 rounded-md border border-rule p-4" open={!c.contact_name && !c.email}>
        <summary className="cursor-pointer font-display text-xl font-bold">Edit customer and rate card</summary>
        <div className="mt-4"><CustomerForm c={c} /></div>
      </details>
    </>
  );
}
