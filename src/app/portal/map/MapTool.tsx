"use client";

import { useEffect, useMemo, useState } from "react";

type LoadPin = { id: string; label: string; pickup: string; dropoff: string };
type Vehicle = { id: string; name: string; lat: number; lon: number; address: string | null; running: boolean; speed: number | null; updated: string | null };

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

function src(mode: "search" | "route", a: string, b: string) {
  if (mode === "route" && a && b) {
    return KEY
      ? `https://www.google.com/maps/embed/v1/directions?key=${KEY}&origin=${encodeURIComponent(a)}&destination=${encodeURIComponent(b)}&mode=driving`
      : `https://maps.google.com/maps?saddr=${encodeURIComponent(a)}&daddr=${encodeURIComponent(b)}&output=embed`;
  }
  const q = a || "Jackson, MS";
  return KEY
    ? `https://www.google.com/maps/embed/v1/search?key=${KEY}&q=${encodeURIComponent(q)}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${a ? 12 : 5}&output=embed`;
}

let citiesP: Promise<string[]> | null = null;
const cities = () => (citiesP ??= fetch("/data/us-cities.json").then((r) => r.json()).catch(() => []));

export default function MapTool({ loads, vehicles, vehicleNote }: { loads: LoadPin[]; vehicles: Vehicle[]; vehicleNote?: string }) {
  const [mode, setMode] = useState<"search" | "route">("search");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shown, setShown] = useState(() => src("search", "", ""));
  const [list, setList] = useState<string[]>([]);

  // Live search: the map follows what you type after a short pause.
  useEffect(() => {
    const t = setTimeout(() => {
      if (mode === "search") setShown(src("search", q.trim(), ""));
      else if (from.trim() && to.trim()) setShown(src("route", from.trim(), to.trim()));
    }, 700);
    return () => clearTimeout(t);
  }, [mode, q, from, to]);

  useEffect(() => { cities().then(setList); }, []);
  const typed = mode === "search" ? q : to || from;
  const suggestions = useMemo(() => {
    const s = typed.trim().toLowerCase();
    if (s.length < 2) return [];
    return list.filter((c) => c.toLowerCase().startsWith(s)).slice(0, 8);
  }, [typed, list]);

  const gmaps = mode === "route" && from && to
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "Jackson, MS")}`;

  return (
    <div className="grid gap-3 lg:h-[calc(100vh-9rem)] lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="flex min-h-0 flex-col gap-3">
        <div className="rounded-md border border-rule bg-surface p-3">
          <div role="tablist" aria-label="Map mode" className="mb-2 grid grid-cols-2 gap-1">
            {(["search", "route"] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)}
                className={`btn !min-h-9 !py-1 text-sm ${mode === m ? "btn-gold" : "btn-line"}`}>{m === "search" ? "🔎 Search" : "🛣️ Route"}</button>
            ))}
          </div>
          <datalist id="map-cities">{suggestions.map((c) => <option key={c} value={c} />)}</datalist>
          {mode === "search" ? (
            <div className="field">
              <label htmlFor="mq">Place, address or business</label>
              <input id="mq" className="input" list="map-cities" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Truck stop near Meridian, MS" autoComplete="off" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="field"><label htmlFor="mf">From</label><input id="mf" className="input" list="map-cities" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Boaz, AL" autoComplete="off" /></div>
              <div className="field"><label htmlFor="mt">To</label><input id="mt" className="input" list="map-cities" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Douglas, GA" autoComplete="off" /></div>
              <button type="button" className="btn btn-line w-full !min-h-9 text-sm" onClick={() => { setFrom(to); setTo(from); }}>Swap</button>
            </div>
          )}
          <a href={gmaps} target="_blank" rel="noopener noreferrer" className="link mt-2 inline-block text-sm">Open in Google Maps<span className="sr-only"> (new tab)</span></a>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-rule bg-surface p-3">
          <h2 className="text-sm font-bold">🗓️ Active loads</h2>
          {loads.length === 0 ? <p className="text-sm text-muted">None right now.</p> : (
            <ul className="mt-1 divide-y divide-rule text-sm">
              {loads.map((l) => (
                <li key={l.id}><button type="button" className="w-full py-1.5 text-left hover:underline underline-offset-4"
                  onClick={() => { setMode("route"); setFrom(l.pickup); setTo(l.dropoff); setShown(src("route", l.pickup, l.dropoff)); }}>
                  <span className="block font-medium">{l.pickup} to {l.dropoff}</span><span className="text-xs text-muted">{l.label}</span></button></li>
              ))}
            </ul>
          )}
          <h2 className="mt-4 text-sm font-bold">🚙 Vehicles (Bouncie)</h2>
          {vehicleNote && <p className="text-xs text-muted">{vehicleNote}</p>}
          <ul className="mt-1 divide-y divide-rule text-sm">
            {vehicles.map((v) => (
              <li key={v.id}><button type="button" className="w-full py-1.5 text-left hover:underline underline-offset-4"
                onClick={() => { setMode("search"); setQ(`${v.lat},${v.lon}`); setShown(src("search", `${v.lat},${v.lon}`, "")); }}>
                <span className="block font-medium">{v.running ? "🟢" : "⚪"} {v.name}</span>
                <span className="text-xs text-muted">{v.address ?? `${v.lat.toFixed(4)}, ${v.lon.toFixed(4)}`}{v.running && v.speed ? ` · ${Math.round(v.speed)} mph` : ""}{v.updated ? ` · ${new Date(v.updated).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}</span>
              </button></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="min-h-[60vh] overflow-hidden rounded-md border border-rule lg:min-h-0">
        <iframe key={shown} title="Map" src={shown} className="h-full min-h-[60vh] w-full border-0 lg:min-h-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>
    </div>
  );
}
