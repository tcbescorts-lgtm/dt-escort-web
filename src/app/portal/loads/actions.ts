"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { alertDriverAssigned } from "@/lib/notify";

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};
const nOrNull = (f: FormData, k: string) => {
  const v = s(f, k);
  if (v === null) return null;
  const x = Number(v.replace(/[$,]/g, ""));
  return Number.isFinite(x) ? x : null;
};

export type SaveState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

async function upsertCustomer(sb: Awaited<ReturnType<typeof supabaseServer>>, id: string | null, data: Record<string, unknown>) {
  if (id) return id;
  if (!data.company) return null;
  const { data: existing } = await sb.from("customers").select("id").ilike("company", String(data.company)).maybeSingle();
  if (existing) return existing.id as string;
  const { data: created, error } = await sb.from("customers").insert(data).select("id").single();
  if (error) throw new Error(error.message);
  return created.id as string;
}

export async function saveLoad(_prev: SaveState, form: FormData): Promise<SaveState> {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const loadId = s(form, "id");

  const fieldErrors: Record<string, string> = {};
  if (!s(form, "company") && !s(form, "customer_id")) fieldErrors.company = "Enter the company that posted the load.";
  if (!s(form, "pickup")) fieldErrors.pickup = "Enter the pickup location.";
  if (!s(form, "dropoff")) fieldErrors.dropoff = "Enter the drop-off location.";
  if (!s(form, "load_date")) fieldErrors.load_date = "Choose the load date.";
  const email = s(form, "contact_email");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.contact_email = "That email doesn't look right.";
  const invEmail = s(form, "invoice_email");
  if (invEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invEmail)) fieldErrors.invoice_email = "That email doesn't look right.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  try {
    const customerId = await upsertCustomer(sb, s(form, "customer_id"), {
      company: s(form, "company"),
      contact_name: s(form, "contact_name"),
      phone: s(form, "contact_phone"),
      email,
      type: s(form, "customer_type") ?? "not_set",
    });

    let invoiceCustomerId: string | null = customerId;
    if (form.get("same_as_customer") !== "on") {
      invoiceCustomerId = await upsertCustomer(sb, s(form, "invoice_customer_id"), {
        company: s(form, "invoice_company"),
        billing_email: invEmail,
        billing_contact: s(form, "billing_contact"),
        billing_phone: s(form, "billing_phone"),
        type: s(form, "invoice_type") ?? "not_set",
      });
    }

    const terms = s(form, "payment_terms");
    const record = {
      booked_by: s(form, "booked_by"),
      customer_id: customerId,
      invoice_customer_id: invoiceCustomerId,
      invoice_email: invEmail ?? email,
      invoice_type: s(form, "invoice_type") ?? "not_set",
      billing_contact: s(form, "billing_contact"),
      billing_phone: s(form, "billing_phone"),
      quick_pay: s(form, "quick_pay") ?? "not_set",
      qp_fee_pct: nOrNull(form, "qp_fee_pct"),
      paid_by: s(form, "paid_by"),
      payment_terms: terms === "custom" ? s(form, "payment_terms_custom") ?? "custom" : terms,
      truck_driver_name: s(form, "truck_driver_name"),
      truck_driver_phone: s(form, "truck_driver_phone"),
      trucking_company: s(form, "trucking_company"),
      truck_number: s(form, "truck_number"),
      pickup: s(form, "pickup"),
      dropoff: s(form, "dropoff"),
      load_date: s(form, "load_date"),
      est_miles: nOrNull(form, "est_miles"),
      empty_at: s(form, "empty_at"),
      order_no: s(form, "order_no"),
      height: s(form, "height"), width: s(form, "width"), length: s(form, "length"), weight: s(form, "weight"),
      rate_per_mile: nOrNull(form, "rate_per_mile"),
      rate_day: nOrNull(form, "rate_day"),
      rate_overnight: nOrNull(form, "rate_overnight"),
      rate_no_go: nOrNull(form, "rate_no_go"),
      rate_mini: nOrNull(form, "rate_mini"),
      rate_flat: nOrNull(form, "rate_flat"),
      remarks: s(form, "remarks"),
      raw_notes: s(form, "raw_notes"),
      status: s(form, "status") ?? "booked",
    };

    let id = loadId;
    if (id) {
      const { error } = await sb.from("loads").update(record).eq("id", id);
      if (error) return { error: error.message };
    } else {
      const { data, error } = await sb.from("loads").insert({ ...record, created_by: me.id }).select("id").single();
      if (error) return { error: error.message };
      id = data.id;
    }

    // positions
    const positions = form.getAll("positions").map(String);
    await sb.from("load_positions").delete().eq("load_id", id!);
    if (positions.length) await sb.from("load_positions").insert(positions.map((p) => ({ load_id: id, position: p })));

    // pilot assignment (one primary pilot from this form; more can be added on the load page)
    const pilot = s(form, "pilot");
    if (pilot) {
      const { data: exists } = await sb.from("load_assignments").select("id").eq("load_id", id!).eq("driver_id", pilot).maybeSingle();
      if (!exists) {
        const { error } = await sb.from("load_assignments").insert({ load_id: id, driver_id: pilot, position: positions[0] ?? null });
        if (!error) await alertDriverAssigned(pilot, id!).catch(() => {});
      }
    }
    revalidatePath("/portal/loads");
    revalidatePath("/portal");
    redirect(`/portal/loads/${id}?saved=1`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect
    return { error: e instanceof Error ? e.message : "Couldn't save the load." };
  }
}

export async function assignDriver(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const loadId = String(form.get("load_id"));
  const driverId = String(form.get("driver_id"));
  const position = (form.get("position") as string) || null;
  const { error } = await sb.from("load_assignments").insert({ load_id: loadId, driver_id: driverId, position });
  if (!error) await alertDriverAssigned(driverId, loadId).catch(() => {});
  revalidatePath(`/portal/loads/${loadId}`);
}

export async function unassignDriver(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  await sb.from("load_assignments").delete().eq("id", String(form.get("assignment_id")));
  revalidatePath(`/portal/loads/${form.get("load_id")}`);
}

export async function setLoadStatus(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("load_id"));
  const patch: Record<string, unknown> = { status: String(form.get("status")) };
  const onTime = form.get("on_time");
  if (onTime === "yes" || onTime === "no") patch.on_time = onTime === "yes";
  await sb.from("loads").update(patch).eq("id", id);
  revalidatePath(`/portal/loads/${id}`);
  revalidatePath("/portal/loads");
}

export async function deleteLoad(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  await sb.from("loads").update({ status: "cancelled" }).eq("id", String(form.get("load_id")));
  revalidatePath("/portal/loads");
  redirect("/portal/loads");
}
