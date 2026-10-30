"use server";

import { revalidatePath } from "next/cache";
import { getMe } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { computeRunSheet, type Leg } from "@/lib/runsheet";

export type RSState = { ok?: string; error?: string; missing?: string[]; id?: string } | undefined;

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const n = (f: FormData, k: string) => {
  const v = s(f, k);
  const x = v === null ? NaN : Number(v.replace(/[$,]/g, ""));
  return Number.isFinite(x) ? x : null;
};

const REQUIRED: [string, string][] = [
  ["invoice_date", "Invoice date"], ["trucking_company", "Trucking company"], ["truck_driver_name", "Truck driver's name"],
  ["truck_driver_phone", "Truck driver's contact number"], ["start_location", "Starting location"], ["end_location", "Ending location"],
];

export async function saveRunSheet(_p: RSState, form: FormData): Promise<RSState> {
  const me = await getMe();
  if (!me) return { error: "You're signed out. Sign in again; your draft is kept on this device." };
  const staff = me.role !== "driver";
  const intent = String(form.get("intent") ?? "save"); // save | submit | approve
  const sb = await supabaseServer();
  const loadId = String(form.get("load_id"));
  const driverId = staff ? String(form.get("driver_id")) : me.driverId;
  if (!driverId) return { error: "No driver profile found for this account." };

  let legs: (Leg & { leg_date?: string; start_location?: string; end_location?: string })[] = [];
  try {
    legs = JSON.parse(String(form.get("legs_json") ?? "[]"));
  } catch {
    return { error: "The mileage log couldn't be read. Try again." };
  }
  const positions = form.getAll("positions").map(String);
  const rates = { per_mile: n(form, "rate_per_mile"), day: n(form, "rate_day"), mini: n(form, "rate_mini"), overnight: n(form, "rate_overnight"), no_go: n(form, "rate_no_go") };
  const gas = n(form, "gas_amount") ?? 0;
  const includeGas = form.get("include_gas") === "on";
  const calc = computeRunSheet(legs, rates, gas, includeGas);

  if (intent !== "save") {
    const missing = REQUIRED.filter(([k]) => !s(form, k)).map(([, l]) => l);
    if (!positions.length) missing.push("Position");
    if (!legs.length) missing.push("At least one mileage log leg");
    legs.forEach((l, i) => {
      if (!l.start_location?.trim() || !l.end_location?.trim()) missing.push(`Leg ${i + 1}: starting and ending location`);
    });
    if (missing.length) return { error: "Some required fields are empty.", missing };
  }

  const gps = (k: string) => {
    const v = s(form, k);
    try { return v ? JSON.parse(v) : null; } catch { return null; }
  };

  const rec: Record<string, unknown> = {
    load_id: loadId,
    driver_id: driverId,
    invoice_date: s(form, "invoice_date"),
    load_number: s(form, "load_number"),
    trucking_company: s(form, "trucking_company"),
    truck_number: s(form, "truck_number"),
    trailer_number: s(form, "trailer_number"),
    truck_driver_name: s(form, "truck_driver_name"),
    truck_driver_phone: s(form, "truck_driver_phone"),
    invoice_email: s(form, "invoice_email"),
    start_location: s(form, "start_location"),
    end_location: s(form, "end_location"),
    load_description: s(form, "load_description"),
    height: s(form, "height"), width: s(form, "width"), length: s(form, "length"), weight: s(form, "weight"),
    positions,
    rate_per_mile: rates.per_mile, rate_day: rates.day, rate_mini: rates.mini, rate_overnight: rates.overnight, rate_no_go: rates.no_go,
    gas_amount: gas,
    include_gas: includeGas,
    total_miles: calc.miles,
    amount_mileage: calc.lines.mileage.amount,
    amount_day: calc.lines.day.amount,
    amount_mini: calc.lines.mini.amount,
    amount_overnight: calc.lines.overnight.amount,
    amount_no_go: calc.lines.no_go.amount,
    total_due: calc.total,
    notes: s(form, "notes"),
    odometer_start: n(form, "odometer_start"), odometer_end: n(form, "odometer_end"),
    time_start: s(form, "time_start") ? new Date(s(form, "time_start")!).toISOString() : null,
    time_end: s(form, "time_end") ? new Date(s(form, "time_end")!).toISOString() : null,
    wait_minutes: n(form, "wait_minutes"),
    tolls: n(form, "tolls"), lodging: n(form, "lodging"), per_diem: n(form, "per_diem"),
    incident_report: s(form, "incident_report"),
    route_deviation: s(form, "route_deviation"),
    permits: s(form, "permits"),
    police_escort: form.get("police_escort") === "yes" ? true : form.get("police_escort") === "no" ? false : null,
    equipment_checked: form.get("equipment_checked") === "on",
    gps_start: gps("gps_start"), gps_end: gps("gps_end"),
    driver_signature: s(form, "driver_signature"),
    customer_signature: s(form, "customer_signature"),
  };
  if (staff) {
    rec.customer_rating = n(form, "customer_rating");
    rec.admin_comment = s(form, "admin_comment");
    rec.dispute = form.get("dispute") === "on";
  }
  if (intent === "submit") {
    rec.status = "submitted";
    rec.submitted_at = new Date().toISOString();
  }
  if (intent === "approve" && staff) {
    const { data: d } = await sb.from("drivers").select("split_pct").eq("id", driverId).single();
    rec.status = "approved";
    rec.approved_at = new Date().toISOString();
    rec.approved_by = me.id;
    rec.driver_split_pct = d?.split_pct ?? 40;
  }

  const existingId = s(form, "id");
  let id = existingId;
  if (id) {
    // For drivers, the row must still be a draft (enforced by RLS too).
    const { data, error } = await sb.from("run_sheets").update(rec).eq("id", id).select("id");
    if (error) return { error: error.message };
    if (!data?.length) return { error: "This run sheet was already submitted, so it can't be changed here. Ask dispatch to correct it." };
  } else {
    const { data, error } = await sb.from("run_sheets").insert(rec).select("id").single();
    if (error) return { error: error.message.includes("duplicate") ? "A run sheet for this load already exists. Reload the page." : error.message };
    id = data.id;
  }

  // Replace legs
  await sb.from("run_sheet_legs").delete().eq("run_sheet_id", id!);
  if (legs.length) {
    const { error } = await sb.from("run_sheet_legs").insert(
      legs.map((l, i) => ({
        run_sheet_id: id, seq: i, charged_as: l.charged_as, overnight: Boolean(l.overnight), leg_date: l.leg_date || null,
        miles: Number(l.miles) || 0, start_location: l.start_location || null, end_location: l.end_location || null,
      })),
    );
    if (error) return { error: error.message };
  }

  // Attach uploaded files
  try {
    const files: { path: string; name: string; kind: string }[] = JSON.parse(String(form.get("files_json") ?? "[]"));
    const fresh = files.filter((f) => f.path && f.path.startsWith(`${driverId}/`));
    if (fresh.length) {
      const { data: known } = await sb.from("run_sheet_files").select("file_path").eq("run_sheet_id", id!);
      const have = new Set((known ?? []).map((k) => k.file_path));
      const add = fresh.filter((f) => !have.has(f.path));
      if (add.length) await sb.from("run_sheet_files").insert(add.map((f) => ({ run_sheet_id: id, kind: f.kind, file_path: f.path, file_name: f.name })));
    }
  } catch {
    /* ignore malformed list */
  }

  const event = intent === "submit" ? "submitted" : intent === "approve" ? "approved" : "saved";
  await sb.from("run_sheet_events").insert({ run_sheet_id: id, actor: me.id, event, comment: staff ? s(form, "admin_comment") : null });

  revalidatePath("/driver", "layout");
  revalidatePath("/portal/run-sheets");
  return {
    id: id!,
    ok: intent === "submit" ? "Run sheet submitted. Dispatch has been notified." : intent === "approve" ? "Run sheet approved." : "Saved. Not sent yet.",
  };
}

export async function reopenRunSheet(form: FormData) {
  const me = await getMe();
  if (!me || me.role === "driver") return;
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  await sb.from("run_sheets").update({ status: "draft", approved_at: null, approved_by: null }).eq("id", id).is("settlement_id", null);
  await sb.from("run_sheet_events").insert({ run_sheet_id: id, actor: me.id, event: "reopened", comment: String(form.get("comment") ?? "") || null });
  revalidatePath(`/portal/run-sheets/${id}`);
}
