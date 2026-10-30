import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHead } from "@/components/portal/ui";
import { bouncieConfigured, bouncieVehicles } from "@/lib/bouncie";
import { date } from "@/lib/format";
import MapTool from "./MapTool";

export const metadata = { title: "Map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  await requireStaff();
  const sb = await supabaseServer();
  const [{ data: loads }, fleet] = await Promise.all([
    sb.from("loads").select("id, load_no, load_date, pickup, dropoff, load_assignments(drivers(full_name))")
      .in("status", ["booked", "assigned", "in_progress"]).order("load_date").limit(30),
    bouncieVehicles(),
  ]);
  const pins = (loads ?? []).filter((l) => l.pickup && l.dropoff).map((l: any) => ({
    id: l.id, pickup: l.pickup, dropoff: l.dropoff,
    label: [l.load_no, date(l.load_date), (l.load_assignments ?? []).map((a: any) => a.drivers?.full_name).filter(Boolean).join(", ")].filter(Boolean).join(" · "),
  }));
  const vehicles = fleet.vehicles
    .filter((v) => v.stats?.location)
    .map((v) => ({
      id: v.imei, name: v.nickName || [v.model?.year, v.model?.make, v.model?.name].filter(Boolean).join(" ") || v.vin,
      lat: v.stats!.location!.lat, lon: v.stats!.location!.lon, address: v.stats!.location!.address ?? null,
      running: Boolean(v.stats?.isRunning), speed: v.stats?.speed ?? null, updated: v.stats?.lastUpdated ?? null,
    }));
  const note = !bouncieConfigured() ? "Not connected yet. Add the Bouncie keys in Vercel to see where each car is." : fleet.error ?? (vehicles.length ? undefined : "No vehicles reported a location.");
  return (
    <>
      <PageHead title="Map" sub="Search places or plan a route without leaving the portal. Click a load to see its route." />
      <MapTool loads={pins} vehicles={vehicles} vehicleNote={note} />
    </>
  );
}
