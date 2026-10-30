"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { company, nav } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 md:px-6">
        <Link href="/" className="flex items-center gap-3 no-underline min-h-11" aria-label={`${company.name}, home`}>
          <Logo />
        </Link>

        <nav aria-label="Main" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {nav.filter((n) => n.top).map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap rounded px-2.5 text-[0.92rem] font-medium hover:text-gold ${active ? "text-gold underline underline-offset-8 decoration-2" : ""}`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-3">
          <Link href="/quote" className="btn btn-gold hidden whitespace-nowrap sm:inline-flex">
            Request a Quote
          </Link>
          <ThemeToggle />
          <button
            ref={btnRef}
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-field px-3 text-sm font-medium xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
            Menu
          </button>
        </div>
      </div>

      <nav id="mobile-nav" aria-label="Main" hidden={!open} className="border-t border-rule xl:hidden">
        <ul className="mx-auto grid max-w-7xl gap-0.5 px-4 py-3 sm:grid-cols-2 md:px-6">
          {nav.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={pathname === n.href ? "page" : undefined}
                className="flex min-h-11 items-center rounded px-2 text-base font-medium hover:text-gold aria-[current=page]:text-gold"
              >
                {n.label}
              </Link>
            </li>
          ))}
          <li className="sm:hidden">
            <Link href="/quote" className="flex min-h-11 items-center rounded px-2 text-base font-medium text-gold">
              Request a Quote
            </Link>
          </li>
          <li>
            <Link href="/careers" className="flex min-h-11 items-center rounded px-2 text-base font-medium hover:text-gold">
              Careers
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
