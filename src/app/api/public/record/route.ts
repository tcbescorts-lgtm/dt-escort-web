import { NextResponse, type NextRequest } from "next/server";
import { deletionSchema } from "@/lib/forms";
import { SITE_URL } from "@/lib/site";

/**
 * Records consent and data-deletion requests from the public site in the
 * portal database (the email copy still goes through Web3Forms).
 * Does nothing until Supabase is configured.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = [SITE_URL, "https://www.dtescortservice.com", "http://localhost:3000", "http://localhost:3100"];
  if (origin && !allowed.includes(origin) && !origin.endsWith(".vercel.app")) return new NextResponse("Forbidden", { status: 403 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: true, stored: false });
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return new NextResponse("Bad request", { status: 400 });
  const admin = supabaseAdmin();
  if (body.type === "deletion") {
    const parsed = deletionSchema.safeParse({ ...body, consent: true });
    if (!parsed.success) return new NextResponse("Invalid", { status: 400 });
    await admin.from("deletion_requests").insert({ name: parsed.data.name, email: parsed.data.email, scope: parsed.data.scope, details: parsed.data.details || null });
    await admin.from("consent_log").insert({ subject_email: parsed.data.email, purpose: "deletion_request_verification", granted: true, source: "website" });
  } else if (body.type === "quote" || body.type === "careers") {
    const email = typeof body.email === "string" ? body.email.slice(0, 200) : null;
    await admin.from("consent_log").insert({ subject_email: email, purpose: body.type === "quote" ? "contact_about_quote" : "contact_about_driving", granted: true, source: "website" });
  }
  return NextResponse.json({ ok: true, stored: true });
}
