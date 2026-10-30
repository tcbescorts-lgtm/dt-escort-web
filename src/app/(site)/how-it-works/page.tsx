import { Container, CtaBand, PageIntro } from "@/components/Blocks";
import { steps } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "How It Works: Booking a Pilot Car Escort",
  description:
    "How to book an oversize load escort with D & T Escort Service: request, route review, dispatch and delivery, plus what to have ready when you call.",
  path: "/how-it-works",
});

const ready = [
  ["Permits", "Copies of the permits for every state on the route, if you have them."],
  ["Dimensions", "Height, width, length and gross weight of the loaded truck."],
  ["Route", "Pickup and drop-off, and the permitted route between them."],
  ["Date and time", "When the truck loads and when it can roll."],
  ["Truck contact", "The truck driver's name and phone, the trucking company, and the truck number."],
  ["Billing", "Who we invoice, their email, and your payment terms."],
];

export default function HowItWorks() {
  return (
    <>
      <PageIntro
        title="How it works"
        lede="Booking an escort takes a phone call or a short form. Here's what happens from there."
      />
      <Container>
        <ol className="border-t border-rule">
          {steps.map((s, i) => (
            <li key={s.title} className="grid gap-3 border-b border-rule py-8 md:grid-cols-[6rem_minmax(0,1fr)_minmax(0,2fr)] md:gap-8">
              <span aria-hidden="true" className="font-bold text-gold">{i + 1}</span>
              <h2 className="display-3">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h2>
              <p className="measure">{s.text}</p>
            </li>
          ))}
        </ol>

        <section aria-labelledby="ready-h" className="mt-16">
          <h2 id="ready-h" className="display-2">What to have ready</h2>
          <p className="mt-3 text-muted measure">You don&apos;t need all of this to ask for a quote, but we&apos;ll need it before dispatch.</p>
          <dl className="mt-8 grid gap-x-12 md:grid-cols-2">
            {ready.map(([t, d]) => (
              <div key={t} className="border-t border-rule py-4">
                <dt className="font-semibold">{t}</dt>
                <dd className="mt-1 text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Container>
      <CtaBand />
    </>
  );
}
