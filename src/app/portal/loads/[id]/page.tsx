import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, Flash, PageHead, Panel } from "@/components/portal/ui";
import { INVOICE_STATUS, LOAD_STATUS, PARTY, POSITIONS, date, dateTime, money } from "@/lib/format";
import LoadForm from "../LoadForm";
import { loadFormData } from "../data";
import { assignDriver, setLoadStatus, unassignDriver } from "../actions";
import { createInvoiceFromLoad } from "../../invoices/actions";

export const metadata = { title: "Load" };

export default async function LoadDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const sb = await supabaseServer();
  const { data: load } = await sb
    .from("loads")
    .select("*, customer:customers!loads_customer_id_fkey(*), invoice_customer:customers!loads_invoice_customer_id_fkey(*), load_positions(position), load_assignments(id, driver_id, position, acknowledged_at, drivers(full_name, phone)), run_sheets(id, status, total_due, driver_id, drivers(full_name)), invoices(id, number, status, total)")
    .eq("id", id)
    .single();
  if (!load) notFound();
  const formData = await loadFormData();
  const l = load as any;
  const maps = (q: string) => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(l.pickup ?? "")}&destination=${encodeURIComponent(q)}`;

  return (
    <>
      <PageHead
        title={`${l.load_no}: ${l.pickup ?? "?"} → ${l.dropoff ?? "?"}`}
        sub={<>{date(l.load_date)} · booked by {l.booked_by ?? "-"} · <Badge status={l.status} label={LOAD_STATUS[l.status]} /></>}
        actions={<>
          <Link className="btn btn-line" href={`/portal/loads/new?from=${l.id}`}>🔁 Book again</Link>
          <a className="btn btn-line" href={maps(l.dropoff ?? "")} target="_blank" rel="noopener noreferrer">Route in Google Maps<span className="sr-only"> (opens in a new tab)</span></a>
        </>}
      />
      <Flash msg={sp.saved ? "Load saved." : null} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Summary" id="sum" className="xl:col-span-2">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Customer", `${l.customer?.company ?? "-"} (${PARTY[l.customer?.type ?? "not_set"]})`],
              ["Contact", [l.customer?.contact_name, l.customer?.phone, l.customer?.email].filter(Boolean).join(" · ") || "-"],
              ["Invoice to", `${l.invoice_customer?.company ?? l.customer?.company ?? "-"}${l.invoice_email ? ` · ${l.invoice_email}` : ""}`],
              ["Quick pay", l.quick_pay === "yes" ? `Yes${l.qp_fee_pct ? `, ${l.qp_fee_pct}%` : ""}` : l.quick_pay === "no" ? "No" : "Not set"],
              ["Terms / paid by", [l.payment_terms?.replace(/_/g, " "), l.paid_by].filter(Boolean).join(" · ") || "-"],
              ["Truck", [l.truck_driver_name, l.truck_driver_phone, l.trucking_company, l.truck_number && `#${l.truck_number}`].filter(Boolean).join(" · ") || "-"],
              ["Miles / empty at", [l.est_miles && `${l.est_miles} mi`, l.empty_at].filter(Boolean).join(" · ") || "-"],
              ["Dimensions", [l.height && `H ${l.height}`, l.width && `W ${l.width}`, l.length && `L ${l.length}`, l.weight && `${l.weight}`].filter(Boolean).join(" · ") || "-"],
              ["Positions", l.load_positions.map((p: any) => POSITIONS[p.position]).join(", ") || "-"],
              ["Rates", [l.rate_per_mile && `${money(l.rate_per_mile)}/mi`, l.rate_day && `day ${money(l.rate_day)}`, l.rate_overnight && `overnight ${money(l.rate_overnight)}`, l.rate_no_go && `no-go ${money(l.rate_no_go)}`, l.rate_mini && `mini ${money(l.rate_mini)}`, l.rate_flat && `flat ${money(l.rate_flat)}`].filter(Boolean).join(" · ") || "-"],
              ["Order #", l.order_no ?? "-"],
              ["Remarks", l.remarks ?? "-"],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-sm text-muted">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </Panel>

        <Panel title="Status" id="st">
          <form action={setLoadStatus} className="space-y-3">
            <input type="hidden" name="load_id" value={l.id} />
            <div className="field"><label htmlFor="ls">Load status</label>
              <select id="ls" name="status" defaultValue={l.status} className="input">{Object.entries(LOAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="field"><label htmlFor="ot">Delivered on time?</label>
              <select id="ot" name="on_time" defaultValue={l.on_time === null ? "" : l.on_time ? "yes" : "no"} className="input">
                <option value="">Not judged</option><option value="yes">Yes</option><option value="no">No</option></select></div>
            <button className="btn btn-gold">Update status</button>
          </form>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Pilots" id="pil">
          <ul className="divide-y divide-rule">
            {l.load_assignments.map((a: any) => (
              <li key={a.id} className="flex items-start justify-between gap-2 py-2">
                <div>
                  <Link href={`/portal/drivers/${a.driver_id}`} className="font-medium underline-offset-4 hover:underline">{a.drivers?.full_name}</Link>
                  <p className="text-sm text-muted">{a.position ? POSITIONS[a.position] : "Position not set"} · {a.acknowledged_at ? `Acknowledged ${dateTime(a.acknowledged_at)}` : "Not acknowledged yet"}</p>
                </div>
                <form action={unassignDriver}>
                  <input type="hidden" name="assignment_id" value={a.id} /><input type="hidden" name="load_id" value={l.id} />
                  <button className="min-h-11 text-sm text-muted underline-offset-4 hover:underline" aria-label={`Remove ${a.drivers?.full_name} from this load`}>Remove</button>
                </form>
              </li>
            ))}
          </ul>
          <form action={assignDriver} className="mt-3 grid gap-2">
            <input type="hidden" name="load_id" value={l.id} />
            <div className="field"><label htmlFor="ad">Add a pilot</label>
              <select id="ad" name="driver_id" className="input" required>{formData.drivers.filter((d) => !l.load_assignments.some((a: any) => a.driver_id === d.id)).map((d) => <option key={d.id} value={d.id}>{d.full_name}{d.status === "needs_load" ? " (needs a load)" : ""}</option>)}</select></div>
            <div className="field"><label htmlFor="ap">Position</label>
              <select id="ap" name="position" className="input"><option value="">Not set</option>{Object.entries(POSITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <button className="btn btn-line">Assign and notify</button>
          </form>
        </Panel>

        <Panel title="Run sheets" id="rs">
          {l.run_sheets.length === 0 ? <p className="text-muted">None yet. Drivers fill these in after the run.</p> : (
            <ul className="divide-y divide-rule">{l.run_sheets.map((r: any) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <Link href={`/portal/run-sheets/${r.id}`} className="link">{r.drivers?.full_name}</Link>
                <span className="flex items-center gap-2">{money(r.total_due)} <Badge status={r.status} label={r.status === "draft" ? "Saved, not sent" : r.status[0].toUpperCase() + r.status.slice(1)} /></span>
              </li>))}</ul>
          )}
        </Panel>

        <Panel title="Invoices" id="inv">
          {l.invoices.length > 0 && (
            <ul className="mb-3 divide-y divide-rule">{l.invoices.map((i: any) => (
              <li key={i.id} className="flex items-center justify-between py-2">
                <Link href={`/portal/invoices/${i.id}`} className="link">{i.number}</Link>
                <span className="flex items-center gap-2">{money(i.total)} <Badge status={i.status} label={INVOICE_STATUS[i.status]} /></span>
              </li>))}</ul>
          )}
          <form action={createInvoiceFromLoad}>
            <input type="hidden" name="load_id" value={l.id} />
            <button className="btn btn-gold">{l.run_sheets.some((r: any) => r.status !== "draft") ? "Create invoice from run sheet" : "Create invoice from load"}</button>
          </form>
        </Panel>
      </div>

      <details className="mt-6 rounded-md border border-rule p-4">
        <summary className="cursor-pointer text-base font-bold">Edit load</summary>
        <div className="mt-4"><LoadForm {...formData} load={l} /></div>
      </details>
    </>
  );
}
