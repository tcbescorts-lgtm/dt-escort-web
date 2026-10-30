import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ThemeToggle";
import PortalNav from "./PortalNav";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = { title: { default: "Portal", template: "%s | D & T Portal" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const [{ count: unread }, { count: pendingSheets }] = await Promise.all([
    sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    sb.from("run_sheets").select("id", { count: "exact", head: true }).eq("status", "submitted"),
  ]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-rule bg-surface lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/portal" className="flex min-h-11 items-center gap-2">
            <Image src="/brand/dt-logo-nophone.png" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="font-display text-xl font-bold">D&nbsp;&amp;&nbsp;T <span className="text-gold">Portal</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2 lg:hidden"><ThemeToggle /></div>
        </div>
        <PortalNav role={me.role} unread={unread ?? 0} pendingSheets={pendingSheets ?? 0} />
      </aside>
      <div className="min-w-0">
        <div className="hidden items-center justify-end gap-3 border-b border-rule px-6 py-2.5 lg:flex">
          <span className="text-sm text-muted">{me.fullName || me.email} · {me.role === "owner" ? "Owner" : "Admin"}</span>
          <Link href="/account/password" className="text-sm underline-offset-4 hover:underline">Change password</Link>
          <form action={signOut}><button className="btn btn-line !min-h-11 !py-1.5 text-sm">Sign out</button></form>
          <ThemeToggle />
        </div>
        <main id="main" tabIndex={-1} className="px-4 py-6 focus:outline-none md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
