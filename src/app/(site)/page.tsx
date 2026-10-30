import Link from "next/link";
import Image from "next/image";
import { Actions, Container, CtaBand } from "@/components/Blocks";
import { STATES_48, claims, positions } from "@/lib/site";
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
      <Container className="pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-14">
          <div>
            <h1 className="display-1">Pilot car escorts for oversize loads, in all 48 states.</h1>
            <p className="lede mt-5">
              Lead and chase escorts out of Jackson, Mississippi, for heavy haul and project cargo.
              Dispatch answers around the clock.
            </p>
            <Actions className="mt-8" />
          </div>
          <Image
            src="/brand/dt-logo-nophone.png"
            alt="D & T Escort Service logo"
            width={372}
            height={372}
            priority
            className="mx-auto hidden w-full max-w-[22rem] md:block"
          />
        </div>
      </Container>

      <section aria-label="At a glance">
        <Container>
          <ul className="grid grid-cols-2 border-y border-rule lg:grid-cols-4">
            {trust.map((t, i) => (
              <li
                key={t}
                className={`py-5 pr-4 font-display text-xl font-bold leading-tight md:text-2xl ${i % 2 ? "pl-4 border-l border-rule" : ""} ${i > 0 ? "lg:pl-6 lg:border-l lg:border-rule" : ""} ${i > 1 ? "border-t border-rule lg:border-t-0" : ""}`}
              >
                {t}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="services-h">
        <Container className="pt-16 md:pt-24">
          <h2 id="services-h" className="display-2 max-w-3xl">Front and rear escorts, matched to your permit</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-16">
            {[lead, chase].map((p) => (
              <div key={p.slug} className="border-l-4 border-gold-fill pl-5">
                <h3 className="display-3">{p.name}</h3>
                <p className="text-muted text-[0.98rem]">Also called: {p.aka.toLowerCase()}</p>
                <p className="mt-3">{p.summary}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 measure">
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

      <section aria-labelledby="cargo-h">
        <Container className="pt-16 md:pt-24">
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
                  <dd className="text-muted mt-1">{g.items.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <section aria-labelledby="how-h">
        <Container className="pt-16 md:pt-24">
          <h2 id="how-h" className="display-2">How it works</h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="bg-bg p-6">
                <span aria-hidden="true" className="font-display text-5xl font-extrabold text-gold">{i + 1}</span>
                <h3 className="display-3 mt-2">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6">
            <Link href="/how-it-works" className="link">What to have ready before you call</Link>
          </p>
        </Container>
      </section>

      <section aria-labelledby="coverage-h">
        <Container className="pt-16 md:pt-24">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-12">
            <div>
              <h2 id="coverage-h" className="display-2">Coverage in the lower 48</h2>
              <p className="mt-4 text-muted measure">
                Our home base is on I-55 in Jackson, where it meets I-20. That puts the Gulf Coast, Texas
                and the Southeast close by, and we run escorts in every contiguous state.
              </p>
              <p className="mt-4">
                <Link href="/coverage" className="link">Coverage and main corridors</Link>
              </p>
            </div>
            <ul aria-label="States we cover" className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
              {STATES_48.map(([abbr, name]) => (
                <li key={abbr} className="rounded border border-rule bg-surface py-2 text-center font-display text-lg font-bold">
                  <abbr title={name} className="no-underline">{abbr}</abbr>
                  <span className="sr-only"> {name}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section aria-labelledby="faq-h">
        <Container className="pt-16 md:pt-24">
          <h2 id="faq-h" className="display-2">Common questions</h2>
          <div className="mt-6 max-w-3xl divide-y divide-rule border-y border-rule">
            {[1, 3, 5, 6].map((i) => faqs[i]).map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="text-lg font-semibold">{f.q}</h3>
                <p className="mt-1 text-muted measure">{f.a}</p>
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
