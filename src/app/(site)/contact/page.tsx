import Link from "next/link";
import { Container, PageIntro } from "@/components/Blocks";
import ConsentMap from "@/components/ConsentMap";
import { MailIcon, PhoneIcon, PinIcon } from "@/components/Icons";
import { company, fullAddress } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Contact Dispatch 24/7",
  description: `Call D & T Escort Service dispatch at ${company.phoneDisplay}, 24/7, or email ${company.email}. Office at ${fullAddress}.`,
  path: "/contact",
});

export default function Contact() {
  return (
    <>
      <PageIntro title="Contact dispatch" lede="Phone is fastest. Dispatch answers 24 hours a day, 7 days a week." />
      <Container>
        <div className="grid gap-12 lg:grid-cols-2">
          <dl className="space-y-8">
            <div>
              <dt className="flex items-center gap-2 font-semibold text-muted"><PhoneIcon /> Phone</dt>
              <dd className="mt-1">
                <a href={company.telHref} className="font-display text-4xl font-bold text-gold underline-offset-4 hover:underline">
                  {company.phoneDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 font-semibold text-muted"><MailIcon /> Email</dt>
              <dd className="mt-1 text-xl">
                <a href={`mailto:${company.email}`} className="link break-all">{company.email}</a>
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 font-semibold text-muted"><PinIcon /> Office and mailing address</dt>
              <dd className="mt-1 text-xl">
                <address className="not-italic">
                  {company.legalName}
                  <br />
                  {company.street}
                  <br />
                  {company.city}, {company.region} {company.postalCode}
                </address>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Need a price?</dt>
              <dd className="mt-2">
                <Link href="/quote" className="btn btn-gold">Request a Quote</Link>
              </dd>
            </div>
          </dl>
          <ConsentMap query={`${company.legalName}, ${fullAddress}`} label={`Map showing ${company.name} at ${fullAddress}`} />
        </div>
      </Container>
    </>
  );
}
