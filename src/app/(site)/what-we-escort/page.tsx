import { Container, CtaBand, PageIntro } from "@/components/Blocks";
import { cargoGroups } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "What We Escort: Cranes, Wind Blades, Transformers, Homes and Superloads",
  description:
    "Oversize load escorts for cranes, wind turbine blades and towers, transformers, bridge beams, modular homes, drilling rigs, heavy equipment and superloads.",
  path: "/what-we-escort",
});

export default function WhatWeEscort() {
  return (
    <>
      <PageIntro
        title="What we escort"
        lede="If it moves on an oversize or overweight permit, we can escort it. Each type of load brings its own problems on the road, and the escort plan changes with it."
      />
      <Container>
        <nav aria-label="Load types" className="mb-10">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {cargoGroups.map((g) => (
              <li key={g.id}>
                <a href={`#${g.id}`} className="inline-flex min-h-11 items-center px-1 font-semibold text-gold underline-offset-4 hover:underline">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-x-12 md:grid-cols-2">
          {cargoGroups.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-24 border-t border-rule py-8">
              <h2 id={`${g.id}-h`} className="display-3">{g.title}</h2>
              <p className="mt-2 text-muted">{g.note}</p>
              <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {g.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-3 flex-none bg-gold-fill" />
                    {i}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section aria-labelledby="superload-h" className="mt-10 border-t border-rule pt-8">
          <h2 id="superload-h" className="display-2">Superloads</h2>
          <p className="mt-4 measure">
            Superloads go past a state&apos;s routine oversize limits and move under special permits,
            often with set travel times, required bridge crossings and extra escorts. Send us the
            permit early. We&apos;ll staff every position it lists, including 3rd cars, steer cars and
            a high pole where needed.
          </p>
        </section>
      </Container>
      <CtaBand title="Tell us what you're moving" />
    </>
  );
}
