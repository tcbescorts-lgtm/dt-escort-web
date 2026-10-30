import Link from "next/link";
import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/portal/ui";
import { POSITIONS, date, daysUntil } from "@/lib/format";
import { signOut } from "@/app/login/actions";
import MyDocUpload from "./MyDocUpload";

export const metadata = { title: "Profile" };

const CERT: Record<string, string> = { pevo: "PEVO", state_certification: "State certification", pilot_car_permit: "Pilot car permit", insurance: "Insurance", other: "Other" };

function Exp({ d }: { d: string | null }) {
  if (!d) return null;
  const n = daysUntil(d);
  return <> · expires {date(d)} {n <= 60 && <Badge status={n < 0 ? "failed" : n <= 7 ? "overdue" : "partial"} label={n < 0 ? "Expired" : `${n} days`} />}</>;
}

export default async function DriverProfile() {
  const me = await requireDriver();
  const sb = await supabaseServer();
  const [{ data: d }, { data: certs }, { data: docs }, { data: veh }] = await Promise.all([
    sb.from("drivers").select("full_name, phone, email, home_address, positions, license_state, license_class, license_expires, split_pct").eq("id", me.driverId).single(),
    sb.from("certifications").select("*").eq("driver_id", me.driverId).order("expires_on"),
    sb.from("driver_documents").select("*").eq("driver_id", me.driverId).order("created_at", { ascending: false }),
    sb.from("vehicles").select("*").eq("driver_id", me.driverId).limit(1).maybeSingle(),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="display-2">{d?.full_name}</h1>
      <section aria-labelledby="info" className="rounded-md border border-rule p-4">
        <h2 id="info" className="text-lg font-semibold">Your info</h2>
        <p>{d?.phone}<br />{d?.email}{d?.home_address && <><br />{d.home_address}</>}</p>
        <p className="mt-2 text-muted">Positions: {(d?.positions ?? []).map((p: string) => POSITIONS[p]).join(", ") || "not set"} · Split {d?.split_pct}%</p>
        <p className="mt-2 text-sm text-muted">Something wrong? Tell dispatch and they&apos;ll update it.</p>
      </section>
      <section aria-labelledby="exp" className="rounded-md border border-rule p-4">
        <h2 id="exp" className="text-lg font-semibold">Licenses, certifications and expirations</h2>
        <ul className="mt-2 space-y-1">
          <li>Driver license {d?.license_state} {d?.license_class}<Exp d={d?.license_expires ?? null} /></li>
          {(certs ?? []).map((c) => <li key={c.id}>{CERT[c.kind]} {c.state}{c.number ? ` #${c.number}` : ""}<Exp d={c.expires_on} /></li>)}
          {veh && <li>Vehicle registration {veh.plate_state} {veh.plate}<Exp d={veh.registration_expires} /></li>}
        </ul>
      </section>
      <section aria-labelledby="docs" className="rounded-md border border-rule p-4">
        <h2 id="docs" className="text-lg font-semibold">Documents</h2>
        <ul className="mt-2 space-y-1">
          {(docs ?? []).map((doc) => <li key={doc.id}><a className="link" href={`/portal/files?bucket=driver-docs&path=${encodeURIComponent(doc.file_path)}`} target="_blank" rel="noopener noreferrer">{doc.file_name}</a> <span className="text-sm text-muted">{doc.doc_type.replace(/_/g, " ")}</span></li>)}
        </ul>
        <div className="mt-4"><MyDocUpload driverId={me.driverId} /></div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link href="/account/password" className="btn btn-line">Change password</Link>
        <form action={signOut}><button className="btn btn-line">Sign out</button></form>
      </div>
    </div>
  );
}
