import Link from "next/link";
import { Container, CtaBand, PageIntro, Split } from "@/components/Blocks";
import { equipment } from "@/lib/content";
import { claims } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Safety and Compliance: Certified Operators, Equipment and Insurance",
  description:
    "PEVO-certified pilot car operators, escort vehicles equipped to state requirements, and $1,000,000 in insurance. How D & T Escort Service runs safe oversize moves.",
  path: "/safety",
});

export default function Safety() {
  return (
    <>
      <PageIntro
        title="Safety and compliance"
        lede="An escort's job is to keep the public, the driver and the load out of trouble. That starts with trained operators, the right equipment and following the permit to the letter."
      />
      <Container>
        <Split id="certification" title="Certified operators">
          <p>
            Our pilot car operators are PEVO certified (pilot/escort vehicle operator). Several states
            require their own certification or accept only certain others, so we assign operators who
            are certified for every state on your route.
          </p>
        </Split>

        <Split id="equipment" title="Vehicle equipment">
          <p>Our escort vehicles carry the equipment state rules call for, including:</p>
          <ul className="mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {equipment.map((e) => (
              <li key={e} className="flex gap-2">
                <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-3 flex-none bg-gold-fill" />
                {e}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-muted">Exact requirements differ by state; we equip to the strictest state on the route.</p>
        </Split>

        <Split id="insurance" title="Insurance">
          <p>
            D &amp; T Escort Service carries {claims.insurance1m.text.toLowerCase()}. If your company
            needs a certificate of insurance before a move, ask dispatch and we&apos;ll send one.
          </p>
        </Split>

        <Split id="on-the-road" title="On the road">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>We run the permitted route and travel times, and don&apos;t improvise detours.</li>
            <li>Escorts keep radio contact with the driver for the whole move.</li>
            <li>The lead car watches clearances, turns and traffic ahead; the chase car protects the load from behind.</li>
            <li>When weather or road conditions make a move unsafe, we stop and talk to the carrier before going on.</li>
          </ul>
        </Split>

        <Split id="rules" title="State escort rules">
          <p>
            Every state writes its own rules for when escorts are needed, how many, and what they must
            carry. The permit issued for your load is the final word for that move. Nothing on this
            site is legal advice; check with the state DOT or your permit service if you aren&apos;t sure.
          </p>
          <p className="mt-3">
            <Link href="/faq" className="link">Questions about escorts and permits</Link>
          </p>
        </Split>
      </Container>
      <CtaBand />
    </>
  );
}
