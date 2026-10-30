"use client";

import { useEffect, useState } from "react";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Opt-in phone/desktop notifications. Nothing is requested until the person presses the button. */
export default function PushToggle() {
  const [state, setState] = useState<"unsupported" | "off" | "on" | "blocked" | "busy">("busy");
  useEffect(() => {
    if (!KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) return setState("unsupported");
    if (Notification.permission === "denied") return setState("blocked");
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    }).catch(() => setState("unsupported"));
  }, []);

  if (state === "unsupported") return null;

  async function enable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(KEY) });
      await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub) });
      setState("on");
    } catch {
      setState(Notification.permission === "denied" ? "blocked" : "off");
    }
  }
  async function disable() {
    setState("busy");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    setState("off");
  }

  return (
    <div className="rounded-md border border-rule p-3">
      <p className="font-semibold">Alerts on this device</p>
      {state === "blocked" ? (
        <p className="text-muted">Notifications are blocked in this browser&apos;s settings.</p>
      ) : (
        <>
          <p className="text-muted">{state === "on" ? "On: you'll get an alert here when something needs you." : "Get an alert on this phone or computer for new loads and updates."}</p>
          <button type="button" className="btn btn-line mt-2" disabled={state === "busy"} onClick={state === "on" ? disable : enable}>
            {state === "on" ? "Turn off alerts" : "Turn on alerts"}
          </button>
        </>
      )}
    </div>
  );
}
