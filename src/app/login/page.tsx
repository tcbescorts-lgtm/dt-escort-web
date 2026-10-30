import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getMe, homeFor } from "@/lib/auth";
import { portalConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  if (portalConfigured()) {
    const me = await getMe();
    if (me) redirect(me.mustChangePassword ? "/account/password" : homeFor(me.role));
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <h1 className="display-2">Sign in</h1>
      <p className="mt-2 text-muted">For D &amp; T staff and drivers.</p>
      {sp.timeout && <p role="status" className="mt-4 rounded-md border border-field p-3">You were signed out after a period of inactivity.</p>}
      {sp.setup && <p role="status" className="mt-4 rounded-md border border-field p-3">The portal isn&apos;t connected to its database yet.</p>}
      <LoginForm next={sp.next ?? ""} />
      <p className="mt-6">
        <Link href="/login/forgot" className="link">Forgot your password?</Link>
      </p>
    </div>
  );
}
