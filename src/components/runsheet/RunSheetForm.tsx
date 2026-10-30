"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { computeRunSheet } from "@/lib/runsheet";
import { POSITIONS, money } from "@/lib/format";
import { saveRunSheet, type RSState } from "@/app/runsheet-actions";
import SignaturePad from "./SignaturePad";
import MultiUpload from "./MultiUpload";

type LegRow = { key: string; charged_as: "miles" | "day_rate" | "mini" | "no_go"; overnight: boolean; leg_date: string; miles: string; start_location: string; end_location: string };
type Extras = Record<string, boolean>;

const CHARGE: [LegRow["charged_as"], string][] = [["miles", "Miles"], ["day_rate", "Day rate"], ["mini", "Mini"], ["no_go", "No-Go"]];
const newLeg = (p?: Partial<LegRow>): LegRow => ({ key: Math.random().toString(36).slice(2), charged_as: "miles", overnight: false, leg_date: "", miles: "", start_location: "", end_location: "", ...p });

function Txt({ name, label, def, req, type = "text", hint, step, inputMode }: { name: string; label: string; def?: any; req?: boolean; type?: string; hint?: string; step?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) {
  const id = `rs-${name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}{req && <span aria-hidden="true" className="text-gold"> *</span>}</label>
      {hint && <span id={`${id}-h`} className="hint">{hint}</span>}
      <input id={id} name={name} type={type} step={step} inputMode={inputMode} defaultValue={def ?? ""} className="input" aria-required={req} aria-describedby={hint ? `${id}-h` : undefined} />
    </div>
  );
}

export default function RunSheetForm({
  mode, load, sheet, driver, extras, files,
}: { mode: "driver" | "admin"; load: any; sheet: any | null; driver: { id: string; full_name: string }; extras: Extras; files: any[] }) {
  const [state, action, pending] = useActionState<RSState, FormData>(saveRunSheet, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const draftKey = `dt-rs-${load.id}-${driver.id}`;
  const status: string = sheet?.status ?? "draft";
  const readOnly = mode === "driver" && status !== "draft";
  const sheetId = state?.id ?? sheet?.id ?? "";

  const [legs, setLegs] = useState<LegRow[]>(() =>
    sheet?.run_sheet_legs?.length
      ? [...sheet.run_sheet_legs].sort((a: any, b: any) => a.seq - b.seq).map((l: any) => newLeg({ charged_as: l.charged_as, overnight: l.overnight, leg_date: l.leg_date ?? "", miles: String(l.miles ?? ""), start_location: l.start_location ?? "", end_location: l.end_location ?? "" }))
      : [newLeg({ leg_date: load.load_date ?? "", start_location: load.pickup ?? "", end_location: load.dropoff ?? "", miles: load.est_miles ? String(load.est_miles) : "" })],
  );
  const [rates, setRates] = useState({
    per_mile: String(sheet?.rate_per_mile ?? load.rate_per_mile ?? ""),
    day: String(sheet?.rate_day ?? load.rate_day ?? ""),
    mini: String(sheet?.rate_mini ?? load.rate_mini ?? ""),
    overnight: String(sheet?.rate_overnight ?? load.rate_overnight ?? ""),
    no_go: String(sheet?.rate_no_go ?? load.rate_no_go ?? ""),
  });
  const [gas, setGas] = useState(String(sheet?.gas_amount ?? ""));
  const [includeGas, setIncludeGas] = useState<boolean>(sheet?.include_gas ?? false);
  const [gpsStart, setGpsStart] = useState<string>(sheet?.gps_start ? JSON.stringify(sheet.gps_start) : "");
  const [gpsEnd, setGpsEnd] = useState<string>(sheet?.gps_end ? JSON.stringify(sheet.gps_end) : "");
  const [offline, setOffline] = useState(false);
  const [restored, setRestored] = useState<string | null>(null);
  const [geoMsg, setGeoMsg] = useState("");

  const calc = useMemo(() => computeRunSheet(legs.map((l) => ({ ...l, miles: l.miles || 0 })), rates, gas || 0, includeGas), [legs, rates, gas, includeGas]);

  // Offline-tolerant draft: autosave to this device; offer to restore if newer than the server copy.
  useEffect(() => {
    if (readOnly) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        const serverTime = sheet?.updated_at ? new Date(sheet.updated_at).getTime() : 0;
        if (d.savedAt > serverTime) setRestored(new Date(d.savedAt).toLocaleString());
      }
    } catch {}
    const on = () => setOffline(!navigator.onLine);
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", on); };
  }, [draftKey, readOnly, sheet?.updated_at]);

  const snapshot = () => {
    if (readOnly || !formRef.current) return;
    const fd = new FormData(formRef.current);
    const fields: Record<string, string | string[]> = {};
    fd.forEach((v, k) => {
      if (typeof v !== "string" || k.endsWith("_signature")) return;
      if (k === "positions") fields[k] = [...((fields[k] as string[]) ?? []), v];
      else fields[k] = v;
    });
    try { localStorage.setItem(draftKey, JSON.stringify({ savedAt: Date.now(), fields, legs, rates, gas, includeGas })); } catch {}
  };

  const restore = () => {
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) ?? "{}");
      setLegs(d.legs ?? legs);
      setRates(d.rates ?? rates);
      setGas(d.gas ?? gas);
      setIncludeGas(Boolean(d.includeGas));
      const f = formRef.current!;
      for (const [k, v] of Object.entries(d.fields ?? {})) {
        if (k === "positions") f.querySelectorAll<HTMLInputElement>('input[name="positions"]').forEach((cb) => (cb.checked = (v as string[]).includes(cb.value)));
        else {
          const el = f.elements.namedItem(k) as HTMLInputElement | null;
          if (el && "value" in el && el.type !== "hidden" && el.type !== "checkbox") el.value = v as string;
          if (el && el.type === "checkbox") el.checked = v === "on";
        }
      }
      setRestored(null);
    } catch {}
  };

  useEffect(() => {
    if (state?.ok) {
      try { localStorage.removeItem(draftKey); } catch {}
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state, draftKey]);

  const setLeg = (k: string, patch: Partial<LegRow>) => setLegs((ls) => ls.map((l) => (l.key === k ? { ...l, ...patch } : l)));
  const v = (k: string) => sheet?.[k] ?? null;
  const geo = (set: (s: string) => void) => {
    if (!navigator.geolocation) return setGeoMsg("This device can't share location. You can skip this.");
    navigator.geolocation.getCurrentPosition(
      (p) => { set(JSON.stringify({ lat: Number(p.coords.latitude.toFixed(5)), lng: Number(p.coords.longitude.toFixed(5)), at: new Date().toISOString() })); setGeoMsg("Location recorded."); },
      () => setGeoMsg("Location wasn't shared. You can skip this."),
    );
  };
  const needsTruck = !readOnly && [v("trucking_company") ?? load.trucking_company, v("truck_driver_name") ?? load.truck_driver_name, v("truck_driver_phone") ?? load.truck_driver_phone].some((x) => !x);
  const statusLabel = status === "draft" ? "Saved, not sent" : status === "submitted" ? "Submitted" : "Approved";

  const payRows: [string, string, number, number, number][] = [
    ["Mileage", "miles × rate", calc.lines.mileage.qty, calc.lines.mileage.rate, calc.lines.mileage.amount],
    ["Day rate", "days × rate", calc.lines.day.qty, calc.lines.day.rate, calc.lines.day.amount],
    ["Mini run", "runs × rate", calc.lines.mini.qty, calc.lines.mini.rate, calc.lines.mini.amount],
    ["Overnight", "nights × rate", calc.lines.overnight.qty, calc.lines.overnight.rate, calc.lines.overnight.amount],
    ["No-Go", "trips × rate", calc.lines.no_go.qty, calc.lines.no_go.rate, calc.lines.no_go.amount],
  ];

  return (
    <form ref={formRef} action={action} onChange={snapshot} className="space-y-3" noValidate>
      <input type="hidden" name="id" value={sheetId} />
      <input type="hidden" name="load_id" value={load.id} />
      <input type="hidden" name="driver_id" value={driver.id} />
      <input type="hidden" name="legs_json" value={JSON.stringify(legs.map((l) => ({ charged_as: l.charged_as, overnight: l.overnight, leg_date: l.leg_date, miles: l.miles, start_location: l.start_location, end_location: l.end_location })))} />

      <header className="border-b border-rule pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Run sheet · {load.load_no} · {driver.full_name}</h2>
          <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${status === "approved" ? "border-success text-success" : status === "submitted" ? "border-gold-fill text-gold" : "border-field text-muted"}`}>{statusLabel}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {[load.pickup && load.dropoff && `${load.pickup} to ${load.dropoff}`, load.truck_driver_name && `Truck driver ${load.truck_driver_name}`, load.truck_driver_phone, load.trucking_company, load.truck_number && `truck #${load.truck_number}`].filter(Boolean).join(" · ") || "No truck details on the load yet."}
        </p>
        {sheet?.admin_comment && <p className="mt-2 rounded-md border border-gold-fill p-2"><span className="font-semibold">Dispatch note:</span> {sheet.admin_comment}</p>}
      </header>

      {state?.ok && <p role="status" className="rounded-md border-2 border-success p-3 font-medium text-success">{state.ok}</p>}
      {state?.error && (
        <div role="alert" className="rounded-md border-2 border-error p-3">
          <p className="font-semibold text-error">{state.error}</p>
          {state.missing && <ul className="mt-1 list-disc pl-5">{state.missing.map((m) => <li key={m}>{m}</li>)}</ul>}
          {offline && <p className="mt-1">You&apos;re offline. Your draft is saved on this device; send it when you have signal.</p>}
        </div>
      )}
      {offline && !state?.error && <p role="status" className="rounded-md border border-field p-3">You&apos;re offline. Changes are kept on this device until you can save.</p>}
      {restored && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-md border border-gold-fill p-3">
          <span>There&apos;s a newer draft on this device from {restored}.</span>
          <button type="button" className="btn btn-gold !min-h-11" onClick={restore}>Restore it</button>
          <button type="button" className="btn btn-line !min-h-11" onClick={() => { try { localStorage.removeItem(draftKey); } catch {} setRestored(null); }}>Discard</button>
        </div>
      )}
      {readOnly && <p className="rounded-md border border-field p-3">This run sheet has been {status}. Ask dispatch if something needs to change.</p>}

      <fieldset disabled={readOnly} className="space-y-3">
        <input type="hidden" name="start_location" value={legs[0]?.start_location ?? ""} />
        <input type="hidden" name="end_location" value={legs[legs.length - 1]?.end_location ?? ""} />
        <details open={needsTruck} className="group border-t border-rule pt-3">
          <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-2 text-sm">
            <span aria-hidden="true" className="text-muted group-open:rotate-90">▸</span>
            <span className="font-bold">🚚 Truck, invoice and load size</span>
            <span className="text-muted">{needsTruck ? "Fill in the missing truck details" : [v("trucking_company") ?? load.trucking_company, v("truck_driver_name") ?? load.truck_driver_name].filter(Boolean).join(" · ")}</span>
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-4">
            <Txt name="trucking_company" label="Trucking company" req def={v("trucking_company") ?? load.trucking_company} />
            <Txt name="truck_driver_name" label="Truck driver" req def={v("truck_driver_name") ?? load.truck_driver_name} />
            <Txt name="truck_driver_phone" label="Truck driver phone" type="tel" req def={v("truck_driver_phone") ?? load.truck_driver_phone} />
            <Txt name="truck_number" label="Truck #" def={v("truck_number") ?? load.truck_number} />
            <Txt name="trailer_number" label="Trailer #" def={v("trailer_number")} />
            <Txt name="invoice_date" label="Invoice date" type="date" req def={v("invoice_date") ?? new Date().toISOString().slice(0, 10)} />
            <Txt name="load_number" label="Load #" def={v("load_number") ?? load.order_no ?? load.load_no} />
            <Txt name="invoice_email" label="Invoice email" type="email" def={v("invoice_email") ?? load.invoice_email} />
            <div className="col-span-2 lg:col-span-4"><Txt name="load_description" label="Load description" def={v("load_description")} /></div>
            <Txt name="height" label="Height" def={v("height") ?? load.height} />
            <Txt name="width" label="Width" def={v("width") ?? load.width} />
            <Txt name="length" label="Length" def={v("length") ?? load.length} />
            <Txt name="weight" label="Weight" def={v("weight") ?? load.weight} />
          </div>
        </details>

        <fieldset className="border-t border-rule pt-3">
          <legend className="pr-2 font-bold">🛣️ Mileage log</legend>
          <p className="text-sm text-muted">Pick how each leg is charged. Pay below counts it for you.</p>
          <ol className="mt-2 divide-y divide-rule">
            {legs.map((l, i) => (
              <li key={l.key} className="py-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Leg {i + 1}</h3>
                  {legs.length > 1 && <button type="button" className="min-h-11 text-sm text-muted underline-offset-4 hover:underline" onClick={() => setLegs((ls) => ls.filter((x) => x.key !== l.key))}>Remove leg {i + 1}</button>}
                </div>
                <div role="radiogroup" aria-label={`Leg ${i + 1} charged as`} className="mt-1 flex flex-wrap gap-1.5">
                  {CHARGE.map(([c, label]) => (
                    <button key={c} type="button" role="radio" aria-checked={l.charged_as === c} onClick={() => setLeg(l.key, { charged_as: c })}
                      className={`btn !min-h-10 !px-3 text-sm ${l.charged_as === c ? "btn-gold" : "btn-line"}`}>{label}</button>
                  ))}
                  <button type="button" role="switch" aria-checked={l.overnight} onClick={() => setLeg(l.key, { overnight: !l.overnight })}
                    className={`btn !min-h-10 !px-3 text-sm ${l.overnight ? "btn-gold" : "btn-line"}`}>Overnight {l.overnight ? "on" : "off"}</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-4">
                  <div className="field"><label htmlFor={`d-${l.key}`}>Date</label><input id={`d-${l.key}`} type="date" className="input" value={l.leg_date} onChange={(e) => setLeg(l.key, { leg_date: e.target.value })} /></div>
                  <div className="field"><label htmlFor={`m-${l.key}`}>Total miles</label><input id={`m-${l.key}`} type="number" inputMode="decimal" step="0.1" className="input" value={l.miles} onChange={(e) => setLeg(l.key, { miles: e.target.value })} /></div>
                  <div className="field"><label htmlFor={`s-${l.key}`}>Starting location<span aria-hidden="true" className="text-gold"> *</span></label><input id={`s-${l.key}`} className="input" value={l.start_location} onChange={(e) => setLeg(l.key, { start_location: e.target.value })} /></div>
                  <div className="field"><label htmlFor={`e-${l.key}`}>Ending location<span aria-hidden="true" className="text-gold"> *</span></label><input id={`e-${l.key}`} className="input" value={l.end_location} onChange={(e) => setLeg(l.key, { end_location: e.target.value })} /></div>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" className="btn btn-line mt-1" onClick={() => setLegs((ls) => [...ls, newLeg({ start_location: ls[ls.length - 1]?.end_location ?? "", leg_date: ls[ls.length - 1]?.leg_date ?? "" })])}>Add a leg</button>
        </fieldset>

        <fieldset className="border-t border-rule pt-3">
          <legend className="pr-2 font-bold">Position<span aria-hidden="true" className="text-gold"> *</span></legend>
          <div className="flex flex-wrap gap-x-4">
            {Object.entries(POSITIONS).map(([val, label]) => (
              <label key={val} className="check min-h-10 items-center text-sm">
                <input type="checkbox" name="positions" value={val} defaultChecked={(sheet?.positions ?? load.positions ?? []).includes(val)} /><span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border-t border-rule pt-3">
          <legend className="pr-2 font-bold">💵 Pay</legend>
          <p className="text-sm text-muted">Rates fill in from the load and customer rate card{mode === "admin" ? "; every box can be corrected." : ". Dispatch can correct them."}</p>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead><tr className="text-sm text-muted"><th scope="col" className="py-1">Line</th><th scope="col">Count</th><th scope="col">Rate ($)</th><th scope="col" className="text-right">Amount</th></tr></thead>
              <tbody>
                {payRows.map(([label, how, qty, , amt], idx) => {
                  const key = (["per_mile", "day", "mini", "overnight", "no_go"] as const)[idx];
                  const field = (["rate_per_mile", "rate_day", "rate_mini", "rate_overnight", "rate_no_go"] as const)[idx];
                  return (
                    <tr key={label} className="border-t border-rule">
                      <th scope="row" className="py-1 font-medium">{label} <span className="font-normal text-muted">({how})</span></th>
                      <td>{qty}</td>
                      <td><label className="sr-only" htmlFor={`rs-${field}`}>{label} rate</label>
                        <input id={`rs-${field}`} name={field} type="number" inputMode="decimal" step="0.01" className="input !min-h-9 !py-1 max-w-28" value={rates[key]} onChange={(e) => setRates((r) => ({ ...r, [key]: e.target.value }))} /></td>
                      <td className="text-right tabular-nums">{money(amt)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-rule">
                  <th scope="row" className="py-1 font-medium">Gas</th>
                  <td colSpan={1}><label className="check min-h-11 items-center"><input type="checkbox" name="include_gas" checked={includeGas} onChange={(e) => setIncludeGas(e.target.checked)} /><span>Include in total</span></label></td>
                  <td><label className="sr-only" htmlFor="rs-gas">Gas amount</label><input id="rs-gas" name="gas_amount" type="number" inputMode="decimal" step="0.01" className="input !min-h-9 !py-1 max-w-28" value={gas} onChange={(e) => setGas(e.target.value)} /></td>
                  <td className="text-right tabular-nums">{money(calc.lines.gas.amount)}</td>
                </tr>
                <tr className="border-t-2 border-field">
                  <th scope="row" colSpan={3} className="py-2 font-bold">Total amount due</th>
                  <td className="text-right font-bold tabular-nums" aria-live="polite">{money(calc.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="rs-notes">Notes for dispatch</label>
          <textarea id="rs-notes" name="notes" rows={2} className="input !min-h-0" defaultValue={v("notes") ?? ""} />
        </div>

        {Object.values(extras).some(Boolean) && (
          <details className="border-t border-rule pt-3" open={Boolean(sheet && (sheet.odometer_start || sheet.incident_report || files.length))}>
            <summary className="min-h-11 cursor-pointer text-sm font-bold">📎 Receipts, photos, signatures and more <span className="font-normal text-muted">(optional)</span></summary>
            <div className="mt-2 grid gap-x-3 gap-y-2 sm:grid-cols-2">
              {extras.equipment_check && <label className="check min-h-11 items-center sm:col-span-2"><input type="checkbox" name="equipment_checked" defaultChecked={Boolean(v("equipment_checked"))} /><span>Equipment checked at start (lights, signs, flags, radio, extinguisher, first aid, cones, vest)</span></label>}
              {extras.odometer && <><Txt name="odometer_start" label="Odometer start" type="number" inputMode="decimal" def={v("odometer_start")} /><Txt name="odometer_end" label="Odometer end" type="number" inputMode="decimal" def={v("odometer_end")} /></>}
              {extras.times && <><Txt name="time_start" label="Start time" type="datetime-local" def={v("time_start")?.slice(0, 16)} /><Txt name="time_end" label="End time" type="datetime-local" def={v("time_end")?.slice(0, 16)} /></>}
              {extras.wait_time && <Txt name="wait_minutes" label="Wait / detention (minutes)" type="number" inputMode="numeric" def={v("wait_minutes")} />}
              {extras.tolls && <Txt name="tolls" label="Tolls and parking ($)" type="number" step="0.01" def={v("tolls")} />}
              {extras.lodging && <Txt name="lodging" label="Lodging ($)" type="number" step="0.01" def={v("lodging")} />}
              {extras.per_diem && <Txt name="per_diem" label="Per diem ($)" type="number" step="0.01" def={v("per_diem")} />}
              {extras.permits && <Txt name="permits" label="Permit numbers and states" def={v("permits")} />}
              {extras.police_escort && (
                <div className="field"><label htmlFor="rs-police">Police escort used?</label>
                  <select id="rs-police" name="police_escort" className="input" defaultValue={v("police_escort") === null ? "" : v("police_escort") ? "yes" : "no"}><option value="">Not answered</option><option value="yes">Yes</option><option value="no">No</option></select></div>
              )}
              {extras.route_deviation && <div className="sm:col-span-2"><label className="font-semibold" htmlFor="rs-dev">Route deviation notes</label><textarea id="rs-dev" name="route_deviation" rows={2} className="input !min-h-0 mt-1" defaultValue={v("route_deviation") ?? ""} /></div>}
              {extras.incident && <div className="sm:col-span-2"><label className="font-semibold" htmlFor="rs-inc">Incident or damage report</label><textarea id="rs-inc" name="incident_report" rows={3} className="input !min-h-0 mt-1" defaultValue={v("incident_report") ?? ""} /></div>}
              {extras.gps && (
                <div className="sm:col-span-2">
                  <p className="font-semibold">Location stamps</p>
                  <p className="text-sm text-muted">Only if you choose to share. Your phone will ask for permission.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="btn btn-line" onClick={() => geo(setGpsStart)}>{gpsStart ? "Start location recorded" : "Record start location"}</button>
                    <button type="button" className="btn btn-line" onClick={() => geo(setGpsEnd)}>{gpsEnd ? "End location recorded" : "Record end location"}</button>
                  </div>
                  <p aria-live="polite" className="mt-1 text-sm text-muted">{geoMsg}</p>
                  <input type="hidden" name="gps_start" value={gpsStart} /><input type="hidden" name="gps_end" value={gpsEnd} />
                </div>
              )}
              {extras.photos && <div className="sm:col-span-2"><p className="mb-2 font-semibold">Receipts, photos and delivery ticket</p><MultiUpload folder={`${driver.id}/${load.id}`} existing={files} /></div>}
              {extras.signatures && (
                <>
                  <SignaturePad name="driver_signature" label="Driver signature" defaultValue={v("driver_signature")} disabled={readOnly} />
                  <SignaturePad name="customer_signature" label="Customer / truck driver signature" defaultValue={v("customer_signature")} disabled={readOnly} />
                </>
              )}
            </div>
          </details>
        )}

        {mode === "admin" && (
          <fieldset className="border-t-2 border-gold-fill pt-3">
            <legend className="pr-2 font-bold">Dispatch review</legend>
            <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
              <div className="field sm:col-span-2"><label htmlFor="rs-ac">Comment to driver</label><textarea id="rs-ac" name="admin_comment" rows={2} className="input !min-h-0" defaultValue={v("admin_comment") ?? ""} /></div>
              {extras.customer_rating && (
                <div className="field"><label htmlFor="rs-rate">Customer rating of service (internal)</label>
                  <select id="rs-rate" name="customer_rating" className="input" defaultValue={v("customer_rating") ?? ""}><option value="">Not rated</option>{[5, 4, 3, 2, 1].map((x) => <option key={x} value={x}>{x} of 5</option>)}</select></div>
              )}
              <label className="check min-h-11 items-center"><input type="checkbox" name="dispute" defaultChecked={Boolean(v("dispute"))} /><span>Flag as disputed</span></label>
            </div>
          </fieldset>
        )}

        <div className={`sticky ${mode === "driver" ? "bottom-14" : "bottom-0"} z-10 flex flex-wrap items-center gap-2 border-t border-rule bg-bg py-3`}>
          <button name="intent" value="save" className="btn btn-line" disabled={pending}>{pending ? "Saving…" : mode === "admin" ? "Save corrections" : "Save draft"}</button>
          {mode === "driver" && <button name="intent" value="submit" className="btn btn-gold" disabled={pending}>Mark run complete and send</button>}
          {mode === "admin" && status !== "approved" && <button name="intent" value="approve" className="btn btn-gold" disabled={pending}>Approve</button>}
          <span className="ml-auto text-sm font-semibold tabular-nums">Total {money(calc.total)}</span>
        </div>
      </fieldset>
    </form>
  );
}
