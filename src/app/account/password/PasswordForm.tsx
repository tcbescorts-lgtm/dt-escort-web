"use client";

import { useActionState, useState } from "react";
import { passwordProblems } from "@/lib/password";
import { changePassword } from "./actions";

export default function PasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const [pw, setPw] = useState("");
  const live = pw ? passwordProblems(pw, email) : [];
  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      {state?.errors?.length ? (
        <div role="alert" className="rounded-md border-2 border-error p-3">
          <ul className="list-disc pl-5 text-error">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="password">New password</label>
        <span id="pw-hint" className="hint">At least 10 characters, mixing three of: lowercase, uppercase, numbers, symbols.</span>
        <input id="password" name="password" type="password" autoComplete="new-password" required className="input"
          aria-describedby="pw-hint pw-live" value={pw} onChange={(e) => setPw(e.target.value)} />
        <p id="pw-live" aria-live="polite" className="mt-1 text-sm text-muted">
          {pw ? (live.length ? live[0] : "Looks good.") : ""}
        </p>
      </div>
      <div className="field">
        <label htmlFor="confirm">Type it again</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="input" />
      </div>
      <button className="btn btn-gold" disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
    </form>
  );
}
