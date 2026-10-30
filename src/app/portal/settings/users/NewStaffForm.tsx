"use client";

import { useActionState } from "react";
import { createStaff } from "../actions";

export default function NewStaffForm() {
  const [state, action, pending] = useActionState(createStaff, undefined);
  if (state?.created) {
    return (
      <p role="status">Account created for <strong>{state.created.email}</strong>. Temporary password: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-semibold">{state.created.password}</code>. Share it privately; they must change it at first sign-in.</p>
    );
  }
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3 sm:items-end">
      {state?.error && <p role="alert" className="text-error font-medium sm:col-span-3">{state.error}</p>}
      <div className="field"><label htmlFor="sn">Full name</label><input id="sn" name="full_name" className="input" required /></div>
      <div className="field"><label htmlFor="se">Email</label><input id="se" name="email" type="email" className="input" required /></div>
      <div className="field"><label htmlFor="sr">Role</label><select id="sr" name="role" className="input"><option value="admin">Admin (dispatch)</option><option value="owner">Owner</option></select></div>
      <button className="btn btn-gold sm:col-span-3 sm:w-fit" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
    </form>
  );
}
