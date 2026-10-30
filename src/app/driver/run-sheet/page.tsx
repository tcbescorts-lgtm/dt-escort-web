import Link from "next/link";
import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/portal/ui";
import { date, money } from "@/lib/format";

export const metadata = { title: "Run sheets" };
const LABEL: Record<string, string> = { draft: "Saved, not sent", submitted: "Submitted", approved: "Approved" };

export default async function DriverRunSheets() {
  const me = await requireDriver();
  const sb = await supabaseServer();
  const [{ data: assigns }, { data: sheets }] = await Promise.all([
    sb.from("load_assignments").select("loads(id, load_no, pickup, dropoff, load_date, status)").eq("driver_id", me.driverId),
    sb.from("run_sheets").select("load_id, status, total_due, updated_at").eq("driver_id", me.driverId),
  ]);
  const byLoad = new Map((sheets ?? []).map((s) => [s.load_id, s]));
  const rows = ((assigns ?? []) as any[]).filter((a) => a.loads && a.loads.status !== "cancelled").map((a) => ({ l: a.loads, s: byLoad.get(a.loads.id) }));
  const todo = rows.filter((r) => !r.s || r.s.status === "draft").sort((a, b) => (a.l.load_date ?? "").localeCompare(b.l.load_date ?? ""));
  const done = rows.filter((r) => r.s && r.s.status !== "draft").sort((a, b) => (b.l.load_date ?? "").localeCompare(a.l.load_date ?? ""));
  const Item = ({ r }: { r: any }) => (
    <li>
      <Link href={`/driver/run-sheet/${r.l.id}`} className="block rounded-md border border-rule p-3 hover:border-gold">
        <span className="flex items-center justify-between gap-2"><span className="font-semibold">{r.l.pickup} → {r.l.dropoff}</span>
          {r.s ? <Badge status={r.s.status} label={LABEL[r.s.status]} /> : <Badge status="draft" label="Not started" />}</span>
        <span className="text-sm text-muted">{r.l.load_no} · {date(r.l.load_date)}{r.s ? ` · ${money(r.s.total_due)}` : ""}</span>
      </Link>
    </li>
  );
  return (
    <>
      <h1 className="display-2">Run sheets</h1>
      <p className="mt-1 text-muted">After each load, fill in the run sheet and send it to dispatch. Drafts save on your phone even without signal.</p>
      <h2 className="mt-6 mb-2 text-lg font-semibold">To do</h2>
      {todo.length ? <ul className="space-y-2">{todo.map((r) => <Item key={r.l.id} r={r} />)}</ul> : <p className="text-muted">You&apos;re all caught up.</p>}
      <h2 className="mt-6 mb-2 text-lg font-semibold">Sent</h2>
      {done.length ? <ul className="space-y-2">{done.map((r) => <Item key={r.l.id} r={r} />)}</ul> : <p className="text-muted">None yet.</p>}
    </>
  );
}
