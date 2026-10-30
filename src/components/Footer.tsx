import Link from "next/link";
import { company, legalNav, nav } from "@/lib/site";
import CookieSettingsLink from "./CookieSettingsLink";
import Logo from "./Logo";

const linkClass =
  "inline-flex min-h-8 items-center text-muted hover:text-gold underline-offset-4 hover:underline";

const siteLinks = [
  ...nav.map(({ href, label }) => ({ href, label })),
  { href: "/quote", label: "Request a Quote" },
  { href: "/careers", label: "Careers" },
];

function Col({ items, children }: { items: readonly { href: string; label: string }[]; children?: React.ReactNode }) {
  return (
    <ul className="space-y-0.5">
      {items.map((n) => (
        <li key={n.href}>
          <Link href={n.href} className={linkClass}>
            {n.label}
          </Link>
        </li>
      ))}
      {children}
    </ul>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1 flex items-end pb-1 md:mb-2 md:h-10 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink">
      {children}
    </h2>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-rule bg-surface text-[0.85rem] md:text-[0.9rem]">
      <div className="mx-auto grid max-w-7xl gap-x-8 gap-y-6 px-4 py-10 md:grid-cols-12 md:px-6 md:py-12">
        <div className="md:col-span-4">
          <div className="flex items-end md:h-10">
            <Logo compact />
          </div>
          <address className="mt-3 not-italic leading-relaxed text-muted">
            {company.street}, {company.city}, {company.region} {company.postalCode}
          </address>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <a href={company.telHref} className="link font-semibold">{company.phoneDisplay}</a>
            <a href={`mailto:${company.email}`} className="link">{company.email}</a>
          </p>
          <p className="mt-2 text-muted">{company.hours}.</p>
        </div>

        <nav aria-label="Site" className="md:col-span-4">
          <Heading>Site</Heading>
          <div className="grid grid-cols-2 gap-x-6">
            <Col items={siteLinks.slice(0, 6)} />
            <Col items={siteLinks.slice(6)} />
          </div>
        </nav>

        <nav aria-label="Legal and privacy" className="md:col-span-4">
          <Heading>Legal and privacy</Heading>
          <div className="grid grid-cols-2 gap-x-6">
            <Col items={legalNav.slice(0, 4)} />
            <Col items={legalNav.slice(4)}>
              <li>
                <CookieSettingsLink className={linkClass} />
              </li>
              <li>
                <Link href="/login" className={linkClass}>
                  Staff and driver sign in
                </Link>
              </li>
            </Col>
          </div>
        </nav>
      </div>
      <div className="border-t border-rule">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted md:px-6">
          © {year} {company.legalName}
        </p>
      </div>
    </footer>
  );
}
