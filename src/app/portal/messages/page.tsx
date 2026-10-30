import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Empty, PageHead } from "@/components/portal/ui";
import { dateTime } from "@/lib/format";
import { markCommsRead } from "./actions";

export const metadata = { title: "Calls and texts" };

const ICON: Record<string, string> = { message: "💬", call: "📞", missed_call: "📵", voicemail: "🎙️" };
const LABEL: Record<string, string> = { message: "Text", call: "Call", missed_call: "Missed call", voicemail: "Voicemail" };
const fmt = (n: string | null) => {
  const d = (n ?? "").replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : n ?? "";
};

export default async function Messages({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const sb = await supabaseServer();
  let q = sb.from("comms").select("*, drivers(id, full_name), customers(id, company)").order("occurred_at", { ascending: false }).limit(200);
  if (sp.who === "drivers") q = q.not("driver_id", "is", null);
  if (sp.who === "customers") q = q.not("customer_id", "is", null);
  const { data } = await q;
  const unread = (data ?? []).filter((m) => !m.read_at).length;
  const configured = Boolean(process.env.QUO_WEBHOOK_SECRET);

  return (
    <>
      <PageHead title="Calls and texts" sub="From your Quo business number. Names show when the number matches a driver or customer."
        actions={unread ? <form action={markCommsRead}><button className="btn btn-line">Mark all read ({unread})</button></form> : undefined} />
      {!configured && (
        <p className="mb-4 rounded-md border border-gold-fill p-3 text-sm">
          Quo isn&apos;t connected yet. In Quo go to Settings, Integrations, Webhooks, add <span className="font-mono">https://dtescortservice.com/api/webhooks/quo</span> with message and call events, then put its signing secret in Vercel as <span className="font-mono">QUO_WEBHOOK_SECRET</span>.
        </p>
      )}
      <nav aria-label="Filter" className="mb-3 flex gap-1 border-b border-rule">
        {[["", "All"], ["drivers", "Drivers"], ["customers", "Customers"]].map(([k, l]) => (
          <Link key={k} href={k ? `?who=${k}` : "?"} aria-current={(sp.who ?? "") === k ? "page" : undefined}
            className={`-mb-px inline-flex min-h-10 items-center border-b-2 px-3 text-sm font-semibold ${(sp.who ?? "") === k ? "border-gold-fill" : "border-transparent text-muted"}`}>{l}</Link>
        ))}
      </nav>
      {(data ?? []).length === 0 ? <Empty>No calls or texts yet.</Empty> : (
        <ul className="divide-y divide-rule rounded-md border border-rule bg-surface">
          {(data ?? []).map((m: any) => {
            const other = m.direction === "outgoing" ? m.to_number : m.from_number;
            const who = m.drivers?.full_name ?? m.customers?.company;
            return (
              <li key={m.id} className={`grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-3 px-3 py-2.5 text-sm ${m.read_at ? "" : "bg-surface-2"}`}>
                <span aria-hidden="true">{ICON[m.kind]}</span>
                <div className="min-w-0">
                  <p className={m.read_at ? "" : "font-semibold"}>
                    {LABEL[m.kind]} {m.direction === "outgoing" ? "to" : "from"}{" "}
                    {m.drivers ? <Link className="link" href={`/portal/drivers/${m.drivers.id}`}>{who}</Link> : m.customers ? <Link className="link" href={`/portal/customers/${m.customers.id}`}>{who}</Link> : fmt(other)}
                    {who && <span className="font-normal text-muted"> · {fmt(other)}</span>}
                  </p>
                  {m.body && <p className="mt-0.5 whitespace-pre-wrap text-muted">{m.body}</p>}
                  {m.duration_seconds ? <p className="text-xs text-muted">{Math.floor(m.duration_seconds / 60)}m {m.duration_seconds % 60}s</p> : null}
                  {m.recording_url && <a className="link text-xs" href={m.recording_url} target="_blank" rel="noopener noreferrer">Play voicemail</a>}
                </div>
                <div className="text-right text-xs text-muted">
                  <p>{dateTime(m.occurred_at)}</p>
                  <a className="link" href={`tel:${other}`}>Call back</a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
