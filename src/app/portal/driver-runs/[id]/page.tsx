import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, PageHead, Panel } from "@/components/portal/ui";
import RunsTable from "@/components/portal/RunsTable";
import { date } from "@/lib/format";
import { deleteSettlement, markSettlementPaid, updateAdvances } from "../actions";

export const metadata = { title: "Pay statement" };

export default async function Settlement({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: s } = await sb.from("driver_settlements").select("*, drivers(full_name)").eq("id", id).single();
  if (!s) notFound();
  const { data: runs } = await sb.from("driver_runs").select("*").eq("settlement_id", id).order("run_date");
  return (
    <>
      <PageHead title={`Pay statement · ${(s as any).drivers?.full_name}`} sub={<>{date(s.period_start)} to {date(s.period_end)} · <Badge status={s.status === "paid" ? "paid" : "partial"} label={s.status === "paid" ? `Paid ${date(s.paid_on)}` : "Open"} /></>}
        actions={<a className="btn btn-line" href={`/portal/driver-runs/export?settlement=${id}`}>Export CSV</a>} />
      <RunsTable rows={(runs ?? []) as any} advances={Number(s.cash_advances)} caption="Runs in this pay statement" />
      {s.status === "open" && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Panel title="Cash advances" id="adv">
            <form action={updateAdvances} className="flex gap-2"><input type="hidden" name="id" value={id} />
              <label htmlFor="ca" className="sr-only">Cash advances</label><input id="ca" name="cash_advances" type="number" step="0.01" defaultValue={s.cash_advances} className="input" />
              <button className="btn btn-line">Update</button></form>
          </Panel>
          <Panel title="Mark paid" id="mp">
            <form action={markSettlementPaid} className="grid gap-2"><input type="hidden" name="id" value={id} />
              <div className="field"><label htmlFor="pm">Method</label><select id="pm" name="method" className="input"><option value="cashapp">CashApp</option><option value="zelle">Zelle</option><option value="direct_deposit">Direct deposit</option><option value="check">Check</option><option value="other">Other</option></select></div>
              <div className="field"><label htmlFor="pd">Paid on</label><input id="pd" name="paid_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input" /></div>
              <div className="field"><label htmlFor="pr">Reference</label><input id="pr" name="reference" className="input" /></div>
              <button className="btn btn-gold">Mark paid</button></form>
          </Panel>
          <Panel title="Undo" id="un">
            <form action={deleteSettlement}><input type="hidden" name="id" value={id} />
              <p className="mb-2 text-muted">Deletes this statement and returns its runs to the unpaid list.</p>
              <button className="btn btn-line">Delete statement</button></form>
          </Panel>
        </div>
      )}
    </>
  );
}
