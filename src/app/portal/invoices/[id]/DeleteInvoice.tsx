"use client";

import { useActionState, useState } from "react";
import { archiveInvoice } from "../actions";

/** Delete = move to Archive. Needs the invoice number typed back to confirm. */
export default function DeleteInvoice({ id, number }: { id: string; number: string }) {
  const [state, action, pending] = useActionState(archiveInvoice, undefined);
  const [typed, setTyped] = useState("");
  const ok = typed.trim().toUpperCase() === number.toUpperCase();
  return (
    <details className="rounded-md border border-rule bg-surface p-3">
      <summary className="cursor-pointer text-sm font-bold">🗑️ Delete invoice</summary>
      <form action={action} className="mt-2 space-y-2">
        <input type="hidden" name="id" value={id} />
        <p className="text-sm text-muted">The invoice moves to the Archive tab and its online link stops working. You can restore it from there.</p>
        <div className="field">
          <label htmlFor="del-confirm">Type <span className="font-mono">{number}</span> to confirm</label>
          <input id="del-confirm" name="confirm" className="input" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
        <div className="field"><label htmlFor="del-reason">Reason (optional)</label><input id="del-reason" name="reason" className="input" /></div>
        <button className="btn btn-line !border-error !text-error" disabled={!ok || pending}>{pending ? "Deleting…" : "Delete invoice"}</button>
        {state?.error && <p role="alert" className="text-sm font-medium text-error">{state.error}</p>}
      </form>
    </details>
  );
}
