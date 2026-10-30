import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Flash, PageHead, Panel } from "@/components/portal/ui";
import { INVOICE_STATUS, PAY_METHOD, date, dateTime, money } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import InvoiceEditor from "./InvoiceEditor";
import { deletePayment, setInvoiceStatus } from "../actions";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [{ data: inv }, { data: items }, { data: payments }, { data: events }] = await Promise.all([
    sb.from("invoices").select("*, loads(id, load_no)").eq("id", id).single(),
    sb.from("invoice_items").select("*").eq("invoice_id", id).order("seq"),
    sb.from("payments").select("*").eq("invoice_id", id).order("paid_on"),
    sb.from("email_events").select("*").eq("invoice_id", id).order("created_at", { ascending: false }),
  ]);
  if (!inv) notFound();
  const balance = Number(inv.total) - Number(inv.amount_paid);

  return (
    <>
      <PageHead
        title={`Invoice ${inv.number}`}
        sub={<>{inv.bill_to_name || "No customer"} · {money(inv.total)} · balance {money(balance)} · <Badge status={inv.status} label={INVOICE_STATUS[inv.status]} />
          {inv.loads && <> · <Link className="link" href={`/portal/loads/${inv.loads.id}`}>{inv.loads.load_no}</Link></>}</>}
      />
      <Flash msg={sp.created ? "Invoice created from the load. Check the lines, save, then send." : null} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <InvoiceEditor inv={inv} items={items ?? []} publicUrl={`${SITE_URL}/i/${inv.public_token}`} />
        <div className="space-y-4">
          <Panel title="Payments" id="pays">
            {(payments ?? []).length === 0 ? <p className="text-muted">None recorded.</p> : (
              <ul className="divide-y divide-rule">{(payments ?? []).map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-2 py-2">
                  <div><p className="font-medium">{money(p.amount)} · {PAY_METHOD[p.method]}</p><p className="text-sm text-muted">{date(p.paid_on)}{p.reference ? ` · ${p.reference}` : ""}{p.source === "stripe" ? " · automatic" : ""}</p></div>
                  <form action={deletePayment}><input type="hidden" name="payment_id" value={p.id} /><input type="hidden" name="invoice_id" value={id} />
                    <button className="min-h-11 text-sm text-muted underline-offset-4 hover:underline" aria-label={`Delete payment of ${money(p.amount)}`}>Delete</button></form>
                </li>))}</ul>
            )}
          </Panel>
          <Panel title="Status" id="ist">
            <form action={setInvoiceStatus} className="space-y-2">
              <input type="hidden" name="id" value={id} />
              <div className="field"><label htmlFor="is">Set status manually</label>
                <select id="is" name="status" defaultValue={inv.status} className="input">{Object.entries(INVOICE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <p className="text-sm text-muted">Use this when you sent the invoice yourself, or to void it. Payments set Paid / Partial automatically.</p>
              <button className="btn btn-line">Update status</button>
            </form>
          </Panel>
          <Panel title="Email activity" id="ev">
            {(events ?? []).length === 0 ? <p className="text-muted">Nothing yet.</p> : (
              <ul className="space-y-1">{(events ?? []).map((e) => <li key={e.id}><span className="capitalize">{e.type.replace(/[._]/g, " ")}</span> <span className="text-sm text-muted">{dateTime(e.created_at)}</span></li>)}</ul>
            )}
            {inv.viewed_at && <p className="mt-2 text-sm">Opened online {dateTime(inv.viewed_at)}</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}
