import Link from "next/link";
import { company, fullAddress, legalNav, nav } from "@/lib/site";
import CookieSettingsLink from "./CookieSettingsLink";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-rule bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_1fr_1fr] md:px-6">
        <div>
          <p className="font-display text-2xl font-bold">{company.legalName}</p>
          <address className="mt-3 not-italic leading-relaxed text-muted">
            {company.street}
            <br />
            {company.city}, {company.region} {company.postalCode}
          </address>
          <p className="mt-3">
            <a href={company.telHref} className="link text-lg font-semibold">{company.phoneDisplay}</a>
            <br />
            <a href={`mailto:${company.email}`} className="link">{company.email}</a>
          </p>
          <p className="mt-3 text-muted">{company.hours}.</p>
        </div>

        <nav aria-label="Site">
          <h2 className="font-semibold mb-2">Site</h2>
          <ul className="space-y-0.5">
            {[...nav, { href: "/quote", label: "Request a Quote" }, { href: "/careers", label: "Careers" }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="inline-flex min-h-11 items-center hover:text-gold underline-offset-4 hover:underline">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal and privacy">
          <h2 className="font-semibold mb-2">Legal and privacy</h2>
          <ul className="space-y-0.5">
            {legalNav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="inline-flex min-h-11 items-center hover:text-gold underline-offset-4 hover:underline">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsLink />
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-rule">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-muted md:px-6">
          © {year} {company.legalName}. {fullAddress}.
        </p>
      </div>
    </footer>
  );
}
