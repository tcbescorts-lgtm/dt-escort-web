import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { F, Flash, PageHead, Panel, TA } from "@/components/portal/ui";
import { DEFAULT_EXTRAS } from "@/lib/runsheet-data";
import { company, fullAddress } from "@/lib/site";
import { POSITIONS } from "@/lib/format";
import { saveSettings } from "./actions";
import { EMPTY_PAYMENT_INFO } from "@/lib/payment-info";
import { setupStatus } from "@/lib/setup";

export const metadata = { title: "Settings" };

const EXTRA_LABELS: Record<string, string> = {
  photos: "Photo and receipt uploads", signatures: "Driver and customer signatures", odometer: "Start/end odometer", times: "Start/end time",
  wait_time: "Wait / detention time", tolls: "Tolls and parking", lodging: "Lodging", per_diem: "Per diem", incident: "Incident or damage report",
  route_deviation: "Route deviation notes", permits: "Permit numbers and states", police_escort: "Police escort used", equipment_check: "Equipment check at start",
  gps: "GPS location stamps (driver must allow)", customer_rating: "Customer rating of service (internal, admin only)",
};

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const me = await requireStaff();
  const sp = await searchParams;
  const sb = await supabaseServer();
  const { data } = await sb.from("settings").select("key, value");
  const v = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, any>;
  const extras = { ...DEFAULT_EXTRAS, ...(v.run_sheet_extras ?? {}) };
  const rates = v.default_rates ?? {};
  const pi = { ...EMPTY_PAYMENT_INFO, ...(v.payment_info ?? {}) };
  const setup = setupStatus(v);

  return (
    <>
      <PageHead title="Settings" />
      <Flash msg={sp.saved ? "Settings saved." : null} />
      <nav aria-label="Settings sections" className="mb-5 flex flex-wrap gap-2">
        {me.role === "owner" && <Link href="/portal/settings/users" className="btn btn-line">Users and roles</Link>}
        {me.role === "owner" && <Link href="/portal/settings/audit" className="btn btn-line">Audit log</Link>}
        <Link href="/portal/settings/deletion" className="btn btn-line">Data deletion queue</Link>
      </nav>

      <Panel title="✅ Setup checklist" id="setup" className="mb-4">
        <ul className="grid gap-x-6 gap-y-1.5 text-sm md:grid-cols-2">
          {setup.map((x) => (
            <li key={x.name} className="flex gap-2">
              <span aria-hidden="true">{x.ok ? "✅" : "⬜"}</span>
              <span><span className="font-semibold">{x.name}</span><span className="sr-only">{x.ok ? " (done)" : " (not set up)"}</span>{!x.ok && <span className="block text-muted">{x.todo}</span>}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="💵 Payment details on invoices" id="pay" className="xl:col-span-2">
          <form action={saveSettings} className="grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-4">
            <input type="hidden" name="section" value="payment" />
            <F name="zelle" label="Zelle (email or phone)" defaultValue={pi.zelle} />
            <F name="cashapp" label="Cash App $cashtag" defaultValue={pi.cashapp} placeholder="$DTEscort" />
            <F name="check_payable" label="Checks payable to" defaultValue={pi.check_payable} />
            <F name="check_mail" label="Mail checks to" defaultValue={pi.check_mail} />
            <F name="ach_name" label="ACH account name" defaultValue={pi.ach_name} />
            <F name="ach_bank" label="Bank name" defaultValue={pi.ach_bank} />
            <F name="ach_routing" label="Routing number" defaultValue={pi.ach_routing} inputMode="numeric" />
            <F name="ach_account" label="Account number" defaultValue={pi.ach_account} inputMode="numeric" />
            <F name="online_fee_note" label="Online payment note" defaultValue={pi.online_fee_note} className="col-span-2" placeholder="A card fee applies when paid online." />
            <TA name="other" label="Other ways to pay (one per line)" defaultValue={pi.other} rows={2} className="col-span-2" />
            <p className="col-span-2 text-sm text-muted lg:col-span-4">Everything filled in here prints on every invoice PDF, the online invoice and the invoice email, the same way the sample invoice lists Zelle and ACH. Leave a box empty to hide it.</p>
            <div className="col-span-2 lg:col-span-4"><button className="btn btn-gold">Save payment details</button></div>
          </form>
        </Panel>

        <Panel title="Company profile" id="co">
          <p>{company.legalName}<br />{fullAddress}<br />{company.phoneDisplay} · {company.email}</p>
          <p className="mt-2 text-sm text-muted">Company details and the legal pages live in the website code (src/lib/site.ts) so the public site and invoices always match. Ask your developer to change them.</p>
        </Panel>

        <Panel title="Booked by list" id="bb">
          <form action={saveSettings} className="space-y-3">
            <input type="hidden" name="section" value="booked_by" />
            <TA name="booked_by" label="One name per line" defaultValue={(v.booked_by ?? ["Jim", "Boss"]).join("\n")} rows={4} />
            <button className="btn btn-gold">Save list</button>
          </form>
        </Panel>

        <Panel title="Default rates" id="dr">
          <form action={saveSettings} className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="section" value="rates" />
            <F name="per_mile" label="Per mile ($)" type="number" step="0.01" defaultValue={rates.per_mile} />
            <F name="day_rate" label="Day rate ($)" type="number" step="0.01" defaultValue={rates.day_rate} />
            <F name="overnight" label="Overnight ($)" type="number" step="0.01" defaultValue={rates.overnight} />
            <F name="no_go" label="No-go ($)" type="number" step="0.01" defaultValue={rates.no_go} />
            <F name="mini_run" label="Mini run ($)" type="number" step="0.01" defaultValue={rates.mini_run} />
            <F name="flat_rate" label="Flat rate ($)" type="number" step="0.01" defaultValue={rates.flat_rate} />
            <p className="text-sm text-muted sm:col-span-3">Used as a reference; customer rate cards and the rates on each load take priority.</p>
            <div className="sm:col-span-3"><button className="btn btn-gold">Save rates</button></div>
          </form>
        </Panel>

        <Panel title="Billing" id="bl">
          <form action={saveSettings} className="space-y-3">
            <input type="hidden" name="section" value="billing" />
            <TA name="payment_text" label="Fallback payment note" defaultValue={v.payment_instructions?.text} rows={2}
              hint="Only used when no payment details are filled in above." />
            <F name="terms_days" label="Default days until due" type="number" defaultValue={v.invoice_terms_days ?? 14} />
            <button className="btn btn-gold">Save billing</button>
          </form>
        </Panel>

        <Panel title="Invoice email" id="em">
          <form action={saveSettings} className="space-y-3">
            <input type="hidden" name="section" value="email" />
            <F name="invoice_subject" label="Subject" defaultValue={v.email_templates?.invoice_subject} />
            <TA name="invoice_body" label="Message" defaultValue={v.email_templates?.invoice_body} rows={7}
              hint="Placeholders: {{name}} {{number}} {{load}} {{total}} {{due}} {{link}}. Business name, address and the reason for the email are added automatically." />
            <button className="btn btn-gold">Save email</button>
          </form>
        </Panel>

        <Panel title="Run sheet extras" id="rx">
          <form action={saveSettings} className="space-y-3">
            <input type="hidden" name="section" value="extras" />
            <p className="text-muted">Turn optional run sheet sections on or off for drivers.</p>
            <div className="grid sm:grid-cols-2">
              {Object.keys(EXTRA_LABELS).map((k) => (
                <label key={k} className="check min-h-11 items-center"><input type="checkbox" name={k} defaultChecked={Boolean((extras as any)[k])} /><span>{EXTRA_LABELS[k]}</span></label>
              ))}
            </div>
            <button className="btn btn-gold">Save extras</button>
          </form>
        </Panel>

        <Panel title="Positions" id="pos">
          <p>{Object.values(POSITIONS).join(", ")}</p>
          <p className="mt-2 text-sm text-muted">These match the database. Adding a new position type needs a small database change.</p>
        </Panel>
      </div>
    </>
  );
}
