import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Flash, PageHead, Panel } from "@/components/portal/ui";
import { INVOICE_STATUS, PAY_METHOD, date, dateTime, money } from "@/lib/format";
import { SITE_URL, company } from "@/lib/site";
import { paymentLines } from "@/lib/payment-info";
import DeleteInvoice from "./DeleteInvoice";
import InvoiceEditor from "./InvoiceEditor";
import { deletePayment, setInvoiceStatus } from "../actions";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [{ data: inv }, { data: items }, { data: payments }, { data: events }, { data: st }] = await Promise.all([
    sb.from("invoices").select("*, loads(id, load_no)").eq("id", id).single(),
    sb.from("invoice_items").select("*").eq("invoice_id", id).order("seq"),
    sb.from("payments").select("*").eq("invoice_id", id).order("paid_on"),
    sb.from("email_events").select("*").eq("invoice_id", id).order("created_at", { ascending: false }),
    sb.from("settings").select("key, value").in("key", ["payment_info", "email_templates"]),
  ]);
  if (!inv) notFound();
  const sv = Object.fromEntries((st ?? []).map((r) => [r.key, r.value])) as Record<string, any>;
  const link = `${SITE_URL}/i/${inv.public_token}`;
  const howToPay = paymentLines(sv.payment_info).map((m) => `${m.label}: ${m.lines.join(", ")}`);
  const mailBody = [
    `Hello ${inv.bill_to_name},`,
    `Invoice ${inv.number} from ${company.legalName} for ${money(inv.total)}${inv.due_date ? `, due ${date(inv.due_date)}` : ""}.`,
    `View and download it here: ${link}`,
    howToPay.length ? `How to pay:\n${howToPay.join("\n")}` : "",
    `Thank you,\n${company.legalName}\n${company.phoneDisplay}`,
  ].filter(Boolean).join("\n\n");
  const mailto = `mailto:${encodeURIComponent(inv.bill_to_email ?? "")}?subject=${encodeURIComponent(`Invoice ${inv.number} from ${company.legalName}`)}&body=${encodeURIComponent(mailBody)}`;
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
        <InvoiceEditor inv={inv} items={items ?? []} publicUrl={link} mailto={mailto} hasPayInfo={howToPay.length > 0} />
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
          {inv.archived_at ? <p className="rounded-md border border-field p-3 text-sm">This invoice is archived. Restore it from the Archive tab on Invoices.</p> : <DeleteInvoice id={inv.id} number={inv.number} />}
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
