"use client";

import Link from "next/link";
import { useId, useState } from "react";
import geo from "@/lib/us-map.json";
import { STATES_48 } from "@/lib/site";

const NAMES = Object.fromEntries(STATES_48) as Record<string, string>;
const SMALL = new Set(["RI", "DE", "CT", "NJ", "MD", "MA", "VT", "NH"]);
const HOME = "MS";

/**
 * Lower-48 coverage map. Every state is clickable; the select menu gives the
 * same choice to keyboard and screen-reader users (and is easier on small phones).
 */
export default function UsMap() {
  const [sel, setSel] = useState<string>(HOME);
  const [hover, setHover] = useState<string | null>(null);
  const selectId = useId();
  const name = NAMES[sel];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] lg:items-center">
      <div className="relative">
        <svg
          viewBox="0 0 975 610"
          role="img"
          aria-label="Map of the 48 contiguous states. D & T Escort Service covers all of them from its home base in Jackson, Mississippi."
          className="h-auto w-full"
        >
          <g>
            {geo.states.map((s) => {
              const on = s.abbr === sel;
              const hot = s.abbr === hover;
              return (
                <path
                  key={s.abbr}
                  d={s.d}
                  onClick={() => setSel(s.abbr)}
                  onMouseEnter={() => setHover(s.abbr)}
                  onMouseLeave={() => setHover(null)}
                  className="cursor-pointer"
                  style={{
                    fill: on
                      ? "var(--gold-fill)"
                      : hot
                        ? "color-mix(in srgb, var(--gold-fill) 45%, var(--surface-2))"
                        : s.abbr === HOME
                          ? "color-mix(in srgb, var(--gold-fill) 22%, var(--surface-2))"
                          : "var(--surface-2)",
                    stroke: "var(--bg)",
                    strokeWidth: 1.2,
                  }}
                >
                  <title>{NAMES[s.abbr]}</title>
                </path>
              );
            })}
          </g>
          <g aria-hidden="true" className="pointer-events-none select-none">
            {geo.states
              .filter((s) => !SMALL.has(s.abbr))
              .map((s) => (
                <text
                  key={s.abbr}
                  x={s.c[0]}
                  y={s.c[1] + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  style={{ fill: s.abbr === sel ? "var(--on-gold)" : "var(--muted)" }}
                >
                  {s.abbr}
                </text>
              ))}
            <circle cx={geo.jackson[0]} cy={geo.jackson[1]} r="11" style={{ fill: "var(--gold-fill)", opacity: 0.25 }} />
            <circle cx={geo.jackson[0]} cy={geo.jackson[1]} r="5" style={{ fill: "var(--gold-fill)", stroke: "var(--bg)", strokeWidth: 2 }} />
          </g>
        </svg>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-gold-fill" />
          Home base: Jackson, MS (I-55 and I-20)
        </p>
      </div>

      <div className="border-t border-rule pt-5 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
        <label htmlFor={selectId} className="text-sm font-semibold">
          Choose a state
        </label>
        <select
          id={selectId}
          className="input mt-1.5"
          value={sel}
          onChange={(e) => setSel(e.target.value)}
        >
          {STATES_48.map(([abbr, n]) => (
            <option key={abbr} value={abbr}>
              {n}
            </option>
          ))}
        </select>

        <div aria-live="polite" className="mt-5">
          <h3 className="display-3">{name}{sel === HOME ? " (home state)" : ""}</h3>
          <p className="mt-1.5 text-sm text-muted">
            {sel === HOME
              ? "Our base is in Jackson, so Mississippi moves are close to home."
              : `We run lead, chase and specialty escorts in ${name}, with operators certified for its rules.`}
          </p>
        </div>
        <Link href={`/quote?state=${sel}`} className="btn btn-gold mt-5 w-full">
          Request a quote in {name}
        </Link>
      </div>
    </div>
  );
}
