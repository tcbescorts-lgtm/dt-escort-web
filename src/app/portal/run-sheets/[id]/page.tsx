import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { runSheetBundle } from "@/lib/runsheet-data";
import RunSheetForm from "@/components/runsheet/RunSheetForm";
import { PageHead, Panel } from "@/components/portal/ui";
import { dateTime } from "@/lib/format";
import { reopenRunSheet } from "@/app/runsheet-actions";
import { createInvoiceFromLoad } from "../../invoices/actions";

export const metadata = { title: "Review run sheet" };

export default async function ReviewRunSheet({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: rs } = await sb.from("run_sheets").select("load_id, driver_id, status, settlement_id").eq("id", id).single();
  if (!rs) notFound();
  const b = await runSheetBundle(rs.load_id, rs.driver_id);
  if (!b) notFound();
  const events = ((b.sheet?.run_sheet_events ?? []) as any[]).sort((a, z) => z.created_at.localeCompare(a.created_at));

  return (
    <>
      <PageHead title="Review run sheet" sub={<Link className="link" href={`/portal/loads/${rs.load_id}`}>Open load {b.load.load_no}</Link>}
        actions={rs.status !== "draft" ? (
          <form action={createInvoiceFromLoad}><input type="hidden" name="load_id" value={rs.load_id} /><input type="hidden" name="run_sheet_id" value={id} /><button className="btn btn-gold">Create invoice</button></form>
        ) : undefined} />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <RunSheetForm mode="admin" {...b} />
        <div className="space-y-4">
          <Panel title="Timeline" id="tl">
            <ol className="space-y-2">{events.map((e, i) => (
              <li key={i}><span className="font-medium capitalize">{e.event}</span> <span className="text-sm text-muted">{dateTime(e.created_at)}</span>{e.comment && <p className="text-sm">{e.comment}</p>}</li>
            ))}</ol>
          </Panel>
          {rs.status !== "draft" && !rs.settlement_id && (
            <Panel title="Send back to driver" id="rb">
              <form action={reopenRunSheet} className="space-y-2">
                <input type="hidden" name="id" value={id} />
                <div className="field"><label htmlFor="rb-c">What needs fixing?</label><textarea id="rb-c" name="comment" rows={3} className="input !min-h-0" /></div>
                <button className="btn btn-line">Reopen as draft</button>
              </form>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
