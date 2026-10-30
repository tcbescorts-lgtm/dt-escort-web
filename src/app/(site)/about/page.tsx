import Image from "next/image";
import { Container, CtaBand, PageIntro } from "@/components/Blocks";
import { company } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "About D & T Escort Service, Jackson MS Pilot Car Company",
  description:
    "D & T Escort Service LLC is a pilot car and oversize load escort company in Jackson, Mississippi, running escorts in all 48 contiguous states.",
  path: "/about",
});

export default function About() {
  return (
    <>
      <PageIntro title="About D & T Escort Service" />
      <Container>
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-16">
          <div className="measure space-y-4 text-lg">
            <p>
              {company.legalName} is a pilot car and oversize load escort company based in Jackson,
              Mississippi. We provide lead and chase escorts for heavy haul and project cargo, and high
              pole, steer, 3rd car and route survey work when a move calls for it.
            </p>
            <p>
              Our operators are PEVO certified, our vehicles are equipped for the states we run in, and
              we carry $1,000,000 in insurance. We cover all 48 contiguous states, and dispatch picks up
              at any hour.
            </p>
            <p>
              Our customers are carriers, brokers and companies shipping their own equipment. What they
              want from an escort is simple: show up on time, know the route, talk clearly on the radio,
              and send an accurate invoice. That&apos;s the standard we hold ourselves to.
            </p>
          </div>
          <div>
            <Image
              src="/brand/dt-logo-nophone.png"
              alt="D & T Escort Service logo: a black semi with an oversize load banner and a pilot car with an amber light bar, under the words Safe, Reliable, Professional."
              width={372}
              height={372}
              className="w-full max-w-xs"
            />
          </div>
        </div>
      </Container>
      <CtaBand />
    </>
  );
}
