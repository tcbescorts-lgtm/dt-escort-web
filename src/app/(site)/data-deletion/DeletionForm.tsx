"use client";

import { ConsentBox, TextArea, TextField } from "@/components/forms/Field";
import WebForm from "@/components/forms/WebForm";
import { deletionSchema } from "@/lib/forms";

const labels = { name: "Name", email: "Email", scope: "What to delete", details: "Details", consent: "Verification" };
const scopes = [
  ["quote", "My quote requests"],
  ["career", "My driver interest form"],
  ["all", "Everything you have about me"],
  ["other", "Something else (explain below)"],
] as const;

export default function DeletionForm() {
  return (
    <WebForm
      schema={deletionSchema}
      labels={labels}
      subject={(d) => `Data deletion request: ${d.name}`}
      toPayload={(d) => ({
        name: d.name, email: d.email,
        "Delete": scopes.find(([v]) => v === d.scope)?.[1] ?? d.scope,
        Details: d.details || "(none)", replyto: d.email,
        "Next step": "Verify by emailing the requester before deleting anything.",
      })}
      recordType="deletion"
      submitLabel="Send deletion request"
      sendingLabel="Sending…"
      success={
        <>
          <h2 className="display-3">Request received</h2>
          <p className="mt-2">Watch for an email from us asking you to confirm. We won&apos;t delete anything until you reply.</p>
        </>
      }
    >
      {(errors) => (
        <>
          <TextField name="name" label="Name" required errors={errors} autoComplete="name" />
          <TextField name="email" label="Email" type="email" hint="Use the email you contacted us with" required errors={errors} autoComplete="email" />
          <fieldset aria-describedby={errors.scope ? "scope-error" : undefined}>
            <legend className="font-semibold">What should we delete?<span aria-hidden="true" className="text-gold"> *</span></legend>
            <div className="mt-2 space-y-1">
              {scopes.map(([v, l], i) => (
                <label key={v} className="check min-h-11 items-center">
                  <input type="radio" name="scope" value={v} id={i === 0 ? "scope" : undefined} className="h-5 w-5 accent-[var(--gold-fill)]" />
                  <span>{l}</span>
                </label>
              ))}
            </div>
            {errors.scope && <p id="scope-error" className="field-error">{errors.scope}</p>}
          </fieldset>
          <TextArea name="details" label="Details" hint="Dates, load numbers, or anything that helps us find your records" errors={errors} rows={4} />
          <ConsentBox errors={errors}>
            I understand you&apos;ll email me to verify this request before deleting anything.
          </ConsentBox>
        </>
      )}
    </WebForm>
  );
}
