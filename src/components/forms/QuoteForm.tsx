"use client";

import { quoteSchema } from "@/lib/forms";
import { company } from "@/lib/site";
import CityField from "./CityField";
import { ConsentBox, TextArea, TextField } from "./Field";
import WebForm from "./WebForm";

const labels = {
  name: "Name", phone: "Phone", email: "Email", pickup: "Pick up", dropoff: "Drop off",
  date: "Load date", notes: "Load details", consent: "Consent",
};

export default function QuoteForm({ state }: { state?: string }) {
  return (
    <WebForm
      compact
      schema={quoteSchema}
      labels={labels}
      subject={(d) => `Quote request: ${d.pickup} to ${d.dropoff} on ${d.date}`}
      toPayload={(d) => ({
        name: d.name, phone: d.phone, email: d.email,
        "Pick up": d.pickup, "Drop off": d.dropoff, Date: d.date, Notes: d.notes || "(none)",
        replyto: d.email,
      })}
      recordType="quote"
      submitLabel="Send quote request"
      sendingLabel="Sending…"
      success={
        <>
          <h2 className="display-3">Quote request sent</h2>
          <p className="mt-2">
            Dispatch will get back to you by phone or email. If the move is soon, call{" "}
            <a href={company.telHref} className="link">{company.phoneDisplay}</a>; we answer 24/7.
          </p>
        </>
      }
    >
      {(errors) => (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-3 md:gap-x-4">
            <TextField name="name" label="Name" required errors={errors} autoComplete="name" placeholder="John Smith" />
            <TextField name="phone" label="Phone" type="tel" required errors={errors} autoComplete="tel" inputMode="tel" placeholder="(601) 555-0142" />
            <TextField name="email" label="Email" type="email" required errors={errors} autoComplete="email" placeholder="you@company.com" className="col-span-2 md:col-span-1" />
            <CityField name="pickup" label="Pick up" required errors={errors} placeholder={state ? `City, ${state}` : "Houston, TX"} preferState={state} />
            <CityField name="dropoff" label="Drop off" required errors={errors} placeholder="Jackson, MS" />
            <TextField name="date" label="Load date" type="date" required errors={errors} className="col-span-2 md:col-span-1" />
          </div>
          <TextArea
            name="notes"
            label="Load details"
            errors={errors}
            rows={2}
            placeholder={'e.g. 14\' W, 15\'6" H, 120\' L, 95,000 lb transformer'}
          />
          <ConsentBox errors={errors} />
        </>
      )}
    </WebForm>
  );
}
