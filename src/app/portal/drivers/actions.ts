"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { tempPassword } from "@/lib/password";

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const num = (f: FormData, k: string) => {
  const v = s(f, k);
  const x = v === null ? NaN : Number(v);
  return Number.isFinite(x) ? x : null;
};

export type CreateState = { error?: string; created?: { id: string; email: string; password: string; name: string } } | undefined;

export async function createDriver(_p: CreateState, form: FormData): Promise<CreateState> {
  const me = await requireStaff();
  const name = s(form, "full_name");
  const email = s(form, "email")?.toLowerCase() ?? null;
  if (!name) return { error: "Enter the driver's full name." };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email; the driver signs in with it." };
  const custom = s(form, "temp_password");
  if (custom && custom.length < 10) return { error: "A custom temporary password needs at least 10 characters." };
  const password = custom ?? tempPassword();

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "driver", full_name: name, phone: s(form, "phone"), must_change_password: true },
  });
  if (error || !data.user) return { error: error?.message.includes("already") ? "An account with that email already exists." : error?.message ?? "Couldn't create the account." };

  const { data: d, error: dErr } = await admin
    .from("drivers")
    .insert({
      profile_id: data.user.id,
      full_name: name,
      email,
      phone: s(form, "phone"),
      employment_type: s(form, "employment_type") ?? "contractor",
      start_date: s(form, "start_date"),
      split_pct: num(form, "split_pct") ?? 40,
      positions: form.getAll("positions").map(String),
    })
    .select("id")
    .single();
  if (dErr) return { error: dErr.message };
  await admin.from("audit_log").insert({ actor: me.id, action: "create_driver_account", table_name: "drivers", record_id: d.id });
  revalidatePath("/portal/drivers");
  return { created: { id: d.id, email, password, name } };
}

export async function resetDriverPassword(_p: { password?: string; error?: string } | undefined, form: FormData) {
  const me = await requireStaff();
  const driverId = String(form.get("driver_id"));
  const sb = await supabaseServer();
  const { data: d } = await sb.from("drivers").select("profile_id").eq("id", driverId).single();
  if (!d?.profile_id) return { error: "This driver has no login." };
  const password = tempPassword();
  const admin = supabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(d.profile_id, { password });
  if (error) return { error: error.message };
  await admin.from("profiles").update({ must_change_password: true }).eq("id", d.profile_id);
  await admin.from("audit_log").insert({ actor: me.id, action: "reset_driver_password", table_name: "drivers", record_id: driverId });
  return { password };
}

export async function saveDriver(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  const equipment: Record<string, boolean> = {};
  for (const k of form.getAll("equipment")) equipment[String(k)] = true;
  const last4 = s(form, "payment_handle_last4");
  await sb.from("drivers").update({
    full_name: s(form, "full_name"),
    phone: s(form, "phone"),
    email: s(form, "email"),
    home_address: s(form, "home_address"),
    emergency_contact_name: s(form, "emergency_contact_name"),
    emergency_contact_phone: s(form, "emergency_contact_phone"),
    employment_type: s(form, "employment_type") ?? "contractor",
    start_date: s(form, "start_date"),
    active: form.get("active") === "on",
    positions: form.getAll("positions").map(String),
    split_pct: num(form, "split_pct") ?? 40,
    license_state: s(form, "license_state"),
    license_class: s(form, "license_class"),
    license_expires: s(form, "license_expires"),
    equipment,
    payment_method: s(form, "payment_method"),
    payment_handle_last4: last4 ? last4.replace(/\D/g, "").slice(-4) || null : null,
    notes: s(form, "notes"),
  }).eq("id", id);
  await sb.from("driver_internal").upsert({ driver_id: id, performance_notes: s(form, "performance_notes"), updated_at: new Date().toISOString() });
  const { data: d } = await sb.from("drivers").select("profile_id, active").eq("id", id).single();
  if (d?.profile_id) await supabaseAdmin().from("profiles").update({ active: d.active, full_name: s(form, "full_name") ?? "" }).eq("id", d.profile_id);
  revalidatePath(`/portal/drivers/${id}`);
  redirect(`/portal/drivers/${id}?saved=1`);
}

export async function saveSensitive(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  await sb.rpc("set_driver_private", { p_driver: id, p_dob: s(form, "dob"), p_license: s(form, "license_number") ?? "", p_vin: s(form, "vin") ?? "" });
  redirect(`/portal/drivers/${id}?saved=1#sensitive`);
}

export async function saveVehicle(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const driverId = String(form.get("driver_id"));
  const rec = {
    driver_id: driverId,
    year: num(form, "year"), make: s(form, "make"), model: s(form, "model"), color: s(form, "color"),
    plate: s(form, "plate"), plate_state: s(form, "plate_state"),
    registration_expires: s(form, "registration_expires"), inspection_date: s(form, "inspection_date"),
  };
  const vid = s(form, "vehicle_id");
  if (vid) await sb.from("vehicles").update(rec).eq("id", vid);
  else await sb.from("vehicles").insert(rec);
  redirect(`/portal/drivers/${driverId}?saved=1#vehicle`);
}

export async function addCertification(_p: { error?: string } | undefined, form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const driverId = String(form.get("driver_id"));
  const file_path = s(form, "file_path");
  if (file_path && !file_path.startsWith(`${driverId}/`)) return { error: "Upload path mismatch." };
  const { error } = await sb.from("certifications").insert({
    driver_id: driverId, kind: s(form, "kind") ?? "other", state: s(form, "state"), issuer: s(form, "issuer"),
    number: s(form, "number"), issued_on: s(form, "issued_on"), expires_on: s(form, "expires_on"), file_path,
  });
  if (error) return { error: error.message };
  revalidatePath(`/portal/drivers/${driverId}`);
  return { error: undefined };
}

export async function deleteCertification(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  await sb.from("certifications").delete().eq("id", String(form.get("id")));
  revalidatePath(`/portal/drivers/${form.get("driver_id")}`);
}

export async function uploadDocument(_p: { error?: string; ok?: boolean } | undefined, form: FormData) {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const driverId = String(form.get("driver_id"));
  const path = s(form, "file_path");
  if (!path || !path.startsWith(`${driverId}/`)) return { error: "Upload the file first." };
  await sb.from("driver_documents").insert({
    driver_id: driverId, doc_type: s(form, "doc_type") ?? "other", file_path: path, file_name: s(form, "file_name") ?? "file",
    expires_on: s(form, "expires_on"), uploaded_by: me.id,
  });
  revalidatePath(`/portal/drivers/${driverId}`);
  return { ok: true };
}

export async function deleteDocument(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  const { data } = await sb.from("driver_documents").select("file_path").eq("id", id).single();
  if (data) await sb.storage.from("driver-docs").remove([data.file_path]);
  await sb.from("driver_documents").delete().eq("id", id);
  revalidatePath(`/portal/drivers/${form.get("driver_id")}`);
}
