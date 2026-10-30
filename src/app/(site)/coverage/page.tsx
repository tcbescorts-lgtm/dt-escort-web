import { Container, CtaBand, PageIntro, Split } from "@/components/Blocks";
import UsMap from "@/components/UsMap";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Coverage: Nationwide Pilot Car Service in All 48 States",
  description:
    "48-state pilot car escort service from Jackson, Mississippi. Escorts on I-55, I-20, I-10 and I-40 and across the Gulf Coast, Texas, Louisiana, Alabama and Georgia.",
  path: "/coverage",
});

const corridors = [
  {
    id: "i-55",
    title: "I-55",
    text: "I-55 runs north from the New Orleans area (it starts at I-10 near LaPlace, Louisiana) through Jackson, Memphis and St. Louis to Chicago. Our base sits on it, so loads moving between the Gulf and the Midwest are close to home for us.",
  },
  {
    id: "i-20",
    title: "I-20",
    text: "I-20 crosses Jackson on its way from West Texas through Dallas, Shreveport, Birmingham and Atlanta to South Carolina. It's a main east–west route for equipment moving across the South.",
  },
  {
    id: "i-10",
    title: "I-10 and the Gulf Coast",
    text: "I-10 ties together Houston, Lake Charles, Baton Rouge, New Orleans, Mobile and Jacksonville, along with the ports, refineries and plants near them. Many loads on this stretch are tall or heavy process equipment, so bridge and overhead clearances matter.",
  },
  {
    id: "i-40",
    title: "I-40",
    text: "I-40 links North Carolina to California through Nashville, Memphis, Little Rock, Oklahoma City and Amarillo. It's a common choice for long cross-country moves.",
  },
];

const regional = ["Texas", "Louisiana", "Mississippi", "Alabama", "Georgia"];

export default function Coverage() {
  return (
    <>
      <PageIntro
        title="Coverage in all 48 contiguous states"
        lede="We're based in Jackson, Mississippi, and escort loads in every state of the lower 48. States set their own escort rules, so we assign operators who are certified for the states on your route."
      />
      <Container>
        <section aria-labelledby="states-h">
          <h2 id="states-h" className="display-3">States we cover</h2>
          <p className="mt-1 text-sm text-muted">Select any state. We don&apos;t cover Alaska or Hawaii.</p>
          <div className="mt-5">
            <UsMap />
          </div>
        </section>

        <div className="mt-12">
          <h2 className="display-2 mb-2">Main corridors</h2>
          {corridors.map((c) => (
            <Split key={c.id} id={c.id} title={c.title} as="h3">
              <p>{c.text}</p>
            </Split>
          ))}
          <Split id="southeast" title="Close to home" as="h3">
            <p>
              Moves in {regional.slice(0, -1).join(", ")} and {regional.at(-1)} are close to our home
              base, which helps when a load needs escorts on short notice.
            </p>
          </Split>
        </div>
      </Container>
      <CtaBand />
    </>
  );
}
