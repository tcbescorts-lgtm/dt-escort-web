"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const n = (f: FormData, k: string) => {
  const v = s(f, k);
  const x = v === null ? NaN : Number(v.replace(/[$,]/g, ""));
  return Number.isFinite(x) ? x : null;
};

export async function saveCustomer(_p: { error?: string } | undefined, form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const company = s(form, "company");
  if (!company) return { error: "Enter the company name." };
  const email = s(form, "email");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "The email doesn't look right." };
  const rec = {
    company,
    contact_name: s(form, "contact_name"),
    phone: s(form, "phone"),
    email,
    type: s(form, "type") ?? "not_set",
    billing_email: s(form, "billing_email"),
    billing_contact: s(form, "billing_contact"),
    billing_phone: s(form, "billing_phone"),
    payment_terms: s(form, "payment_terms"),
    quick_pay: s(form, "quick_pay") ?? "not_set",
    qp_fee_pct: n(form, "qp_fee_pct"),
    notes: s(form, "notes"),
  };
  let id = s(form, "id");
  if (id) {
    const { error } = await sb.from("customers").update(rec).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await sb.from("customers").insert(rec).select("id").single();
    if (error) return { error: error.message };
    id = data.id;
  }
  await sb.from("customer_rate_cards").upsert({
    customer_id: id,
    per_mile: n(form, "per_mile"),
    day_rate: n(form, "day_rate"),
    no_go: n(form, "no_go"),
    overnight: n(form, "overnight"),
    flat_rate: n(form, "flat_rate"),
    mini_run: n(form, "mini_run"),
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/portal/customers");
  redirect(`/portal/customers/${id}?saved=1`);
}
