import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Empty, PageHead, Table } from "@/components/portal/ui";
import { LOAD_STATUS, POSITIONS, date, money } from "@/lib/format";

export const metadata = { title: "Loads" };

type SP = { q?: string; status?: string; driver?: string; from?: string; to?: string; view?: string; month?: string };

export default async function Loads({ searchParams }: { searchParams: Promise<SP> }) {
  await requireStaff();
  const sp = await searchParams;
  const sb = await supabaseServer();
  const view = sp.view === "calendar" ? "calendar" : "list";

  let q = sb
    .from("loads")
    .select("id, load_no, status, pickup, dropoff, load_date, est_miles, rate_per_mile, rate_flat, booked_by, customer:customers!loads_customer_id_fkey(company), load_positions(position), load_assignments(driver_id, drivers(full_name))")
    .order("load_date", { ascending: false, nullsFirst: false })
    .limit(500);
  if (sp.status) q = q.eq("status", sp.status);
  else q = q.neq("status", "cancelled");
  if (sp.from) q = q.gte("load_date", sp.from);
  if (sp.to) q = q.lte("load_date", sp.to);

  const month = sp.month ?? new Date().toISOString().slice(0, 7);
  if (view === "calendar") {
    const [y, m] = month.split("-").map(Number);
    const start = `${month}-01`;
    const end = new Date(y, m, 0).toISOString().slice(0, 10);
    q = q.gte("load_date", start).lte("load_date", end);
  }
  const [{ data }, { data: drivers }] = await Promise.all([q, sb.from("drivers").select("id, full_name").order("full_name")]);
  let rows = (data ?? []) as any[];
  if (sp.driver) rows = rows.filter((r) => r.load_assignments.some((a: any) => a.driver_id === sp.driver));
  if (sp.q) {
    const t = sp.q.toLowerCase();
    rows = rows.filter((r) => [r.load_no, r.pickup, r.dropoff, r.customer?.company].some((v) => v?.toLowerCase().includes(t)));
  }

  const qs = (p: Partial<SP>) => "?" + new URLSearchParams(Object.entries({ ...sp, ...p }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageHead title="Loads" actions={<>
        <Link href={qs({ view: view === "list" ? "calendar" : "list" })} className="btn btn-line">{view === "list" ? "Calendar view" : "List view"}</Link>
        <Link href="/portal/loads/new" className="btn btn-gold">Book a load</Link>
      </>} />

      <form className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end" role="search" aria-label="Filter loads">
        <input type="hidden" name="view" value={view} />
        <div className="field lg:col-span-2"><label htmlFor="q">Search</label><input id="q" name="q" defaultValue={sp.q} className="input" placeholder="Load #, city, customer" /></div>
        <div className="field"><label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="input"><option value="">All except cancelled</option>{Object.entries(LOAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="field"><label htmlFor="driver">Driver</label>
          <select id="driver" name="driver" defaultValue={sp.driver ?? ""} className="input"><option value="">Any</option>{(drivers ?? []).map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></div>
        {view === "list" ? (
          <>
            <div className="field"><label htmlFor="from">From</label><input id="from" name="from" type="date" defaultValue={sp.from} className="input" /></div>
            <div className="field"><label htmlFor="to">To</label><input id="to" name="to" type="date" defaultValue={sp.to} className="input" /></div>
          </>
        ) : (
          <div className="field"><label htmlFor="month">Month</label><input id="month" name="month" type="month" defaultValue={month} className="input" /></div>
        )}
        <div className="flex gap-2 lg:col-span-6"><button className="btn btn-gold">Apply filters</button><Link href="/portal/loads" className="btn btn-line">Reset</Link></div>
      </form>

      {view === "calendar" ? (
        <Calendar month={month} rows={rows} />
      ) : rows.length === 0 ? (
        <Empty action={<Link href="/portal/loads/new" className="btn btn-gold">Book a load</Link>}>No loads match these filters.</Empty>
      ) : (
        <Table caption="Loads" head={["Load", "Date", "Customer", "Route", "Positions", "Pilot", "Rate", "Status"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/portal/loads/${r.id}`} className="link font-semibold">{r.load_no}</Link></td>
              <td className="whitespace-nowrap">{date(r.load_date)}</td>
              <td>{r.customer?.company}</td>
              <td>{r.pickup} → {r.dropoff}{r.est_miles ? <span className="block text-sm text-muted">{r.est_miles} mi</span> : null}</td>
              <td>{r.load_positions.map((p: any) => POSITIONS[p.position]).join(", ")}</td>
              <td>{r.load_assignments.map((a: any) => a.drivers?.full_name).join(", ") || <span className="text-muted">Unassigned</span>}</td>
              <td className="whitespace-nowrap">{r.rate_flat ? money(r.rate_flat) + " flat" : r.rate_per_mile ? money(r.rate_per_mile) + "/mi" : ""}</td>
              <td><Badge status={r.status} label={LOAD_STATUS[r.status]} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

function Calendar({ month, rows }: { month: string; rows: any[] }) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const lead = first.getDay();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const byDay = (d: number) => rows.filter((r) => r.load_date === `${month}-${String(d).padStart(2, "0")}`);
  return (
    <div>
      <h2 className="mb-3 text-xl font-semibold">{first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
      <div className="hidden grid-cols-7 gap-px rounded-md border border-rule bg-rule md:grid" role="grid" aria-label="Loads calendar">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} role="columnheader" className="bg-surface-2 px-2 py-1.5 text-sm font-semibold">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} role="gridcell" className="min-h-28 bg-bg p-1.5">
            {d && <p className="text-sm text-muted">{d}</p>}
            {d && byDay(d).map((r) => (
              <Link key={r.id} href={`/portal/loads/${r.id}`} className="mt-1 block rounded border border-field px-1.5 py-1 text-xs hover:border-gold">
                <span className="font-semibold">{r.load_no}</span> {r.pickup?.split(",")[0]} → {r.dropoff?.split(",")[0]}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <ul className="space-y-2 md:hidden">
        {Array.from({ length: days }, (_, i) => i + 1).filter((d) => byDay(d).length).map((d) => (
          <li key={d}><p className="font-semibold">{new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
            {byDay(d).map((r) => <Link key={r.id} href={`/portal/loads/${r.id}`} className="block link">{r.load_no}: {r.pickup} → {r.dropoff}</Link>)}</li>
        ))}
      </ul>
    </div>
  );
}
