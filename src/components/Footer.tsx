import Link from "next/link";
import { company, fullAddress, legalNav, nav } from "@/lib/site";
import CookieSettingsLink from "./CookieSettingsLink";

const linkClass = "inline-flex min-h-11 items-center hover:text-gold underline-offset-4 hover:underline";

const siteLinks = [
  ...nav.filter((n) => ["/services", "/what-we-escort", "/coverage", "/safety"].includes(n.href)),
  ...nav.filter((n) => !["/services", "/what-we-escort", "/coverage", "/safety"].includes(n.href)),
  { href: "/quote", label: "Request a Quote" },
  { href: "/careers", label: "Careers" },
];

function FooterList({ items, children }: { items: readonly { href: string; label: string }[]; children?: React.ReactNode }) {
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

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-rule bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.3fr_1.3fr] md:px-6">
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
          <div className="grid grid-cols-2 gap-x-6">
            <FooterList items={siteLinks.slice(0, 4)} />
            <FooterList items={siteLinks.slice(4)} />
          </div>
        </nav>

        <nav aria-label="Legal and privacy">
          <h2 className="font-semibold mb-2">Legal and privacy</h2>
          <div className="grid grid-cols-2 gap-x-6">
            <FooterList items={legalNav.slice(0, 4)} />
            <FooterList items={legalNav.slice(4)}>
              <li>
                <CookieSettingsLink />
              </li>
              <li>
                <Link href="/login" className={linkClass}>
                  Staff and driver sign in
                </Link>
              </li>
            </FooterList>
          </div>
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
