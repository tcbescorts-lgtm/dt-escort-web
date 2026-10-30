import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ThemeToggle";
import PortalNav from "./PortalNav";
import LivePopups from "@/components/portal/LivePopups";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = { title: { default: "Portal", template: "%s | D & T Portal" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  const sb = await supabaseServer();
  const [{ count: unread }, { count: pendingSheets }, { count: unreadComms }] = await Promise.all([
    sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    sb.from("run_sheets").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    sb.from("comms").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-rule bg-surface lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/portal" className="flex min-h-11 items-center gap-2">
            <Image src="/brand/dt-logo-graygold.png" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="text-base font-bold">D&nbsp;&amp;&nbsp;T <span className="text-gold">Portal</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2 lg:hidden"><ThemeToggle /></div>
        </div>
        <PortalNav role={me.role} unread={unread ?? 0} pendingSheets={pendingSheets ?? 0} unreadComms={unreadComms ?? 0} />
      </aside>
      <div className="min-w-0">
        <div className="hidden items-center justify-end gap-3 border-b border-rule px-6 py-2 lg:flex">
          <form action="/portal/search" role="search" className="mr-auto flex w-full max-w-sm">
            <label htmlFor="top-q" className="sr-only">Search the portal</label>
            <input id="top-q" name="q" className="input !min-h-9 !py-1 text-sm" placeholder="🔎 Search loads, customers, drivers, invoices" />
          </form>
          <span className="text-sm text-muted">{me.fullName && !["Owner", "Admin"].includes(me.fullName) ? me.fullName : me.email} · {me.role === "owner" ? "Owner" : "Admin"}</span>
          <Link href="/account/password" className="text-sm underline-offset-4 hover:underline">Change password</Link>
          <form action={signOut}><button className="btn btn-line !min-h-9 !py-1 text-sm">Sign out</button></form>
          <ThemeToggle />
        </div>
        <LivePopups />
        <main id="main" tabIndex={-1} className="px-4 py-5 focus:outline-none md:px-6">{children}</main>
      </div>
    </div>
  );
}
