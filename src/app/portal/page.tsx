import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Empty, PageHead, Panel, Stat } from "@/components/portal/ui";
import { Bars } from "@/components/portal/Charts";
import { DRIVER_STATUS, LOAD_STATUS, date, dateTime, daysUntil, money, num } from "@/lib/format";
import { addTodo, deleteTodo, setDriverStatus, toggleTodo } from "./_actions/misc";

export const metadata = { title: "Dashboard" };

function months(n: number) {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`, label: m.toLocaleDateString("en-US", { month: "short" }) });
  }
  return out;
}

export default async function Dashboard() {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const since = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString().slice(0, 10);
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

  const [inv, loads, sheets, drivers, expiring, todos, staff, notes, assigns] = await Promise.all([
    sb.from("invoices").select("issue_date, total, amount_paid, status, bill_to_name, due_date").gte("issue_date", since).neq("status", "void"),
    sb.from("loads").select("id, status, load_date, on_time").gte("created_at", since),
    sb.from("run_sheets").select("invoice_date, total_miles, status").in("status", ["submitted", "approved"]).gte("created_at", since),
    sb.from("drivers").select("id, full_name, status, status_note, status_updated_at").eq("active", true).order("full_name"),
    sb.from("expiring_items").select("*").lte("expires_on", in60).order("expires_on"),
    sb.from("todos").select("id, title, due_on, done_at, assigned_to").order("done_at", { nullsFirst: true }).order("due_on", { nullsFirst: false }).limit(30),
    sb.from("profiles").select("id, full_name").in("role", ["owner", "admin"]).eq("active", true),
    sb.from("notifications").select("id, title, body, link, created_at, read_at").order("created_at", { ascending: false }).limit(6),
    sb.from("load_assignments").select("driver_id, drivers(full_name), loads(load_date, status)").gte("created_at", since),
  ]);

  const ms = months(12);
  const invoices = inv.data ?? [];
  const byMonth = ms.map((m) => {
    const rows = invoices.filter((i) => i.issue_date?.startsWith(m.key));
    return {
      month: m.label,
      revenue: rows.reduce((a, r) => a + Number(r.total), 0),
      paid: rows.reduce((a, r) => a + Number(r.amount_paid), 0),
      outstanding: rows.reduce((a, r) => a + Math.max(0, Number(r.total) - Number(r.amount_paid)), 0),
    };
  });
  const milesByMonth = ms.map((m) => ({
    month: m.label,
    miles: (sheets.data ?? []).filter((s) => s.invoice_date?.startsWith(m.key)).reduce((a, s) => a + Number(s.total_miles), 0),
  }));
  const statusCounts = Object.entries(LOAD_STATUS)
    .map(([k, label]) => ({ name: label, loads: (loads.data ?? []).filter((l) => l.status === k).length }))
    .filter((r) => r.loads > 0);
  const perDriver = Object.values(
    (assigns.data ?? []).reduce<Record<string, { name: string; loads: number }>>((acc, a: any) => {
      const n = a.drivers?.full_name ?? "Unknown";
      acc[n] = acc[n] ?? { name: n, loads: 0 };
      acc[n].loads++;
      return acc;
    }, {}),
  ).sort((a, b) => b.loads - a.loads).slice(0, 8);
  const topCustomers = Object.values(
    invoices.reduce<Record<string, { name: string; revenue: number }>>((acc, i) => {
      acc[i.bill_to_name] = acc[i.bill_to_name] ?? { name: i.bill_to_name, revenue: 0 };
      acc[i.bill_to_name].revenue += Number(i.total);
      return acc;
    }, {}),
  ).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  const thisMonth = byMonth[byMonth.length - 1];
  const outstanding = invoices.reduce((a, r) => a + Math.max(0, Number(r.total) - Number(r.amount_paid)), 0);
  const overdue = invoices.filter((i) => i.due_date && i.due_date < new Date().toISOString().slice(0, 10) && Number(i.amount_paid) < Number(i.total)).length;
  const active = (loads.data ?? []).filter((l) => ["booked", "assigned", "in_progress"].includes(l.status)).length;
  const judged = (loads.data ?? []).filter((l) => l.on_time !== null);
  const onTime = judged.length ? Math.round((judged.filter((l) => l.on_time).length / judged.length) * 100) : null;
  const staffName = (id: string | null) => (staff.data ?? []).find((s) => s.id === id)?.full_name ?? "";

  return (
    <>
      <PageHead title={`Hello${me.fullName ? ", " + me.fullName.split(" ")[0] : ""}`} sub={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        actions={<Link href="/portal/loads/new" className="btn btn-gold">Book a load</Link>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Invoiced this month" value={money(thisMonth.revenue)} />
        <Stat label="Outstanding" value={money(outstanding)} hint={overdue ? `${overdue} overdue` : "None overdue"} />
        <Stat label="Active loads" value={active} />
        <Stat label="Miles this month" value={num(milesByMonth[11].miles)} />
        <Stat label="On-time rate" value={onTime === null ? "No data" : `${onTime}%`} hint="Loads marked on time / judged" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel title="Driver status" id="ds" className="xl:col-span-2">
          {(drivers.data ?? []).length === 0 ? (
            <Empty action={<Link href="/portal/drivers/new" className="btn btn-line">Add a driver</Link>}>No drivers yet.</Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["needs_load", "on_load", "vacation", "other"] as const).map((s) => {
                const list = (drivers.data ?? []).filter((d) => (d.status ?? "other") === s);
                return (
                  <div key={s} className="rounded-md border border-rule p-3">
                    <h3 className="flex items-center justify-between font-semibold">
                      {DRIVER_STATUS[s]} <span className="text-muted">{list.length}</span>
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {list.map((d) => (
                        <li key={d.id}>
                          <Link href={`/portal/drivers/${d.id}`} className="font-medium underline-offset-4 hover:underline">{d.full_name}</Link>
                          {d.status_note && <p className="text-sm text-muted">{d.status_note}</p>}
                          <form action={setDriverStatus} className="mt-1 flex gap-1">
                            <input type="hidden" name="driver_id" value={d.id} />
                            <label className="sr-only" htmlFor={`st-${d.id}`}>Change status for {d.full_name}</label>
                            <select id={`st-${d.id}`} name="status" defaultValue={d.status ?? "other"} className="input !min-h-9 !py-1 text-sm">
                              {Object.entries(DRIVER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <button className="btn btn-line !min-h-9 !px-2 !py-1 text-sm">Set</button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Notifications" id="nt" actions={<Link href="/portal/notifications" className="link text-sm">All</Link>}>
          {(notes.data ?? []).length === 0 ? <p className="text-muted">Nothing new.</p> : (
            <ul className="divide-y divide-rule">
              {(notes.data ?? []).map((n) => (
                <li key={n.id} className="py-2">
                  <Link href={n.link ?? "/portal/notifications"} className={`underline-offset-4 hover:underline ${n.read_at ? "" : "font-semibold"}`}>{n.title}</Link>
                  <p className="text-sm text-muted">{n.body} · {dateTime(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="To-do" id="todo" className="xl:col-span-2">
          <form action={addTodo} className="grid gap-2 sm:grid-cols-[1fr_10rem_10rem_auto] sm:items-end">
            <div className="field"><label htmlFor="todo-title">New task</label><input id="todo-title" name="title" className="input" required /></div>
            <div className="field"><label htmlFor="todo-who">Assign to</label>
              <select id="todo-who" name="assigned_to" className="input"><option value="">Anyone</option>{(staff.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.full_name || "Unnamed"}</option>)}</select></div>
            <div className="field"><label htmlFor="todo-due">Due</label><input id="todo-due" name="due_on" type="date" className="input" /></div>
            <button className="btn btn-gold">Add</button>
          </form>
          <ul className="mt-4 divide-y divide-rule">
            {(todos.data ?? []).map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <form action={toggleTodo}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="done" value={t.done_at ? "0" : "1"} />
                  <button className="btn btn-line !min-h-9 !px-2 !py-1 text-sm" aria-label={t.done_at ? `Reopen: ${t.title}` : `Mark done: ${t.title}`}>
                    {t.done_at ? "Reopen" : "Done"}
                  </button>
                </form>
                <div className="min-w-0 flex-1">
                  <p className={t.done_at ? "text-muted line-through" : ""}>{t.title}</p>
                  <p className="text-sm text-muted">
                    {t.assigned_to ? staffName(t.assigned_to) : "Anyone"}
                    {t.due_on ? ` · due ${date(t.due_on)}` : ""}
                    {t.due_on && !t.done_at && daysUntil(t.due_on) < 0 ? " · overdue" : ""}
                  </p>
                </div>
                <form action={deleteTodo}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="text-sm text-muted underline-offset-4 hover:underline min-h-11" aria-label={`Delete task: ${t.title}`}>Delete</button>
                </form>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Expiring in 60 days" id="exp">
          {(expiring.data ?? []).length === 0 ? <p className="text-muted">Nothing expiring.</p> : (
            <ul className="divide-y divide-rule">
              {(expiring.data ?? []).map((e: any, i: number) => {
                const d = daysUntil(e.expires_on);
                return (
                  <li key={i} className="flex items-start justify-between gap-2 py-2">
                    <div>
                      <Link href={`/portal/drivers/${e.driver_id}`} className="font-medium underline-offset-4 hover:underline">{e.full_name}</Link>
                      <p className="text-sm text-muted">{e.item} · {date(e.expires_on)}</p>
                    </div>
                    <Badge status={d < 0 ? "failed" : d <= 7 ? "overdue" : d <= 30 ? "partial" : "draft"} label={d < 0 ? "Expired" : `${d} days`} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Invoiced by month" id="c1"><Bars title="Invoiced by month" data={byMonth} x="month" series={[{ key: "revenue", label: "Invoiced" }]} fmt="money" /></Panel>
        <Panel title="Paid vs outstanding, by invoice month" id="c2"><Bars title="Paid vs outstanding" data={byMonth} x="month" series={[{ key: "paid", label: "Paid" }, { key: "outstanding", label: "Outstanding" }]} fmt="money" /></Panel>
        <Panel title="Loads by status (last 12 months)" id="c3"><Bars title="Loads by status" data={statusCounts} x="name" series={[{ key: "loads", label: "Loads" }]} layout="horizontal" /></Panel>
        <Panel title="Loads per driver" id="c4"><Bars title="Loads per driver" data={perDriver} x="name" series={[{ key: "loads", label: "Loads" }]} layout="horizontal" /></Panel>
        <Panel title="Top customers by invoiced" id="c5"><Bars title="Top customers" data={topCustomers} x="name" series={[{ key: "revenue", label: "Invoiced" }]} fmt="money" layout="horizontal" /></Panel>
        <Panel title="Miles per month" id="c6"><Bars title="Miles per month" data={milesByMonth} x="month" series={[{ key: "miles", label: "Miles" }]} /></Panel>
      </div>
    </>
  );
}
