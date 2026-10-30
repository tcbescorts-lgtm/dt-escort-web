import { Container, CtaBand, PageIntro } from "@/components/Blocks";
import { JsonLd } from "@/components/JsonLd";
import { faqs } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Pilot Car and Escort FAQ",
  description:
    "Answers about D & T Escort Service: coverage, 24/7 dispatch, escort positions, certification, insurance, permits and how pricing works.",
  path: "/faq",
});

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function Faq() {
  return (
    <>
      <JsonLd data={faqLd} />
      <PageIntro title="Frequently asked questions" />
      <Container>
        <div className="max-w-3xl border-t border-rule">
          {faqs.map((f) => (
            <section key={f.q} className="border-b border-rule py-6">
              <h2 className="text-lg font-semibold">{f.q}</h2>
              <p className="mt-2 text-muted measure">{f.a}</p>
            </section>
          ))}
        </div>
      </Container>
      <CtaBand title="Didn't find your answer?" text="Call dispatch any time, or send a quote request and ask in the notes." />
    </>
  );
}
