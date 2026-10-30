import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, F, Fieldset, Flash, PageHead, Panel, Sel, Stat, TA, Table } from "@/components/portal/ui";
import { DRIVER_STATUS, LOAD_STATUS, POSITIONS, date, dateTime, daysUntil, money } from "@/lib/format";
import { deleteCertification, deleteDocument, saveDriver, saveSensitive, saveVehicle } from "../actions";
import { CertForm, DocForm, ResetPassword } from "./DriverForms";

export const metadata = { title: "Driver" };

const EQUIPMENT: [string, string][] = [
  ["amber_lights", "Amber lights"], ["oversize_signs", "OVERSIZE LOAD signs"], ["flags", "Flags"], ["height_pole", "Height pole"],
  ["cb_radio", "CB / radio"], ["fire_extinguisher", "Fire extinguisher"], ["first_aid", "First aid kit"], ["cones", "Cones"], ["safety_vests", "Safety vests"],
];
const CERT: Record<string, string> = { pevo: "PEVO", state_certification: "State certification", pilot_car_permit: "Pilot car permit", insurance: "Insurance", other: "Other" };

function Exp({ d }: { d: string | null }) {
  if (!d) return <span className="text-muted">—</span>;
  const n = daysUntil(d);
  return <span>{date(d)} {n <= 60 && <Badge status={n < 0 ? "failed" : n <= 7 ? "overdue" : "partial"} label={n < 0 ? "Expired" : `${n} days`} />}</span>;
}

export default async function DriverDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; reveal?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [{ data: d }, { data: certs }, { data: docs }, { data: veh }, { data: hist }, { data: runs }, { data: assigns }, { data: internal }] = await Promise.all([
    sb.from("drivers").select("*").eq("id", id).single(),
    sb.from("certifications").select("*").eq("driver_id", id).order("expires_on"),
    sb.from("driver_documents").select("*").eq("driver_id", id).order("created_at", { ascending: false }),
    sb.from("vehicles").select("*").eq("driver_id", id).limit(1).maybeSingle(),
    sb.from("driver_status_history").select("*").eq("driver_id", id).order("created_at", { ascending: false }).limit(15),
    sb.from("driver_runs").select("*").eq("driver_id", id).order("run_date", { ascending: false }),
    sb.from("load_assignments").select("load_id, loads(id, load_no, load_date, pickup, dropoff, status)").eq("driver_id", id).order("created_at", { ascending: false }).limit(50),
    sb.from("driver_internal").select("performance_notes").eq("driver_id", id).maybeSingle(),
  ]);
  if (!d) notFound();
  let priv: { dob: string | null; license_number: string | null; vin: string | null } | null = null;
  if (sp.reveal) {
    const { data } = await sb.rpc("get_driver_private", { p_driver: id });
    priv = (data as any)?.[0] ?? { dob: null, license_number: null, vin: null };
  }
  const now = new Date();
  const ytd = (runs ?? []).filter((r: any) => r.run_date?.startsWith(String(now.getFullYear())));
  const earnedYtd = ytd.reduce((a: number, r: any) => a + Number(r.driver_pay), 0);
  const unpaid = (runs ?? []).filter((r: any) => !r.settlement_id).reduce((a: number, r: any) => a + Number(r.driver_pay), 0);
  const completed = (assigns ?? []).filter((a: any) => ["delivered", "run_sheet_submitted", "invoiced", "paid"].includes(a.loads?.status)).length;

  return (
    <>
      <PageHead title={d.full_name} sub={<>{d.status ? <Badge status={d.status} label={DRIVER_STATUS[d.status]} /> : "Status not set"}{d.status_note ? ` · ${d.status_note}` : ""}{!d.active ? " · Inactive" : ""}</>} />
      <Flash msg={sp.saved ? "Saved." : null} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Loads completed" value={completed} />
        <Stat label="Earned this year" value={money(earnedYtd)} />
        <Stat label="Not yet paid out" value={money(unpaid)} />
        <Stat label="Split" value={`${d.split_pct}%`} />
      </div>

      <form action={saveDriver} className="mt-6 space-y-5">
        <input type="hidden" name="id" value={d.id} />
        <Fieldset legend="Profile">
          <F name="full_name" label="Full name" required defaultValue={d.full_name} />
          <F name="phone" label="Phone" type="tel" defaultValue={d.phone} />
          <F name="email" label="Email" type="email" defaultValue={d.email} hint="Changing this doesn't change the sign-in email." />
          <F name="home_address" label="Home address" defaultValue={d.home_address} className="sm:col-span-2" />
          <Sel name="employment_type" label="Employment type" defaultValue={d.employment_type} options={[["contractor", "Contractor"], ["employee", "Employee"]]} />
          <F name="emergency_contact_name" label="Emergency contact" defaultValue={d.emergency_contact_name} />
          <F name="emergency_contact_phone" label="Emergency phone" type="tel" defaultValue={d.emergency_contact_phone} />
          <F name="start_date" label="Start date" type="date" defaultValue={d.start_date} />
          <F name="split_pct" label="Driver split %" type="number" step="0.01" defaultValue={d.split_pct} hint="Driver pay = (load total − QP fee − gas) × split" />
          <div className="field"><div className="check mt-7"><input id="active" type="checkbox" name="active" defaultChecked={d.active} /><label htmlFor="active" className="!font-normal">Active (can sign in and get loads)</label></div></div>
        </Fieldset>
        <Fieldset legend="License">
          <F name="license_state" label="License state" defaultValue={d.license_state} />
          <F name="license_class" label="Class" defaultValue={d.license_class} />
          <F name="license_expires" label="Expires" type="date" defaultValue={d.license_expires} />
        </Fieldset>
        <fieldset className="rounded-md border border-rule p-4 md:p-5">
          <legend className="px-1 font-display text-xl font-bold">Positions and equipment</legend>
          <p className="font-semibold">Positions qualified for</p>
          <div className="mt-1 flex flex-wrap gap-x-5">{Object.entries(POSITIONS).map(([v, l]) => (
            <label key={v} className="check min-h-11 items-center"><input type="checkbox" name="positions" value={v} defaultChecked={(d.positions ?? []).includes(v)} /><span>{l}</span></label>))}</div>
          <p className="mt-3 font-semibold">Equipment checklist</p>
          <div className="mt-1 grid sm:grid-cols-3">{EQUIPMENT.map(([v, l]) => (
            <label key={v} className="check min-h-11 items-center"><input type="checkbox" name="equipment" value={v} defaultChecked={Boolean((d.equipment ?? {})[v])} /><span>{l}</span></label>))}</div>
        </fieldset>
        <Fieldset legend="Payment preference">
          <Sel name="payment_method" label="Paid by" defaultValue={d.payment_method ?? ""} options={[["", "Not set"], ["cashapp", "CashApp"], ["zelle", "Zelle"], ["direct_deposit", "Direct deposit"], ["check", "Check"], ["other", "Other"]]} />
          <F name="payment_handle_last4" label="Account / handle, last 4 only" defaultValue={d.payment_handle_last4} hint="Never store full account numbers here." />
        </Fieldset>
        <div className="grid gap-4 md:grid-cols-2">
          <TA name="notes" label="Notes" defaultValue={d.notes} />
          <TA name="performance_notes" label="Rating / performance notes (internal, drivers never see this)" defaultValue={internal?.performance_notes} />
        </div>
        <button className="btn btn-gold">Save profile</button>
      </form>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Sensitive details" id="sensitive">
          {!priv ? (
            <form><input type="hidden" name="reveal" value="1" />
              <p className="mb-3 text-muted">Date of birth, license number and VIN are hidden. Viewing them is recorded in the audit log.</p>
              <button className="btn btn-line">Show sensitive details</button></form>
          ) : (
            <form action={saveSensitive} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="id" value={d.id} />
              <F name="dob" label="Date of birth" type="date" defaultValue={priv.dob} />
              <F name="license_number" label="License number" defaultValue={priv.license_number} />
              <F name="vin" label="Vehicle VIN" defaultValue={priv.vin} />
              <div className="sm:col-span-3 flex gap-2"><button className="btn btn-gold">Save sensitive details</button><Link href={`/portal/drivers/${d.id}`} className="btn btn-line">Hide</Link></div>
            </form>
          )}
        </Panel>

        <Panel title="Vehicle" id="vehicle">
          <form action={saveVehicle} className="grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="driver_id" value={d.id} />
            {veh && <input type="hidden" name="vehicle_id" value={veh.id} />}
            <F name="year" label="Year" type="number" defaultValue={veh?.year} />
            <F name="make" label="Make" defaultValue={veh?.make} />
            <F name="model" label="Model" defaultValue={veh?.model} />
            <F name="color" label="Color" defaultValue={veh?.color} />
            <F name="plate" label="Plate" defaultValue={veh?.plate} />
            <F name="plate_state" label="Plate state" defaultValue={veh?.plate_state} />
            <F name="registration_expires" label="Registration expires" type="date" defaultValue={veh?.registration_expires} />
            <F name="inspection_date" label="Inspection date" type="date" defaultValue={veh?.inspection_date} />
            <div className="sm:col-span-4"><button className="btn btn-gold">Save vehicle</button></div>
          </form>
        </Panel>
      </div>

      <Panel title="Certifications, permits and insurance" id="certs" className="mt-4">
        {(certs ?? []).length > 0 && (
          <Table caption="Certifications" head={["Type", "State", "Issuer", "Number", "Issued", "Expires", "File", ""]}>
            {(certs ?? []).map((c) => (
              <tr key={c.id}>
                <td>{CERT[c.kind]}</td><td>{c.state}</td><td>{c.issuer}</td><td>{c.number}</td><td>{date(c.issued_on)}</td><td><Exp d={c.expires_on} /></td>
                <td>{c.file_path ? <a className="link" href={`/portal/files?bucket=driver-docs&path=${encodeURIComponent(c.file_path)}`} target="_blank" rel="noopener noreferrer">View</a> : ""}</td>
                <td><form action={deleteCertification}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="driver_id" value={d.id} />
                  <button className="min-h-11 text-sm text-muted underline-offset-4 hover:underline" aria-label={`Delete ${CERT[c.kind]} ${c.state ?? ""}`}>Delete</button></form></td>
              </tr>
            ))}
          </Table>
        )}
        <div className="mt-4"><CertForm driverId={d.id} /></div>
      </Panel>

      <Panel title="Documents" id="docs" className="mt-4">
        {(docs ?? []).length > 0 && (
          <ul className="mb-4 divide-y divide-rule">
            {(docs ?? []).map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><a className="link" href={`/portal/files?bucket=driver-docs&path=${encodeURIComponent(doc.file_path)}`} target="_blank" rel="noopener noreferrer">{doc.file_name}</a>
                  <span className="text-sm text-muted"> · {doc.doc_type.replace(/_/g, " ")} · added {date(doc.created_at)}{doc.expires_on ? ` · expires ${date(doc.expires_on)}` : ""}</span></span>
                <form action={deleteDocument}><input type="hidden" name="id" value={doc.id} /><input type="hidden" name="driver_id" value={d.id} />
                  <button className="min-h-11 text-sm text-muted underline-offset-4 hover:underline" aria-label={`Delete ${doc.file_name}`}>Delete</button></form>
              </li>
            ))}
          </ul>
        )}
        <DocForm driverId={d.id} />
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Recent loads" id="rl">
          {(assigns ?? []).length === 0 ? <p className="text-muted">No loads yet.</p> : (
            <ul className="divide-y divide-rule">{(assigns ?? []).map((a: any) => a.loads && (
              <li key={a.load_id} className="flex items-center justify-between py-2">
                <Link className="link" href={`/portal/loads/${a.loads.id}`}>{a.loads.load_no}: {a.loads.pickup} → {a.loads.dropoff}</Link>
                <span className="flex items-center gap-2 text-sm text-muted">{date(a.loads.load_date)} <Badge status={a.loads.status} label={LOAD_STATUS[a.loads.status]} /></span>
              </li>))}</ul>
          )}
        </Panel>
        <Panel title="Activity" id="act">
          <ul className="divide-y divide-rule">{(hist ?? []).map((h) => (
            <li key={h.id} className="py-2">{DRIVER_STATUS[h.status]}{h.note ? `: ${h.note}` : ""} <span className="text-sm text-muted">· {dateTime(h.created_at)}</span></li>))}
          </ul>
          <div className="mt-4 border-t border-rule pt-4"><ResetPassword driverId={d.id} /></div>
        </Panel>
      </div>
    </>
  );
}
