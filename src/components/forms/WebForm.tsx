"use client";

import { useRef, useState } from "react";
import type { z } from "zod";
import { sendToWeb3Forms, toFieldErrors, type FieldErrors } from "@/lib/forms";
import { ErrorSummary, Honeypot } from "./Field";

type Props<S extends z.ZodTypeAny> = {
  schema: S;
  labels: Record<string, string>;
  subject: (data: z.infer<S>) => string;
  /** Turn validated data into the fields emailed to the business. */
  toPayload: (data: z.infer<S>) => Record<string, string>;
  submitLabel: string;
  sendingLabel: string;
  success: React.ReactNode;
  children: (errors: FieldErrors) => React.ReactNode;
  /** Also record in the portal database (consent log / deletion queue). */
  recordType?: "quote" | "careers" | "deletion";
  /** Tighter spacing, no separate "required" line; submit sits beside the consent box. */
  compact?: boolean;
};

export default function WebForm<S extends z.ZodTypeAny>({ schema, labels, subject, toPayload, submitLabel, sendingLabel, success, children, recordType, compact }: Props<S>) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const focusSummary = () => requestAnimationFrame(() => document.getElementById("form-errors")?.focus());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("botcheck")) {
      setStatus("sent"); // quietly drop bot traffic
      return;
    }
    const raw: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (k !== "botcheck") raw[k] = typeof v === "string" ? v : "";
    });
    raw.consent = fd.get("consent") === "on";

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setFormError(undefined);
      setErrors(toFieldErrors(parsed.error));
      focusSummary();
      return;
    }
    setErrors({});
    setFormError(undefined);
    setStatus("sending");
    const data = parsed.data as z.infer<S>;
    const result = await sendToWeb3Forms({
      subject: subject(data),
      from_name: "D & T Escort Service website",
      ...toPayload(data),
      consent: `Agreed to be contacted (${new Date().toISOString()})`,
    });
    if (result.ok) {
      if (recordType) {
        fetch("/api/public/record", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: recordType, ...(data as object) }) }).catch(() => {});
      }
      setStatus("sent");
      requestAnimationFrame(() => doneRef.current?.focus());
    } else {
      setStatus("idle");
      setFormError(result.message);
      focusSummary();
    }
  }

  if (status === "sent") {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="rounded-md border-2 border-success bg-surface p-6">
        {success}
        <button type="button" className="btn btn-line mt-5" onClick={() => setStatus("idle")}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-6"}>
      <ErrorSummary errors={errors} formError={formError} labels={labels} />
      {!compact && (
        <p className="text-muted">
          Fields marked <span className="text-gold">*</span> are required.
        </p>
      )}
      {children(errors)}
      <Honeypot />
      <button type="submit" className={`btn btn-gold ${compact ? "w-full sm:w-auto" : ""}`} disabled={status === "sending"} aria-disabled={status === "sending"}>
        {status === "sending" ? sendingLabel : submitLabel}
      </button>
    </form>
  );
}
