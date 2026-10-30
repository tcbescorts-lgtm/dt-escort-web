"use client";

import { openCookieSettings } from "@/lib/consent";

export default function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="inline-flex min-h-11 items-center text-left hover:text-gold underline-offset-4 hover:underline"
    >
      Cookie settings
    </button>
  );
}
