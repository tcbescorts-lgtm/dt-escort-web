import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Stat } from "@/components/portal/ui";
import { Bars } from "@/components/portal/Charts";
import { DRIVER_STATUS, LOAD_STATUS, date, daysUntil, money } from "@/lib/format";
import { addTodo, deleteTodo, setDriverStatus, toggleTodo } from "./_actions/misc";

export const metadata = { title: "Dashboard" };

const DOT: Record<string, string> = { needs_load: "🟢", on_load: "🚚", vacation: "🌴", other: "⚪" };
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Panel whose body scrolls on its own, so the dashboard fits one screen on a computer. */
function Box({ title, id, action, children, className = "" }: { title: string; id: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`flex min-h-0 flex-col rounded-md border border-rule bg-surface ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-rule px-3 py-2">
        <h2 id={id} className="text-sm font-bold">{title}</h2>
        {action}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1">{children}</div>
    </section>
  );
}

export default async function Dashboard() {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const now = new Date();
  const today = iso(now);
  const monthStart = iso(new Date(now.getFullYear(), now.getMonth(), 1));
  const from = iso(new Date(Date.now() - 86400000));
  const to = iso(new Date(Date.now() + 14 * 86400000));
  const in30 = iso(new Date(Date.now() + 30 * 86400000));

  const lastMonthStart = iso(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const sixAgo = iso(new Date(now.getFullYear(), now.getMonth() - 5, 1));
  const [upcoming, active, drivers, sheets, openInv, recentInv, expiring, todos, staff, recentLoads, comms] = await Promise.all([
    sb.from("loads")
      .select("id, load_no, load_date, pickup, dropoff, status, customer:customers!loads_customer_id_fkey(company), load_assignments(drivers(full_name))")
      .gte("load_date", from).lte("load_date", to)
      .in("status", ["draft", "booked", "assigned", "in_progress"])
      .order("load_date").limit(40),
    sb.from("loads").select("id, status, load_assignments(id)").in("status", ["booked", "assigned", "in_progress"]),
    sb.from("drivers").select("id, full_name, status, status_note").eq("active", true).order("full_name"),
    sb.from("run_sheets").select("id, total_due, submitted_at, drivers(full_name), loads(load_no)").eq("status", "submitted").order("submitted_at"),
    sb.from("invoices").select("id, number, bill_to_name, total, amount_paid, due_date, status").not("status", "in", "(paid,void,draft)").is("archived_at", null),
    sb.from("invoices").select("total, amount_paid, issue_date").gte("issue_date", sixAgo).neq("status", "void").is("archived_at", null),
    sb.from("expiring_items").select("*").lte("expires_on", in30).order("expires_on"),
    sb.from("todos").select("id, title, due_on, done_at, assigned_to").is("done_at", null).order("due_on", { nullsFirst: false }).limit(30),
    sb.from("profiles").select("id, full_name").in("role", ["owner", "admin"]).eq("active", true),
    sb.from("loads").select("load_date").gte("load_date", lastMonthStart).neq("status", "cancelled"),
    sb.from("comms").select("id, kind, from_number, body, occurred_at, drivers(full_name), customers(company)").is("read_at", null).order("occurred_at", { ascending: false }).limit(5),
  ]);

  const activeLoads = active.data ?? [];
  const unassigned = activeLoads.filter((l: any) => l.status === "booked" && !(l.load_assignments ?? []).length).length;
  const invoices = openInv.data ?? [];
  const outstanding = invoices.reduce((a, r) => a + Math.max(0, Number(r.total) - Number(r.amount_paid)), 0);
  const overdue = invoices.filter((i) => i.due_date && i.due_date < today && Number(i.amount_paid) < Number(i.total));
  const inv6 = recentInv.data ?? [];
  const sumIn = (from: string, to?: string) => inv6.filter((i) => i.issue_date >= from && (!to || i.issue_date < to)).reduce((a, r) => a + Number(r.total), 0);
  const invoicedMonth = sumIn(monthStart);
  const invoicedLast = sumIn(lastMonthStart, monthStart);
  const loadsMonth = (recentLoads.data ?? []).filter((l) => l.load_date >= monthStart).length;
  const loadsLast = (recentLoads.data ?? []).filter((l) => l.load_date < monthStart).length;
  const delta = (a: number, b: number, f: (n: number) => string) => (a === 0 && b === 0 ? null : { text: f(Math.abs(a - b)), up: a >= b });
  const chart = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = iso(m).slice(0, 7);
    const rows = inv6.filter((r) => r.issue_date.startsWith(key));
    return { month: m.toLocaleDateString("en-US", { month: "short" }), invoiced: rows.reduce((a, r) => a + Number(r.total), 0), collected: rows.reduce((a, r) => a + Number(r.amount_paid), 0) };
  });
  const free = (drivers.data ?? []).filter((d) => d.status === "needs_load");
  const staffName = (id: string | null) => (staff.data ?? []).find((s) => s.id === id)?.full_name ?? "";
  const first = me.fullName && me.fullName !== "Owner" ? `, ${me.fullName.split(" ")[0]}` : "";

  const attention = [
    ...(comms.data ?? []).map((c: any) => ({ key: `cm${c.id}`, icon: c.kind === "message" ? "💬" : "📵", href: "/portal/messages", text: `${c.kind === "message" ? "Text" : "Missed call"} from ${c.drivers?.full_name ?? c.customers?.company ?? c.from_number ?? "unknown"}`, sub: c.body ?? "" })),
    ...(sheets.data ?? []).map((s: any) => ({ key: `rs${s.id}`, icon: "📝", href: `/portal/run-sheets/${s.id}`, text: `Approve run sheet ${s.loads?.load_no ?? ""}`, sub: `${s.drivers?.full_name ?? ""} · ${money(s.total_due)}` })),
    ...(unassigned ? [{ key: "un", icon: "🚚", href: "/portal/loads?status=booked", text: `${unassigned} booked load${unassigned > 1 ? "s" : ""} without a pilot`, sub: "Assign a driver" }] : []),
    ...overdue.map((i) => ({ key: `iv${i.id}`, icon: "💵", href: `/portal/invoices/${i.id}`, text: `Overdue ${i.number}`, sub: `${i.bill_to_name} · ${money(Number(i.total) - Number(i.amount_paid))} · due ${date(i.due_date)}` })),
    ...(expiring.data ?? []).map((e: any, n: number) => {
      const d = daysUntil(e.expires_on);
      return { key: `ex${n}`, icon: "⚠️", href: `/portal/drivers/${e.driver_id}`, text: `${e.full_name}: ${e.item}`, sub: d < 0 ? `Expired ${date(e.expires_on)}` : `Expires in ${d} days` };
    }),
  ];

  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100vh-6.5rem)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold leading-tight">Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}{first}</h1>
          <p className="text-sm text-muted">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/portal/loads/new" className="btn btn-gold">+ Book a load</Link>
          <Link href="/portal/loads?view=calendar" className="btn btn-line">Calendar</Link>
          {me.role === "owner" && <Link href="/portal/reports" className="btn btn-line">Reports</Link>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat big label="Loads this month" value={loadsMonth} delta={delta(loadsMonth, loadsLast, String)} />
        <Stat big label="Invoiced this month" value={money(invoicedMonth)} delta={delta(invoicedMonth, invoicedLast, money)} />
        <Stat big label="Outstanding" value={money(outstanding)} hint={overdue.length ? `${overdue.length} overdue` : "None overdue"} />
        <Stat big label="Active loads" value={activeLoads.length} hint={unassigned ? `${unassigned} need a pilot` : "All have a pilot"} />
        <Stat big label="Drivers free" value={free.length} hint={`of ${(drivers.data ?? []).length} active · ${(sheets.data ?? []).length} run sheet${(sheets.data ?? []).length === 1 ? "" : "s"} to approve`} />
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Box title="🗓️ Next 14 days" id="up" action={<Link href="/portal/loads" className="link text-xs">All loads</Link>}>
          {(upcoming.data ?? []).length === 0 ? (
            <p className="py-3 text-sm text-muted">No loads in the next two weeks.</p>
          ) : (
            <ul className="divide-y divide-rule text-sm">
              {(upcoming.data ?? []).map((l: any) => {
                const pilots = (l.load_assignments ?? []).map((a: any) => a.drivers?.full_name).filter(Boolean).join(", ");
                return (
                  <li key={l.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-2 py-1.5">
                    <span className={`tabular-nums ${l.load_date === today ? "font-bold text-gold" : "text-muted"}`}>{l.load_date === today ? "Today" : date(l.load_date).replace(/, \d{4}$/, "")}</span>
                    <Link href={`/portal/loads/${l.id}`} className="min-w-0 hover:underline underline-offset-4">
                      <span className="block truncate font-medium">{l.pickup} to {l.dropoff}</span>
                      <span className="block truncate text-xs text-muted">{l.load_no} · {l.customer?.company ?? "No customer"} · {pilots || "No pilot"}</span>
                    </Link>
                    <Badge status={l.status} label={LOAD_STATUS[l.status]} />
                  </li>
                );
              })}
            </ul>
          )}
        </Box>

        <div className="grid min-h-0 gap-3 lg:grid-rows-[auto_minmax(0,1fr)]">
        <section aria-labelledby="ch" className="rounded-md border border-rule bg-surface px-3 py-2">
          <h2 id="ch" className="text-sm font-bold">💵 Invoiced and collected, last 6 months</h2>
          <Bars title="Invoiced and collected by month" data={chart} x="month" series={[{ key: "invoiced", label: "Invoiced" }, { key: "collected", label: "Collected" }]} fmt="money" height={130} />
        </section>
        <Box title="👥 Drivers" id="dr" action={<Link href="/portal/drivers" className="link text-xs">Manage</Link>}>
          {(drivers.data ?? []).length === 0 ? (
            <p className="py-3 text-sm text-muted">No drivers yet. <Link href="/portal/drivers/new" className="link">Add one</Link></p>
          ) : (
            <ul className="divide-y divide-rule text-sm">
              {(drivers.data ?? []).map((d) => (
                <li key={d.id} className="flex items-center gap-2 py-1.5">
                  <span aria-hidden="true">{DOT[d.status ?? "other"]}</span>
                  <Link href={`/portal/drivers/${d.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline underline-offset-4" title={d.status_note ?? undefined}>{d.full_name}</Link>
                  <form action={setDriverStatus} className="flex items-center gap-1">
                    <input type="hidden" name="driver_id" value={d.id} />
                    <label className="sr-only" htmlFor={`st-${d.id}`}>Status for {d.full_name}</label>
                    <select id={`st-${d.id}`} name="status" defaultValue={d.status ?? "other"} className="input !min-h-8 !w-auto !py-0.5 !pl-2 !pr-6 text-xs">
                      {Object.entries(DRIVER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button className="btn btn-line !min-h-8 !px-2 !py-0.5 text-xs">Set</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Box>
        </div>

        <div className="grid min-h-0 gap-3 lg:grid-rows-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Box title="⚠️ Needs attention" id="na">
            {attention.length === 0 ? <p className="py-3 text-sm text-muted">All clear.</p> : (
              <ul className="divide-y divide-rule text-sm">
                {attention.map((a) => (
                  <li key={a.key} className="py-1.5">
                    <Link href={a.href} className="flex gap-2 hover:underline underline-offset-4">
                      <span aria-hidden="true">{a.icon}</span>
                      <span className="min-w-0"><span className="block truncate font-medium">{a.text}</span><span className="block truncate text-xs text-muted">{a.sub}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Box>

          <Box title="✅ To-do" id="todo">
            <form action={addTodo} className="sticky top-0 z-10 flex gap-1.5 bg-surface py-1.5">
              <label htmlFor="todo-title" className="sr-only">New task</label>
              <input id="todo-title" name="title" className="input !min-h-8 !py-1 text-sm" placeholder="Add a task" required />
              <label htmlFor="todo-due" className="sr-only">Due date</label>
              <input id="todo-due" name="due_on" type="date" className="input !min-h-8 !w-36 !py-1 text-sm" />
              <button className="btn btn-gold !min-h-8 !px-3 !py-1 text-sm">Add</button>
            </form>
            <ul className="divide-y divide-rule text-sm">
              {(todos.data ?? []).map((t) => (
                <li key={t.id} className="flex items-center gap-2 py-1">
                  <form action={toggleTodo}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="done" value="1" />
                    <button className="grid h-8 w-8 place-items-center rounded border border-field hover:border-gold" aria-label={`Mark done: ${t.title}`}>✓</button>
                  </form>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{t.title}</span>
                    {(t.due_on || t.assigned_to) && (
                      <span className={`block text-xs ${t.due_on && daysUntil(t.due_on) < 0 ? "text-error" : "text-muted"}`}>
                        {[t.assigned_to && staffName(t.assigned_to), t.due_on && `due ${date(t.due_on)}`].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  <form action={deleteTodo}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="min-h-8 px-1 text-xs text-muted hover:underline" aria-label={`Delete task: ${t.title}`}>Delete</button>
                  </form>
                </li>
              ))}
            </ul>
          </Box>
        </div>
      </div>
    </div>
  );
}
