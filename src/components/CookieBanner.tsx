"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { OPEN_SETTINGS_EVENT, readConsent, writeConsent } from "@/lib/consent";

/**
 * Non-blocking consent panel. Only two controls, per the business brief:
 *  - "Accept" allows optional third-party content (currently: Google Maps embed).
 *  - The X button is a real Decline: nothing optional loads, and the choice is saved.
 * Reopened from the "Cookie settings" link in the footer.
 */
export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ReturnType<typeof readConsent>>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const c = readConsent();
    setCurrent(c);
    if (c === null) setOpen(true);
    const reopen = () => {
      setCurrent(readConsent());
      setOpen(true);
      requestAnimationFrame(() => headingRef.current?.focus());
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (c: "accepted" | "declined") => {
    writeConsent(c);
    setCurrent(c);
    setOpen(false);
  };

  return (
    <section
      aria-labelledby="cookie-heading"
      className="fixed z-40 left-20 right-3 bottom-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md rounded-lg border border-field bg-surface p-4 pr-16 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
    >
      <h2 id="cookie-heading" ref={headingRef} tabIndex={-1} className="font-semibold text-base mb-1">
        Cookies on this site
      </h2>
      <p className="text-[0.95rem] text-muted leading-snug">
        We use only what the site needs to work. If you accept, we also load Google Maps on the
        Contact page, and Google may set cookies. Closing this keeps those off.{" "}
        <Link href="/cookie-policy" className="link">Cookie Policy</Link>
      </p>
      {current && (
        <p className="text-sm text-muted mt-2">
          Current choice: {current === "accepted" ? "accepted" : "declined"}.
        </p>
      )}
      <div className="mt-3">
        <button type="button" className="btn btn-gold" onClick={() => choose("accepted")}>
          Accept
        </button>
      </div>
      <button
        type="button"
        onClick={() => choose("declined")}
        aria-label="Decline optional cookies and close"
        title="Decline optional cookies and close"
        className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-md border border-field text-ink hover:border-gold"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M3 3l12 12M15 3L3 15" />
        </svg>
      </button>
    </section>
  );
}
