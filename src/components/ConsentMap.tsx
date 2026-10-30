"use client";

import { useEffect, useState } from "react";
import { onConsentChange, openCookieSettings, readConsent, type Consent } from "@/lib/consent";

/**
 * Google Maps embed that only loads after the visitor accepts optional cookies.
 * Before that (or without an API key) we show the address and a plain link.
 */
export default function ConsentMap({ query, label }: { query: string; label: string }) {
  const [consent, setConsent] = useState<Consent>(null);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  useEffect(() => {
    setConsent(readConsent());
    return onConsentChange(setConsent);
  }, []);

  if (consent === "accepted" && key) {
    return (
      <iframe
        title={label}
        className="aspect-[4/3] w-full rounded-md border border-rule"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={`https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(query)}`}
      />
    );
  }

  return (
    <div className="flex aspect-[4/3] w-full flex-col justify-end rounded-md border border-rule bg-surface p-6">
      <p className="text-muted">
        {key
          ? "The map is off because it comes from Google, which may set cookies."
          : "Map not shown."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={link} className="btn btn-line" target="_blank" rel="noopener noreferrer">
          Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
        </a>
        {key && (
          <button type="button" className="btn btn-line" onClick={openCookieSettings}>
            Cookie settings
          </button>
        )}
      </div>
    </div>
  );
}
