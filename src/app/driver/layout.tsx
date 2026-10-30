import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireDriver } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ThemeToggle";
import DriverNav from "./DriverNav";
import SWRegister from "./SWRegister";

export const metadata: Metadata = {
  title: { default: "Driver", template: "%s | D & T Driver" },
  manifest: "/driver.webmanifest",
  robots: { index: false },
  appleWebApp: { capable: true, title: "D & T Driver", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#0b0b0c" };
export const dynamic = "force-dynamic";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const me = await requireDriver();
  const sb = await supabaseServer();
  const { count } = await sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  return (
    <div className="min-h-screen pb-24">
      <SWRegister />
      <header className="sticky top-0 z-20 border-b border-rule bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2">
          <Link href="/driver" className="flex min-h-11 items-center gap-2">
            <Image src="/brand/dt-logo-graygold.png" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="font-display text-lg font-bold">D&nbsp;&amp;&nbsp;T <span className="text-gold">Driver</span></span>
          </Link>
          <span className="ml-auto truncate text-sm text-muted">{me.fullName.split(" ")[0]}</span>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-5 focus:outline-none">{children}</main>
      <DriverNav unread={count ?? 0} />
    </div>
  );
}
