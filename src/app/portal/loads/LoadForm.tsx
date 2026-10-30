"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { parseBookingNotes } from "@/lib/parseNotes";
import { POSITIONS } from "@/lib/format";
import { saveLoad, type SaveState } from "./actions";

type Customer = {
  id: string; company: string; contact_name: string | null; phone: string | null; email: string | null; type: string;
  billing_email: string | null; billing_contact: string | null; billing_phone: string | null; payment_terms: string | null;
  quick_pay: string; qp_fee_pct: number | null;
  customer_rate_cards: { per_mile: number | null; day_rate: number | null; no_go: number | null; overnight: number | null; flat_rate: number | null; mini_run: number | null } | null;
};
type Driver = { id: string; full_name: string; status: string | null };

const PARTY_OPTS: [string, string][] = [["broker", "Broker"], ["direct", "Direct company"], ["other", "Other"], ["not_set", "Not set"]];

function Inp({ name, label, type = "text", err, def, req, hint, step, list, onChange }: {
  name: string; label: string; type?: string; err?: string; def?: string | number | null; req?: boolean; hint?: string; step?: string; list?: string;
  onChange?: (v: string) => void;
}) {
  const id = `lf-${name}`;
  const desc = [hint ? `${id}-hint` : "", err ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}{req && <span aria-hidden="true" className="text-gold"> *</span>}</label>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      <input id={id} name={name} type={type} step={step} list={list} defaultValue={def ?? undefined} className="input" autoComplete="off"
        aria-invalid={err ? true : undefined} aria-describedby={desc} required={req} onChange={onChange ? (e) => onChange(e.target.value) : undefined} />
      {err && <p id={`${id}-err`} className="field-error">{err}</p>}
    </div>
  );
}

function Pick({ name, label, opts, def, onChange }: { name: string; label: string; opts: [string, string][]; def?: string | null; onChange?: (v: string) => void }) {
  const id = `lf-${name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name} defaultValue={def ?? opts[0]?.[0]} className="input" onChange={onChange ? (e) => onChange(e.target.value) : undefined}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function Group({ legend, children, cols = 4 }: { legend: string; children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const c = cols === 2 ? "lg:grid-cols-2" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  return (
    <fieldset className="grid gap-x-6 gap-y-2 border-t border-rule pt-3 lg:grid-cols-[9rem_minmax(0,1fr)]">
      <legend className="float-left pt-1 text-sm font-bold lg:w-36">{legend}</legend>
      <div className={`grid grid-cols-2 gap-x-3 gap-y-2 ${c}`}>{children}</div>
    </fieldset>
  );
}

/** Collapsed section with a one-line summary, opened automatically when it holds an error or filled data. */
function More({ title, summary, open, children }: { title: string; summary: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-t border-rule pt-3">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm">
        <span aria-hidden="true" className="text-muted group-open:rotate-90">▸</span>
        <span className="font-bold">{title}</span>
        <span className="truncate text-muted">{summary}</span>
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-4">{children}</div>
    </details>
  );
}

export default function LoadForm({ customers, drivers, bookedBy, load }: { customers: Customer[]; drivers: Driver[]; bookedBy: string[]; load?: any }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveLoad, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [notes, setNotes] = useState(load?.raw_notes ?? "");
  const [filled, setFilled] = useState<string | null>(null);
  const [same, setSame] = useState(load ? load.invoice_customer_id === load.customer_id : true);
  const [terms, setTerms] = useState<string>(load?.payment_terms && !["pay_at_drop", "2_weeks"].includes(load.payment_terms) ? "custom" : load?.payment_terms ?? "2_weeks");
  const fe = state?.fieldErrors ?? {};
  const loadPositions: string[] = load?.load_positions?.map((p: any) => p.position) ?? [];

  const set = (name: string, value: string) => {
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
    if (el && "value" in el) el.value = value;
  };

  const applyCustomer = (company: string) => {
    const c = customers.find((x) => x.company.toLowerCase() === company.trim().toLowerCase());
    set("customer_id", c?.id ?? "");
    if (!c) return;
    set("contact_name", c.contact_name ?? "");
    set("contact_phone", c.phone ?? "");
    set("contact_email", c.email ?? "");
    set("customer_type", c.type);
    set("invoice_email", c.billing_email ?? c.email ?? "");
    set("billing_contact", c.billing_contact ?? "");
    set("billing_phone", c.billing_phone ?? "");
    set("invoice_type", c.type);
    if (c.quick_pay) set("quick_pay", c.quick_pay);
    if (c.qp_fee_pct != null) set("qp_fee_pct", String(c.qp_fee_pct));
    const rc = c.customer_rate_cards;
    if (rc) {
      if (rc.per_mile != null) set("rate_per_mile", String(rc.per_mile));
      if (rc.day_rate != null) set("rate_day", String(rc.day_rate));
      if (rc.overnight != null) set("rate_overnight", String(rc.overnight));
      if (rc.no_go != null) set("rate_no_go", String(rc.no_go));
      if (rc.mini_run != null) set("rate_mini", String(rc.mini_run));
      if (rc.flat_rate != null) set("rate_flat", String(rc.flat_rate));
    }
  };

  const openAll = () => formRef.current?.querySelectorAll("details").forEach((d) => (d.open = true));
  useEffect(() => {
    if (state?.fieldErrors && Object.keys(state.fieldErrors).length) openAll();
  }, [state]);

  const fill = () => {
    const { fields, matched } = parseBookingNotes(notes);
    if (!matched.length) {
      setFilled('Nothing recognized. Try lines like "Company: ...", "Route: Jackson, MS to Houston, TX", "Rate: $2/mile".');
      return;
    }
    if (typeof fields.company === "string") { set("company", fields.company); applyCustomer(fields.company); }
    const direct = ["contact_name", "contact_phone", "contact_email", "pickup", "dropoff", "est_miles", "load_date", "empty_at", "order_no",
      "quick_pay", "qp_fee_pct", "paid_by", "rate_per_mile", "rate_day", "rate_overnight", "rate_no_go", "rate_mini", "rate_flat",
      "truck_driver_name", "truck_driver_phone", "trucking_company", "truck_number", "height", "width", "length", "weight", "invoice_email", "remarks"];
    for (const k of direct) if (typeof fields[k] === "string") set(k, fields[k] as string);
    if (typeof fields.payment_terms === "string") {
      setTerms(fields.payment_terms);
      set("payment_terms", fields.payment_terms);
      if (fields.payment_terms_custom) setTimeout(() => set("payment_terms_custom", String(fields.payment_terms_custom)), 0);
    }
    if (typeof fields.invoice_company === "string") { setSame(false); setTimeout(() => set("invoice_company", fields.invoice_company as string), 0); }
    if (Array.isArray(fields.positions)) {
      formRef.current?.querySelectorAll<HTMLInputElement>('input[name="positions"]').forEach((cb) => { cb.checked = (fields.positions as string[]).includes(cb.value); });
    }
    if (typeof fields.pilot === "string") {
      const d = drivers.find((x) => x.full_name.toLowerCase().includes((fields.pilot as string).toLowerCase()));
      if (d) set("pilot", d.id);
    }
    openAll();
    setFilled(`Filled ${matched.length} field${matched.length === 1 ? "" : "s"}. Check them before saving.`);
  };

  const clearForm = () => {
    formRef.current?.reset();
    setNotes("");
    setFilled(null);
    setSame(true);
    setTerms("2_weeks");
  };

  return (
    <form ref={formRef} action={action} className="space-y-3" noValidate>
      {load?.id && <input type="hidden" name="id" value={load.id} />}
      <input type="hidden" name="customer_id" defaultValue={load?.customer_id ?? ""} />
      {state?.error && <p role="alert" className="rounded-md border-2 border-error p-3 text-error font-medium">{state.error}</p>}
      {Object.keys(fe).length > 0 && (
        <div role="alert" className="rounded-md border-2 border-error p-3">
          <p className="font-semibold text-error">Fix {Object.keys(fe).length} field{Object.keys(fe).length > 1 ? "s" : ""} to save</p>
          <ul className="mt-1 list-disc pl-5">{Object.entries(fe).map(([k, v]) => <li key={k}><a className="link" href={`#lf-${k}`}>{v}</a></li>)}</ul>
        </div>
      )}

      <details open={!load} className="rounded-md border border-rule bg-surface p-3">
        <summary className="cursor-pointer list-none text-sm font-bold">📋 Paste booking notes to fill the form <span className="font-normal text-muted">(optional)</span></summary>
        <div className="mt-2">
          <label htmlFor="lf-raw_notes" className="sr-only">Booking notes</label>
          <textarea id="lf-raw_notes" name="raw_notes" rows={3} className="input !min-h-0" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste call notes or a broker email. Nothing is saved until you press Save load." />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-gold" onClick={fill} disabled={!notes.trim()}>Fill the form</button>
            <button type="button" className="btn btn-line" onClick={clearForm}>Start over</button>
            <p aria-live="polite" className="text-sm font-medium text-success">{filled}</p>
          </div>
        </div>
      </details>

      <datalist id="customer-list">{customers.map((c) => <option key={c.id} value={c.company} />)}</datalist>

      <Group legend="Customer">
        <Inp name="company" label="Company" req list="customer-list" err={fe.company} def={load?.customer?.company} onChange={applyCustomer} />
        <Inp name="contact_name" label="Point of contact" def={load?.customer?.contact_name} />
        <Inp name="contact_phone" label="Phone" type="tel" def={load?.customer?.phone} />
        <Inp name="contact_email" label="Email" type="email" err={fe.contact_email} def={load?.customer?.email} />
      </Group>

      <Group legend="Route">
        <Inp name="pickup" label="Pick up" req err={fe.pickup} def={load?.pickup} />
        <Inp name="dropoff" label="Drop off" req err={fe.dropoff} def={load?.dropoff} />
        <Inp name="load_date" label="Load date" type="date" req err={fe.load_date} def={load?.load_date} />
        <Inp name="est_miles" label="Est. miles" type="number" step="0.1" def={load?.est_miles} />
        <fieldset className="col-span-2 lg:col-span-4">
          <legend className="text-sm font-semibold">Positions</legend>
          <div className="flex flex-wrap gap-x-4">
            {Object.entries(POSITIONS).map(([v, l]) => (
              <label key={v} className="check min-h-9 items-center text-sm">
                <input type="checkbox" name="positions" value={v} defaultChecked={loadPositions.includes(v)} />
                <span>{l}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Group>

      <Group legend="Rate and pilot">
        <Inp name="rate_per_mile" label="Per mile ($)" type="number" step="0.01" def={load?.rate_per_mile} />
        <Inp name="rate_day" label="Day rate ($)" type="number" step="0.01" def={load?.rate_day} />
        <Pick name="pilot" label="Pilot" opts={[["", "Unassigned"], ...drivers.map((d) => [d.id, (d.status === "needs_load" ? "🟢 " : "") + d.full_name] as [string, string])]} />
        <Pick name="status" label="Status" def={load?.status ?? "booked"}
          opts={[["booked", "Booked"], ["draft", "Draft"], ["assigned", "Assigned"], ["in_progress", "In progress"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]]} />
      </Group>

      <More title="💵 Other rates" summary="Overnight, no-go, mini run, flat" open={Boolean(load?.rate_overnight || load?.rate_no_go || load?.rate_mini || load?.rate_flat)}>
        <Inp name="rate_overnight" label="Overnight ($)" type="number" step="0.01" def={load?.rate_overnight} />
        <Inp name="rate_no_go" label="No-go ($)" type="number" step="0.01" def={load?.rate_no_go} />
        <Inp name="rate_mini" label="Mini run ($)" type="number" step="0.01" def={load?.rate_mini} />
        <Inp name="rate_flat" label="Flat total ($)" type="number" step="0.01" def={load?.rate_flat} />
      </More>

      <More title="🧾 Billing and payment" summary="Invoice to, quick pay, terms" open={Boolean(fe.invoice_email) || (load && !same)}>
        <div className="col-span-2 flex min-h-9 items-center lg:col-span-4">
          <label className="check items-center text-sm"><input id="lf-same" type="checkbox" name="same_as_customer" checked={same} onChange={(e) => setSame(e.target.checked)} /><span>Invoice the same company</span></label>
        </div>
        {!same && <Inp name="invoice_company" label="Company to invoice" list="customer-list" def={load?.invoice_customer?.company} />}
        <input type="hidden" name="invoice_customer_id" defaultValue={!same ? load?.invoice_customer_id ?? "" : ""} />
        <Inp name="invoice_email" label="Invoice email" type="email" err={fe.invoice_email} def={load?.invoice_email} />
        <Inp name="billing_contact" label="Billing contact" def={load?.billing_contact} />
        <Inp name="billing_phone" label="Billing phone" type="tel" def={load?.billing_phone} />
        <Pick name="quick_pay" label="Quick pay" opts={[["not_set", "Not set"], ["yes", "Yes"], ["no", "No"]]} def={load?.quick_pay} />
        <Inp name="qp_fee_pct" label="QP fee %" type="number" step="0.01" def={load?.qp_fee_pct} />
        <Pick name="payment_terms" label="Terms" opts={[["pay_at_drop", "Pay at drop"], ["2_weeks", "2 weeks"], ["custom", "Custom"]]} def={terms} onChange={setTerms} />
        {terms === "custom" && <Inp name="payment_terms_custom" label="Custom terms" def={load?.payment_terms && !["pay_at_drop", "2_weeks"].includes(load.payment_terms) ? load.payment_terms : ""} />}
        <Pick name="paid_by" label="Paid by" opts={[["", "Not set"], ["cashapp", "CashApp"], ["zelle", "Zelle"], ["ach", "ACH / direct deposit"], ["check", "Check"], ["stripe", "Card (Stripe)"], ["other", "Other"]]} def={load?.paid_by ?? ""} />
        <Pick name="customer_type" label="Customer type" opts={PARTY_OPTS.slice(0, 2).concat([["not_set", "Not set"]])} def={load?.customer?.type ?? "broker"} />
        <Pick name="invoice_type" label="Invoice-to type" opts={PARTY_OPTS} def={load?.invoice_type ?? "not_set"} />
      </More>

      <More title="🚚 Truck and load size" summary="Truck driver, truck #, height, width, length, weight" open={Boolean(load?.truck_driver_name || load?.height)}>
        <Inp name="truck_driver_name" label="Truck driver" def={load?.truck_driver_name} />
        <Inp name="truck_driver_phone" label="Truck driver phone" type="tel" def={load?.truck_driver_phone} />
        <Inp name="trucking_company" label="Trucking company" def={load?.trucking_company} />
        <Inp name="truck_number" label="Truck #" def={load?.truck_number} />
        <Inp name="height" label="Height" def={load?.height} />
        <Inp name="width" label="Width" def={load?.width} />
        <Inp name="length" label="Length" def={load?.length} />
        <Inp name="weight" label="Weight" def={load?.weight} />
        <Inp name="empty_at" label="Escort starts from" def={load?.empty_at} />
        <Inp name="order_no" label="Order #" def={load?.order_no} />
      </More>

      <More title="📝 Remarks and booking" summary="Notes, booked by" open={Boolean(load?.remarks)}>
        <div className="field col-span-2 lg:col-span-3">
          <label htmlFor="lf-remarks">Remarks</label>
          <textarea id="lf-remarks" name="remarks" rows={2} className="input !min-h-0" defaultValue={load?.remarks ?? ""} />
        </div>
        <Pick name="booked_by" label="Booked by" opts={bookedBy.map((b) => [b, b])} def={load?.booked_by} />
      </More>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-rule bg-bg px-1 py-3">
        <button className="btn btn-gold" disabled={pending}>{pending ? "Saving…" : "Save load"}</button>
        <p className="text-sm text-muted">Saving with a pilot selected notifies that driver.</p>
      </div>
    </form>
  );
}
