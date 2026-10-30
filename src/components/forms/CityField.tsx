"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FieldErrors } from "@/lib/forms";

let cache: Promise<string[]> | null = null;
function loadCities() {
  cache ??= fetch("/data/us-cities.json")
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  return cache;
}

const norm = (s: string) => s.toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();

/**
 * City, ST text field with suggestions (ARIA 1.2 combobox, list autocomplete).
 * Free text is always allowed: a yard or a small town that isn't listed still works.
 * City list: GeoNames (CC BY 4.0), US places with 1,000+ people, lower 48.
 */
export default function CityField({
  name, label, errors, required, placeholder, preferState, className = "",
}: { name: string; label: string; errors: FieldErrors; required?: boolean; placeholder?: string; preferState?: string; className?: string }) {
  const [value, setValue] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const err = errors[name];

  useEffect(() => {
    if (!open || cities.length) return;
    loadCities().then(setCities);
  }, [open, cities.length]);

  const matches = useMemo(() => {
    const q = norm(value);
    if (q.length < 2 || !cities.length) return [];
    const starts: string[] = [];
    const has: string[] = [];
    for (const c of cities) {
      const n = norm(c);
      if (n.startsWith(q)) starts.push(c);
      else if (n.includes(" " + q)) has.push(c);
      if (starts.length >= 40) break;
    }
    let out = [...starts, ...has];
    if (preferState) {
      const st = `, ${preferState}`;
      out = [...out.filter((c) => c.endsWith(st)), ...out.filter((c) => !c.endsWith(st))];
    }
    return out.slice(0, 7);
  }, [value, cities, preferState]);

  const show = open && matches.length > 0 && !(matches.length === 1 && matches[0] === value);

  function pick(c: string) {
    setValue(c);
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && show && active >= 0) {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === "Escape") {
      if (show) e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className={`field relative ${className}`}>
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true" className="text-gold"> *</span>}
      </label>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="text"
        className="input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        aria-required={required}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? `${name}-error` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label={`${label} suggestions`}
        hidden={!show}
        className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-md border border-field bg-surface py-1 text-sm shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)]"
      >
        {show &&
          matches.map((c, i) => (
            <li
              key={c}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 ${i === active ? "bg-surface-2 text-gold" : ""}`}
            >
              {c}
            </li>
          ))}
      </ul>
      {err && <p id={`${name}-error`} className="field-error">{err}</p>}
    </div>
  );
}
