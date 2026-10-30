import Link from "next/link";
import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/portal/ui";
import { LOAD_STATUS, POSITIONS, date } from "@/lib/format";

export const metadata = { title: "Loads" };

export default async function DriverLoads() {
  const me = await requireDriver();
  const sb = await supabaseServer();
  const { data } = await sb.from("load_assignments").select("position, acknowledged_at, loads(id, load_no, pickup, dropoff, load_date, status)").eq("driver_id", me.driverId);
  const rows = ((data ?? []) as any[]).filter((a) => a.loads).sort((a, b) => (b.loads.load_date ?? "").localeCompare(a.loads.load_date ?? ""));
  const upcoming = rows.filter((a) => ["booked", "assigned", "in_progress"].includes(a.loads.status)).reverse();
  const past = rows.filter((a) => !["booked", "assigned", "in_progress"].includes(a.loads.status));
  const List = ({ items }: { items: any[] }) => (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.loads.id}>
          <Link href={`/driver/loads/${a.loads.id}`} className="block rounded-md border border-rule p-3 hover:border-gold">
            <span className="flex items-center justify-between gap-2">
              <span className="font-semibold">{a.loads.pickup} → {a.loads.dropoff}</span>
              <Badge status={a.loads.status} label={LOAD_STATUS[a.loads.status]} />
            </span>
            <span className="text-sm text-muted">{a.loads.load_no} · {date(a.loads.load_date)}{a.position ? ` · ${POSITIONS[a.position]}` : ""}{!a.acknowledged_at && ["booked", "assigned"].includes(a.loads.status) ? " · needs your OK" : ""}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <h1 className="display-2">Your loads</h1>
      <h2 className="mt-6 mb-2 text-lg font-semibold">Upcoming and active</h2>
      {upcoming.length ? <List items={upcoming} /> : <p className="text-muted">Nothing assigned right now.</p>}
      <h2 className="mt-6 mb-2 text-lg font-semibold">Past</h2>
      {past.length ? <List items={past} /> : <p className="text-muted">No past loads yet.</p>}
    </>
  );
}
