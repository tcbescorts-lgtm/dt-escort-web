import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseServer } from "./supabase/server";

export type Role = "owner" | "admin" | "driver";
export type Me = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  mustChangePassword: boolean;
  driverId: string | null;
};

export const getMe = cache(async (): Promise<Me | null> => {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: p } = await sb.from("profiles").select("id, role, full_name, email, must_change_password, active").eq("id", data.user.id).single();
  if (!p || !p.active) return null;
  let driverId: string | null = null;
  if (p.role === "driver") {
    const { data: d } = await sb.from("drivers").select("id").eq("profile_id", p.id).maybeSingle();
    driverId = d?.id ?? null;
  }
  return { id: p.id, email: p.email, role: p.role, fullName: p.full_name, mustChangePassword: p.must_change_password, driverId };
});

async function requireUser(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.mustChangePassword) redirect("/account/password");
  return me;
}

export async function requireStaff() {
  const me = await requireUser();
  if (me.role === "driver") redirect("/driver");
  return me;
}

export async function requireOwner() {
  const me = await requireUser();
  if (me.role !== "owner") redirect("/portal");
  return me;
}

export async function requireDriver() {
  const me = await requireUser();
  if (me.role !== "driver") redirect("/portal");
  if (!me.driverId) redirect("/login?error=nodriver");
  return me as Me & { driverId: string };
}

export const homeFor = (role: Role) => (role === "driver" ? "/driver/status" : "/portal");
