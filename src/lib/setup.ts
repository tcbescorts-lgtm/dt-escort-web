import "server-only";

/** What is and isn't connected yet. Reads env presence only, never values. */
export function setupStatus(settings: Record<string, any>) {
  const has = (k: string) => Boolean(process.env[k]);
  const pi = settings.payment_info ?? {};
  return [
    { name: "Database and sign-in", ok: has("NEXT_PUBLIC_SUPABASE_URL") && has("SUPABASE_SERVICE_ROLE_KEY"), todo: "Supabase keys in Vercel." },
    { name: "Payment details on invoices", ok: Boolean(pi.zelle || pi.cashapp || pi.ach_account || pi.other), todo: "Fill in Zelle, Cash App or ACH below." },
    { name: "Invoice email sending (Resend)", ok: has("RESEND_API_KEY"), todo: "Until then use \"Email from my mail app\" on each invoice. Needs a free Resend account and 3 DNS records." },
    { name: "Online card payments (Stripe)", ok: has("STRIPE_SECRET_KEY"), todo: "Optional. Stripe account keys in Vercel." },
    { name: "Google Maps key", ok: has("NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY"), todo: "Optional. The Map page works without it; a free key removes Google's limits." },
    { name: "Quo calls and texts", ok: has("QUO_WEBHOOK_SECRET"), todo: "Add a webhook in Quo pointing to /api/webhooks/quo, then put its signing secret in Vercel." },
    { name: "Bouncie vehicle tracking", ok: has("BOUNCIE_CLIENT_ID") && has("BOUNCIE_CLIENT_SECRET") && has("BOUNCIE_AUTH_CODE"), todo: "Bouncie developer app: client ID, client secret and authorization code in Vercel." },
    { name: "Phone alerts (web push)", ok: has("NEXT_PUBLIC_VAPID_PUBLIC_KEY") && has("VAPID_PRIVATE_KEY"), todo: "VAPID keys in Vercel." },
    { name: "Daily reminders job", ok: has("CRON_SECRET"), todo: "CRON_SECRET in Vercel." },
  ];
}
