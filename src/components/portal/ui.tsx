import Link from "next/link";
import { tone } from "@/lib/format";

export function PageHead({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold leading-tight md:text-2xl">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, id, className = "" }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; id?: string; className?: string }) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={`rounded-md border border-rule bg-surface p-3 md:p-4 ${className}`}>
      {(title || actions) && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 id={id} className="font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const toneClass = {
  ok: "border-success text-success",
  bad: "border-error text-error",
  warn: "border-gold-fill text-gold",
  active: "border-ink text-ink",
  neutral: "border-field text-muted",
};

export function Badge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-xs font-semibold ${toneClass[tone(status)]}`}>
      {label}
    </span>
  );
}

/** KPI tile. `delta` compares with last month: positive is shown green with an up arrow. */
export function Stat({ label, value, hint, delta, big }: { label: string; value: React.ReactNode; hint?: string; delta?: { text: string; up: boolean } | null; big?: boolean }) {
  return (
    <div className="rounded-md border border-rule bg-surface px-3 py-2.5">
      <p className={`${big ? "text-[1.7rem]" : "text-xl"} font-bold leading-none tabular-nums`}>{value}</p>
      <p className="mt-1 text-xs font-medium">{label}</p>
      {delta ? (
        <p className={`text-xs font-semibold ${delta.up ? "text-success" : "text-error"}`}>{delta.up ? "▲" : "▼"} {delta.text} <span className="font-normal text-muted">vs last month</span></p>
      ) : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Empty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-field p-6 text-center text-muted">
      <p>{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Table({ head, children, caption }: { head: React.ReactNode[]; children: React.ReactNode; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-rule">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-surface-2">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="[&_td]:border-t [&_td]:border-rule [&_td]:px-3 [&_td]:py-2 [&_td]:align-top">{children}</tbody>
      </table>
    </div>
  );
}

type FieldProps = {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  hint?: string;
  step?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  list?: string;
};

export function F({ name, label, defaultValue, type = "text", required, hint, step, inputMode, placeholder, autoComplete, className = "", list }: FieldProps) {
  const id = `f-${name}`;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true" className="text-gold"> *</span>}
      </label>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      <input
        id={id} name={name} type={type} required={required} step={step} inputMode={inputMode} placeholder={placeholder}
        autoComplete={autoComplete ?? "off"} list={list}
        defaultValue={defaultValue ?? undefined} aria-describedby={hint ? `${id}-hint` : undefined} className="input"
      />
    </div>
  );
}

export function Sel({ name, label, options, defaultValue, required, className = "", hint }: { name: string; label: string; options: [string, string][]; defaultValue?: string | null; required?: boolean; className?: string; hint?: string }) {
  const id = `f-${name}`;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true" className="text-gold"> *</span>}
      </label>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      <select id={id} name={name} defaultValue={defaultValue ?? ""} required={required} className="input" aria-describedby={hint ? `${id}-hint` : undefined}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

export function TA({ name, label, defaultValue, rows = 3, hint, className = "" }: { name: string; label: string; defaultValue?: string | null; rows?: number; hint?: string; className?: string }) {
  const id = `f-${name}`;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      <textarea id={id} name={name} rows={rows} defaultValue={defaultValue ?? ""} className="input !min-h-0" aria-describedby={hint ? `${id}-hint` : undefined} />
    </div>
  );
}

export function Fieldset({ legend, children, className = "" }: { legend: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={`border-t border-rule pt-3 ${className}`}>
      <legend className="pr-2 text-sm font-bold">{legend}</legend>
      <div className="mt-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </fieldset>
  );
}

export function Flash({ msg, kind = "ok" }: { msg?: string | null; kind?: "ok" | "bad" }) {
  if (!msg) return null;
  return (
    <p role={kind === "bad" ? "alert" : "status"} className={`mb-4 rounded-md border-2 p-3 font-medium ${kind === "bad" ? "border-error text-error" : "border-success text-success"}`}>
      {msg}
    </p>
  );
}

export const LinkBtn = ({ href, children, gold }: { href: string; children: React.ReactNode; gold?: boolean }) => (
  <Link href={href} className={`btn ${gold ? "btn-gold" : "btn-line"}`}>{children}</Link>
);
