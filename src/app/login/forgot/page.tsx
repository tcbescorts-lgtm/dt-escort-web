"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendReset } from "../actions";

export default function Forgot() {
  const [state, action, pending] = useActionState(sendReset, undefined);
  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <h1 className="display-2">Reset your password</h1>
      {state?.sent ? (
        <p role="status" className="mt-6">
          If that email has an account, a reset link is on its way. Open it on this device to set a new password.
        </p>
      ) : (
        <form action={action} className="mt-8 space-y-5" noValidate>
          {state?.error && <p role="alert" className="text-error font-medium">{state.error}</p>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required className="input" />
          </div>
          <button className="btn btn-gold" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
      <p className="mt-6"><Link href="/login" className="link">Back to sign in</Link></p>
    </div>
  );
}
