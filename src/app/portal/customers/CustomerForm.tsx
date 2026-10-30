"use client";

import { useActionState } from "react";
import { F, Fieldset, Sel, TA } from "@/components/portal/ui";
import { saveCustomer } from "./actions";

export default function CustomerForm({ c }: { c?: any }) {
  const [state, action, pending] = useActionState(saveCustomer, undefined);
  const rc = c?.customer_rate_cards ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {c && <input type="hidden" name="id" value={c.id} />}
      {state?.error && <p role="alert" className="rounded-md border-2 border-error p-3 font-medium text-error">{state.error}</p>}
      <Fieldset legend="Company">
        <F name="company" label="Company name" required defaultValue={c?.company} />
        <F name="contact_name" label="Contact" defaultValue={c?.contact_name} />
        <F name="phone" label="Phone" type="tel" defaultValue={c?.phone} />
        <F name="email" label="Email" type="email" defaultValue={c?.email} />
        <Sel name="type" label="Type" defaultValue={c?.type ?? "broker"} options={[["broker", "Broker"], ["direct", "Direct company"], ["other", "Other"], ["not_set", "Not set"]]} />
      </Fieldset>
      <Fieldset legend="Billing">
        <F name="billing_email" label="Invoice email" type="email" defaultValue={c?.billing_email} />
        <F name="billing_contact" label="Billing contact" defaultValue={c?.billing_contact} />
        <F name="billing_phone" label="Billing phone" type="tel" defaultValue={c?.billing_phone} />
        <F name="payment_terms" label="Payment terms" hint="e.g. pay at drop, 2 weeks, net 30" defaultValue={c?.payment_terms} />
        <Sel name="quick_pay" label="Quick pay" defaultValue={c?.quick_pay ?? "not_set"} options={[["not_set", "Not set"], ["yes", "Yes"], ["no", "No"]]} />
        <F name="qp_fee_pct" label="QP fee %" type="number" step="0.01" defaultValue={c?.qp_fee_pct} />
      </Fieldset>
      <Fieldset legend="Rate card">
        <F name="per_mile" label="Per mile ($)" type="number" step="0.01" defaultValue={rc.per_mile} />
        <F name="day_rate" label="Day rate ($)" type="number" step="0.01" defaultValue={rc.day_rate} />
        <F name="no_go" label="No-go ($)" type="number" step="0.01" defaultValue={rc.no_go} />
        <F name="overnight" label="Overnight ($)" type="number" step="0.01" defaultValue={rc.overnight} />
        <F name="flat_rate" label="Flat rate ($)" type="number" step="0.01" defaultValue={rc.flat_rate} />
        <F name="mini_run" label="Mini run ($)" type="number" step="0.01" defaultValue={rc.mini_run} />
      </Fieldset>
      <TA name="notes" label="Notes" defaultValue={c?.notes} rows={3} />
      <button className="btn btn-gold" disabled={pending}>{pending ? "Saving…" : "Save customer"}</button>
    </form>
  );
}
