"use client";

import { quoteSchema } from "@/lib/forms";
import { company } from "@/lib/site";
import { ConsentBox, TextArea, TextField } from "./Field";
import WebForm from "./WebForm";

const labels = {
  name: "Name", phone: "Phone", email: "Email", pickup: "Pick up", dropoff: "Drop off",
  date: "Date", notes: "Notes", consent: "Consent",
};

export default function QuoteForm() {
  return (
    <WebForm
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
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2"><TextField name="name" label="Name" required errors={errors} autoComplete="name" /></div>
            <TextField name="phone" label="Phone" type="tel" required errors={errors} autoComplete="tel" inputMode="tel" />
            <TextField name="email" label="Email" type="email" required errors={errors} autoComplete="email" />
            <TextField name="pickup" label="Pick up" hint="City and state" required errors={errors} />
            <TextField name="dropoff" label="Drop off" hint="City and state" required errors={errors} />
            <TextField name="date" label="Date" type="date" hint="Load date" required errors={errors} />
          </div>
          <TextArea
            name="notes"
            label="Notes"
            hint="Height, width, length, weight, cargo type, and anything else we should know"
            errors={errors}
            rows={6}
          />
          <ConsentBox errors={errors} />
        </>
      )}
    </WebForm>
  );
}
