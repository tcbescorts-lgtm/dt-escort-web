import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export async function loadFormData() {
  const sb = await supabaseServer();
  const [c, d, s] = await Promise.all([
    sb.from("customers").select("id, company, contact_name, phone, email, type, billing_email, billing_contact, billing_phone, payment_terms, quick_pay, qp_fee_pct, customer_rate_cards(per_mile, day_rate, no_go, overnight, flat_rate, mini_run)").order("company"),
    sb.from("drivers").select("id, full_name, status").eq("active", true).order("full_name"),
    sb.from("settings").select("value").eq("key", "booked_by").maybeSingle(),
  ]);
  return {
    customers: (c.data ?? []) as any[],
    drivers: (d.data ?? []) as any[],
    bookedBy: (Array.isArray(s.data?.value) ? s.data!.value : ["Jim", "Boss"]) as string[],
  };
}

