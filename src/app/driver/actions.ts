"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function setMyStatus(form: FormData) {
  await requireDriver();
  const status = String(form.get("status"));
  if (!["needs_load", "on_load", "vacation", "other"].includes(status)) return;
  const sb = await supabaseServer();
  await sb.rpc("set_my_status", { p_status: status, p_note: String(form.get("note") ?? "").slice(0, 200) });
  revalidatePath("/driver", "layout");
  redirect(String(form.get("next") ?? "/driver"));
}

export async function acknowledgeLoad(form: FormData) {
  await requireDriver();
  const sb = await supabaseServer();
  const id = String(form.get("load_id"));
  await sb.rpc("acknowledge_load", { p_load: id });
  revalidatePath(`/driver/loads/${id}`);
}

export async function markMyNotificationsRead() {
  await requireDriver();
  const sb = await supabaseServer();
  await sb.rpc("mark_notifications_read", { p_ids: null });
  revalidatePath("/driver", "layout");
}

export async function addMyDocument(_p: { ok?: boolean; error?: string } | undefined, form: FormData) {
  const me = await requireDriver();
  const path = String(form.get("file_path") ?? "");
  if (!path.startsWith(`${me.driverId}/`)) return { error: "Upload the file first." };
  const sb = await supabaseServer();
  const { error } = await sb.from("driver_documents").insert({
    driver_id: me.driverId, doc_type: String(form.get("doc_type") ?? "other"), file_path: path,
    file_name: String(form.get("file_name") ?? "file"), expires_on: (form.get("expires_on") as string) || null, uploaded_by: me.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/driver/profile");
  return { ok: true };
}
