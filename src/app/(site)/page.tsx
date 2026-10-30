import Link from "next/link";
import { Actions, Container, CtaBand } from "@/components/Blocks";
import Image from "next/image";
import UsMap from "@/components/UsMap";
import { claims, positions } from "@/lib/site";
import { cargoGroups, faqs, steps } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Pilot Car and Oversize Load Escort Service | Jackson, MS",
  description:
    "D & T Escort Service runs lead and chase pilot cars for oversize and wide loads in all 48 contiguous states. PEVO-certified operators, $1M insured, dispatch 24/7.",
  path: "/",
});

const trust = [claims.coverage48.text, claims.insurance1m.text, claims.certified.text, claims.available247.text];

export default function Home() {
  const [lead, chase] = positions;
  const extra = positions.slice(2);
  return (
    <>
      <div className="border-b border-rule bg-surface">
        <Container className="py-10 md:py-14">
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-12">
            <div>
              <h1 className="display-1 max-w-2xl">Pilot car escorts for oversize and overweight loads</h1>
              <p className="lede mt-4">
                Lead, chase, high pole, steer and 3rd car escorts based in Jackson, Mississippi. PEVO-certified
                operators with $1,000,000 insurance, running loads in all 48 contiguous states. Dispatch
                answers 24 hours a day.
              </p>
              <Actions className="mt-6" />
            </div>
            <Image
              src="/brand/dt-logo-graygold.png"
              alt="D & T Escort Service logo"
              width={372}
              height={372}
              priority
              className="mx-auto hidden w-full max-w-[19rem] md:block"
            />
          </div>
        </Container>
      </div>

      <section aria-label="At a glance" className="border-b border-rule">
        <Container>
          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {trust.map((t, i) => (
              <li
                key={t}
                className={`py-4 pr-4 text-[0.95rem] font-bold ${i % 2 ? "pl-4 border-l border-rule" : ""} ${i > 0 ? "lg:pl-5 lg:border-l lg:border-rule" : ""} ${i > 1 ? "border-t border-rule lg:border-t-0" : ""}`}
              >
                {t}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="services-h">
        <Container className="pt-14 md:pt-20">
          <h2 id="services-h" className="display-2 max-w-3xl">Front and rear escorts, matched to your permit</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
            {[lead, chase].map((p) => (
              <div key={p.slug}>
                <h3 className="display-3">{p.name}</h3>
                <p className="text-muted text-sm">Also called: {p.aka.toLowerCase()}</p>
                <p className="mt-3 text-[0.95rem]">{p.summary}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 measure text-[0.95rem]">
            When the permit or route calls for more, we also run{" "}
            {extra.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && (i === extra.length - 1 ? " and " : ", ")}
                {p.name.toLowerCase()}
              </span>
            ))}
            . <Link href="/services" className="link">See all escort services</Link>
          </p>
        </Container>
      </section>

      <section aria-labelledby="cargo-h" className="band mt-14 md:mt-20">
        <Container className="py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12">
            <div>
              <h2 id="cargo-h" className="display-2">What we escort</h2>
              <p className="mt-4 text-muted">
                Anything that runs on an oversize or overweight permit. These are the loads we see most.
              </p>
              <p className="mt-4">
                <Link href="/what-we-escort" className="link">More on the loads we escort</Link>
              </p>
            </div>
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {cargoGroups.map((g) => (
                <div key={g.id} className="border-t border-rule py-4">
                  <dt className="font-semibold">{g.title}</dt>
                  <dd className="text-muted mt-1 text-[0.95rem]">{g.items.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <section aria-labelledby="how-h">
        <Container className="pt-14 md:pt-20">
          <h2 id="how-h" className="display-2">How it works</h2>
          <ol className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span aria-hidden="true" className="font-bold text-gold">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="display-3 mt-1">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-muted text-[0.95rem]">{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6">
            <Link href="/how-it-works" className="link">What to have ready before you call</Link>
          </p>
        </Container>
      </section>

      <section aria-labelledby="coverage-h">
        <Container className="pt-14 md:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="coverage-h" className="display-2">Coverage in the lower 48</h2>
            </div>
            <Link href="/coverage" className="link text-sm">Main corridors</Link>
          </div>
          <div className="mt-6">
            <UsMap />
          </div>
        </Container>
      </section>

      <section aria-labelledby="faq-h">
        <Container className="pt-14 md:pt-20">
          <h2 id="faq-h" className="display-2">Common questions</h2>
          <div className="mt-6 max-w-3xl divide-y divide-rule border-y border-rule">
            {[1, 3, 5, 6].map((i) => faqs[i]).map((f) => (
              <div key={f.q} className="py-4">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-1 text-muted measure text-[0.95rem]">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6">
            <Link href="/faq" className="link">All questions</Link>
          </p>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
