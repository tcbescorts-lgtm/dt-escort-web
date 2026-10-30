"use server";

import { redirect } from "next/navigation";
import { getMe, homeFor } from "@/lib/auth";
import { passwordProblems } from "@/lib/password";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function changePassword(_p: { errors?: string[] } | undefined, form: FormData) {
  const me = await getMe();
  if (!me) redirect("/login");
  const pw = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const problems = passwordProblems(pw, me.email);
  if (pw !== confirm) problems.push("The two passwords don't match.");
  if (problems.length) return { errors: problems };

  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) return { errors: [error.message.includes("different") ? "Choose a password you haven't used here before." : "Couldn't save the password. Try again."] };
  await supabaseAdmin().from("profiles").update({ must_change_password: false }).eq("id", me.id);
  await supabaseAdmin().from("audit_log").insert({ actor: me.id, action: "password_changed", table_name: "profiles", record_id: me.id });
  redirect(homeFor(me.role));
}
