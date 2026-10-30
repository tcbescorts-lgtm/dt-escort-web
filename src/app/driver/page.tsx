import Link from "next/link";
import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { DRIVER_STATUS, POSITIONS, date, money } from "@/lib/format";
import { company } from "@/lib/site";
import { PhoneIcon } from "@/components/Icons";

export const metadata = { title: "Home" };

export default async function DriverHome() {
  const me = await requireDriver();
  const sb = await supabaseServer();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [{ data: d }, { data: assigns }, { data: runs }, { data: drafts }] = await Promise.all([
    sb.from("drivers").select("status, status_note, status_updated_at").eq("id", me.driverId).single(),
    sb.from("load_assignments").select("position, acknowledged_at, loads(id, load_no, pickup, dropoff, load_date, status)").eq("driver_id", me.driverId),
    sb.from("driver_runs").select("driver_pay, run_date, settlement_id").eq("driver_id", me.driverId).gte("run_date", monthStart),
    sb.from("run_sheets").select("load_id").eq("driver_id", me.driverId).eq("status", "draft"),
  ]);
  const loads = (assigns ?? []).filter((a: any) => a.loads && !["cancelled", "paid"].includes(a.loads.status)).sort((a: any, b: any) => (a.loads.load_date ?? "").localeCompare(b.loads.load_date ?? ""));
  const active = loads.find((a: any) => a.loads.status === "in_progress") ?? loads.find((a: any) => ["assigned", "booked"].includes(a.loads.status) && a.loads.load_date <= new Date().toISOString().slice(0, 10));
  const next = loads.find((a: any) => a !== active && ["assigned", "booked"].includes(a.loads.status));
  const needSheet = (assigns ?? []).filter((a: any) => a.loads && a.loads.status === "delivered");
  const month = (runs ?? []).reduce((a, r) => a + Number(r.driver_pay), 0);

  const Card = ({ a, title }: { a: any; title: string }) => (
    <section aria-label={title} className="rounded-md border border-rule bg-surface p-4">
      <p className="text-sm text-muted">{title}</p>
      <Link href={`/driver/loads/${a.loads.id}`} className="mt-1 block text-lg font-bold underline-offset-4 hover:underline">{a.loads.pickup} → {a.loads.dropoff}</Link>
      <p className="text-muted">{a.loads.load_no} · {date(a.loads.load_date)}{a.position ? ` · ${POSITIONS[a.position]}` : ""}</p>
      {!a.acknowledged_at && <p className="mt-2 font-medium text-gold">Not acknowledged yet. Open it to confirm.</p>}
    </section>
  );

  return (
    <div className="space-y-4">
      <section aria-label="Your status" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-rule p-4">
        <div>
          <p className="text-sm text-muted">Your status</p>
          <p className="text-lg font-bold">{d?.status ? DRIVER_STATUS[d.status] : "Not set"}</p>
          {d?.status_note && <p className="text-muted">{d.status_note}</p>}
        </div>
        <Link href="/driver/status" className="btn btn-line">Change</Link>
      </section>

      {active ? <Card a={active} title="Active load" /> : <p className="rounded-md border border-dashed border-field p-4 text-muted">No active load right now.</p>}
      {next && <Card a={next} title="Next load" />}

      <div className="grid grid-cols-2 gap-3">
        <a href={company.telHref} className="btn btn-gold"><PhoneIcon /> Call dispatch</a>
        <Link href="/driver/run-sheet" className="btn btn-line">Run sheets{(needSheet.length + (drafts ?? []).length) ? ` (${needSheet.length + (drafts ?? []).length})` : ""}</Link>
      </div>

      <section aria-label="Earnings" className="rounded-md border border-rule p-4">
        <p className="text-sm text-muted">Your pay from submitted runs this month</p>
        <p className="text-xl font-bold">{money(month)}</p>
        <Link href="/driver/pay" className="link mt-1 inline-block">See pay details</Link>
      </section>
    </div>
  );
}
