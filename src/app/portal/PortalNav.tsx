"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/login/actions";

type Item = { href: string; label: string; count?: number; owner?: boolean };

export default function PortalNav({ role, unread, pendingSheets }: { role: string; unread: number; pendingSheets: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const items: Item[] = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/loads/new", label: "Book a load" },
    { href: "/portal/loads", label: "Loads" },
    { href: "/portal/run-sheets", label: "Run sheets", count: pendingSheets },
    { href: "/portal/invoices", label: "Invoices" },
    { href: "/portal/driver-runs", label: "Driver runs" },
    { href: "/portal/customers", label: "Customers" },
    { href: "/portal/drivers", label: "Drivers" },
    { href: "/portal/reports", label: "Reports", owner: true },
    { href: "/portal/notifications", label: "Notifications", count: unread },
    { href: "/portal/settings", label: "Settings" },
  ];
  const active = (href: string) =>
    href === "/portal" ? path === "/portal" : path === href || (path.startsWith(href + "/") && !(href === "/portal/loads" && path === "/portal/loads/new"));

  return (
    <>
      <button
        type="button"
        className="mx-4 mb-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-field px-3 font-medium lg:hidden"
        aria-expanded={open}
        aria-controls="portal-nav"
        onClick={() => setOpen((o) => !o)}
      >
        Menu{unread + pendingSheets > 0 ? ` (${unread + pendingSheets} new)` : ""}
      </button>
      <nav id="portal-nav" aria-label="Portal" className={`${open ? "block" : "hidden"} px-2 pb-4 lg:block`}>
        <ul className="space-y-0.5">
          {items.filter((i) => !i.owner || role === "owner").map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active(i.href) ? "page" : undefined}
                className={`flex min-h-11 items-center justify-between rounded-md px-3 font-medium hover:bg-surface-2 ${active(i.href) ? "bg-surface-2 text-gold" : ""}`}
              >
                {i.label}
                {i.count ? (
                  <span className="rounded-full bg-gold-fill px-2 text-sm font-semibold text-on-gold">
                    {i.count}
                    <span className="sr-only"> new</span>
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-rule px-3 pt-4 lg:hidden">
          <Link href="/account/password" className="flex min-h-11 items-center">Change password</Link>
          <form action={signOut}><button className="flex min-h-11 items-center">Sign out ({role === "owner" ? "Owner" : "Admin"})</button></form>
        </div>
      </nav>
    </>
  );
}
