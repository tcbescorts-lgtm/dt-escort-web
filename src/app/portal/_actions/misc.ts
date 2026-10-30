"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function addTodo(form: FormData) {
  const me = await requireStaff();
  const title = String(form.get("title") ?? "").trim();
  if (!title) return;
  const sb = await supabaseServer();
  await sb.from("todos").insert({
    title: title.slice(0, 300),
    assigned_to: (form.get("assigned_to") as string) || null,
    due_on: (form.get("due_on") as string) || null,
    created_by: me.id,
  });
  revalidatePath("/portal");
}

export async function toggleTodo(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const done = form.get("done") === "1";
  const sb = await supabaseServer();
  await sb.from("todos").update({ done_at: done ? new Date().toISOString() : null }).eq("id", id);
  revalidatePath("/portal");
}

export async function deleteTodo(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  await sb.from("todos").delete().eq("id", String(form.get("id")));
  revalidatePath("/portal");
}

export async function setDriverStatus(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  await sb.rpc("set_driver_status", {
    p_driver: String(form.get("driver_id")),
    p_status: String(form.get("status")),
    p_note: String(form.get("note") ?? ""),
  });
  revalidatePath("/portal");
  revalidatePath("/portal/drivers");
}

export async function markAllRead() {
  await requireStaff();
  const sb = await supabaseServer();
  await sb.rpc("mark_notifications_read", { p_ids: null });
  revalidatePath("/portal", "layout");
}
