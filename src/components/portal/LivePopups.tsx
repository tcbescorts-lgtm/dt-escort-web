"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type N = { id: string; kind: string; title: string; body: string | null; link: string | null; created_at: string };

const ICON: Record<string, string> = { run_sheet_submitted: "📝", comm: "💬", load_assigned: "🚚", invoice_status: "💵", deletion_request: "🗂️" };

function chime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.55);
  } catch {}
}

/** Checks for new notifications every 20 seconds while the portal is open and pops them up. */
export default function LivePopups() {
  const [items, setItems] = useState<N[]>([]);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const after = useRef(new Date().toISOString());
  const router = useRouter();

  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/portal/notifications?after=${encodeURIComponent(after.current)}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        const fresh: N[] = j.items ?? [];
        if (!fresh.length || stop) return;
        after.current = fresh[fresh.length - 1].created_at;
        setItems((cur) => [...fresh.filter((f) => !cur.some((c) => c.id === f.id)), ...cur].slice(0, 4));
        chime();
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
          fresh.forEach((n) => new Notification(n.title, { body: n.body ?? "", icon: "/icon-192.png", tag: n.id }));
        }
        if (fresh.some((n) => n.kind === "run_sheet_submitted")) router.refresh();
      } catch {}
    };
    const id = setInterval(tick, 20_000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => { stop = true; clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [router]);

  useEffect(() => {
    if (!items.length) return;
    const t = setTimeout(() => setItems((cur) => cur.slice(0, -1)), 15_000);
    return () => clearTimeout(t);
  }, [items]);

  return (
    <>
      <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((n) => (
          <div key={n.id} role="status" className="pointer-events-auto rounded-md border border-gold-fill bg-surface p-3 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)]">
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="text-lg">{ICON[n.kind] ?? "🔔"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.title}</p>
                {n.body && <p className="text-sm text-muted">{n.body}</p>}
                {n.link && <Link href={n.link} className="link text-sm font-semibold" onClick={() => setItems((c) => c.filter((x) => x.id !== n.id))}>Open</Link>}
              </div>
              <button type="button" className="grid h-8 w-8 place-items-center rounded text-muted hover:text-ink" aria-label="Dismiss" onClick={() => setItems((c) => c.filter((x) => x.id !== n.id))}>✕</button>
            </div>
          </div>
        ))}
      </div>
      {perm === "default" && (
        <button type="button" className="fixed bottom-4 right-4 z-40 btn btn-line bg-surface !min-h-9 !py-1 text-sm shadow"
          onClick={async () => setPerm(await Notification.requestPermission())}>
          🔔 Turn on desktop alerts
        </button>
      )}
    </>
  );
}
