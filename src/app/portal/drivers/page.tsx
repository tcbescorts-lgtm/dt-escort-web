import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Empty, PageHead, Table } from "@/components/portal/ui";
import { DRIVER_STATUS, POSITIONS, dateTime } from "@/lib/format";

export const metadata = { title: "Drivers" };

export default async function Drivers({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const sb = await supabaseServer();
  let q = sb.from("drivers").select("id, full_name, phone, email, status, status_note, status_updated_at, positions, split_pct, active, profile_id").order("full_name");
  if (!sp.all) q = q.eq("active", true);
  const { data } = await q;
  return (
    <>
      <PageHead title="Drivers" actions={<>
        <Link href={sp.all ? "/portal/drivers" : "/portal/drivers?all=1"} className="btn btn-line">{sp.all ? "Active only" : "Show inactive too"}</Link>
        <Link href="/portal/drivers/new" className="btn btn-gold">Add driver</Link>
      </>} />
      {(data ?? []).length === 0 ? <Empty action={<Link href="/portal/drivers/new" className="btn btn-gold">Add driver</Link>}>No drivers yet.</Empty> : (
        <Table caption="Drivers" head={["Name", "Status", "Positions", "Split", "Contact", "Login"]}>
          {(data ?? []).map((d) => (
            <tr key={d.id}>
              <td><Link className="link font-semibold" href={`/portal/drivers/${d.id}`}>{d.full_name}</Link>{!d.active && <span className="block text-sm text-muted">Inactive</span>}</td>
              <td>{d.status ? <Badge status={d.status} label={DRIVER_STATUS[d.status]} /> : <span className="text-muted">Not set</span>}
                {d.status_note && <span className="block text-sm text-muted">{d.status_note}</span>}
                {d.status_updated_at && <span className="block text-sm text-muted">{dateTime(d.status_updated_at)}</span>}</td>
              <td>{(d.positions ?? []).map((p: string) => POSITIONS[p]).join(", ")}</td>
              <td>{d.split_pct}%</td>
              <td>{d.phone}<span className="block text-sm text-muted">{d.email}</span></td>
              <td>{d.profile_id ? "Yes" : "No"}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
