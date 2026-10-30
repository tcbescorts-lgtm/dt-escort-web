import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { loadFormData } from "../data";
import { PageHead } from "@/components/portal/ui";
import LoadForm from "../LoadForm";

export const metadata = { title: "Book a load" };

export default async function NewLoad({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requireStaff();
  const { from } = await searchParams;
  const data = await loadFormData();
  let copy: any = undefined;
  if (from) {
    const sb = await supabaseServer();
    const { data: src } = await sb
      .from("loads")
      .select("*, customer:customers!loads_customer_id_fkey(*), invoice_customer:customers!loads_invoice_customer_id_fkey(*), load_positions(position)")
      .eq("id", from)
      .single();
    if (src) {
      // Same customer, lane, rates and positions; new date, truck and status.
      const rest: any = { ...src };
      for (const k of ["id", "load_no", "load_date", "truck_driver_name", "truck_driver_phone", "truck_number", "order_no", "raw_notes"]) delete rest[k];
      copy = { ...rest, status: "booked" };
    }
  }
  return (
    <>
      <PageHead title={copy ? "Book again" : "Book a load"} sub={copy ? `Copied from ${copy.pickup} to ${copy.dropoff}. Set the date and check the rest.` : "Only the first three rows are needed. Open the other sections when you have the details."} />
      <LoadForm {...data} load={copy} />
    </>
  );
}
