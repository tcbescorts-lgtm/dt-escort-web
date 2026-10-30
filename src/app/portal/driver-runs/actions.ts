"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function createSettlement(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const driverId = String(form.get("driver_id"));
  const ids = form.getAll("run_sheet_id").map(String);
  if (!ids.length) redirect(`/portal/driver-runs?driver=${driverId}&err=none`);
  const { data, error } = await sb
    .from("driver_settlements")
    .insert({
      driver_id: driverId,
      period_start: String(form.get("from")),
      period_end: String(form.get("to")),
      cash_advances: Number(form.get("cash_advances") || 0),
      notes: String(form.get("notes") ?? "") || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await sb.from("run_sheets").update({ settlement_id: data.id }).in("id", ids).is("settlement_id", null);
  revalidatePath("/portal/driver-runs");
  redirect(`/portal/driver-runs/${data.id}`);
}

export async function markSettlementPaid(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  await sb.from("driver_settlements").update({
    status: "paid",
    paid_on: String(form.get("paid_on") || new Date().toISOString().slice(0, 10)),
    method: String(form.get("method") ?? "") || null,
    reference: String(form.get("reference") ?? "") || null,
  }).eq("id", id);
  revalidatePath(`/portal/driver-runs/${id}`);
}

export async function updateAdvances(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  await sb.from("driver_settlements").update({ cash_advances: Number(form.get("cash_advances") || 0) }).eq("id", id).eq("status", "open");
  revalidatePath(`/portal/driver-runs/${id}`);
}

export async function deleteSettlement(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  await sb.from("run_sheets").update({ settlement_id: null }).eq("settlement_id", id);
  await sb.from("driver_settlements").delete().eq("id", id).eq("status", "open");
  redirect("/portal/driver-runs");
}
