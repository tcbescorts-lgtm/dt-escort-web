import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Empty, PageHead, Table } from "@/components/portal/ui";
import { date, dateTime, money } from "@/lib/format";

export const metadata = { title: "Run sheets" };

const LABEL: Record<string, string> = { draft: "Saved, not sent", submitted: "Submitted", approved: "Approved" };

export default async function RunSheets({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff();
  const { status = "submitted" } = await searchParams;
  const sb = await supabaseServer();
  let q = sb.from("run_sheets").select("id, status, total_due, invoice_date, submitted_at, dispute, loads(id, load_no, pickup, dropoff), drivers(full_name)").order("submitted_at", { ascending: false, nullsFirst: false }).limit(300);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  const tabs: [string, string][] = [["submitted", "Waiting for review"], ["approved", "Approved"], ["draft", "Drafts"], ["all", "All"]];
  return (
    <>
      <PageHead title="Run sheets" sub="Drivers submit these after each run. Review, correct if needed, approve, then invoice." />
      <nav aria-label="Run sheet status" className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([k, l]) => <Link key={k} href={`?status=${k}`} aria-current={status === k ? "page" : undefined} className={`btn ${status === k ? "btn-gold" : "btn-line"}`}>{l}</Link>)}
      </nav>
      {(data ?? []).length === 0 ? <Empty>No run sheets here.</Empty> : (
        <Table caption="Run sheets" head={["Load", "Driver", "Route", "Invoice date", "Total", "Status", "Submitted"]}>
          {(data ?? []).map((r: any) => (
            <tr key={r.id}>
              <td><Link className="link font-semibold" href={`/portal/run-sheets/${r.id}`}>{r.loads?.load_no}</Link></td>
              <td>{r.drivers?.full_name}</td>
              <td>{r.loads?.pickup} → {r.loads?.dropoff}</td>
              <td>{date(r.invoice_date)}</td>
              <td>{money(r.total_due)}</td>
              <td className="space-x-1"><Badge status={r.status} label={LABEL[r.status]} />{r.dispute && <Badge status="failed" label="Disputed" />}</td>
              <td>{dateTime(r.submitted_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
