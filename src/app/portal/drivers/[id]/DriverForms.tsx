"use client";

import { useActionState, useRef, useEffect } from "react";
import UploadField from "@/components/portal/UploadField";
import { addCertification, resetDriverPassword, uploadDocument } from "../actions";

export function CertForm({ driverId }: { driverId: string }) {
  const [state, action, pending] = useActionState(addCertification, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state && !state.error) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input type="hidden" name="driver_id" value={driverId} />
      {state?.error && <p role="alert" className="text-error font-medium sm:col-span-2 lg:col-span-4">{state.error}</p>}
      <div className="field"><label htmlFor="c-kind">Type</label>
        <select id="c-kind" name="kind" className="input">
          <option value="pevo">PEVO certification</option><option value="state_certification">State certification</option>
          <option value="pilot_car_permit">Pilot car permit / registration</option><option value="insurance">Insurance</option><option value="other">Other</option>
        </select></div>
      <div className="field"><label htmlFor="c-state">State</label><input id="c-state" name="state" className="input" maxLength={2} placeholder="MS" /></div>
      <div className="field"><label htmlFor="c-issuer">Issuer / provider</label><input id="c-issuer" name="issuer" className="input" /></div>
      <div className="field"><label htmlFor="c-number">Number / policy #</label><input id="c-number" name="number" className="input" /></div>
      <div className="field"><label htmlFor="c-issued">Issued / registered</label><input id="c-issued" name="issued_on" type="date" className="input" /></div>
      <div className="field"><label htmlFor="c-exp">Expires</label><input id="c-exp" name="expires_on" type="date" className="input" /></div>
      <div className="sm:col-span-2"><UploadField bucket="driver-docs" folder={`${driverId}/certs`} id="c-file" label="Certificate file" /></div>
      <div className="sm:col-span-2 lg:col-span-4"><button className="btn btn-gold" disabled={pending}>{pending ? "Adding…" : "Add certification"}</button></div>
    </form>
  );
}

export function DocForm({ driverId }: { driverId: string }) {
  const [state, action, pending] = useActionState(uploadDocument, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="driver_id" value={driverId} />
      {state?.error && <p role="alert" className="text-error font-medium sm:col-span-3">{state.error}</p>}
      {state?.ok && <p role="status" className="text-success font-medium sm:col-span-3">Document saved.</p>}
      <div className="field"><label htmlFor="d-type">Document</label>
        <select id="d-type" name="doc_type" className="input">
          <option value="w9">W-9</option><option value="agreement">Agreement</option><option value="insurance_certificate">Insurance certificate</option>
          <option value="license">Driver license</option><option value="certification">Certification</option><option value="vehicle_registration">Vehicle registration</option><option value="other">Other</option>
        </select></div>
      <div className="field"><label htmlFor="d-exp">Expires (if any)</label><input id="d-exp" name="expires_on" type="date" className="input" /></div>
      <UploadField bucket="driver-docs" folder={`${driverId}/docs`} id="d-file" label="File" required />
      <div className="sm:col-span-3"><button className="btn btn-gold" disabled={pending}>{pending ? "Saving…" : "Save document"}</button></div>
    </form>
  );
}

export function ResetPassword({ driverId }: { driverId: string }) {
  const [state, action, pending] = useActionState(resetDriverPassword, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="driver_id" value={driverId} />
      {state?.password ? (
        <p role="status" className="mb-2">New temporary password: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-semibold">{state.password}</code>. Send it to the driver; they must change it at sign-in.</p>
      ) : state?.error ? <p role="alert" className="mb-2 text-error">{state.error}</p> : null}
      <button className="btn btn-line" disabled={pending}>Issue a new temporary password</button>
    </form>
  );
}
