import Link from "next/link";
import { tone } from "@/lib/format";

export function PageHead({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, id, className = "" }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; id?: string; className?: string }) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={`rounded-md border border-rule bg-surface p-4 md:p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 id={id} className="text-lg font-semibold">{title}</h2>}
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
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-sm font-medium ${toneClass[tone(status)]}`}>
      {label}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-md border border-rule bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold leading-none">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
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
      <table className="w-full min-w-[640px] border-collapse text-left text-[0.95rem]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-surface-2">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-3 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="[&_td]:border-t [&_td]:border-rule [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top">{children}</tbody>
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
    <fieldset className={`rounded-md border border-rule p-4 md:p-5 ${className}`}>
      <legend className="px-1 font-display text-xl font-bold">{legend}</legend>
      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
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
