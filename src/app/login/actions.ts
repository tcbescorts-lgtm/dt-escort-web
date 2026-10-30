"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { homeFor, type Role } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

const MAX_FAILS = 5;
const WINDOW_MIN = 15;

export type LoginState = { error?: string; email?: string } | undefined;

async function recentFailures(email: string) {
  try {
    const admin = supabaseAdmin();
    const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
    const { data } = await admin
      .from("login_attempts")
      .select("success, created_at")
      .ilike("email", email)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);
    let fails = 0;
    for (const r of data ?? []) {
      if (r.success) break;
      fails++;
    }
    return fails;
  } catch {
    return 0;
  }
}

async function logAttempt(email: string, success: boolean) {
  try {
    await supabaseAdmin().from("login_attempts").insert({ email: email.toLowerCase(), success });
  } catch {
    /* lockout bookkeeping is best effort */
  }
}

export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = z
    .object({ email: z.string().trim().pipe(z.email()), password: z.string().min(1) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  const email = String(form.get("email") ?? "");
  if (!parsed.success) return { error: "Enter your email and password.", email };

  if ((await recentFailures(parsed.data.email)) >= MAX_FAILS) {
    return { error: `Too many failed attempts. Wait ${WINDOW_MIN} minutes, or reset your password.`, email };
  }

  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    await logAttempt(parsed.data.email, false);
    return { error: "That email and password don't match. Check them and try again.", email };
  }
  await logAttempt(parsed.data.email, true);

  const { data: p } = await sb.from("profiles").select("role, must_change_password, active").eq("id", data.user.id).single();
  if (!p || !p.active) {
    await sb.auth.signOut();
    return { error: "This account is turned off. Contact the office.", email };
  }
  if (p.must_change_password) redirect("/account/password");
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/portal") || next.startsWith("/driver") ? (p.role === "driver" ? "/driver/status" : next) : homeFor(p.role as Role));
}

export async function sendReset(_prev: { sent?: boolean; error?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  if (!z.email().safeParse(email).success) return { error: "Enter the email you sign in with." };
  const sb = await supabaseServer();
  const h = await headers();
  const origin = h.get("origin") ?? SITE_URL;
  await sb.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/account/password` });
  // Same answer whether or not the account exists.
  return { sent: true };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}
