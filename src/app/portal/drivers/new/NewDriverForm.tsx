"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { F, Fieldset, Sel } from "@/components/portal/ui";
import { POSITIONS } from "@/lib/format";
import { createDriver, type CreateState } from "../actions";
import { SITE_URL } from "@/lib/site";

export default function NewDriverForm() {
  const [state, action, pending] = useActionState<CreateState, FormData>(createDriver, undefined);
  const [copied, setCopied] = useState(false);

  if (state?.created) {
    const c = state.created;
    const message = `Hi ${c.name.split(" ")[0]}, your D & T driver portal account is ready.\nSign in: ${SITE_URL}/login\nEmail: ${c.email}\nTemporary password: ${c.password}\nYou'll be asked to choose your own password when you sign in.`;
    return (
      <div role="status" className="max-w-2xl rounded-md border-2 border-success p-5">
        <h2 className="display-3">Account created for {c.name}</h2>
        <p className="mt-2">Send the driver these sign-in details by text or in person. This temporary password is shown only once; it stops working after they choose their own.</p>
        <pre className="mt-4 whitespace-pre-wrap rounded-md border border-field bg-surface p-3 text-[0.95rem]">{message}</pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-gold" onClick={async () => { await navigator.clipboard.writeText(message); setCopied(true); }}>
            {copied ? "Copied" : "Copy message"}
          </button>
          <Link href={`/portal/drivers/${c.id}`} className="btn btn-line">Open driver profile</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="max-w-4xl space-y-5" noValidate>
      {state?.error && <p role="alert" className="rounded-md border-2 border-error p-3 font-medium text-error">{state.error}</p>}
      <Fieldset legend="Driver">
        <F name="full_name" label="Full name" required autoComplete="off" />
        <F name="email" label="Email (used to sign in)" type="email" required />
        <F name="phone" label="Phone" type="tel" />
        <Sel name="employment_type" label="Employment type" options={[["contractor", "Contractor"], ["employee", "Employee"]]} />
        <F name="start_date" label="Start date" type="date" />
        <F name="split_pct" label="Driver split %" type="number" step="0.01" defaultValue={40} hint="Share of (load total − QP fee − gas)" />
      </Fieldset>
      <fieldset className="rounded-md border border-rule p-4">
        <legend className="px-1 font-display text-xl font-bold">Positions qualified for</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(POSITIONS).map(([v, l]) => (
            <label key={v} className="check min-h-11 items-center"><input type="checkbox" name="positions" value={v} /><span>{l}</span></label>
          ))}
        </div>
      </fieldset>
      <details className="rounded-md border border-rule p-4">
        <summary className="cursor-pointer font-semibold">Temporary password (optional)</summary>
        <p className="mt-2 text-muted">Leave blank and we&apos;ll generate a unique one (recommended). A shared or simple password lets anyone who knows it sign in as this driver until they change it.</p>
        <div className="mt-3 max-w-sm"><F name="temp_password" label="Custom temporary password" hint="At least 10 characters" /></div>
      </details>
      <button className="btn btn-gold" disabled={pending}>{pending ? "Creating…" : "Create driver account"}</button>
    </form>
  );
}
