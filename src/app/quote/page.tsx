import { Container, PageIntro } from "@/components/Blocks";
import QuoteForm from "@/components/forms/QuoteForm";
import { company } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Request a Pilot Car Quote",
  description:
    "Request a quote for an oversize load escort. Send pickup, drop-off, date and load dimensions, and D & T Escort Service will get back to you.",
  path: "/quote",
});

export default function Quote() {
  return (
    <>
      <PageIntro
        title="Request a quote"
        lede={
          <>
            Tell us where and when, and give us the load dimensions in the notes. For a move today or
            tomorrow, calling is faster: <a href={company.telHref} className="link">{company.phoneDisplay}</a>.
          </>
        }
      />
      <Container>
        <div className="max-w-2xl">
          <QuoteForm />
          <p className="mt-8 text-muted text-[0.95rem]">
            We use these details only to quote and arrange this job. The form is delivered to our email
            by Web3Forms. Read the <a href="/privacy" className="link">Privacy Policy</a> to see how we
            handle and delete your information.
          </p>
        </div>
      </Container>
    </>
  );
}
