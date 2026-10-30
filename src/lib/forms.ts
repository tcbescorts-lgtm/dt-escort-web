import { z } from "zod";

/**
 * Schemas for every public form. The same schema validates in the browser
 * before sending; Web3Forms then validates the access key, honeypot and
 * required fields on its server. See DATA_INVENTORY.md for why each field exists.
 */

const phone = z
  .string()
  .trim()
  .min(1, "Enter a phone number.")
  .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a 10-digit phone number, including area code.")
  .refine((v) => v.replace(/\D/g, "").length <= 15, "That phone number is too long.");
const email = z.string().trim().min(1, "Enter an email address.").pipe(z.email("Enter an email address like name@company.com."));
const name = z.string().trim().min(2, "Enter your name.").max(100, "Keep the name under 100 characters.");
const consent = z.literal(true, { error: "Check this box so we can contact you about this request." });

export const quoteSchema = z.object({
  name,
  phone,
  email,
  pickup: z.string().trim().min(2, "Enter the pickup city and state.").max(200),
  dropoff: z.string().trim().min(2, "Enter the drop-off city and state.").max(200),
  date: z
    .string()
    .min(1, "Choose the load date.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date."),
  notes: z.string().trim().max(3000, "Keep notes under 3,000 characters.").optional().default(""),
  consent,
});

export const careersSchema = z.object({
  name,
  phone,
  email,
  homeState: z.string().trim().min(2, "Enter the state you live in.").max(60),
  certifications: z.string().trim().max(500, "Keep this under 500 characters.").optional().default(""),
  notes: z.string().trim().max(1500, "Keep this under 1,500 characters.").optional().default(""),
  consent,
});

export const deletionSchema = z.object({
  name,
  email,
  scope: z.enum(["quote", "career", "all", "other"], { error: "Choose what you want deleted." }),
  details: z.string().trim().max(1500, "Keep this under 1,500 characters.").optional().default(""),
  consent: z.literal(true, { error: "Check this box so we can email you to verify the request." }),
});

export type FieldErrors = Record<string, string | undefined>;

export function toFieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0]);
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// Web3Forms access keys are public by design (they ship to the browser in every
// form). Locked to dtescortservice.com in the Web3Forms dashboard. The env var
// can override it, e.g. for a new key.
export const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "ce65ef1d-c790-449d-ba97-6d64d16d236a";

export async function sendToWeb3Forms(payload: Record<string, string | boolean>): Promise<{ ok: boolean; message: string }> {
  if (!WEB3FORMS_KEY) {
    return { ok: false, message: "This form isn't connected yet (missing Web3Forms key). Please call or email us instead." };
  }
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: WEB3FORMS_KEY, ...payload }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (res.ok && data.success) return { ok: true, message: "Sent" };
    return { ok: false, message: data.message ?? `The form service returned an error (${res.status}).` };
  } catch {
    return { ok: false, message: "We couldn't reach the form service. Check your connection and try again." };
  }
}
