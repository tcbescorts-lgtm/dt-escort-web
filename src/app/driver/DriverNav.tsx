"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const I = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  loads: <><rect x="2" y="7" width="13" height="9" rx="1" /><path d="M15 10h4l3 3v3h-7" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  sheet: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  pay: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
};

export default function DriverNav({ unread }: { unread: number }) {
  const path = usePathname();
  const items: [string, string, keyof typeof I, number?][] = [
    ["/driver", "Home", "home"],
    ["/driver/loads", "Loads", "loads"],
    ["/driver/run-sheet", "Run sheet", "sheet"],
    ["/driver/pay", "Pay", "pay"],
    ["/driver/notifications", "Alerts", "bell", unread],
    ["/driver/profile", "Profile", "user"],
  ];
  return (
    <nav aria-label="Driver" className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-3xl grid-cols-6">
        {items.map(([href, label, icon, count]) => {
          const active = href === "/driver" ? path === "/driver" || path === "/driver/status" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${active ? "text-gold" : "text-muted"}`}>
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{I[icon]}</svg>
                {label}
                {count ? <span className="absolute right-2 top-1 min-w-5 rounded-full bg-gold-fill px-1 text-center text-[11px] font-bold text-on-gold">{count}<span className="sr-only"> unread</span></span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
