import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, PageHead } from "@/components/portal/ui";
import { INVOICE_STATUS, LOAD_STATUS, date, money } from "@/lib/format";

export const metadata = { title: "Search" };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff();
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const sb = await supabaseServer();
  const like = `%${q.replace(/[%_,()]/g, " ")}%`;
  const [loads, customers, drivers, invoices] = q.length < 2 ? [null, null, null, null] : await Promise.all([
    sb.from("loads").select("id, load_no, pickup, dropoff, load_date, status").or(`load_no.ilike.${like},pickup.ilike.${like},dropoff.ilike.${like},order_no.ilike.${like},truck_driver_name.ilike.${like}`).order("load_date", { ascending: false }).limit(15),
    sb.from("customers").select("id, company, contact_name, phone").or(`company.ilike.${like},contact_name.ilike.${like},email.ilike.${like}`).limit(10),
    sb.from("drivers").select("id, full_name, phone").or(`full_name.ilike.${like},phone.ilike.${like}`).limit(10),
    sb.from("invoices").select("id, number, bill_to_name, total, status").or(`number.ilike.${like},bill_to_name.ilike.${like}`).is("archived_at", null).limit(10),
  ]);
  const groups: [string, React.ReactNode[]][] = q.length < 2 ? [] : [
    ["Loads", (loads?.data ?? []).map((l) => <Link key={l.id} href={`/portal/loads/${l.id}`} className="flex items-center justify-between gap-3 py-2 hover:underline underline-offset-4"><span>{l.load_no} · {l.pickup} to {l.dropoff} · {date(l.load_date)}</span><Badge status={l.status} label={LOAD_STATUS[l.status]} /></Link>)],
    ["Customers", (customers?.data ?? []).map((c) => <Link key={c.id} href={`/portal/customers/${c.id}`} className="block py-2 hover:underline underline-offset-4">{c.company}{c.contact_name ? ` · ${c.contact_name}` : ""}{c.phone ? ` · ${c.phone}` : ""}</Link>)],
    ["Drivers", (drivers?.data ?? []).map((d) => <Link key={d.id} href={`/portal/drivers/${d.id}`} className="block py-2 hover:underline underline-offset-4">{d.full_name}{d.phone ? ` · ${d.phone}` : ""}</Link>)],
    ["Invoices", (invoices?.data ?? []).map((i) => <Link key={i.id} href={`/portal/invoices/${i.id}`} className="flex items-center justify-between gap-3 py-2 hover:underline underline-offset-4"><span>{i.number} · {i.bill_to_name} · {money(i.total)}</span><Badge status={i.status} label={INVOICE_STATUS[i.status]} /></Link>)],
  ];
  const total = groups.reduce((a, [, r]) => a + r.length, 0);

  return (
    <>
      <PageHead title="Search" sub={q.length < 2 ? "Type at least 2 letters." : `${total} result${total === 1 ? "" : "s"} for "${q}"`} />
      <form className="mb-4 flex max-w-xl gap-2" role="search">
        <label htmlFor="sq" className="sr-only">Search</label>
        <input id="sq" name="q" defaultValue={q} className="input" placeholder="Load #, city, customer, driver, invoice #" autoFocus />
        <button className="btn btn-gold">Search</button>
      </form>
      <div className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
        {groups.filter(([, r]) => r.length).map(([title, rows]) => (
          <section key={title} aria-label={title} className="border-t border-rule pt-2">
            <h2 className="text-sm font-bold">{title}</h2>
            <div className="divide-y divide-rule text-sm">{rows}</div>
          </section>
        ))}
      </div>
    </>
  );
}
