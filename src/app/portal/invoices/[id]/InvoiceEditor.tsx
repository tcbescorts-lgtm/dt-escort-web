"use client";

import { useActionState, useMemo, useState } from "react";
import { money } from "@/lib/format";
import { createPaymentLink, recordPayment, saveInvoice, sendInvoice } from "../actions";

type Item = { key: string; kind: string; description: string; qty: string; rate: string };
const KINDS: [string, string][] = [
  ["mileage", "Mileage"], ["day_rate", "Day rate"], ["mini_run", "Mini run"], ["overnight", "Overnight"], ["no_go", "No-go"],
  ["flat_rate", "Flat rate"], ["gas", "Gas / reimbursement"], ["tolls", "Tolls"], ["lodging", "Lodging"], ["adjustment", "Adjustment"], ["qp_fee", "QP fee deduction"],
];
const k = () => Math.random().toString(36).slice(2);

function Msg({ s }: { s?: { ok?: string; error?: string } }) {
  if (!s) return null;
  return s.error ? <p role="alert" className="mt-2 font-medium text-error">{s.error}</p> : s.ok ? <p role="status" className="mt-2 font-medium text-success">{s.ok}</p> : null;
}

export default function InvoiceEditor({ inv, items, publicUrl, mailto, hasPayInfo }: { inv: any; items: any[]; publicUrl: string; mailto: string; hasPayInfo: boolean }) {
  const [saveState, saveAction, saving] = useActionState(saveInvoice, undefined);
  const [sendState, sendAction, sending] = useActionState(sendInvoice, undefined);
  const [linkState, linkAction, linking] = useActionState(createPaymentLink, undefined);
  const [payState, payAction, paying] = useActionState(recordPayment, undefined);
  const [rows, setRows] = useState<Item[]>(() => items.map((i) => ({ key: k(), kind: i.kind, description: i.description, qty: String(i.qty), rate: String(i.rate) })));
  const [copied, setCopied] = useState(false);
  const total = useMemo(() => rows.reduce((a, r) => a + Math.round((Number(r.qty) || 0) * (Number(r.rate) || 0) * 100) / 100, 0), [rows]);
  const set = (key: string, p: Partial<Item>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const locked = inv.status === "void";

  return (
    <div className="space-y-4">
      <form action={saveAction} className="space-y-4">
        <input type="hidden" name="id" value={inv.id} />
        <input type="hidden" name="items_json" value={JSON.stringify(rows.map((r) => ({ kind: r.kind, description: r.description, qty: r.qty, rate: r.rate })))} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="field"><label htmlFor="bt">Bill to</label><input id="bt" name="bill_to_name" defaultValue={inv.bill_to_name} className="input" /></div>
          <div className="field"><label htmlFor="be">Bill-to email</label><input id="be" name="bill_to_email" type="email" defaultValue={inv.bill_to_email ?? ""} className="input" /></div>
          <div className="field"><label htmlFor="id_">Issue date</label><input id="id_" name="issue_date" type="date" defaultValue={inv.issue_date} className="input" /></div>
          <div className="field"><label htmlFor="dd">Due date</label><input id="dd" name="due_date" type="date" defaultValue={inv.due_date ?? ""} className="input" /></div>
        </div>
        <div className="overflow-x-auto rounded-md border border-rule">
          <table className="w-full min-w-[720px] text-left">
            <caption className="sr-only">Invoice line items</caption>
            <thead className="bg-surface-2"><tr><th scope="col" className="p-2">Type</th><th scope="col" className="p-2">Description</th><th scope="col" className="p-2">Qty</th><th scope="col" className="p-2">Rate ($)</th><th scope="col" className="p-2 text-right">Amount</th><th scope="col" className="p-2"><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key} className="border-t border-rule">
                  <td className="p-2"><label className="sr-only" htmlFor={`k-${r.key}`}>Line {i + 1} type</label>
                    <select id={`k-${r.key}`} className="input !min-h-11" value={r.kind} onChange={(e) => set(r.key, { kind: e.target.value })}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
                  <td className="p-2"><label className="sr-only" htmlFor={`d-${r.key}`}>Line {i + 1} description</label><input id={`d-${r.key}`} className="input !min-h-11" value={r.description} onChange={(e) => set(r.key, { description: e.target.value })} /></td>
                  <td className="p-2"><label className="sr-only" htmlFor={`q-${r.key}`}>Line {i + 1} quantity</label><input id={`q-${r.key}`} type="number" step="0.01" className="input !min-h-11 w-24" value={r.qty} onChange={(e) => set(r.key, { qty: e.target.value })} /></td>
                  <td className="p-2"><label className="sr-only" htmlFor={`r-${r.key}`}>Line {i + 1} rate</label><input id={`r-${r.key}`} type="number" step="0.01" className="input !min-h-11 w-28" value={r.rate} onChange={(e) => set(r.key, { rate: e.target.value })} /></td>
                  <td className="p-2 text-right tabular-nums">{money((Number(r.qty) || 0) * (Number(r.rate) || 0))}</td>
                  <td className="p-2"><button type="button" className="min-h-11 text-sm text-muted underline-offset-4 hover:underline" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>Remove<span className="sr-only"> line {i + 1}</span></button></td>
                </tr>
              ))}
              <tr className="border-t-2 border-field"><th scope="row" colSpan={4} className="p-2 text-right text-lg">Total</th><td className="p-2 text-right text-lg font-bold tabular-nums">{money(total)}</td><td /></tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">For a quick pay deduction, use the type QP fee deduction with a negative rate.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-line" onClick={() => setRows((rs) => [...rs, { key: k(), kind: "adjustment", description: "", qty: "1", rate: "" }])}>Add line</button>
        </div>
        <div className="field"><label htmlFor="nt">Notes on invoice</label><textarea id="nt" name="notes" rows={2} defaultValue={inv.notes ?? ""} className="input !min-h-0" /></div>
        <button className="btn btn-gold" disabled={saving || locked}>{saving ? "Saving…" : "Save invoice"}</button>
        <Msg s={saveState} />
      </form>

      <section aria-labelledby="send-h" className="rounded-md border border-rule bg-surface p-4">
        <h2 id="send-h" className="font-bold">✉️ Send to the customer</h2>
        <p className="mt-1 text-sm text-muted">Save first. The email includes the PDF, the online invoice link and your payment information.</p>
        {!hasPayInfo && <p className="mt-2 rounded-md border border-gold-fill p-2 text-sm">Your payment details (Zelle, Cash App, ACH, check) aren&apos;t filled in yet. Add them in <a className="link" href="/portal/settings#pay">Settings</a> so they print on the invoice.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={sendAction}><input type="hidden" name="id" value={inv.id} /><button className="btn btn-gold" disabled={sending || locked}>{sending ? "Sending…" : inv.sent_at ? "Send again" : "Send invoice"}</button></form>
          {inv.sent_at && Number(inv.amount_paid) < Number(inv.total) && (
            <form action={sendAction}><input type="hidden" name="id" value={inv.id} /><input type="hidden" name="reminder" value="1" /><button className="btn btn-line" disabled={sending}>Send payment reminder</button></form>
          )}
          <a className="btn btn-line" href={mailto}>Email from my mail app</a>
          <a className="btn btn-line" href={`/portal/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer">View PDF<span className="sr-only"> (opens in a new tab)</span></a>
          <button type="button" className="btn btn-line" onClick={async () => { await navigator.clipboard.writeText(publicUrl); setCopied(true); }}>{copied ? "Link copied" : "Copy invoice link"}</button>
          <form action={linkAction}><input type="hidden" name="id" value={inv.id} /><button className="btn btn-line" disabled={linking || locked}>{inv.stripe_payment_link_url ? "Refresh online payment link" : "Add online payment link"}</button></form>
        </div>
        <Msg s={sendState} /><Msg s={linkState} />
        {inv.stripe_payment_link_url && <p className="mt-2 text-sm">Payment link: <a className="link break-all" href={inv.stripe_payment_link_url} target="_blank" rel="noopener noreferrer">{inv.stripe_payment_link_url}</a></p>}
      </section>

      <section aria-labelledby="pay-h" className="rounded-md border border-rule bg-surface p-4">
        <h2 id="pay-h" className="font-bold">💵 Mark as paid</h2>
        <form action={payAction} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <input type="hidden" name="invoice_id" value={inv.id} />
          <div className="field"><label htmlFor="pa">Amount ($)</label><input id="pa" name="amount" type="number" step="0.01" defaultValue={Math.max(0, Number(inv.total) - Number(inv.amount_paid)).toFixed(2)} className="input" /></div>
          <div className="field"><label htmlFor="pm">Method</label>
            <select id="pm" name="method" className="input"><option value="ach">ACH</option><option value="zelle">Zelle</option><option value="cashapp">CashApp</option><option value="check">Check</option><option value="direct_deposit">Direct deposit</option><option value="stripe">Card/bank (Stripe)</option><option value="other">Other</option></select></div>
          <div className="field"><label htmlFor="pd">Date received</label><input id="pd" name="paid_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input" /></div>
          <div className="field"><label htmlFor="pr">Reference</label><input id="pr" name="reference" className="input" placeholder="Check #, Zelle ID" /></div>
          <button className="btn btn-gold" disabled={paying || locked}>{paying ? "Saving…" : "Record payment"}</button>
        </form>
        <Msg s={payState} />
      </section>
    </div>
  );
}
