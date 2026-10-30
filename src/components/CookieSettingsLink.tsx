"use client";

import { openCookieSettings } from "@/lib/consent";

export default function CookieSettingsLink({
  className = "inline-flex min-h-11 items-center text-left hover:text-gold underline-offset-4 hover:underline",
}: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={`${className} text-left`}>
      Cookie settings
    </button>
  );
}
