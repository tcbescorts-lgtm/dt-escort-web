"use client";

import { useActionState } from "react";
import UploadField from "@/components/portal/UploadField";
import { addMyDocument } from "../actions";

export default function MyDocUpload({ driverId }: { driverId: string }) {
  const [state, action, pending] = useActionState(addMyDocument, undefined);
  return (
    <form action={action} className="space-y-3">
      <h3 className="font-semibold">Send a document to dispatch</h3>
      {state?.ok && <p role="status" className="font-medium text-success">Sent. Dispatch can see it now.</p>}
      {state?.error && <p role="alert" className="font-medium text-error">{state.error}</p>}
      <div className="field"><label htmlFor="dt">What is it?</label>
        <select id="dt" name="doc_type" className="input"><option value="certification">Certification</option><option value="insurance_certificate">Insurance certificate</option><option value="license">Driver license</option><option value="vehicle_registration">Vehicle registration</option><option value="w9">W-9</option><option value="other">Other</option></select></div>
      <div className="field"><label htmlFor="de">Expires (if any)</label><input id="de" name="expires_on" type="date" className="input" /></div>
      <UploadField bucket="driver-docs" folder={`${driverId}/docs`} id="df" label="File or photo" capture />
      <button className="btn btn-gold" disabled={pending}>Send</button>
    </form>
  );
}
