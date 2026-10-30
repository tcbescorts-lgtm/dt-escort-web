import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Empty, Flash, PageHead, Panel, Table } from "@/components/portal/ui";
import RunsTable from "@/components/portal/RunsTable";
import { date, money } from "@/lib/format";
import { createSettlement } from "./actions";

export const metadata = { title: "Driver runs" };

export default async function DriverRuns({ searchParams }: { searchParams: Promise<{ driver?: string; from?: string; to?: string; err?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const sb = await supabaseServer();
  const now = new Date();
  const from = sp.from ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = sp.to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const { data: drivers } = await sb.from("drivers").select("id, full_name, split_pct").order("full_name");
  const driverId = sp.driver ?? drivers?.[0]?.id;

  const [{ data: runs }, { data: settlements }] = await Promise.all([
    driverId
      ? sb.from("driver_runs").select("*").eq("driver_id", driverId).is("settlement_id", null).gte("run_date", from).lte("run_date", to).order("run_date")
      : Promise.resolve({ data: [] as any[] }),
    sb.from("driver_settlements").select("id, driver_id, period_start, period_end, status, cash_advances, paid_on, drivers(full_name)").order("period_end", { ascending: false }).limit(50),
  ]);
  const driver = (drivers ?? []).find((d) => d.id === driverId);

  return (
    <>
      <PageHead title="Driver runs" sub="Each driver's runs and split for a pay period, laid out like the tracking sheet." actions={
        driverId ? <a className="btn btn-line" href={`/portal/driver-runs/export?driver=${driverId}&from=${from}&to=${to}`}>Export CSV</a> : undefined} />
      <Flash msg={sp.err ? "Tick at least one run to include." : null} kind="bad" />
      <form className="mb-5 grid gap-3 sm:grid-cols-4 sm:items-end">
        <div className="field"><label htmlFor="dr">Driver</label>
          <select id="dr" name="driver" defaultValue={driverId} className="input">{(drivers ?? []).map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></div>
        <div className="field"><label htmlFor="fr">Pay period from</label><input id="fr" name="from" type="date" defaultValue={from} className="input" /></div>
        <div className="field"><label htmlFor="tt">To</label><input id="tt" name="to" type="date" defaultValue={to} className="input" /></div>
        <button className="btn btn-gold">Show runs</button>
      </form>

      {!driver ? <Empty action={<Link href="/portal/drivers/new" className="btn btn-gold">Add a driver</Link>}>Add a driver first.</Empty> : (
        <Panel title={`${driver.full_name} · ${date(from)} to ${date(to)} · not yet paid out`} id="runs">
          {(runs ?? []).length === 0 ? <p className="text-muted">No unpaid submitted or approved runs in this period.</p> : (
            <form action={createSettlement} className="space-y-4">
              <input type="hidden" name="driver_id" value={driver.id} /><input type="hidden" name="from" value={from} /><input type="hidden" name="to" value={to} />
              <RunsTable rows={(runs ?? []) as any} selectable caption={`Runs for ${driver.full_name}`} />
              <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
                <div className="field"><label htmlFor="ca">Cash advances ($)</label><input id="ca" name="cash_advances" type="number" step="0.01" defaultValue="0" className="input" /></div>
                <div className="field"><label htmlFor="sn">Notes</label><input id="sn" name="notes" className="input" /></div>
                <button className="btn btn-gold">Create pay statement</button>
              </div>
              <p className="text-sm text-muted">Driver pay = (load total − QP fee − gas) × split %. The split comes from the driver&apos;s profile and is locked in when a run sheet is approved.</p>
            </form>
          )}
        </Panel>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold">Pay statements</h2>
      {(settlements ?? []).length === 0 ? <Empty>No pay statements yet.</Empty> : (
        <Table caption="Pay statements" head={["Driver", "Period", "Cash advances", "Status", "Paid on"]}>
          {(settlements ?? []).map((s: any) => (
            <tr key={s.id}>
              <td><Link className="link font-semibold" href={`/portal/driver-runs/${s.id}`}>{s.drivers?.full_name}</Link></td>
              <td>{date(s.period_start)} to {date(s.period_end)}</td>
              <td>{money(s.cash_advances)}</td>
              <td><Badge status={s.status === "paid" ? "paid" : "partial"} label={s.status === "paid" ? "Paid" : "Open"} /></td>
              <td>{date(s.paid_on)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
