"use client";

import Link from "next/link";
import type { FieldErrors } from "@/lib/forms";

type Base = { name: string; label: string; hint?: string; errors: FieldErrors; required?: boolean };

function describedBy(name: string, hint?: string, error?: string) {
  return [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function TextField({
  name, label, hint, errors, required, type = "text", autoComplete, inputMode, defaultValue, placeholder, className,
}: Base & { type?: string; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; defaultValue?: string; placeholder?: string; className?: string }) {
  const err = errors[name];
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={name}>
        {label}
        {required ? <span aria-hidden="true" className="text-gold"> *</span> : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {hint && <span id={`${name}-hint`} className="hint">{hint}</span>}
      <input
        placeholder={placeholder}
        id={name}
        name={name}
        type={type}
        className="input"
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        required={required}
        aria-required={required}
        aria-invalid={err ? true : undefined}
        aria-describedby={describedBy(name, hint, err)}
      />
      {err && <p id={`${name}-error`} className="field-error">{err}</p>}
    </div>
  );
}

export function TextArea({ name, label, hint, errors, required, rows = 5, placeholder, className }: Base & { rows?: number; placeholder?: string; className?: string }) {
  const err = errors[name];
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={name}>
        {label}
        {required ? <span aria-hidden="true" className="text-gold"> *</span> : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {hint && <span id={`${name}-hint`} className="hint">{hint}</span>}
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="input"
        required={required}
        aria-invalid={err ? true : undefined}
        aria-describedby={describedBy(name, hint, err)}
      />
      {err && <p id={`${name}-error`} className="field-error">{err}</p>}
    </div>
  );
}

export function ConsentBox({ errors, children }: { errors: FieldErrors; children?: React.ReactNode }) {
  const err = errors.consent;
  return (
    <div className="field">
      <div className="check">
        {/* Never pre-checked */}
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? "consent-error" : undefined}
        />
        <label htmlFor="consent" className="!font-normal !text-[0.85rem] !mb-0">
          {children ?? (
            <>
              I agree to be contacted about this request (<Link href="/privacy" className="link">privacy</Link>).
            </>
          )}
        </label>
      </div>
      {err && <p id="consent-error" className="field-error">{err}</p>}
    </div>
  );
}

/** Hidden from people; bots fill it. Web3Forms rejects submissions where it's checked. */
export function Honeypot() {
  return (
    <div className="hp" aria-hidden="true">
      <label htmlFor="botcheck">Leave this box unchecked</label>
      <input type="checkbox" id="botcheck" name="botcheck" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function ErrorSummary({ errors, formError, labels }: { errors: FieldErrors; formError?: string; labels: Record<string, string> }) {
  const keys = Object.keys(errors).filter((k) => errors[k]);
  if (!keys.length && !formError) return null;
  return (
    <div role="alert" tabIndex={-1} id="form-errors" className="rounded-md border-2 border-error p-4">
      <h2 className="font-semibold text-error">
        {formError ? "Your request wasn't sent" : `Fix ${keys.length === 1 ? "1 field" : `${keys.length} fields`} to continue`}
      </h2>
      {formError && <p className="mt-1">{formError} Everything you typed is still here.</p>}
      {keys.length > 0 && (
        <ul className="mt-2 list-disc pl-5">
          {keys.map((k) => (
            <li key={k}>
              <a href={`#${k}`} className="link">{labels[k] ?? k}</a>: {errors[k]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
