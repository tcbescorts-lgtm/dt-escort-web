import { requireOwner } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHead, Table } from "@/components/portal/ui";
import { dateTime } from "@/lib/format";

export const metadata = { title: "Audit log" };

export default async function Audit({ searchParams }: { searchParams: Promise<{ table?: string; action?: string }> }) {
  await requireOwner();
  const sp = await searchParams;
  const sb = await supabaseServer();
  let q = sb.from("audit_log").select("*").order("created_at", { ascending: false }).limit(300);
  if (sp.table) q = q.eq("table_name", sp.table);
  if (sp.action) q = q.eq("action", sp.action);
  const [{ data }, { data: people }] = await Promise.all([q, sb.from("profiles").select("id, full_name, email")]);
  const who = (id: string | null) => (id ? people?.find((p) => p.id === id)?.full_name || people?.find((p) => p.id === id)?.email || "Unknown user" : "System");
  return (
    <>
      <PageHead title="Audit log" sub="Every change to loads, invoices, payments, drivers, customers and users, plus each time someone views sensitive driver details." />
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <div className="field"><label htmlFor="at">Table</label><select id="at" name="table" defaultValue={sp.table ?? ""} className="input"><option value="">All</option>{["loads", "invoices", "payments", "drivers", "driver_private", "customers", "run_sheets", "profiles", "driver_settlements"].map((t) => <option key={t}>{t}</option>)}</select></div>
        <div className="field"><label htmlFor="aa">Action</label><select id="aa" name="action" defaultValue={sp.action ?? ""} className="input"><option value="">All</option>{["insert", "update", "delete", "view_sensitive", "edit_sensitive", "password_changed", "create_driver_account", "reset_driver_password", "update_user"].map((t) => <option key={t}>{t}</option>)}</select></div>
        <button className="btn btn-line">Filter</button>
      </form>
      <Table caption="Audit log" head={["When", "Who", "Action", "Table", "Record", "Changed fields"]}>
        {(data ?? []).map((a) => (
          <tr key={a.id}>
            <td className="whitespace-nowrap">{dateTime(a.created_at)}</td><td>{who(a.actor)}</td><td>{a.action}</td><td>{a.table_name}</td>
            <td className="font-mono text-xs">{a.record_id?.slice(0, 8)}</td>
            <td className="max-w-md text-sm">{a.detail ? Object.keys(a.detail).join(", ") : ""}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
