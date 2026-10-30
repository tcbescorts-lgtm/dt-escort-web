import Link from "next/link";
import { Actions, Container, CtaBand } from "@/components/Blocks";
import { BadgeIcon, CheckIcon, ClockIcon, MapIcon, PhoneIcon, ShieldIcon } from "@/components/Icons";
import UsMap from "@/components/UsMap";
import { claims, company, positions } from "@/lib/site";
import { cargoGroups, faqs, steps } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Pilot Car and Oversize Load Escort Service | Jackson, MS",
  description:
    "D & T Escort Service runs lead and chase pilot cars for oversize and wide loads in all 48 contiguous states. PEVO-certified operators, $1M insured, dispatch 24/7.",
  path: "/",
});

const trust = [
  { text: claims.coverage48.text, Icon: MapIcon },
  { text: claims.insurance1m.text, Icon: ShieldIcon },
  { text: claims.certified.text, Icon: BadgeIcon },
  { text: claims.available247.text, Icon: ClockIcon },
];

export default function Home() {
  const [lead, chase] = positions;
  const extra = positions.slice(2);
  return (
    <>
      <div className="backdrop border-b border-rule">
        <Container className="pt-10 pb-12 md:pt-16 md:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Pilot car and oversize load escorts</p>
              <h1 className="display-1 mt-3 max-w-2xl">Pilot car escorts for oversize loads, in all 48 states.</h1>
              <p className="lede mt-4">
                Lead and chase escorts out of Jackson, Mississippi, for heavy haul and project cargo.
                Dispatch answers around the clock.
              </p>
              <Actions className="mt-7" />
            </div>

            <aside aria-label="Dispatch" className="panel panel-gold p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Dispatch</p>
                <p className="flex items-center gap-2 text-xs font-semibold text-success">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" /> Open 24/7
                </p>
              </div>
              <a href={company.telHref} className="mt-3 flex items-center gap-2 font-display text-[1.7rem] font-bold leading-none text-gold hover:underline underline-offset-4">
                <PhoneIcon size={22} /> {company.phoneDisplay}
              </a>
              <p className="mt-2 text-sm text-muted">{company.email}</p>
              <hr className="my-4 border-rule" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Positions we run</p>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {positions.map((p) => (
                  <li key={p.slug} className="flex items-center gap-2">
                    <span className="text-gold"><CheckIcon /></span>
                    {p.name}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Container>
      </div>

      <section aria-label="At a glance">
        <Container>
          <ul className="grid grid-cols-2 gap-px overflow-hidden border-x border-b border-rule bg-rule lg:grid-cols-4">
            {trust.map(({ text, Icon }) => (
              <li key={text} className="flex items-center gap-3 bg-bg px-4 py-4 sm:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-rule text-gold"><Icon /></span>
                <span className="stat-num">{text}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="services-h">
        <Container className="pt-14 md:pt-20">
          <p className="eyebrow">Services</p>
          <h2 id="services-h" className="display-2 mt-2 max-w-3xl">Front and rear escorts, matched to your permit</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[lead, chase].map((p) => (
              <div key={p.slug} className="panel panel-gold p-5 sm:p-6">
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
              <p className="eyebrow">Loads</p>
              <h2 id="cargo-h" className="display-2 mt-2">What we escort</h2>
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
          <p className="eyebrow">Process</p>
          <h2 id="how-h" className="display-2 mt-2">How it works</h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="bg-bg p-5 sm:p-6">
                <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full border border-gold-fill font-display text-lg font-bold text-gold">{i + 1}</span>
                <h3 className="display-3 mt-2">
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
              <p className="eyebrow">Coverage</p>
              <h2 id="coverage-h" className="display-2 mt-2">Coverage in the lower 48</h2>
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
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-h" className="display-2 mt-2">Common questions</h2>
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
