"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner, requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { tempPassword } from "@/lib/password";

async function put(key: string, value: unknown) {
  const sb = await supabaseServer();
  const { error } = await sb.from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function saveSettings(form: FormData) {
  await requireStaff();
  const section = String(form.get("section"));
  const num = (k: string) => {
    const v = String(form.get(k) ?? "").trim();
    return v === "" ? null : Number(v);
  };
  if (section === "booked_by") {
    const list = String(form.get("booked_by") ?? "").split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
    await put("booked_by", list.length ? list : ["Jim", "Boss"]);
  } else if (section === "rates") {
    await put("default_rates", { per_mile: num("per_mile"), day_rate: num("day_rate"), overnight: num("overnight"), no_go: num("no_go"), mini_run: num("mini_run"), flat_rate: num("flat_rate") });
  } else if (section === "billing") {
    await put("payment_instructions", { text: String(form.get("payment_text") ?? "").trim() });
    await put("invoice_terms_days", Number(form.get("terms_days") ?? 14) || 14);
  } else if (section === "email") {
    await put("email_templates", { invoice_subject: String(form.get("invoice_subject") ?? ""), invoice_body: String(form.get("invoice_body") ?? "") });
  } else if (section === "extras") {
    const keys = ["photos", "signatures", "odometer", "times", "wait_time", "tolls", "lodging", "per_diem", "incident", "route_deviation", "permits", "police_escort", "equipment_check", "gps", "customer_rating"];
    await put("run_sheet_extras", Object.fromEntries(keys.map((k) => [k, form.get(k) === "on"])));
  }
  revalidatePath("/portal/settings");
  redirect("/portal/settings?saved=1");
}

export async function createStaff(_p: { error?: string; created?: { email: string; password: string } } | undefined, form: FormData) {
  const me = await requireOwner();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("full_name") ?? "").trim();
  const role = form.get("role") === "owner" ? "owner" : "admin";
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a name and a valid email." };
  const password = tempPassword();
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role, full_name: name, must_change_password: true } });
  if (error || !data.user) return { error: error?.message ?? "Couldn't create the account." };
  await admin.from("audit_log").insert({ actor: me.id, action: `create_${role}_account`, table_name: "profiles", record_id: data.user.id });
  revalidatePath("/portal/settings/users");
  return { created: { email, password } };
}

export async function updateUser(form: FormData) {
  const me = await requireOwner();
  const id = String(form.get("id"));
  if (id === me.id) redirect("/portal/settings/users?err=self");
  const admin = supabaseAdmin();
  const role = String(form.get("role"));
  const active = form.get("active") === "on";
  await admin.from("profiles").update({ role, active }).eq("id", id);
  await admin.auth.admin.updateUserById(id, { user_metadata: { role }, ban_duration: active ? "none" : "876000h" });
  await admin.from("audit_log").insert({ actor: me.id, action: "update_user", table_name: "profiles", record_id: id, detail: { role, active } });
  revalidatePath("/portal/settings/users");
}

export async function updateDeletion(form: FormData) {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  const patch: Record<string, unknown> = { status, notes: String(form.get("notes") ?? "") || null, handled_by: me.id };
  if (status === "verifying") patch.verified_at = null;
  if (form.get("verified") === "on") patch.verified_at = new Date().toISOString();
  if (status === "completed") patch.completed_at = new Date().toISOString();
  await sb.from("deletion_requests").update(patch).eq("id", id);
  revalidatePath("/portal/settings/deletion");
}

export async function addSuppression(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (email) await sb.from("suppression_list").upsert({ email, reason: String(form.get("reason") ?? "requested") });
  revalidatePath("/portal/settings/deletion");
}
