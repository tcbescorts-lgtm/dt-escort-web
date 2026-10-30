import Link from "next/link";
import RouteMap from "@/components/portal/RouteMap";
import { notFound } from "next/navigation";
import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/portal/ui";
import { LOAD_STATUS, POSITIONS, date, dateTime, money } from "@/lib/format";
import { PhoneIcon } from "@/components/Icons";
import { acknowledgeLoad } from "../../actions";

export const metadata = { title: "Load" };

export default async function DriverLoad({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireDriver();
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: l } = await sb.from("loads").select("*, customer:customers!loads_customer_id_fkey(company, contact_name, phone), load_positions(position)").eq("id", id).single();
  if (!l) notFound();
  const { data: a } = await sb.from("load_assignments").select("position, acknowledged_at").eq("load_id", id).eq("driver_id", me.driverId).single();
  const { data: rs } = await sb.from("run_sheets").select("status").eq("load_id", id).eq("driver_id", me.driverId).maybeSingle();
  const origin = l.empty_at || l.pickup || "";
  const dir = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(l.dropoff ?? "")}${l.empty_at && l.pickup ? `&waypoints=${encodeURIComponent(l.pickup)}` : ""}&travelmode=driving`;
  const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;
  const c = (l as any).customer;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted">{l.load_no} · {date(l.load_date)}</p>
        <h1 className="display-2">{l.pickup} → {l.dropoff}</h1>
        <p className="mt-1"><Badge status={l.status} label={LOAD_STATUS[l.status]} /> {a?.position && <span className="ml-1">Your position: <strong>{POSITIONS[a.position]}</strong></span>}</p>
      </div>

      {a && !a.acknowledged_at ? (
        <form action={acknowledgeLoad} className="rounded-md border-2 border-gold-fill p-4">
          <input type="hidden" name="load_id" value={l.id} />
          <p className="font-semibold">Please confirm you&apos;ve seen this load.</p>
          <button className="btn btn-gold mt-2 w-full">I&apos;ve got it</button>
        </form>
      ) : a ? <p className="text-success font-medium">You acknowledged this load {dateTime(a.acknowledged_at)}.</p> : null}

      <section aria-labelledby="contacts" className="rounded-md border border-rule p-4">
        <h2 id="contacts" className="text-lg font-semibold">Contacts</h2>
        <ul className="mt-2 space-y-3">
          {l.truck_driver_phone && (
            <li><p className="text-sm text-muted">Truck driver</p>
              <a href={tel(l.truck_driver_phone)} className="btn btn-gold mt-1 w-full justify-start"><PhoneIcon /> {l.truck_driver_name || "Truck driver"} · {l.truck_driver_phone}</a>
              <p className="mt-1 text-sm text-muted">{[l.trucking_company, l.truck_number && `Truck #${l.truck_number}`].filter(Boolean).join(" · ")}</p></li>
          )}
          {c?.phone && (
            <li><p className="text-sm text-muted">Customer</p>
              <a href={tel(c.phone)} className="btn btn-line mt-1 w-full justify-start"><PhoneIcon /> {c.contact_name || c.company} · {c.phone}</a>
              <p className="mt-1 text-sm text-muted">{c.company}</p></li>
          )}
          <li><a href="tel:+16017063404" className="btn btn-line w-full justify-start"><PhoneIcon /> Dispatch · (601) 706-3404</a></li>
        </ul>
      </section>

      <section aria-labelledby="route" className="rounded-md border border-rule p-4">
        <h2 id="route" className="text-lg font-semibold">Route</h2>
        {l.empty_at && <p className="mt-1">Start from: {l.empty_at}</p>}
        <p>Pick up: {l.pickup}</p>
        <p>Drop off: {l.dropoff}</p>
        {l.est_miles && <p className="text-muted">About {l.est_miles} loaded miles</p>}
        {origin && l.dropoff && <div className="mt-3"><RouteMap from={origin} to={l.dropoff} height={300} /></div>}
        <a href={dir} target="_blank" rel="noopener noreferrer" className="btn btn-line mt-3 w-full">Open in Google Maps<span className="sr-only"> (opens the Maps app)</span></a>
        <p className="mt-2 text-sm text-muted">Always follow the permitted route, not the map&apos;s suggestion.</p>
      </section>

      <section aria-labelledby="details" className="rounded-md border border-rule p-4">
        <h2 id="details" className="text-lg font-semibold">Details</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3">
          {[["Height", l.height], ["Width", l.width], ["Length", l.length], ["Weight", l.weight],
            ["Positions", (l.load_positions ?? []).map((p: any) => POSITIONS[p.position]).join(", ")], ["Order #", l.order_no],
            ["Rate per mile", l.rate_per_mile && money(l.rate_per_mile)], ["Day rate", l.rate_day && money(l.rate_day)],
            ["Overnight", l.rate_overnight && money(l.rate_overnight)], ["No-go", l.rate_no_go && money(l.rate_no_go)]]
            .filter(([, v]) => v).map(([k, v]) => <div key={k as string}><dt className="text-sm text-muted">{k}</dt><dd>{v}</dd></div>)}
        </dl>
        {l.remarks && <p className="mt-3"><span className="text-sm text-muted">Remarks</span><br />{l.remarks}</p>}
      </section>

      <Link href={`/driver/run-sheet/${l.id}`} className="btn btn-gold w-full">{rs ? (rs.status === "draft" ? "Continue run sheet" : "View run sheet") : "Start run sheet"}</Link>
    </div>
  );
}
