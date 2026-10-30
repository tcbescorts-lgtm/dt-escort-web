import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Empty, PageHead, Panel, Table } from "@/components/portal/ui";
import { date, dateTime } from "@/lib/format";
import { addSuppression, updateDeletion } from "../actions";

export const metadata = { title: "Data deletion queue" };

export default async function Deletion() {
  await requireStaff();
  const sb = await supabaseServer();
  const [{ data }, { data: sup }] = await Promise.all([
    sb.from("deletion_requests").select("*").order("created_at", { ascending: false }),
    sb.from("suppression_list").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  return (
    <>
      <PageHead title="Data deletion queue" sub="Requests from the website. Email the person from dtescortservice@gmail.com to verify, delete their records, then mark it complete. Finish within 30 days." />
      {(data ?? []).length === 0 ? <Empty>No requests.</Empty> : (
        <div className="space-y-3">
          {(data ?? []).map((r) => (
            <Panel key={r.id} title={`${r.name} <${r.email}>`} id={`dr-${r.id}`} actions={<Badge status={r.status === "completed" ? "paid" : r.status === "rejected" ? "void" : new Date(r.due_by) < new Date() ? "overdue" : "partial"} label={`${r.status} · due ${date(r.due_by)}`} />}>
              <p><span className="font-semibold">Delete:</span> {r.scope}{r.details ? ` · ${r.details}` : ""}</p>
              <p className="text-sm text-muted">Received {dateTime(r.created_at)}{r.verified_at ? ` · verified ${dateTime(r.verified_at)}` : ""}{r.completed_at ? ` · completed ${dateTime(r.completed_at)}` : ""}</p>
              <form action={updateDeletion} className="mt-3 grid gap-2 sm:grid-cols-[12rem_1fr_auto_auto] sm:items-end">
                <input type="hidden" name="id" value={r.id} />
                <div className="field"><label htmlFor={`s-${r.id}`}>Status</label>
                  <select id={`s-${r.id}`} name="status" defaultValue={r.status} className="input"><option value="received">Received</option><option value="verifying">Verifying</option><option value="completed">Completed</option><option value="rejected">Rejected (can&apos;t verify)</option></select></div>
                <div className="field"><label htmlFor={`n-${r.id}`}>Notes (what was deleted or kept, and why)</label><input id={`n-${r.id}`} name="notes" defaultValue={r.notes ?? ""} className="input" /></div>
                <label className="check min-h-11 items-center"><input type="checkbox" name="verified" defaultChecked={Boolean(r.verified_at)} /><span>Identity verified</span></label>
                <button className="btn btn-gold">Update</button>
              </form>
            </Panel>
          ))}
        </div>
      )}
      <Panel title="Email suppression list" id="sup" className="mt-6">
        <p className="mb-3 text-muted">Addresses here never get non-essential email (reminders and marketing). Unsubscribes land here automatically.</p>
        <form action={addSuppression} className="mb-4 flex flex-wrap items-end gap-2">
          <div className="field"><label htmlFor="se">Email</label><input id="se" name="email" type="email" className="input" required /></div>
          <div className="field"><label htmlFor="sr">Reason</label><input id="sr" name="reason" className="input" defaultValue="requested" /></div>
          <button className="btn btn-line">Add</button>
        </form>
        {(sup ?? []).length > 0 && <Table caption="Suppressed emails" head={["Email", "Reason", "Added"]}>{(sup ?? []).map((s) => <tr key={s.email}><td>{s.email}</td><td>{s.reason}</td><td>{date(s.created_at)}</td></tr>)}</Table>}
      </Panel>
    </>
  );
}
