import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AuthShell from "@/components/portal/AuthShell";
import { company, fullAddress } from "@/lib/site";
import { date, money } from "@/lib/format";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Public invoice view by unguessable token. Opening it marks the invoice Viewed. */
export default async function PublicInvoice({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(token) || !process.env.SUPABASE_SERVICE_ROLE_KEY) notFound();
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = supabaseAdmin();
  const { data: inv } = await admin.from("invoices").select("*, loads(load_no, pickup, dropoff)").eq("public_token", token).maybeSingle();
  if (!inv || inv.status === "void" || inv.status === "draft") notFound();
  const { data: items } = await admin.from("invoice_items").select("description, qty, rate, amount").eq("invoice_id", inv.id).order("seq");
  const { data: pay } = await admin.from("settings").select("value").eq("key", "payment_instructions").maybeSingle();
  if (["sent", "delivered", "failed"].includes(inv.status)) {
    await admin.from("invoices").update({ status: "viewed", viewed_at: new Date().toISOString() }).eq("id", inv.id);
  }
  const balance = Number(inv.total) - Number(inv.amount_paid);

  return (
    <AuthShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {sp.paid && <p role="status" className="mb-6 rounded-md border-2 border-success p-3 font-medium text-success">Thank you. Your payment was received; this page updates once it clears.</p>}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display-2">Invoice {inv.number}</h1>
            <p className="text-muted">Issued {date(inv.issue_date)}{inv.due_date ? ` · due ${date(inv.due_date)}` : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-muted">Balance due</p>
            <p className="text-2xl font-bold">{money(balance)}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><p className="font-semibold">From</p><p>{company.legalName}<br />{fullAddress}<br />{company.phoneDisplay}</p></div>
          <div><p className="font-semibold">Bill to</p><p>{inv.bill_to_name}</p>{inv.loads && <p className="mt-2 text-muted">Load {inv.loads.load_no}: {inv.loads.pickup} to {inv.loads.dropoff}</p>}</div>
        </div>
        <div className="mt-6 overflow-x-auto rounded-md border border-rule">
          <table className="w-full min-w-[480px] text-left">
            <caption className="sr-only">Invoice lines</caption>
            <thead className="bg-surface-2"><tr><th scope="col" className="p-2">Description</th><th scope="col" className="p-2 text-right">Qty</th><th scope="col" className="p-2 text-right">Rate</th><th scope="col" className="p-2 text-right">Amount</th></tr></thead>
            <tbody>{(items ?? []).map((i, n) => <tr key={n} className="border-t border-rule"><td className="p-2">{i.description}</td><td className="p-2 text-right">{Number(i.qty)}</td><td className="p-2 text-right">{money(i.rate)}</td><td className="p-2 text-right">{money(i.amount)}</td></tr>)}</tbody>
            <tfoot><tr className="border-t-2 border-field"><th scope="row" colSpan={3} className="p-2 text-right">Total</th><td className="p-2 text-right font-bold">{money(inv.total)}</td></tr>
              {Number(inv.amount_paid) > 0 && <tr><th scope="row" colSpan={3} className="p-2 text-right font-normal">Paid</th><td className="p-2 text-right">{money(inv.amount_paid)}</td></tr>}</tfoot>
          </table>
        </div>
        <div className="mt-6 rounded-md border border-rule p-4">
          <h2 className="text-lg font-semibold">How to pay</h2>
          <p className="mt-1">{(pay?.value as any)?.text ?? "Contact dispatch for payment details."}</p>
          {inv.stripe_payment_link_url && balance > 0 && <a href={inv.stripe_payment_link_url} className="btn btn-gold mt-3">Pay {money(balance)} online</a>}
        </div>
        <p className="mt-6 text-sm text-muted">Questions about this invoice? Email <a className="link" href={`mailto:${company.email}`}>{company.email}</a> or call {company.phoneDisplay}.</p>
      </div>
    </AuthShell>
  );
}
