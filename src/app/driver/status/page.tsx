import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { DRIVER_STATUS } from "@/lib/format";
import { setMyStatus } from "../actions";

export const metadata = { title: "Your status" };

const HINT: Record<string, string> = {
  needs_load: "Ready to work. Dispatch will look for a load for you.",
  on_load: "You're out on a run right now.",
  vacation: "Not available. You won't be offered loads.",
  other: "Add a short note for dispatch.",
};

export default async function StatusPicker() {
  const me = await requireDriver();
  const sb = await supabaseServer();
  const { data: d } = await sb.from("drivers").select("status, status_note").eq("id", me.driverId).single();
  return (
    <>
      <h1 className="display-2">Hi {me.fullName.split(" ")[0]}, what&apos;s your status?</h1>
      <p className="mt-2 text-muted">Dispatch sees this right away. You can change it any time from Home.</p>
      <div className="mt-6 space-y-3">
        {(["needs_load", "on_load", "vacation"] as const).map((s) => (
          <form key={s} action={setMyStatus}>
            <input type="hidden" name="status" value={s} />
            <button className={`w-full rounded-md border-2 p-4 text-left ${d?.status === s ? "border-gold-fill" : "border-field"} hover:border-gold`}>
              <span className="block text-lg font-bold">{DRIVER_STATUS[s]}{d?.status === s ? " (current)" : ""}</span>
              <span className="text-muted">{HINT[s]}</span>
            </button>
          </form>
        ))}
        <form action={setMyStatus} className="rounded-md border-2 border-field p-4">
          <input type="hidden" name="status" value="other" />
          <label htmlFor="note" className="block text-lg font-bold">{DRIVER_STATUS.other}{d?.status === "other" ? " (current)" : ""}</label>
          <span id="note-hint" className="text-muted">{HINT.other}</span>
          <input id="note" name="note" className="input mt-2" maxLength={200} defaultValue={d?.status === "other" ? d.status_note ?? "" : ""} aria-describedby="note-hint" />
          <button className="btn btn-gold mt-3">Set status</button>
        </form>
      </div>
    </>
  );
}
