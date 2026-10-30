import "server-only";
import { Resend } from "resend";
import webpush from "web-push";
import { supabaseAdmin } from "./supabase/admin";
import { SITE_URL, company, fullAddress } from "./site";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);
const FROM = () => process.env.RESEND_FROM || `D & T Escort Service <dispatch@dtescortservice.com>`;

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Plain, accessible email layout. `reason` explains why the person got it. */
export function emailHtml(opts: { heading: string; paragraphs: string[]; button?: { href: string; label: string }; reason: string; unsubscribe?: string }) {
  const p = opts.paragraphs.map((t) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1a1a1a">${escape(t).replace(/\n/g, "<br>")}</p>`).join("");
  const btn = opts.button
    ? `<p style="margin:20px 0"><a href="${opts.button.href}" style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 20px;border-radius:6px;font-weight:600;text-decoration:none">${escape(opts.button.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="en"><body style="margin:0;background:#faf8f3;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a1a">${escape(opts.heading)}</h1>${p}${btn}
<hr style="border:none;border-top:1px solid #e4dfd2;margin:24px 0">
<p style="font-size:13px;color:#4a4a4a;line-height:1.5;margin:0">${escape(opts.reason)}<br>${escape(company.legalName)}, ${escape(fullAddress)} · ${escape(company.phoneDisplay)}${
    opts.unsubscribe ? `<br><a href="${opts.unsubscribe}" style="color:#4a4a4a">Unsubscribe</a>` : ""
  }</p></div></body></html>`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: Buffer }[];
  marketing?: boolean;
  tags?: { name: string; value: string }[];
}): Promise<{ id?: string; error?: string }> {
  if (!emailConfigured()) return { error: "Email isn't set up yet (RESEND_API_KEY missing)." };
  if (opts.marketing) {
    const { data } = await supabaseAdmin().from("suppression_list").select("email").ilike("email", opts.to).maybeSingle();
    if (data) return { error: "Recipient unsubscribed." };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM(),
    to: opts.to,
    replyTo: company.email,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    attachments: opts.attachments,
    tags: opts.tags,
  });
  if (error) return { error: error.message };
  return { id: data?.id };
}

let vapidReady = false;
function vapid() {
  if (vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || `mailto:${company.email}`, pub, priv);
  vapidReady = true;
  return true;
}

/** Web push to every device a user has subscribed. Stale subscriptions are removed. */
export async function pushToUser(userId: string, payload: { title: string; body: string; url: string }) {
  if (!vapid()) return;
  const admin = supabaseAdmin();
  const { data } = await admin.from("push_subscriptions").select("id, endpoint, keys").eq("user_id", userId);
  await Promise.all(
    (data ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload));
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
      }
    }),
  );
}

/** Email + push for a new load assignment. The in-app notification is created by a database trigger. */
export async function alertDriverAssigned(driverId: string, loadId: string) {
  const admin = supabaseAdmin();
  const { data: d } = await admin.from("drivers").select("full_name, email, profile_id").eq("id", driverId).single();
  const { data: l } = await admin.from("loads").select("load_no, pickup, dropoff, load_date").eq("id", loadId).single();
  if (!d || !l) return;
  const url = `${SITE_URL}/driver/loads/${loadId}`;
  const line = `${l.pickup ?? "?"} to ${l.dropoff ?? "?"}${l.load_date ? ` on ${l.load_date}` : ""}`;
  if (d.profile_id) await pushToUser(d.profile_id, { title: `New load ${l.load_no}`, body: line, url });
  if (d.email) {
    await sendEmail({
      to: d.email,
      subject: `New load ${l.load_no}: ${line}`,
      html: emailHtml({
        heading: `You've been assigned load ${l.load_no}`,
        paragraphs: [line, "Open the driver app to see the details and acknowledge the load."],
        button: { href: url, label: "Open load" },
        reason: "You're getting this because you were assigned a load in the D & T driver portal.",
      }),
    });
  }
}

/** Phone/desktop push to every owner and admin (the in-app notification row comes from a database trigger). */
export async function pushToStaff(payload: { title: string; body: string; url: string }) {
  const admin = supabaseAdmin();
  const { data } = await admin.from("profiles").select("id").in("role", ["owner", "admin"]).eq("active", true);
  await Promise.all((data ?? []).map((p) => pushToUser(p.id, payload)));
}
