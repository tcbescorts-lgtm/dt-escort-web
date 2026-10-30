import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { emailHtml, sendEmail } from "@/lib/notify";
import { SITE_URL } from "@/lib/site";
import { money } from "@/lib/format";

export const runtime = "nodejs";

/**
 * Runs once a day (vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>".
 * - document expiry alerts at 60, 30 and 7 days (and on the day it expires)
 * - marks unpaid invoices past their due date as Overdue
 * - flags deletion requests that are close to their 30-day deadline
 * - emails the owner a short daily digest
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  const admin = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const plus = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

  const { data: staff } = await admin.from("profiles").select("id, email, role, full_name").in("role", ["owner", "admin"]).eq("active", true);
  const notifyStaff = async (kind: string, title: string, body: string, link: string) => {
    if (staff?.length) await admin.from("notifications").insert(staff.map((s) => ({ user_id: s.id, kind, title, body, link })));
  };

  // 1. expiring items
  const { data: exp } = await admin.from("expiring_items").select("*").in("expires_on", [plus(60), plus(30), plus(7), today]);
  for (const e of exp ?? []) {
    const days = Math.round((new Date(e.expires_on + "T12:00:00").getTime() - Date.now()) / 86400000);
    const when = days <= 0 ? "expires today" : `expires in ${days} days`;
    await notifyStaff("document_expiring", `${e.full_name}: ${e.item} ${when}`, `Expires ${e.expires_on}`, `/portal/drivers/${e.driver_id}`);
    const { data: d } = await admin.from("drivers").select("profile_id").eq("id", e.driver_id).single();
    if (d?.profile_id) await admin.from("notifications").insert({ user_id: d.profile_id, kind: "document_expiring", title: `Your ${e.item} ${when}`, body: "Send the renewed copy to dispatch.", link: "/driver/profile" });
  }

  // 2. overdue invoices
  const { data: overdue } = await admin.from("invoices").select("id, number, bill_to_name, total, amount_paid").lt("due_date", today).is("archived_at", null).in("status", ["sent", "delivered", "viewed", "partial"]);
  for (const i of overdue ?? []) {
    if (Number(i.amount_paid) >= Number(i.total)) continue;
    await admin.from("invoices").update({ status: "overdue" }).eq("id", i.id);
    await notifyStaff("invoice_overdue", `Invoice ${i.number} is overdue`, `${i.bill_to_name}: ${money(Number(i.total) - Number(i.amount_paid))} open`, `/portal/invoices/${i.id}`);
  }

  // 3. deletion requests due within 5 days
  const { data: dels } = await admin.from("deletion_requests").select("id, name, due_by").in("status", ["received", "verifying"]).lte("due_by", plus(5));
  for (const d of dels ?? []) await notifyStaff("deletion_due", `Deletion request due ${d.due_by}`, d.name, "/portal/settings/deletion");

  // 4. owner digest
  const [{ count: active }, { count: pending }, { data: open }] = await Promise.all([
    admin.from("loads").select("id", { count: "exact", head: true }).in("status", ["booked", "assigned", "in_progress"]),
    admin.from("run_sheets").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    admin.from("invoices").select("total, amount_paid").in("status", ["sent", "delivered", "viewed", "partial", "overdue"]).is("archived_at", null),
  ]);
  const receivable = (open ?? []).reduce((a, i) => a + Number(i.total) - Number(i.amount_paid), 0);
  for (const o of (staff ?? []).filter((s) => s.role === "owner")) {
    await sendEmail({
      to: o.email,
      subject: `D & T daily digest: ${active ?? 0} active loads, ${money(receivable)} open`,
      html: emailHtml({
        heading: "Daily digest",
        paragraphs: [
          `Active loads: ${active ?? 0}`,
          `Run sheets waiting for review: ${pending ?? 0}`,
          `Open invoices: ${money(receivable)} (${(overdue ?? []).length} newly overdue today)`,
          `Documents expiring soon: ${(exp ?? []).length}`,
        ],
        button: { href: `${SITE_URL}/portal`, label: "Open the portal" },
        reason: "You're getting this daily summary because you're the owner on the D & T portal.",
      }),
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true, expiring: exp?.length ?? 0, overdue: overdue?.length ?? 0 });
}
