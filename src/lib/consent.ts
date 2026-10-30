"use client";

/**
 * Cookie / script consent. Stored in localStorage (first-party, essential:
 * it only remembers the visitor's own choice). Nothing non-essential loads
 * unless the value is "accepted".
 */
export type Consent = "accepted" | "declined" | null;

const KEY = "dt-consent";
const EVENT = "dt-consent-change";
export const OPEN_SETTINGS_EVENT = "dt-open-cookie-settings";
export const CONSENT_VERSION = 1;

export function readConsent(): Consent {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: number; choice: Consent };
    if (parsed.v !== CONSENT_VERSION) return null; // policy changed: ask again
    return parsed.choice;
  } catch {
    return null;
  }
}

export function writeConsent(choice: Exclude<Consent, null>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: CONSENT_VERSION, choice, at: new Date().toISOString() }));
  } catch {
    /* storage blocked: choice applies to this page view only */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: choice }));
}

export function onConsentChange(cb: (c: Consent) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as Consent);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
