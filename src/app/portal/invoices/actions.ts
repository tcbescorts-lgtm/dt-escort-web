"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { emailConfigured, emailHtml, sendEmail } from "@/lib/notify";
import { invoicePdf } from "@/lib/invoice-pdf";
import { SITE_URL, company } from "@/lib/site";
import { money } from "@/lib/format";
import { paymentLines, serviceLabel, type PaymentInfo } from "@/lib/payment-info";

type Item = { kind: string; description: string; qty: number; rate: number; amount: number };
const r2 = (v: number) => Math.round(v * 100) / 100;

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function termsDays(sb: Awaited<ReturnType<typeof supabaseServer>>, terms: string | null) {
  if (terms === "pay_at_drop") return 0;
  if (terms === "2_weeks") return 14;
  const m = terms?.match(/(\d+)/);
  if (m) return Number(m[1]);
  const { data } = await sb.from("settings").select("value").eq("key", "invoice_terms_days").maybeSingle();
  return Number(data?.value ?? 14);
}

export async function createInvoiceFromLoad(form: FormData) {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const loadId = String(form.get("load_id"));
  const rsId = (form.get("run_sheet_id") as string) || null;
  const { data: load } = await sb
    .from("loads")
    .select("*, customer:customers!loads_customer_id_fkey(company, email, billing_email), inv:customers!loads_invoice_customer_id_fkey(id, company, email, billing_email)")
    .eq("id", loadId)
    .single();
  if (!load) redirect("/portal/invoices");

  let rsq = sb.from("run_sheets").select("*").eq("load_id", loadId).neq("status", "draft").order("submitted_at", { ascending: false }).limit(1);
  if (rsId) rsq = sb.from("run_sheets").select("*").eq("id", rsId).limit(1);
  const { data: sheets } = await rsq;
  const rs = sheets?.[0] ?? null;

  const items: Item[] = [];
  const push = (kind: string, description: string, qty: number, rate: number) => {
    if (qty && rate) items.push({ kind, description, qty: r2(qty), rate: r2(rate), amount: r2(qty * rate) });
  };
  if (rs) {
    const legs = (await sb.from("run_sheet_legs").select("*").eq("run_sheet_id", rs.id)).data ?? [];
    const svc = serviceLabel(rs.positions);
    const mileageMiles = legs.filter((l) => l.charged_as === "miles").reduce((a, l) => a + Number(l.miles ?? 0), 0) || Number(rs.total_miles);
    push("mileage", svc, mileageMiles, Number(rs.rate_per_mile ?? 0));
    push("day_rate", `${svc}, day rate`, legs.filter((l) => l.charged_as === "day_rate").length, Number(rs.rate_day ?? 0));
    push("mini_run", `${svc}, mini run`, legs.filter((l) => l.charged_as === "mini").length, Number(rs.rate_mini ?? 0));
    push("overnight", "Overnight", legs.filter((l) => l.overnight).length, Number(rs.rate_overnight ?? 0));
    push("no_go", "No-go", legs.filter((l) => l.charged_as === "no_go").length, Number(rs.rate_no_go ?? 0));
    if (rs.include_gas && Number(rs.gas_amount) > 0) push("gas", "Fuel", 1, Number(rs.gas_amount));
  } else {
    const pos = ((await sb.from("load_positions").select("position").eq("load_id", loadId)).data ?? []).map((p) => p.position);
    if (load.rate_flat) push("flat_rate", `${serviceLabel(pos)}, ${load.pickup} to ${load.dropoff}`, 1, Number(load.rate_flat));
    else if (load.est_miles && load.rate_per_mile) push("mileage", serviceLabel(pos), Number(load.est_miles), Number(load.rate_per_mile));
  }
  const subtotal = r2(items.reduce((a, i) => a + i.amount, 0));
  let qp = 0;
  if (load.quick_pay === "yes" && load.qp_fee_pct) {
    qp = r2((subtotal * Number(load.qp_fee_pct)) / 100);
    items.push({ kind: "qp_fee", description: `Quick pay fee (${load.qp_fee_pct}%)`, qty: 1, rate: -qp, amount: -qp });
  }
  const billTo = (load as any).inv ?? (load as any).customer;
  const issue = new Date().toISOString().slice(0, 10);
  const { data: inv, error } = await sb
    .from("invoices")
    .insert({
      load_id: loadId,
      run_sheet_id: rs?.id ?? null,
      customer_id: load.invoice_customer_id ?? load.customer_id,
      bill_to_name: billTo?.company ?? "",
      bill_to_email: load.invoice_email ?? billTo?.billing_email ?? billTo?.email ?? null,
      issue_date: issue,
      due_date: addDays(issue, await termsDays(sb, load.payment_terms)),
      subtotal,
      qp_fee: qp,
      total: r2(subtotal - qp),
      created_by: me.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (items.length) await sb.from("invoice_items").insert(items.map((i, n) => ({ ...i, invoice_id: inv.id, seq: n })));
  await sb.from("loads").update({ status: "invoiced" }).eq("id", loadId).not("status", "in", "(paid,cancelled)");
  revalidatePath("/portal/invoices");
  redirect(`/portal/invoices/${inv.id}?created=1`);
}

export async function createBlankInvoice(form: FormData) {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const customerId = (form.get("customer_id") as string) || null;
  let name = "";
  let email: string | null = null;
  if (customerId) {
    const { data } = await sb.from("customers").select("company, billing_email, email").eq("id", customerId).single();
    name = data?.company ?? "";
    email = data?.billing_email ?? data?.email ?? null;
  }
  const issue = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb.from("invoices").insert({ customer_id: customerId, bill_to_name: name, bill_to_email: email, issue_date: issue, due_date: addDays(issue, 14), created_by: me.id }).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/portal/invoices/${data.id}`);
}

export async function saveInvoice(_p: { ok?: string; error?: string } | undefined, form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  let items: Item[] = [];
  try {
    items = JSON.parse(String(form.get("items_json") ?? "[]"));
  } catch {
    return { error: "Couldn't read the line items." };
  }
  items = items
    .filter((i) => i.kind !== "discount" && (i.description?.trim() || Number(i.qty) * Number(i.rate)))
    .map((i) => ({ kind: i.kind || "adjustment", description: i.description.trim(), qty: Number(i.qty) || 0, rate: Number(i.rate) || 0, amount: r2((Number(i.qty) || 0) * (Number(i.rate) || 0)) }));
  // Discount: percent of the service lines (before any quick pay fee), or a fixed dollar amount.
  const dType = form.get("discount_type") === "percent" ? "percent" : form.get("discount_type") === "amount" ? "amount" : null;
  const dValue = Math.max(0, Number(String(form.get("discount_value") ?? "").replace(/[$,%]/g, "")) || 0);
  if (dType && dValue > 0) {
    const base = items.filter((i) => i.kind !== "qp_fee").reduce((a, i) => a + i.amount, 0);
    if (dType === "percent" && dValue > 100) return { error: "A percent discount can't be more than 100%." };
    const off = r2(dType === "percent" ? (base * dValue) / 100 : Math.min(dValue, base));
    if (off > 0) items.push({ kind: "discount", description: dType === "percent" ? `Discount (${dValue}%)` : "Discount", qty: 1, rate: -off, amount: -off });
  }
  const qp = r2(-items.filter((i) => i.kind === "qp_fee").reduce((a, i) => a + i.amount, 0));
  const total = r2(items.reduce((a, i) => a + i.amount, 0));
  const email = String(form.get("bill_to_email") ?? "").trim() || null;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "The bill-to email doesn't look right." };
  const { error } = await sb
    .from("invoices")
    .update({
      bill_to_name: String(form.get("bill_to_name") ?? "").trim(),
      bill_to_email: email,
      issue_date: String(form.get("issue_date")),
      due_date: (form.get("due_date") as string) || null,
      notes: String(form.get("notes") ?? "").trim() || null,
      discount_type: dType && dValue > 0 ? dType : null,
      discount_value: dType && dValue > 0 ? dValue : null,
      subtotal: r2(total + qp),
      qp_fee: qp,
      total,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await sb.from("invoice_items").delete().eq("invoice_id", id);
  if (items.length) await sb.from("invoice_items").insert(items.map((i, n) => ({ ...i, invoice_id: id, seq: n })));
  // keep status in sync with payments already recorded
  const { data: inv } = await sb.from("invoices").select("amount_paid, status").eq("id", id).single();
  if (inv && Number(inv.amount_paid) > 0) {
    await sb.from("invoices").update({ status: Number(inv.amount_paid) >= total ? "paid" : "partial" }).eq("id", id);
  }
  revalidatePath(`/portal/invoices/${id}`);
  return { ok: "Invoice saved." };
}

async function loadInvoice(id: string) {
  const sb = await supabaseServer();
  const { data: inv } = await sb.from("invoices").select("*, loads(load_no, pickup, dropoff, order_no, trucking_company, truck_number)").eq("id", id).single();
  const { data: items } = await sb.from("invoice_items").select("*").eq("invoice_id", id).order("seq");
  const { data: st } = await sb.from("settings").select("key, value").in("key", ["payment_instructions", "payment_info", "email_templates"]);
  const v = Object.fromEntries((st ?? []).map((r) => [r.key, r.value])) as Record<string, any>;
  return { sb, inv, items: items ?? [], paymentText: v.payment_instructions?.text ?? "", payInfo: (v.payment_info ?? null) as PaymentInfo | null, tpl: v.email_templates ?? {} };
}

const fill = (t: string, v: Record<string, string>) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? "");

export async function sendInvoice(_p: { ok?: string; error?: string } | undefined, form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const reminder = form.get("reminder") === "1";
  if (!emailConfigured()) return { error: "Email sending isn't set up yet (Resend key missing). Download the PDF or copy the invoice link and send it yourself, then mark it Sent." };
  const { sb, inv, items, paymentText, payInfo, tpl } = await loadInvoice(id);
  if (!inv) return { error: "Invoice not found." };
  if (!inv.bill_to_email) return { error: "Add a bill-to email first." };
  if (!items.length) return { error: "Add at least one line item first." };
  const pdf = await invoicePdf(inv, items, inv.loads, payInfo, paymentText);
  const howToPay = paymentLines(payInfo).map((m) => `${m.label}: ${m.lines.join(", ")}`);
  const link = `${SITE_URL}/i/${inv.public_token}`;
  const vars = { number: inv.number, name: inv.bill_to_name, load: inv.loads?.load_no ?? "", total: money(inv.total), due: inv.due_date ?? "on receipt", link };
  const subject = (reminder ? "Reminder: " : "") + fill(tpl.invoice_subject ?? "Invoice {{number}} from D & T Escort Service", vars);
  const body = fill(tpl.invoice_body ?? "Your invoice {{number}} is attached. Total due {{total}}.", vars);
  const res = await sendEmail({
    to: inv.bill_to_email,
    subject,
    html: emailHtml({
      heading: `${reminder ? "Reminder: invoice" : "Invoice"} ${inv.number}`,
      paragraphs: [...body.split(/\n\n+/), ...(howToPay.length ? ["How to pay:", ...howToPay] : [])],
      button: { href: inv.stripe_payment_link_url ?? link, label: inv.stripe_payment_link_url ? "Pay online" : "View invoice" },
      reason: `You're receiving this because ${company.name} provided escort services billed to ${inv.bill_to_name}.`,
    }),
    text: [body, howToPay.length ? "How to pay:\n" + howToPay.join("\n") : ""].filter(Boolean).join("\n\n"),
    attachments: [{ filename: `${inv.number}.pdf`, content: Buffer.from(pdf) }],
    tags: [{ name: "invoice_id", value: inv.id }],
  });
  if (res.error) {
    await sb.from("invoices").update({ status: "failed" }).eq("id", id);
    await sb.from("email_events").insert({ invoice_id: id, type: "send_failed", payload: { error: res.error } });
    revalidatePath(`/portal/invoices/${id}`);
    return { error: `Sending failed: ${res.error}` };
  }
  await sb.from("invoices").update({
    status: ["paid", "partial"].includes(inv.status) ? inv.status : "sent",
    resend_email_id: res.id,
    sent_at: new Date().toISOString(),
  }).eq("id", id);
  await sb.from("email_events").insert({ invoice_id: id, resend_email_id: res.id, type: reminder ? "reminder_sent" : "sent" });
  revalidatePath(`/portal/invoices/${id}`);
  return { ok: `${reminder ? "Reminder" : "Invoice"} sent to ${inv.bill_to_email}.` };
}

export async function createPaymentLink(_p: { ok?: string; error?: string } | undefined, form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { error: "Online payment isn't set up yet (Stripe key missing)." };
  const { sb, inv } = await loadInvoice(id);
  if (!inv) return { error: "Invoice not found." };
  const due = Math.round((Number(inv.total) - Number(inv.amount_paid)) * 100);
  if (due <= 0) return { error: "Nothing is due on this invoice." };
  const stripe = new Stripe(key);
  if (inv.stripe_payment_link_id) {
    await stripe.paymentLinks.update(inv.stripe_payment_link_id, { active: false }).catch(() => {});
  }
  const price = await stripe.prices.create({ currency: "usd", unit_amount: due, product_data: { name: `Invoice ${inv.number} - ${company.name}` } });
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { invoice_id: inv.id, invoice_number: inv.number },
    payment_intent_data: { metadata: { invoice_id: inv.id, invoice_number: inv.number } },
    after_completion: { type: "redirect", redirect: { url: `${SITE_URL}/i/${inv.public_token}?paid=1` } },
  });
  await sb.from("invoices").update({ stripe_payment_link_id: link.id, stripe_payment_link_url: link.url }).eq("id", id);
  revalidatePath(`/portal/invoices/${id}`);
  return { ok: "Payment link created. It's included when you send the invoice." };
}

export async function recordPayment(_p: { ok?: string; error?: string } | undefined, form: FormData) {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("invoice_id"));
  const amount = Number(String(form.get("amount") ?? "").replace(/[$,]/g, ""));
  if (!(amount > 0)) return { error: "Enter the amount received." };
  const { error } = await sb.from("payments").insert({
    invoice_id: id,
    amount,
    method: String(form.get("method") ?? "other"),
    paid_on: String(form.get("paid_on") || new Date().toISOString().slice(0, 10)),
    reference: String(form.get("reference") ?? "").trim() || null,
    recorded_by: me.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/portal/invoices/${id}`);
  revalidatePath("/portal/invoices");
  return { ok: `Payment of ${money(amount)} recorded.` };
}

export async function deletePayment(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  await sb.from("payments").delete().eq("id", String(form.get("payment_id")));
  revalidatePath(`/portal/invoices/${form.get("invoice_id")}`);
}

export async function setInvoiceStatus(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  const patch: Record<string, unknown> = { status };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  await sb.from("invoices").update(patch).eq("id", id);
  revalidatePath(`/portal/invoices/${id}`);
}

export async function archiveInvoice(_p: { ok?: string; error?: string } | undefined, form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  const { error } = await sb.rpc("archive_invoice", { p_id: id, p_confirm: String(form.get("confirm") ?? ""), p_reason: String(form.get("reason") ?? "") });
  if (error) return { error: error.message };
  revalidatePath("/portal/invoices");
  redirect("/portal/invoices?archived=1");
}

export async function restoreInvoice(form: FormData) {
  await requireStaff();
  const sb = await supabaseServer();
  const id = String(form.get("id"));
  await sb.rpc("restore_invoice", { p_id: id });
  revalidatePath("/portal/invoices");
  redirect(`/portal/invoices/${id}`);
}
