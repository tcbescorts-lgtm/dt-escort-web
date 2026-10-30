"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Tokens = { c1: string; c2: string; grid: string; muted: string; text: string; surface: string };

function useTokens(): Tokens {
  const read = (): Tokens => {
    if (typeof window === "undefined") return { c1: "#a68623", c2: "#5b8fd8", grid: "#2a2a2e", muted: "#b9b4a6", text: "#f5f1e6", surface: "#141416" };
    const cs = getComputedStyle(document.documentElement);
    const g = (n: string) => cs.getPropertyValue(n).trim();
    return { c1: g("--c1"), c2: g("--c2"), grid: g("--grid"), muted: g("--muted"), text: g("--text"), surface: g("--surface") };
  };
  const [t, setT] = useState<Tokens>(read);
  useEffect(() => {
    setT(read());
    const mo = new MutationObserver(() => setT(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return t;
}

export type Series = { key: string; label: string };

/**
 * Bar chart with a hover tooltip and a table view. One series = no legend
 * (the panel title names it); two series = legend. Values are formatted by `fmt`.
 */
export function Bars({
  data, x, series, fmt = "number", height = 220, title, layout = "vertical",
}: {
  data: Record<string, string | number>[];
  x: string;
  series: Series[];
  fmt?: "money" | "number";
  height?: number;
  title: string;
  layout?: "vertical" | "horizontal";
}) {
  const t = useTokens();
  const f = (v: number) =>
    fmt === "money"
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
      : new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(v);
  const colors = [t.c1, t.c2];
  const horizontal = layout === "horizontal";

  if (!data.length) return <p className="text-muted">No data yet.</p>;

  return (
    <figure>
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={t.grid} vertical={horizontal} horizontal={!horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" tickFormatter={f} stroke={t.muted} tick={{ fill: t.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey={x} width={110} stroke={t.muted} tick={{ fill: t.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              </>
            ) : (
              <>
                <XAxis dataKey={x} stroke={t.muted} tick={{ fill: t.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={f} width={64} stroke={t.muted} tick={{ fill: t.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              </>
            )}
            <Tooltip
              cursor={{ fill: t.grid, opacity: 0.4 }}
              formatter={(v) => f(Number(v))}
              contentStyle={{ background: t.surface, border: `1px solid ${t.grid}`, borderRadius: 6, color: t.text }}
              labelStyle={{ color: t.text, fontWeight: 600 }}
            />
            {series.length > 1 && <Legend wrapperStyle={{ color: t.text, fontSize: 13 }} />}
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={colors[i]} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-muted">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{title}</caption>
          <thead><tr><th scope="col" className="py-1">{x === "month" ? "Month" : "Name"}</th>{series.map((s) => <th key={s.key} scope="col" className="py-1">{s.label}</th>)}</tr></thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-t border-rule">
                <th scope="row" className="py-1 font-normal">{d[x]}</th>
                {series.map((s) => <td key={s.key} className="py-1">{f(Number(d[s.key] ?? 0))}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
