import Link from "next/link";
import { Container, CtaBand, PageIntro, Split } from "@/components/Blocks";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, company, positions } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Escort Services: Lead, Chase, High Pole, Steer and Route Survey",
  description:
    "Pilot car escort services for oversize and over-dimensional loads: lead car, chase car, high pole, steer car, 3rd car and route survey. Nationwide, dispatch 24/7.",
  path: "/services",
});

const serviceLd = {
  "@context": "https://schema.org",
  "@graph": positions.map((p) => ({
    "@type": "Service",
    name: p.name,
    serviceType: "Pilot car escort",
    description: p.summary,
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: { "@type": "Country", name: "United States" },
  })),
};

export default function Services() {
  return (
    <>
      <JsonLd data={serviceLd} />
      <PageIntro
        title="Escort services"
        lede="Every oversize permit spells out how many escorts the load needs and where they run. We supply the positions your permit and route call for, with certified operators and properly equipped vehicles."
      />

      <Container>

        <div>
          {positions.map((p) => (
            <Split key={p.slug} id={p.slug} title={p.name}>
              <p className="text-muted">Also called: {p.aka.toLowerCase()}</p>
              <p className="mt-3">{p.summary}</p>
            </Split>
          ))}

          <Split id="communication" title="Communication on the road">
            <p>
              Our escorts stay in contact with the truck driver by CB radio, and by phone as a backup.
              The lead car calls out traffic, turns, low clearances and hazards ahead; the chase car
              calls lane changes and anything coming up from behind.
            </p>
          </Split>

          <Split id="nights-weekends" title="Nights, weekends and short notice">
            <p>
              Dispatch answers 24 hours a day, 7 days a week. If your permit allows travel at night or
              on weekends, we can run it. Call{" "}
              <a href={company.telHref} className="link">{company.phoneDisplay}</a> for a move that
              needs to go today.
            </p>
          </Split>

          <Split id="permits" title="Permits">
            <p>
              We provide escorts only. The carrier or a permit service gets the permits; we run to the
              route, times and conditions written on them. Send the permits with your request so we can
              confirm which positions each state requires.
            </p>
          </Split>

          <Split id="pricing" title="How we quote">
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Per mile</strong> for loaded miles on most runs.</li>
              <li><strong>Day rate</strong> for slow, short or stop-and-go moves where miles don&apos;t reflect the time.</li>
              <li><strong>Overnight</strong> when a move runs past one day and the escort has to stay out.</li>
              <li><strong>No-go</strong> when a move is cancelled after the escort has arrived.</li>
              <li><strong>Mini run</strong> for short trips with a set minimum.</li>
            </ul>
            <p className="mt-4">
              We confirm the rates with you before the run, and they appear line by line on the invoice.{" "}
              <Link href="/refund-policy" className="link">Cancellations and no-go charges</Link>
            </p>
          </Split>
        </div>
      </Container>

      <CtaBand />
    </>
  );
}
