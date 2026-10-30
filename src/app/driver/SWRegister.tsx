"use client";

import { useEffect } from "react";

/** Registers the service worker so the driver app works as an installable PWA with an offline page. */
export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
