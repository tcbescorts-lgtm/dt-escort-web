import { requireOwner } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Flash, PageHead, Panel, Table } from "@/components/portal/ui";
import { date } from "@/lib/format";
import { updateUser } from "../actions";
import NewStaffForm from "./NewStaffForm";

export const metadata = { title: "Users and roles" };

export default async function Users({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const me = await requireOwner();
  const sp = await searchParams;
  const sb = await supabaseServer();
  const { data } = await sb.from("profiles").select("id, full_name, email, role, active, created_at").order("role").order("full_name");
  return (
    <>
      <PageHead title="Users and roles" sub="Owner: everything, including users, reports and the audit log. Admin: loads, drivers, customers, invoices. Driver: only their own information." />
      <Flash msg={sp.err ? "You can't change your own role or turn off your own account." : null} kind="bad" />
      <Table caption="Users" head={["Name", "Email", "Role", "Active", "Created", ""]}>
        {(data ?? []).map((u) => (
          <tr key={u.id}>
            <td>{u.full_name || "—"}</td><td>{u.email}</td>
            <td colSpan={2}>
              <form action={updateUser} className="flex flex-wrap items-center gap-2" id={`u-${u.id}`}>
                <input type="hidden" name="id" value={u.id} />
                <label className="sr-only" htmlFor={`r-${u.id}`}>Role for {u.email}</label>
                <select id={`r-${u.id}`} name="role" defaultValue={u.role} className="input !min-h-11 w-32" disabled={u.id === me.id}>
                  <option value="owner">Owner</option><option value="admin">Admin</option><option value="driver">Driver</option>
                </select>
                <label className="check items-center"><input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} /><span>Active</span></label>
              </form>
            </td>
            <td>{date(u.created_at)}</td>
            <td>{u.id !== me.id && <button form={`u-${u.id}`} className="btn btn-line !min-h-11">Save</button>}</td>
          </tr>
        ))}
      </Table>
      <Panel title="Add office user" id="ns" className="mt-6 max-w-2xl"><NewStaffForm /></Panel>
      <p className="mt-4 text-sm text-muted">Drivers are added from the Drivers page so their profile is created too.</p>
    </>
  );
}
