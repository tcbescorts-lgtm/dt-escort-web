import "server-only";
import { supabaseServer } from "./supabase/server";

export const DEFAULT_EXTRAS = {
  photos: true, signatures: true, odometer: true, times: true, wait_time: true, tolls: true, lodging: true, incident: true,
  route_deviation: true, permits: true, police_escort: true, equipment_check: true, gps: false, per_diem: false, customer_rating: true,
};

/** Everything the run sheet form needs, read as the current user (RLS applies). */
export async function runSheetBundle(loadId: string, driverId: string) {
  const sb = await supabaseServer();
  const [{ data: load }, { data: sheet }, { data: ex }, { data: driver }] = await Promise.all([
    sb.from("loads").select("*, load_positions(position)").eq("id", loadId).single(),
    sb.from("run_sheets").select("*, run_sheet_legs(*), run_sheet_files(file_path, file_name, kind), run_sheet_events(event, comment, created_at)").eq("load_id", loadId).eq("driver_id", driverId).maybeSingle(),
    sb.from("settings").select("value").eq("key", "run_sheet_extras").maybeSingle(),
    sb.from("drivers").select("id, full_name").eq("id", driverId).single(),
  ]);
  if (!load || !driver) return null;
  const l = { ...load, positions: (load.load_positions ?? []).map((p: any) => p.position) };
  return {
    load: l,
    sheet: sheet ?? null,
    driver,
    extras: { ...DEFAULT_EXTRAS, ...((ex?.value as object) ?? {}) } as Record<string, boolean>,
    files: (sheet?.run_sheet_files ?? []) as any[],
  };
}
